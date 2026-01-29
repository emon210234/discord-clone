const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;

// Get the app root directory (where package.json is)
const APP_ROOT = path.join(__dirname, '../..');

// Path to renderer files
const RENDERER_PATH = path.join(APP_ROOT, 'src/renderer/index.html');

// Path to data file
const DATA_FILE = path.join(app.getPath('userData'), 'messages.json');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(RENDERER_PATH);  // ← Fixed!
  mainWindow.webContents.openDevTools();
}

// Initialize data file if it doesn't exist
async function initializeDataFile() {
  try {
    await fs.access(DATA_FILE);
    console.log('Data file exists:', DATA_FILE);
  } catch {
    // File doesn't exist, create it
    const initialData = { messages: [] };
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
    console.log('Created new data file:', DATA_FILE);
  }
}

// IPC Handlers - Main Process listens for these

// Load all messages
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

// Save a new message
ipcMain.handle('save-message', async (event, message) => {
  try {
    // Read current data
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    
    // Add new message
    parsed.messages.push(message);
    
    // Write back to file
    await fs.writeFile(DATA_FILE, JSON.stringify(parsed, null, 2));
    
    console.log('Message saved:', message);
    return { success: true };
  } catch (error) {
    console.error('Error saving message:', error);
    return { success: false, error: error.message };
  }
});

// Delete all messages
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

// App lifecycle
app.whenReady().then(async () => {
  await initializeDataFile();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});