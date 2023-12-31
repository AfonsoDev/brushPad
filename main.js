// const { app, BrowserWindow, ipcMain } = require('electron');
// const path = require('path');
// const fs = require('fs');

// let mainWindow;
// let tabs = [{ filePath: "untitled.txt", title: "Untitled", content: "" }];
// let currentTab = 0;

// function createWindow() {
//   mainWindow = new BrowserWindow({
//     width: 800,
//     height: 600,
//     webPreferences: {
//       nodeIntegration: true
//     }
//   });

//   mainWindow.loadFile('index.html');

//   mainWindow.on('closed', function () {
//     mainWindow = null;
//   });
// }

// app.on('ready', createWindow);

// ipcMain.on('change-tab', (event, tabIndex) => {
//   currentTab = tabIndex;
//   mainWindow.webContents.send('update-editor', tabs[currentTab].content);
// });

// ipcMain.on('save-content', (event, content) => {
//   tabs[currentTab].content = content;
// });

// ipcMain.on('open-file', (event, filePath, content) => {
//   tabs.push({ filePath, title: path.basename(filePath), content });
//   currentTab = tabs.length - 1;
//   mainWindow.webContents.send('update-tabs', tabs);
//   mainWindow.webContents.send('update-editor', content);
// });

// app.on('window-all-closed', function () {
//   if (process.platform !== 'darwin') app.quit();
// });

// app.on('activate', function () {
//   if (mainWindow === null) createWindow();
// });


const { app, BrowserWindow, ipcMain, dialog,globalShortcut  } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow;
let tabs = [{ filePath: "untitled.txt", title: "Untitled", content: "" }];
let currentTab = 0;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
    }
  });

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