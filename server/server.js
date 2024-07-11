const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors'); // Thêm Cors vào

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Thay bằng địa chỉ của client nếu cần
    methods: ["GET", "POST"]
  }
});

// Sử dụng Cors
app.use(cors());

// Kết nối tới MongoDB
mongoose.connect('mongodb+srv://tranquanttdtusec:MZNQQfGS4XP2pa7I@cluster0.reux0as.mongodb.net/twitter-db?retryWrites=true&w=majority&appName=Cluster0');
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Định nghĩa Schema và Model cho phòng quiz
const quizRoomSchema = new mongoose.Schema({
  quizId: { type: String, required: true, unique: true },
  participants: [{ id: String, name: String }],
  question: { type: String, default: '2 + 2 = ?' },
  options: { type: [String], default: ['3', '4', '5', '6'] },
});
const QuizRoom = mongoose.model('QuizRoom', quizRoomSchema);

// Xử lý các sự kiện Socket.IO
io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  // Kiểm tra xem phòng quiz có tồn tại không
  socket.on('check_quiz', async (quizId, callback) => {
    try {
      const room = await QuizRoom.findOne({ quizId });
      callback({ exists: !!room });
    } catch (err) {
      console.error(err);
      callback({ exists: false });
    }
  });

  // Tạo phòng quiz mới
  socket.on('create_quiz', async (quizId, callback) => {
    try {
      const room = await QuizRoom.findOne({ quizId });
      if (room) {
        callback({ success: false, message: 'Quiz ID already exists' });
        return;
      }
      const newRoom = new QuizRoom({ quizId, participants: [] });
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

  // Tham gia phòng quiz
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

  // Kết thúc phòng quiz
  socket.on('end_quiz', async (quizId, callback) => {
    try {
      console.log(`Quiz ended with ID: ${quizId}`);
      io.to(quizId).emit('quiz_ended');
      callback({ success: true, message: 'Quiz room ended successfully' });
    } catch (err) {
      console.error(err);
      callback({ success: false, message: 'Failed to end quiz room' });
    }
  });

  // Xử lý sự kiện ngắt kết nối
  socket.on('disconnect', async () => {
    console.log('user disconnected:', socket.id);
    try {
      const room = await QuizRoom.findOne({ participants: { $elemMatch: { id: socket.id } } });
      if (room) {
        room.participants = room.participants.filter(p => p.id !== socket.id);
        await room.save();
        io.to(room.quizId).emit('new_participant', room.participants);
      }
    } catch (err) {
      console.error(err);
    }
  });
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
