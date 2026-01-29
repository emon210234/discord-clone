const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the Renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Load all messages from file
  loadMessages: () => ipcRenderer.invoke('load-messages'),
  
  // Save a single message to file
  saveMessage: (message) => ipcRenderer.invoke('save-message', message),
  
  // Clear all messages
  clearMessages: () => ipcRenderer.invoke('clear-messages')
});