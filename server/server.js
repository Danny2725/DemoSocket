const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());

// Update your MongoDB URI below
mongoose.connect('mongodb+srv://tranquanttdtusec:MZNQQfGS4XP2pa7I@cluster0.reux0as.mongodb.net/twitter-db?retryWrites=true&w=majority&appName=Cluster0');
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

const quizRoomSchema = new mongoose.Schema({
  quizCode: { type: String, required: true, unique: true },
  participants: [{ id: String, name: String }],
  creatorId: { type: String, required: true },
  question: { type: String, default: '2 + 2 = ?' },
  options: { type: [String], default: ['3', '4', '5', '6'] },
});
const QuizRoom = mongoose.model('QuizRoom', quizRoomSchema);

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('create_quiz', async (callback) => {
    try {
      let quizCode;
      let isUnique = false;
      while (!isUnique) {
        quizCode = Math.floor(1000 + Math.random() * 9000).toString(); // Generate a 4-digit code
        const existingRoom = await QuizRoom.findOne({ quizCode });
        if (!existingRoom) isUnique = true;
      }
      const newRoom = new QuizRoom({ quizCode, participants: [], creatorId: socket.id });
      await newRoom.save();
      socket.join(quizCode);
      console.log(`Quiz created with code: ${quizCode}`);
      callback({ success: true, message: 'Quiz room created successfully', quizCode, question: newRoom.question, options: newRoom.options });
      io.to(quizCode).emit('new_question', { question: newRoom.question, options: newRoom.options });
    } catch (err) {
      console.error(err);
      callback({ success: false, message: 'Failed to create quiz room' });
    }
  });

  socket.on('join_quiz', async (quizCode, userName, callback) => {
    try {
      const room = await QuizRoom.findOne({ quizCode });
      if (!room) {
        callback({ success: false, message: 'Quiz code not found' });
        return;
      }
      socket.join(quizCode);
      room.participants.push({ id: socket.id, name: userName });
      await room.save();
      io.to(quizCode).emit('new_participant', room.participants);
      callback({ success: true, message: 'Joined quiz room successfully', question: room.question, options: room.options });
    } catch (err) {
      console.error(err);
      callback({ success: false, message: 'Failed to join quiz room' });
    }
  });

  socket.on('leave_quiz', async (quizCode, callback) => {
    try {
      const room = await QuizRoom.findOne({ quizCode });
      if (!room) {
        callback({ success: false, message: 'Quiz code not found' });
        return;
      }
      room.participants = room.participants.filter(p => p.id !== socket.id);
      await room.save();
      socket.leave(quizCode);
      io.to(quizCode).emit('new_participant', room.participants);

      if (room.participants.length === 0) {
        io.to(quizCode).emit('quiz_ended');
      }
      
      callback({ success: true, message: 'Left quiz room successfully' });
    } catch (err) {
      console.error(err);
      callback({ success: false, message: 'Failed to leave quiz room' });
    }
  });

  socket.on('end_quiz', async (quizCode, callback) => {
    try {
      const room = await QuizRoom.findOne({ quizCode });
      if (!room) {
        callback({ success: false, message: 'Quiz code not found' });
        return;
      }
      if (room.creatorId !== socket.id) {
        callback({ success: false, message: 'Only the creator can end the quiz' });
        return;
      }
      await QuizRoom.deleteOne({ quizCode }); // Optionally delete the quiz room from the database
      console.log(`Quiz ended with code: ${quizCode}`);
      io.to(quizCode).emit('quiz_ended');
      callback({ success: true, message: 'Quiz room ended successfully' });
    } catch (err) {
      console.error(err);
      callback({ success: false, message: 'Failed to end quiz room' });
    }
  });

  socket.on('submit_answer', (quizCode, userName, answer) => {
    console.log(`Received answer from ${userName}: ${answer}`);
    io.to(quizCode).emit('answer_submitted', { userName, answer });
  });

  socket.on('disconnect', async () => {
    console.log('user disconnected:', socket.id);
    try {
      const room = await QuizRoom.findOne({ participants: { $elemMatch: { id: socket.id } } });
      if (room) {
        room.participants = room.participants.filter(p => p.id !== socket.id);
        await room.save();
        io.to(room.quizCode).emit('new_participant', room.participants);
        if (room.participants.length === 0) {
          io.to(room.quizCode).emit('quiz_ended');
        }
      }
    } catch (err) {
      console.error(err);
    }
  });
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
