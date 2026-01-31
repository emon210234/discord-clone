class ChatClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.username = 'Anonymous';
    this.onMessageCallback = null;
    this.onUserJoinedCallback = null;
    this.onUserLeftCallback = null;
    this.onConnectedCallback = null;
    this.onDisconnectedCallback = null;
  }

  connect(serverUrl, username) {
    this.username = username;
    
    // Load Socket.IO client from CDN
    return new Promise((resolve, reject) => {
      if (typeof io === 'undefined') {
        reject(new Error('Socket.IO client not loaded'));
        return;
      }

      this.socket = io(serverUrl);

      this.socket.on('connect', () => {
        console.log('✅ Connected to server');
        this.connected = true;
        this.socket.emit('user-join', this.username);
        
        if (this.onConnectedCallback) {
          this.onConnectedCallback();
        }
        
        resolve();
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
        this.connected = false;
        
        if (this.onDisconnectedCallback) {
          this.onDisconnectedCallback();
        }
      });

      this.socket.on('new-message', (message) => {
        console.log('📨 New message:', message);
        
        if (this.onMessageCallback) {
          this.onMessageCallback(message);
        }
      });

      this.socket.on('user-joined', (data) => {
        console.log('👤 User joined:', data.username);
        
        if (this.onUserJoinedCallback) {
          this.onUserJoinedCallback(data);
        }
      });

      this.socket.on('user-left', (data) => {
        console.log('👋 User left:', data.username);
        
        if (this.onUserLeftCallback) {
          this.onUserLeftCallback(data);
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });
    });
  }

  sendMessage(text) {
    if (!this.connected) {
      console.error('Not connected to server');
      return false;
    }

    this.socket.emit('send-message', { text });
    return true;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  onMessage(callback) {
    this.onMessageCallback = callback;
  }

  onUserJoined(callback) {
    this.onUserJoinedCallback = callback;
  }

  onUserLeft(callback) {
    this.onUserLeftCallback = callback;
  }

  onConnected(callback) {
    this.onConnectedCallback = callback;
  }

  onDisconnected(callback) {
    this.onDisconnectedCallback = callback;
  }
}