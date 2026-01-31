// Initialize chat client
const chatClient = new ChatClient();

// Get references to HTML elements
const connectionPanel = document.getElementById('connectionPanel');
const chatPanel = document.getElementById('chatPanel');
const usernameInput = document.getElementById('usernameInput');
const serverInput = document.getElementById('serverInput');
const connectBtn = document.getElementById('connectBtn');
const hostServerBtn = document.getElementById('hostServerBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const connectionStatus = document.getElementById('connectionStatus');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const messagesContainer = document.getElementById('messages');
const clearButton = document.getElementById('clearButton');
const userCount = document.getElementById('userCount');

let messageIdCounter = 1;
let isNetworkMode = false;

// ============================================
// Display Functions
// ============================================

function displayMessage(username, text, timestamp, isSystemMessage = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = isSystemMessage ? 'message system-message' : 'message';
  
  const usernameSpan = document.createElement('span');
  usernameSpan.className = 'username';
  usernameSpan.textContent = username;
  
  const timestampSpan = document.createElement('span');
  timestampSpan.className = 'timestamp';
  const date = new Date(timestamp);
  timestampSpan.textContent = date.toLocaleTimeString();
  
  const textDiv = document.createElement('div');
  textDiv.className = 'text';
  textDiv.textContent = text;
  
  messageDiv.appendChild(usernameSpan);
  messageDiv.appendChild(timestampSpan);
  messageDiv.appendChild(textDiv);
  
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showStatus(message, type = 'info') {
  connectionStatus.textContent = message;
  connectionStatus.className = `status status-${type}`;
  setTimeout(() => {
    connectionStatus.textContent = '';
    connectionStatus.className = 'status';
  }, 5000);
}

function updateUserCount(count) {
  userCount.textContent = `${count} user${count !== 1 ? 's' : ''} online`;
}

// ============================================
// Local Mode (File-based messaging)
// ============================================

async function sendLocalMessage() {
  const text = messageInput.value.trim();
  if (text === '') return;
  
  const message = {
    id: messageIdCounter++,
    username: 'You',
    text: text,
    timestamp: new Date().toISOString()
  };
  
  try {
    const result = await window.electronAPI.saveMessage(message);
    
    if (result.success) {
      displayMessage(message.username, message.text, message.timestamp);
      messageInput.value = '';
      messageInput.focus();
    } else {
      showStatus('Failed to save message!', 'error');
    }
  } catch (error) {
    console.error('Error sending message:', error);
    showStatus('Error sending message!', 'error');
  }
}

async function loadLocalMessages() {
  try {
    const messages = await window.electronAPI.loadMessages();
    
    messages.forEach(msg => {
      displayMessage(msg.username, msg.text, msg.timestamp);
      messageIdCounter = Math.max(messageIdCounter, msg.id + 1);
    });
    
    if (messages.length === 0) {
      displayMessage('System', 'No local messages. Send one to get started!', 
                     new Date().toISOString(), true);
    }
  } catch (error) {
    console.error('Error loading messages:', error);
    displayMessage('System', 'Error loading messages!', 
                   new Date().toISOString(), true);
  }
}

async function clearLocalMessages() {
  if (!confirm('Delete all local messages? This cannot be undone!')) {
    return;
  }
  
  try {
    const result = await window.electronAPI.clearMessages();
    
    if (result.success) {
      messagesContainer.innerHTML = '';
      messageIdCounter = 1;
      displayMessage('System', 'All local messages cleared!', 
                     new Date().toISOString(), true);
    }
  } catch (error) {
    console.error('Error clearing messages:', error);
    showStatus('Failed to clear messages!', 'error');
  }
}

// ============================================
// Network Mode (Real-time messaging)
// ============================================

function sendNetworkMessage() {
  const text = messageInput.value.trim();
  if (text === '') return;
  
  const success = chatClient.sendMessage(text);
  
  if (success) {
    messageInput.value = '';
    messageInput.focus();
  } else {
    showStatus('Not connected to server!', 'error');
  }
}

async function connectToServer() {
  const username = usernameInput.value.trim() || 'Anonymous';
  const serverUrl = serverInput.value.trim() || 'http://localhost:3000';
  
  showStatus('Connecting...', 'info');
  connectBtn.disabled = true;
  
  try {
    await chatClient.connect(serverUrl, username);
    
    // Switch to chat view
    connectionPanel.style.display = 'none';
    chatPanel.style.display = 'flex';
    isNetworkMode = true;
    
    // Enable input
    messageInput.disabled = false;
    sendButton.disabled = false;
    messageInput.focus();
    
    // Clear local messages and show network mode
    messagesContainer.innerHTML = '';
    displayMessage('System', `Connected as ${username}! You're now in network mode.`, 
                   new Date().toISOString(), true);
    
    showStatus('Connected!', 'success');
  } catch (error) {
    showStatus('Failed to connect: ' + error.message, 'error');
    connectBtn.disabled = false;
  }
}

async function hostServer() {
  const port = 3000;
  
  showStatus('Starting server...', 'info');
  hostServerBtn.disabled = true;
  
  try {
    const result = await window.electronAPI.startServer(port);
    
    if (result.success) {
      showStatus(`Server started on port ${result.port}!`, 'success');
      serverInput.value = `http://localhost:${result.port}`;
      
      // Auto-connect after starting server
      setTimeout(() => {
        connectToServer();
      }, 1000);
    } else {
      showStatus('Failed to start server: ' + result.error, 'error');
      hostServerBtn.disabled = false;
    }
  } catch (error) {
    showStatus('Error starting server: ' + error.message, 'error');
    hostServerBtn.disabled = false;
  }
}

function disconnectFromServer() {
  chatClient.disconnect();
  
  // Switch back to connection view
  chatPanel.style.display = 'none';
  connectionPanel.style.display = 'flex';
  isNetworkMode = false;
  
  // Disable input
  messageInput.disabled = true;
  sendButton.disabled = true;
  
  // Re-enable connection buttons
  connectBtn.disabled = false;
  hostServerBtn.disabled = false;
  
  showStatus('Disconnected', 'info');
}

// ============================================
// Chat Client Event Handlers
// ============================================

chatClient.onMessage((message) => {
  displayMessage(message.username, message.text, message.timestamp);
  
  // Optionally save network messages to local file
  window.electronAPI.saveMessage(message).catch(err => {
    console.error('Failed to save network message locally:', err);
  });
});

chatClient.onUserJoined((data) => {
  displayMessage('System', `${data.username} joined the chat`, 
                 new Date().toISOString(), true);
  updateUserCount(data.totalUsers);
});

chatClient.onUserLeft((data) => {
  displayMessage('System', `${data.username} left the chat`, 
                 new Date().toISOString(), true);
  updateUserCount(data.totalUsers);
});

chatClient.onConnected(() => {
  console.log('Connected to server');
});

chatClient.onDisconnected(() => {
  showStatus('Connection lost. Reconnecting...', 'error');
  
  // Optionally auto-reconnect
  setTimeout(() => {
    if (isNetworkMode) {
      connectToServer();
    }
  }, 3000);
});

// ============================================
// Event Listeners
// ============================================

// Connection panel
connectBtn.addEventListener('click', connectToServer);
hostServerBtn.addEventListener('click', hostServer);

usernameInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    connectToServer();
  }
});

serverInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    connectToServer();
  }
});

// Chat panel
sendButton.addEventListener('click', () => {
  if (isNetworkMode) {
    sendNetworkMessage();
  } else {
    sendLocalMessage();
  }
});

messageInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    if (isNetworkMode) {
      sendNetworkMessage();
    } else {
      sendLocalMessage();
    }
  }
});

disconnectBtn.addEventListener('click', disconnectFromServer);
clearButton.addEventListener('click', clearLocalMessages);

// ============================================
// Initialize App
// ============================================

// Start in local mode
loadLocalMessages();
messageInput.disabled = false;
sendButton.disabled = false;