// Global variables
let socket;
let currentUser = null;
let selectedUser = null;
let users = [];
let messages = [];
let unreadMessages = {}; // Store unread message counts per user
let lastMessageTimes = {}; // Store last message timestamps per user

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = JSON.parse(userData);
    document.getElementById('currentUserName').textContent = currentUser.fullName;

    // Initialize socket connection
    initSocket();
    
    // Load users
    loadUsers();
    
    // Setup event listeners
    setupEventListeners();
    
    // Request notification permission
    requestNotificationPermission();
});

// Request notification permission
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Show desktop notification
function showDesktopNotification(senderName, message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(`New message from ${senderName}`, {
            body: message.length > 50 ? message.substring(0, 50) + '...' : message,
            icon: '/favicon.ico' // Add your app icon path here
        });
        
        // Close notification after 5 seconds
        setTimeout(() => {
            notification.close();
        }, 5000);
    }
}

// Initialize Socket.io connection
function initSocket() {
    socket = io();
    
    // Connect user
    socket.emit('user-connected', currentUser.email);
    
    // Listen for incoming messages
    socket.on('receive-message', (data) => {
        console.log('Received message:', data);
        
        // Update last message time
        lastMessageTimes[data.sender] = new Date(data.timestamp);
        
        // If the message is from the currently selected user, display it immediately
        if (selectedUser && data.sender === selectedUser.email) {
            displayMessage(data);
        } else {
            // Add to unread messages count
            if (!unreadMessages[data.sender]) {
                unreadMessages[data.sender] = 0;
            }
            unreadMessages[data.sender]++;
            
            // Show desktop notification
            const senderUser = users.find(user => user.email === data.sender);
            if (senderUser) {
                showDesktopNotification(senderUser.fullName, data.message);
            }
        }
        
        // Always update the users list to show unread indicators and reorder
        updateUsersList();
        updateTotalUnreadCount();
    });
    
    // Listen for message sent confirmation
    socket.on('message-sent', (data) => {
        console.log('Message sent confirmation:', data);
        
        // Update last message time for receiver
        lastMessageTimes[data.receiver] = new Date(data.timestamp);
        
        displayMessage(data);
        
        // Reorder users list to show recently messaged user at top
        updateUsersList();
    });
    
    // Listen for user online/offline status
    socket.on('user-online', (email) => {
        console.log('User came online:', email);
        updateUserStatus(email, true);
    });
    
    socket.on('user-offline', (email) => {
        console.log('User went offline:', email);
        updateUserStatus(email, false);
    });
    
    // Handle connection errors
    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
    });

    // Handle message errors
    socket.on('message-error', (error) => {
        console.error('Message error:', error);
        alert('Failed to send message. Please try again.');
    });
}

// Load all users
async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        
        users = data.filter(user => user.email !== currentUser.email);
        
        // Load last message times
        await loadLastMessageTimes();
        
        displayUsers();
        
        // Load unread message counts
        await loadUnreadCounts();
    } catch (error) {
        console.error('Error loading users:', error);
        alert('Failed to load users. Please refresh the page.');
    }
}

// Load last message times for all users
async function loadLastMessageTimes() {
    try {
        const response = await fetch(`/api/last-message-times/${currentUser.email}`);
        if (response.ok) {
            const data = await response.json();
            lastMessageTimes = data;
        }
    } catch (error) {
        console.error('Error loading last message times:', error);
    }
}

// Load unread message counts for all users
async function loadUnreadCounts() {
    try {
        const response = await fetch(`/api/unread-counts/${currentUser.email}`);
        if (response.ok) {
            unreadMessages = await response.json();
            updateUsersList();
            updateTotalUnreadCount();
        }
    } catch (error) {
        console.error('Error loading unread counts:', error);
    }
}

// Update total unread count in page title
function updateTotalUnreadCount() {
    const totalUnread = Object.values(unreadMessages).reduce((sum, count) => sum + count, 0);
    const originalTitle = 'Messages - Infinite Learning';
    
    if (totalUnread > 0) {
        document.title = `(${totalUnread}) ${originalTitle}`;
    } else {
        document.title = originalTitle;
    }
}

