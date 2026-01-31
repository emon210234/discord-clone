const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Existing file operations
  loadMessages: () => ipcRenderer.invoke('load-messages'),
  saveMessage: (message) => ipcRenderer.invoke('save-message', message),
  clearMessages: () => ipcRenderer.invoke('clear-messages'),
  
  // NEW: Server control
  startServer: (port) => ipcRenderer.invoke('start-server', port),
  stopServer: () => ipcRenderer.invoke('stop-server')
});