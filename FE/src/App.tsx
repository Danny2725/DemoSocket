// client/src/App.tsx

import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling', 'flashsocket']
});

interface Participant {
  id: string;
  name: string;
}

function App() {
  const [quizId, setQuizId] = useState('');
  const [userName, setUserName] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isQuizCreated, setIsQuizCreated] = useState(false);

  useEffect(() => {
    // Lắng nghe sự kiện new_participant từ server
    socket.on('new_participant', (participants: Participant[]) => {
      setParticipants(participants);
    });

    // Lắng nghe sự kiện quiz_ended từ server
    socket.on('quiz_ended', () => {
      alert('Quiz ended');
      setParticipants([]);
      setIsQuizCreated(false);
    });

    // Lắng nghe sự kiện error từ server
    socket.on('error', (message: string) => {
      alert(message);
    });

    return () => {
      // Hủy lắng nghe khi component unmount
      socket.off('new_participant');
      socket.off('quiz_ended');
      socket.off('error');
    };
  }, []);

  // Hàm tạo phòng quiz mới
  const createQuiz = () => {
    socket.emit('create_quiz', quizId, (response: { success: boolean; message: string }) => {
      if (response.success) {
        setIsQuizCreated(true);
      }
      alert(response.message);
    });
  };

  // Hàm tham gia phòng quiz
  const joinQuiz = () => {
    socket.emit('join_quiz', quizId, userName, (response: { success: boolean; message: string }) => {
      if (response.success) {
        setIsQuizCreated(true);
      }
      alert(response.message);
    });
  };

  // Hàm kết thúc phòng quiz
  const endQuiz = () => {
    socket.emit('end_quiz', quizId, (response: { success: boolean; message: string }) => {
      if (response.success) {
        setIsQuizCreated(false);
      }
      alert(response.message);
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Real-time Quiz Participation</h1>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Quiz ID"
            value={quizId}
            onChange={(e) => setQuizId(e.target.value)}
            className="w-full px-3 py-2 mb-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {isQuizCreated ? (
          <div className="flex justify-between">
            <button
              onClick={joinQuiz}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Join Quiz
            </button>
            <button
              onClick={endQuiz}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              End Quiz
            </button>
          </div>
        ) : (
          <button
            onClick={createQuiz}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
          >
            Create Quiz
          </button>
        )}
        <h2 className="text-xl font-bold mt-6">Participants</h2>
        <ul className="list-disc list-inside">
          {participants.map((participant, index) => (
            <li key={index} className="mt-2">{participant.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