// Sort users by last message time
function sortUsersByLastMessage(usersList) {
    return usersList.sort((a, b) => {
        const timeA = lastMessageTimes[a.email] ? new Date(lastMessageTimes[a.email]) : new Date(0);
        const timeB = lastMessageTimes[b.email] ? new Date(lastMessageTimes[b.email]) : new Date(0);
        return timeB - timeA; // Most recent first
    });
}

// Display users in sidebar
function displayUsers() {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '';
    
    // Sort users by last message time
    const sortedUsers = sortUsersByLastMessage([...users]);
    
    sortedUsers.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.setAttribute('data-email', user.email);
        
        // Add active class if this user is currently selected
        if (selectedUser && selectedUser.email === user.email) {
            userItem.classList.add('active');
        }
        
        const avatar = user.fullName.charAt(0).toUpperCase();
        const isOnline = user.isOnline;
        const lastSeen = new Date(user.lastSeen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const unreadCount = unreadMessages[user.email] || 0;
        
        userItem.innerHTML = `
            <div class="avatar">${avatar}</div>
            <div class="user-details">
                <h4>${user.fullName}</h4>
                <div class="user-meta">
                    <span class="status-indicator ${isOnline ? 'online' : ''}"></span>
                    <span>${isOnline ? 'Online' : 'Last seen ' + lastSeen}</span>
                </div>
            </div>
            ${unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : ''}
        `;
        
        userItem.addEventListener('click', () => selectUser(user));
        usersList.appendChild(userItem);
    });
}

