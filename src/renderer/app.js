// Get references to HTML elements
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const messagesContainer = document.getElementById('messages');
const clearButton = document.getElementById('clearButton');  // We'll add this to HTML

let messageIdCounter = 1;

// Function to add a message to the display
function displayMessage(username, text, timestamp) {
  // Create message element
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message';
  
  // Create username element
  const usernameSpan = document.createElement('span');
  usernameSpan.className = 'username';
  usernameSpan.textContent = username;
  
  // Create timestamp element
  const timestampSpan = document.createElement('span');
  timestampSpan.className = 'timestamp';
  const date = new Date(timestamp);
  timestampSpan.textContent = date.toLocaleTimeString();
  
  // Create text element
  const textDiv = document.createElement('div');
  textDiv.className = 'text';
  textDiv.textContent = text;
  
  // Assemble
  messageDiv.appendChild(usernameSpan);
  messageDiv.appendChild(timestampSpan);
  messageDiv.appendChild(textDiv);
  
  // Add to container
  messagesContainer.appendChild(messageDiv);
  
  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Function to send and save a message
async function sendMessage() {
  const text = messageInput.value.trim();
  
  if (text === '') return;
  
  // Create message object
  const message = {
    id: messageIdCounter++,
    username: 'You',
    text: text,
    timestamp: new Date().toISOString()
  };
  
  try {
    // Save to file via Main Process
    const result = await window.electronAPI.saveMessage(message);
    
    if (result.success) {
      // Display in UI
      displayMessage(message.username, message.text, message.timestamp);
      
      // Clear input
      messageInput.value = '';
      messageInput.focus();
    } else {
      console.error('Failed to save message:', result.error);
      alert('Failed to save message!');
    }
  } catch (error) {
    console.error('Error sending message:', error);
    alert('Error sending message!');
  }
}

// Function to load all messages on startup
async function loadMessages() {
  try {
    const messages = await window.electronAPI.loadMessages();
    
    console.log('Loaded messages:', messages);
    
    // Display each message
    messages.forEach(msg => {
      displayMessage(msg.username, msg.text, msg.timestamp);
      messageIdCounter = Math.max(messageIdCounter, msg.id + 1);
    });
    
    if (messages.length === 0) {
      displayMessage('System', 'No messages yet. Start chatting!', new Date().toISOString());
    }
  } catch (error) {
    console.error('Error loading messages:', error);
    displayMessage('System', 'Error loading messages!', new Date().toISOString());
  }
}

// Function to clear all messages
async function clearAllMessages() {
  if (!confirm('Delete all messages? This cannot be undone!')) {
    return;
  }
  
  try {
    const result = await window.electronAPI.clearMessages();
    
    if (result.success) {
      messagesContainer.innerHTML = '';
      messageIdCounter = 1;
      displayMessage('System', 'All messages cleared!', new Date().toISOString());
    }
  } catch (error) {
    console.error('Error clearing messages:', error);
    alert('Failed to clear messages!');
  }
}

// Event listeners
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    sendMessage();
  }
});

if (clearButton) {
  clearButton.addEventListener('click', clearAllMessages);
}

// Load messages when app starts
loadMessages();