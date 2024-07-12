// client/src/components/Home.tsx

import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Real-time Quiz Participation</h1>
        <Link to="/create-quiz" className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg mb-4">
          Create Quiz
        </Link>
        <Link to="/join-quiz" className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">
          Join Quiz
        </Link>
      </div>
    </div>
  );
};

export default Home;
