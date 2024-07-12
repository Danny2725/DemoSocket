// client/src/components/Quiz.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import ParticipantList from './ParticipantList';

const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling', 'flashsocket']
});

interface Participant {
  id: string;
  name: string;
}

const Quiz: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Lắng nghe sự kiện new_participant từ server
    socket.on('new_participant', (participants: Participant[]) => {
      setParticipants(participants);
    });

    // Lắng nghe sự kiện quiz_ended từ server
    socket.on('quiz_ended', () => {
      alert('Quiz ended');
      setParticipants([]);
      navigate('/');
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
  }, [navigate]);

  // Hàm kết thúc phòng quiz
  const endQuiz = () => {
    socket.emit('end_quiz', quizId, (response: { success: boolean; message: string }) => {
      if (response.success) {
        navigate('/');
      } else {
        alert(response.message);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Quiz ID: {quizId}</h1>
        <button
          onClick={endQuiz}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg mb-4"
        >
          End Quiz
        </button>
        <ParticipantList participants={participants} />
      </div>
    </div>
  );
};

export default Quiz;
