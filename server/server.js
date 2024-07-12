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

mongoose.connect('mongodb+srv://tranquanttdtusec:MZNQQfGS4XP2pa7I@cluster0.reux0as.mongodb.net/twitter-db?retryWrites=true&w=majority&appName=Cluster0');
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

const quizRoomSchema = new mongoose.Schema({
  quizId: { type: String, required: true, unique: true },
  participants: [{ id: String, name: String }],
  creatorId: { type: String, required: true },
  question: { type: String, default: '2 + 2 = ?' },
  options: { type: [String], default: ['3', '4', '5', '6'] },
});
const QuizRoom = mongoose.model('QuizRoom', quizRoomSchema);

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('check_quiz', async (quizId, callback) => {
    try {
      const room = await QuizRoom.findOne({ quizId });
      callback({ exists: !!room });
    } catch (err) {
      console.error(err);
      callback({ exists: false });
    }
  });

  socket.on('create_quiz', async (quizId, callback) => {
    try {
      const room = await QuizRoom.findOne({ quizId });
      if (room) {
        callback({ success: false, message: 'Quiz ID already exists' });
        return;
      }
      const newRoom = new QuizRoom({ quizId, participants: [], creatorId: socket.id });
      await newRoom.save();
      socket.join(quizId);
      console.log(`Quiz created with ID: ${quizId}`);
      callback({ success: true, message: 'Quiz room created successfully', question: newRoom.question, options: newRoom.options });
      io.to(quizId).emit('new_question', { question: newRoom.question, options: newRoom.options });
    } catch (err) {
      console.error(err);
      callback({ success: false, message: 'Failed to create quiz room' });
    }
  });

  socket.on('join_quiz', async (quizId, userName, callback) => {
    try {
      const room = await QuizRoom.findOne({ quizId });
      if (!room) {
        callback({ success: false, message: 'Quiz ID not found' });
        return;
      }
      socket.join(quizId);
      room.participants.push({ id: socket.id, name: userName });
      await room.save();
      io.to(quizId).emit('new_participant', room.participants);
      callback({ success: true, message: 'Joined quiz room successfully', question: room.question, options: room.options });
    } catch (err) {
      console.error(err);
      callback({ success: false, message: 'Failed to join quiz room' });
    }
  });

  socket.on('leave_quiz', async (quizId, callback) => {
    try {
      const room = await QuizRoom.findOne({ quizId });
      if (!room) {
        callback({ success: false, message: 'Quiz ID not found' });
        return;
      }
      room.participants = room.participants.filter(p => p.id !== socket.id);
      await room.save();
      socket.leave(quizId);
      io.to(quizId).emit('new_participant', room.participants);

      if (room.participants.length === 0) {
        io.to(quizId).emit('quiz_ended');
      }
      
      callback({ success: true, message: 'Left quiz room successfully' });
    } catch (err) {
      console.error(err);
      callback({ success: false, message: 'Failed to leave quiz room' });
    }
  });

  socket.on('end_quiz', async (quizId, callback) => {
    try {
      const room = await QuizRoom.findOne({ quizId });
      if (!room) {
        callback({ success: false, message: 'Quiz ID not found' });
        return;
      }
      if (room.creatorId !== socket.id) {
        callback({ success: false, message: 'Only the creator can end the quiz' });
        return;
      }
      console.log(`Quiz ended with ID: ${quizId}`);
      io.to(quizId).emit('quiz_ended');
      callback({ success: true, message: 'Quiz room ended successfully' });
    } catch (err) {
      console.error(err);
      callback({ success: false, message: 'Failed to end quiz room' });
    }
  });

  // Thêm sự kiện submit_answer
  socket.on('submit_answer', (quizId, userName, answer) => {
    console.log(`Received answer from ${userName}: ${answer}`);
    io.to(quizId).emit('answer_submitted', { userName, answer });
  });

  socket.on('disconnect', async () => {
    console.log('user disconnected:', socket.id);
    try {
      const room = await QuizRoom.findOne({ participants: { $elemMatch: { id: socket.id } } });
      if (room) {
        room.participants = room.participants.filter(p => p.id !== socket.id);
        await room.save();
        io.to(room.quizId).emit('new_participant', room.participants);
        if (room.participants.length === 0) {
          io.to(room.quizId).emit('quiz_ended');
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
