const express = require('express');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

const { User, Chat } = require('./models.js');

dotenv.config();

const app = express();

const server = http.createServer(app);

const io = new Server(server);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });




app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true
}));

// Middleware to parse incoming requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the current directory
app.use(express.static(__dirname));

// Routes for signup and login
app.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if username is already taken
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username is already taken' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({ username, password: hashedPassword });
        await user.save();

        // Log the user in
        req.session.user = user;
        res.json({ message: 'Signup successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        // Validate password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        // Log the user in
        req.session.user = user;
        res.json({ message: 'Login successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Middleware to check if a user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('join', async (roomCode, username) => {
        socket.join(roomCode);
        console.log(`${username} joined room ${roomCode}`);

        // Load chat history
        let chat = await Chat.findOne({ roomCode });
        if (!chat) {
            chat = new Chat({ roomCode, messages: [] });
            await chat.save();
        }

        // Send chat history to the user
        socket.emit('chat history', chat.messages);
    });

    socket.on('chat message', async (msg, roomCode, username) => {
        // Save message in the database
        let chat = await Chat.findOne({ roomCode });
        if (!chat) {
            chat = new Chat({ roomCode, messages: [] });
            await chat.save();
        }

        const messageData = {
            username,
            message: msg,
            time: new Date()
        };

        chat.messages.push(messageData);
        await chat.save();

        // Broadcast message to the room
        io.to(roomCode).emit('chat message', messageData);
    });
});


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on port : http://localhost:${PORT}`);
});
