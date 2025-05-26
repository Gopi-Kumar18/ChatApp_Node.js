const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
});

const chatSchema = new mongoose.Schema({
    roomCode: {
        type: String,
        required: true,
    },
    messages: [
        {
            username: String,
            message: String,
            time: Date,
        },
    ],
});

const User = mongoose.model('User', userSchema);
const Chat = mongoose.model('Chat', chatSchema);

module.exports = { User, Chat };
