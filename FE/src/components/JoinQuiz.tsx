// client/src/components/JoinQuiz.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling', 'flashsocket']
});

const JoinQuiz: React.FC = () => {
  const [quizId, setQuizId] = useState('');
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  const joinQuiz = () => {
    socket.emit('join_quiz', quizId, userName, (response: { success: boolean; message: string }) => {
      if (response.success) {
        navigate(`/quiz/${quizId}`);
      } else {
        alert(response.message);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Join a Quiz</h1>
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
          className="w-full px-3 py-2 mb-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={joinQuiz}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
        >
          Join Quiz
        </button>
      </div>
    </div>
  );
};

export default JoinQuiz;
