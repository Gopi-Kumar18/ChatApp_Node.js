document.addEventListener("DOMContentLoaded", function() {
    let socket;
    const messages = document.getElementById('messages');
    const form = document.getElementById('form');
    const input = document.getElementById('input');
    const joinForm = document.getElementById('join-form');
    const chatRoom = document.getElementById('chat-room');

    // Login and Signup elements
    const loginForm = document.getElementById('login');
    const signupForm = document.getElementById('signup');
    const loginUsername = document.getElementById('login-username');
    const loginPassword = document.getElementById('login-password');
    const signupUsername = document.getElementById('signup-username');
    const signupPassword = document.getElementById('signup-password');

    const showLoginButton = document.getElementById('show-login');
    const showSignupButton = document.getElementById('show-signup');

    // Event listeners for switching between forms
    showLoginButton.addEventListener('click', () => {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('signup-form').style.display = 'none';
    });

    showSignupButton.addEventListener('click', () => {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('signup-form').style.display = 'block';
    });

    // Handle login form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = loginUsername.value;
        const password = loginPassword.value;

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (response.ok) {
                console.log(data.message);
                joinChatRoom(username);
            } else {
                console.log(data.error);
            }
        } catch (error) {
            console.error('Error logging in:', error);
        }
    });

    // Handle signup form submission
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = signupUsername.value;
        const password = signupPassword.value;

        try {
            const response = await fetch('/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (response.ok) {
                console.log(data.message);
                joinChatRoom(username);
            } else {
                console.log(data.error);
            }
        } catch (error) {
            console.error('Error signing up:', error);
        }
    });

    function joinChatRoom(username) {
        // Hide login/signup forms and show chat room
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('signup-form').style.display = 'none';
        chatRoom.style.display = 'block';

        // Connect to socket.io server
        socket = io();

        // Join the user's default chat room
        socket.emit('join', 'default-room', username);

        // Handle sending messages
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (input.value) {
                socket.emit('chat message', input.value, 'default-room', username);
                input.value = '';
            }
        });

        // Handle receiving messages
        socket.on('chat message', function(data) {
            const item = document.createElement('li');
            const formattedTime = new Date(data.time).toLocaleTimeString();

            if (data.username === username) {
                item.className = 'message-sender';
            } else {
                item.className = 'message-receiver';
            }

            item.innerHTML = `
                ${data.username}: ${data.message}
                <span class="message-timestamp">${formattedTime}</span>
            `;
            messages.appendChild(item);
        });

        // Handle chat history
        socket.on('chat history', function(messages) {
            messages.forEach(data => {
                const item = document.createElement('li');
                const formattedTime = new Date(data.time).toLocaleTimeString();

                if (data.username === username) {
                    item.className = 'message-sender';
                } else {
                    item.className = 'message-receiver';
                }

                item.innerHTML = `
                    ${data.username}: ${data.message}
                    <span class="message-timestamp">${formattedTime}</span>
                `;
                messages.appendChild(item);
            });
        });
    }
});
