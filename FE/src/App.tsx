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
  const [quizCode, setQuizCode] = useState('');
  const [createQuizName, setCreateQuizName] = useState('');
  const [joinQuizName, setJoinQuizName] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isQuizCreated, setIsQuizCreated] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
    });

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
      resetState();
    });

    socket.on('error', (message: string) => {
      alert(message);
    });

    socket.on('answer_submitted', ({ userName }) => {
      alert(`${userName} đã trả lời câu hỏi`);
    });

    return () => {
      socket.removeAllListeners();
    };
  }, []);

  const resetState = () => {
    setParticipants([]);
    setIsQuizCreated(false);
    setIsJoined(false);
    setQuestion('');
    setOptions([]);
    setSelectedOption(null);
    setIsSubmitted(false);
    setIsCreator(false);
    setQuizCode('');
    setCreateQuizName('');
    setJoinQuizName('');
  };

  const createQuiz = () => {
    if (createQuizName) {
      socket.emit('create_quiz', (response: { success: boolean; message: string; quizCode?: string; question?: string; options?: string[] }) => {
        if (response.success) {
          setIsQuizCreated(true);
          setIsJoined(true);
          setIsCreator(true);
          setQuizCode(response.quizCode);
          setQuestion(response.question);
          setOptions(response.options);
        }
        alert(response.message);
      });
    } else {
      alert("Please enter your name to create a quiz.");
    }
  };

  const joinQuiz = () => {
    if (quizCode && joinQuizName) {
      socket.emit('join_quiz', quizCode, joinQuizName, (response: { success: boolean; message: string; question?: string; options?: string[] }) => {
        if (response.success) {
          setIsJoined(true);
          setQuestion(response.question);
          setOptions(response.options);
        }
        alert(response.message);
      });
    } else {
      alert("Please enter both the quiz code and your name to join a quiz.");
    }
  };

  const leaveQuiz = () => {
    socket.emit('leave_quiz', quizCode, (response: { success: boolean; message: string }) => {
      if (response.success) {
        resetState();
      }
      alert(response.message);
    });
  };

  const endQuiz = () => {
    socket.emit('end_quiz', quizCode, (response: { success: boolean; message: string }) => {
      if (response.success) {
        resetState();
      }
      alert(response.message);
    });
  };

  const submitAnswer = () => {
    if (selectedOption) {
      socket.emit('submit_answer', quizCode, joinQuizName, selectedOption);
      setIsSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Real-time Quiz Room</h1>
        {!isJoined && (
          <>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Your Name"
                value={createQuizName}
                onChange={(e) => setCreateQuizName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={createQuiz}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg block w-full mt-4"
              >
                Create Quiz
              </button>
            </div>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Enter Quiz Code"
                value={quizCode}
                onChange={(e) => setQuizCode(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Your Name"
                value={joinQuizName}
                onChange={(e) => setJoinQuizName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-4"
              />
              <button
                onClick={joinQuiz}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg block w-full mt-4"
              >
                Join Quiz
              </button>
            </div>
          </>
        )}
        {isQuizCreated && <div className="mb-2">Quiz Code: <strong>{quizCode}</strong></div>}
        {isJoined && (
          <>
            <div>
              {!isSubmitted ? (
                <div>
                  <h2 className="text-xl font-bold mb-2">Question</h2>
                  <p className="text-lg">{question}</p>
                  <ul>
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
                  <button onClick={submitAnswer} className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg" disabled={!selectedOption}>
                    Submit Answer
                  </button>
                </div>
              ) : (
                isCreator && (
                  <button onClick={endQuiz} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg">
                    End Quiz
                  </button>
                )
              )}
              <button onClick={leaveQuiz} className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg">
                Leave Quiz
              </button>
            </div>
          </>
        )}
        <h2 className="text-xl font-bold mt-6">Participants</h2>
        <ul className="list-disc list-inside">
          {participants.map((participant, index) => (
            <li key={index}>{participant.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
