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
  const [isJoined, setIsJoined] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    // Kết nối thành công
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    // Các sự kiện khác
    socket.on('new_participant', (participants: Participant[]) => {
      setParticipants(participants);
    });

    socket.on('new_question', ({ question, options }) => {
      setQuestion(question);
      setOptions(options);
      setIsSubmitted(false);
      setSelectedOption(null);
    });

    socket.on('quiz_ended', () => {
      alert('Quiz ended');
      setParticipants([]);
      setIsQuizCreated(false);
      setIsJoined(false);
      setQuestion('');
      setOptions([]);
      setSelectedOption(null);
      setIsSubmitted(false);
      setIsCreator(false);
    });

    socket.on('error', (message: string) => {
      alert(message);
    });

    socket.on('answer_submitted', ({ userName }) => {
      console.log(`Received answer_submitted event: ${userName} đã trả lời câu hỏi`);
      alert(`${userName} đã trả lời câu hỏi`);
    });

    return () => {
      socket.off('connect');
      socket.off('new_participant');
      socket.off('new_question');
      socket.off('quiz_ended');
      socket.off('error');
      socket.off('answer_submitted');
    };
  }, []);

  const createQuiz = () => {
    socket.emit('create_quiz', quizId, (response: { success: boolean; message: string; question: string; options: string[] }) => {
      if (response.success) {
        setIsQuizCreated(true);
        setIsJoined(true);
        setIsCreator(true);
        setQuestion(response.question);
        setOptions(response.options);
      }
      alert(response.message);
    });
  };

  const joinQuiz = () => {
    socket.emit('join_quiz', quizId, userName, (response: { success: boolean; message: string; question: string; options: string[] }) => {
      if (response.success) {
        setIsJoined(true);
        setQuestion(response.question);
        setOptions(response.options);
      }
      alert(response.message);
    });
  };

  const leaveQuiz = () => {
    socket.emit('leave_quiz', quizId, (response: { success: boolean; message: string }) => {
      if (response.success) {
        setIsJoined(false);
        setQuestion('');
        setOptions([]);
        setSelectedOption(null);
        setIsSubmitted(false);
        setIsCreator(false);
        setParticipants([]);
      }
      alert(response.message);
    });
  };

  const endQuiz = () => {
    socket.emit('end_quiz', quizId, (response: { success: boolean; message: string }) => {
      if (response.success) {
        setIsQuizCreated(false);
        setIsJoined(false);
        setQuestion('');
        setOptions([]);
        setSelectedOption(null);
        setIsSubmitted(false);
        setIsCreator(false);
      }
      alert(response.message);
    });
  };

  const submitAnswer = () => {
    if (selectedOption) {
      console.log(`Sending answer: ${selectedOption}`);
      socket.emit('submit_answer', quizId, userName, selectedOption);
      setIsSubmitted(true);
    }
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
        {!isJoined ? (
          <div className="flex justify-between">
            <button
              onClick={joinQuiz}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Join Quiz
            </button>
            <button
              onClick={createQuiz}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Create Quiz
            </button>
          </div>
        ) : (
          <div>
            {!isSubmitted ? (
              <div>
                <div className="mt-6">
                  <h2 className="text-xl font-bold mb-2">Question</h2>
                  <p className="text-lg">{question}</p>
                  <ul className="mt-4">
                    {options.map((option, index) => (
                      <li key={index} className="mt-2">
                        <button
                          onClick={() => setSelectedOption(option)}
                          className={`w-full ${selectedOption === option ? 'bg-blue-300' : 'bg-gray-200'} hover:bg-gray-300 text-black font-bold py-2 px-4 rounded-lg`}
                        >
                          {option}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={submitAnswer}
                  className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
                  disabled={!selectedOption}
                >
                  Submit Answer
                </button>
              </div>
            ) : (
              isCreator && (
                <button
                  onClick={endQuiz}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
                >
                  End Quiz
                </button>
              )
            )}
            <button
              onClick={leaveQuiz}
              className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Leave Quiz
            </button>
          </div>
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
