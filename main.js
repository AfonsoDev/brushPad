const { app, BrowserWindow, ipcMain, dialog,globalShortcut, Menu  } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow;
let tabs = [{ filePath: "untitled.txt", title: "Untitled", content: "" }];
let currentTab = 0;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'build/icon.png'), // Caminho do ícone
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
    }
  });
  
  // Remove o menu padrão
  Menu.setApplicationMenu(null);

  mainWindow.loadFile('index.html');

  globalShortcut.register('CommandOrControl+Alt+D', () => {
    mainWindow.webContents.send('shortcut-triggered', 'Você pressionou o atalho!');
  });
  

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

ipcMain.on('change-tab', (event, tabIndex) => {
  currentTab = tabIndex;
  mainWindow.webContents.send('update-editor', tabs[currentTab].content);
});

ipcMain.on('save-content', (event, content) => {
  tabs[currentTab].content = content;
});

ipcMain.on('open-file-dialog', (event) => {
  const result = dialog.showOpenDialogSync(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt', 'text'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result) {
    const filePath = result[0];
    const content = fs.readFileSync(filePath, 'utf-8');
    mainWindow.webContents.send('selected-file', filePath, content);
  }
});

ipcMain.on('open-file', (event, filePath, content) => {
  tabs.push({ filePath, title: path.basename(filePath), content });
  currentTab = tabs.length - 1;
  mainWindow.webContents.send('update-tabs', tabs);
  mainWindow.webContents.send('update-editor', content);
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

ipcMain.on('save-file-dialog', (event, content) => {
  const mainWindow = BrowserWindow.fromWebContents(event.sender);

  dialog.showSaveDialog(mainWindow, {
    title: 'Salvar Arquivo',
    defaultPath: path.join(app.getPath('documents'), ''),
    filters: [
      { name: 'Text Files', extensions: ['txt', 'text'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  }).then((result) => {
    if (!result.canceled) {
      const filePath = result.filePath;
      fs.writeFileSync(filePath, content, 'utf-8');
      event.sender.send('file-saved', filePath);
    }
  }).catch((err) => {
    console.error(err);
  });
});

// Libera os atalhos globais quando o aplicativo é fechado
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Add these IPC handlers after your existing IPC handlers

ipcMain.on('save-todo-list', (event, todoData) => {
    dialog.showSaveDialog({
        title: 'Save Todo List',
        defaultPath: 'todolist.json',
        filters: [
            { name: 'JSON Files', extensions: ['json'] }
        ]
    }).then(result => {
        if (!result.canceled && result.filePath) {
            fs.writeFile(result.filePath, JSON.stringify(todoData, null, 2), 'utf8', (err) => {
                if (err) {
                    console.error('Error saving todo list:', err);
                    event.reply('todo-list-saved', false);
                } else {
                    console.log('Todo list saved successfully');
                    event.reply('todo-list-saved', true);
                }
            });
        }
    });
});

ipcMain.on('load-todo-list-dialog', (event) => {
    dialog.showOpenDialog({
        title: 'Load Todo List',
        filters: [
            { name: 'JSON Files', extensions: ['json'] }
        ]
    }).then(result => {
        if (!result.canceled && result.filePaths.length > 0) {
            fs.readFile(result.filePaths[0], 'utf8', (err, data) => {
                if (err) {
                    console.error('Error loading todo list:', err);
                } else {
                    try {
                        const todoData = JSON.parse(data);
                        event.reply('todo-list-loaded', todoData);
                    } catch (error) {
                        console.error('Error parsing todo list data:', error);
                    }
                }
            });
        }
    });
});

// Add this after your existing IPC handlers
ipcMain.on('new-file', (event) => {
  // Create a new tab with default values
  const newTab = {
    filePath: `untitled${tabs.length + 1}.txt`,
    title: `Untitled ${tabs.length + 1}`,
    content: ""
  };
  
  // Add the new tab to the tabs array
  tabs.push(newTab);
  
  // Set the current tab to the new one
  currentTab = tabs.length - 1;
  
  // Update the UI with the new tab
  mainWindow.webContents.send('update-tabs', tabs);
  mainWindow.webContents.send('update-editor', "");
});

// Add this after your existing IPC handlers
ipcMain.on('close-tab', (event, tabIndex) => {
  // Don't close if it's the last tab
  if (tabs.length <= 1) return;
  
  // Remove the tab
  tabs.splice(tabIndex, 1);
  
  // If we closed the current tab, switch to the previous tab
  if (currentTab === tabIndex) {
    currentTab = Math.max(0, tabIndex - 1);
  } else if (currentTab > tabIndex) {
    // If we closed a tab before the current tab, adjust the current tab index
    currentTab--;
  }
  
  // Update the UI
  mainWindow.webContents.send('update-tabs', tabs);
  mainWindow.webContents.send('update-editor', tabs[currentTab].content);
});