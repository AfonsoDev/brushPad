const { ipcRenderer } = require('electron');

const tabsContainer = document.getElementById('tabs');
const editorTextarea = document.getElementById('editor');

// Initial setup
ipcRenderer.send('update-tabs', [{ filePath: "untitled.txt", title: "Untitled", content: "" }]);

ipcRenderer.on('update-tabs', (event, tabs) => {
  tabsContainer.innerHTML = '';
  tabs.forEach((tab, index) => {
    const tabElement = document.createElement('div');
    tabElement.classList.add('tab');
    tabElement.textContent = tab.title || "Untitled";
    tabElement.dataset.index = index;
    tabElement.addEventListener('click', () => changeTab(index));
    tabsContainer.appendChild(tabElement);
  });
});

ipcRenderer.on('update-editor', (event, content) => {
  editorTextarea.value = content;
});

editorTextarea.addEventListener('input', () => {
  ipcRenderer.send('save-content', editorTextarea.value);
});

function changeTab(index) {
  ipcRenderer.send('change-tab', index);
}    

// Open file dialog
document.getElementById('openFile').addEventListener('click', () => {
  ipcRenderer.send('open-file-dialog');
});

ipcRenderer.on('selected-file', (event, filePath, content) => {
  ipcRenderer.send('open-file', filePath, content);
});

// Open file dialog
document.getElementById('openFile').addEventListener('click', () => {
    ipcRenderer.send('open-file-dialog');
  });
  
  ipcRenderer.on('selected-file', (event, filePath, content) => {
    ipcRenderer.send('open-file', filePath, content);
  });
  