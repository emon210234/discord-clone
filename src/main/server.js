const { Server } = require('socket.io');
const http = require('http');

class ChatServer {
  constructor(port = 3000) {
    this.port = port;
    this.users = new Map(); // Store connected users
    this.httpServer = null;
    this.io = null;
  }

  start() {
    // Create HTTP server
    this.httpServer = http.createServer();
    
    // Attach Socket.IO to the HTTP server
    this.io = new Server(this.httpServer, {
      cors: {
        origin: '*', // Allow all origins (for development)
        methods: ['GET', 'POST']
      }
    });

    // Listen for connections
    this.io.on('connection', (socket) => {
      console.log('🔌 New user connected:', socket.id);

      // Handle user joining with username
      socket.on('user-join', (username) => {
        this.users.set(socket.id, username);
        console.log(`👤 ${username} joined (${socket.id})`);
        
        // Notify everyone a user joined
        this.io.emit('user-joined', {
          username,
          userId: socket.id,
          totalUsers: this.users.size
        });
        
        // Send current user list to the new user
        socket.emit('user-list', Array.from(this.users.values()));
      });

      // Handle incoming messages
      socket.on('send-message', (message) => {
        const username = this.users.get(socket.id) || 'Anonymous';
        console.log(`💬 ${username}: ${message.text}`);
        
        // Broadcast to ALL users (including sender)
        this.io.emit('new-message', {
          id: Date.now(),
          username,
          text: message.text,
          timestamp: new Date().toISOString()
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        const username = this.users.get(socket.id);
        this.users.delete(socket.id);
        console.log(`👋 ${username} disconnected`);
        
        // Notify everyone a user left
        this.io.emit('user-left', {
          username,
          totalUsers: this.users.size
        });
      });
    });

    // Start the server
    this.httpServer.listen(this.port, () => {
      console.log(`🚀 Chat server running on port ${this.port}`);
    });
  }

  stop() {
    if (this.httpServer) {
      this.httpServer.close();
      console.log('🛑 Chat server stopped');
    }
  }
}

module.exports = ChatServer;