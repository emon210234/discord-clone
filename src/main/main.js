const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const ChatServer = require('./server');  // ← Import server

// Paths
const DATA_FILE = path.join(app.getPath('userData'), 'messages.json');
const PRELOAD_PATH = path.join(__dirname, 'preload.js');
const RENDERER_PATH = path.join(__dirname, '../renderer/index.html');

let mainWindow;
let chatServer;  // ← Server instance

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: PRELOAD_PATH
    }
  });

  mainWindow.loadFile(RENDERER_PATH);
  mainWindow.webContents.openDevTools();
}

// Initialize data file
async function initializeDataFile() {
  try {
    await fs.access(DATA_FILE);
    console.log('✅ Data file exists:', DATA_FILE);
  } catch {
    const initialData = { messages: [] };
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
    console.log('✅ Created new data file');
  }
}

// IPC Handlers (keep existing ones)
ipcMain.handle('load-messages', async () => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.messages;
  } catch (error) {
    console.error('Error loading messages:', error);
    return [];
  }
});

ipcMain.handle('save-message', async (event, message) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    parsed.messages.push(message);
    await fs.writeFile(DATA_FILE, JSON.stringify(parsed, null, 2));
    console.log('✅ Message saved to file');
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving message:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('clear-messages', async () => {
  try {
    const initialData = { messages: [] };
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error clearing messages:', error);
    return { success: false, error: error.message };
  }
});

// NEW: Server control
ipcMain.handle('start-server', async (event, port) => {
  try {
    if (chatServer) {
      return { success: false, error: 'Server already running' };
    }
    
    chatServer = new ChatServer(port || 3000);
    chatServer.start();
    return { success: true, port: port || 3000 };
  } catch (error) {
    console.error('Error starting server:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-server', async () => {
  try {
    if (chatServer) {
      chatServer.stop();
      chatServer = null;
    }
    return { success: true };
  } catch (error) {
    console.error('Error stopping server:', error);
    return { success: false, error: error.message };
  }
});

// App lifecycle
app.whenReady().then(async () => {
  await initializeDataFile();
  createWindow();
});

app.on('window-all-closed', () => {
  // Stop server when app closes
  if (chatServer) {
    chatServer.stop();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});