// Select a user to chat with
async function selectUser(user) {
    selectedUser = user;
    console.log('Selected user:', selectedUser);
    
    // Mark messages as read for this user
    if (unreadMessages[user.email]) {
        await markMessagesAsRead(user.email);
        delete unreadMessages[user.email];
        updateTotalUnreadCount();
    }
    
    // Update UI - Remove active class from all items
    document.querySelectorAll('.user-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to selected item
    const selectedItem = document.querySelector(`[data-email="${user.email}"]`);
    if (selectedItem) {
        selectedItem.classList.add('active');
        // Remove unread badge
        const unreadBadge = selectedItem.querySelector('.unread-badge');
        if (unreadBadge) {
            unreadBadge.remove();
        }
    }
    
    // Update chat header
    const chatAvatar = document.getElementById('chatAvatar');
    const chatUserName = document.getElementById('chatUserName');
    const chatUserStatus = document.getElementById('chatUserStatus');
    
    chatAvatar.textContent = user.fullName.charAt(0).toUpperCase();
    chatUserName.textContent = user.fullName;
    chatUserStatus.textContent = user.isOnline ? 'Online' : 'Last seen ' + new Date(user.lastSeen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // Show message input
    document.getElementById('messageInputContainer').style.display = 'block';
    
    // Load messages
    await loadMessages();
    
    // Hide no chat selected message
    const noChatSelected = document.querySelector('.no-chat-selected');
    if (noChatSelected) {
        noChatSelected.style.display = 'none';
    }

    // Focus on message input
    document.getElementById('messageInput').focus();
}

// Mark messages as read
async function markMessagesAsRead(senderEmail) {
    try {
        await fetch('/api/mark-read', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                receiver: currentUser.email,
                sender: senderEmail
            })
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

// Load messages between current user and selected user
async function loadMessages() {
    try {
        const response = await fetch(`/api/messages/${currentUser.email}/${selectedUser.email}`);
        if (!response.ok) {
            throw new Error('Failed to fetch messages');
        }
        messages = await response.json();
        
        displayMessages();
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Display messages in chat container
function displayMessages() {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = '';
    
    messages.forEach(message => {
        displayMessage(message);
    });
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Display a single message
function displayMessage(messageData) {
    const messagesContainer = document.getElementById('messagesContainer');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${messageData.sender === currentUser.email ? 'sent' : 'received'}`;
    
    const time = new Date(messageData.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    messageDiv.innerHTML = `
        <div class="message-bubble">
            ${escapeHtml(messageData.message)}
            <span class="message-time">${time}</span>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Setup event listeners
function setupEventListeners() {
    // Message input
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    
    // Send message on button click
    sendButton.addEventListener('click', (e) => {
        e.preventDefault();
        sendMessage();
    });
    
    // Send message on Enter key
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Search users
    const searchInput = document.getElementById('searchUsers');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredUsers = users.filter(user => 
            user.fullName.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm)
        );
        displayFilteredUsers(filteredUsers);
    });
}

// Send message function
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    console.log('Attempting to send message:', message);
    console.log('Selected user:', selectedUser);
    console.log('Current user:', currentUser);
    
    if (!message) {
        console.log('Message is empty');
        return;
    }
    
    if (!selectedUser) {
        console.log('No user selected');
        alert('Please select a user to send message to');
        return;
    }

    if (!socket) {
        console.log('Socket not connected');
        alert('Connection error. Please refresh the page.');
        return;
    }
    
    // Send message via socket
    console.log('Sending message via socket...');
    socket.emit('send-message', {
        sender: currentUser.email,
        receiver: selectedUser.email,
        message: message
    });
    
    // Clear input
    messageInput.value = '';
    
    // Add message to local array for immediate display
    const messageData = {
        sender: currentUser.email,
        receiver: selectedUser.email,
        message: message,
        timestamp: new Date()
    };
    
    messages.push(messageData);
}

// Display filtered users
function displayFilteredUsers(filteredUsers) {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '';
    
    // Sort filtered users by last message time
    const sortedUsers = sortUsersByLastMessage([...filteredUsers]);
    
    sortedUsers.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.setAttribute('data-email', user.email);
        
        // Add active class if this user is currently selected
        if (selectedUser && selectedUser.email === user.email) {
            userItem.classList.add('active');
        }
        
        const avatar = user.fullName.charAt(0).toUpperCase();
        const isOnline = user.isOnline;
        const lastSeen = new Date(user.lastSeen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const unreadCount = unreadMessages[user.email] || 0;
        
        userItem.innerHTML = `
            <div class="avatar">${avatar}</div>
            <div class="user-details">
                <h4>${user.fullName}</h4>
                <div class="user-meta">
                    <span class="status-indicator ${isOnline ? 'online' : ''}"></span>
                    <span>${isOnline ? 'Online' : 'Last seen ' + lastSeen}</span>
                </div>
            </div>
            ${unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : ''}
        `;
        
        userItem.addEventListener('click', () => selectUser(user));
        usersList.appendChild(userItem);
    });
}

// Update user status
function updateUserStatus(email, isOnline) {
    const userIndex = users.findIndex(user => user.email === email);
    if (userIndex !== -1) {
        users[userIndex].isOnline = isOnline;
        users[userIndex].lastSeen = new Date();
        
        // Update UI
        const userItem = document.querySelector(`[data-email="${email}"]`);
        if (userItem) {
            const statusIndicator = userItem.querySelector('.status-indicator');
            const statusText = userItem.querySelector('.user-meta span:last-child');
            
            if (isOnline) {
                statusIndicator.classList.add('online');
                statusText.textContent = 'Online';
            } else {
                statusIndicator.classList.remove('online');
                statusText.textContent = 'Last seen ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }
        }
        
        // Update chat header if this user is currently selected
        if (selectedUser && selectedUser.email === email) {
            const chatUserStatus = document.getElementById('chatUserStatus');
            chatUserStatus.textContent = isOnline ? 'Online' : 'Last seen ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }
    }
}

// Update users list (for new messages indicator)
function updateUsersList() {
    displayUsers();
}

// Go back to home page
function goBack() {
    if (socket) {
        socket.disconnect();
    }
    window.location.href = 'home.html';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (socket) {
        socket.disconnect();
    }
});

// Handle visibility change (when user switches tabs)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // User switched away from tab
        if (socket && currentUser) {
            socket.emit('user-away', currentUser.email);
        }
    } else {
        // User came back to tab
        if (socket && currentUser) {
            socket.emit('user-back', currentUser.email);
        }
    }
});

// Debug function - you can remove this in production
function debugInfo() {
    console.log('Current User:', currentUser);
    console.log('Selected User:', selectedUser);
    console.log('Socket Connected:', socket && socket.connected);
    console.log('Users:', users);
    console.log('Messages:', messages);
    console.log('Unread Messages:', unreadMessages);
    console.log('Last Message Times:', lastMessageTimes);
}

// Make debug function available globally
window.debugInfo = debugInfo;