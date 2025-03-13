const { ipcRenderer } = require('electron');

const tabsContainer = document.getElementById('tabs');
const editorTextarea = document.getElementById('editor');
const blocksContainer = document.getElementById("blocks");

const textarea = document.getElementById("editor");
const todoSidebar = document.getElementById("todo-sidebar");
const todoList = document.getElementById("todo-list");

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

//Open file dialog
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

document.addEventListener('DOMContentLoaded', (event) => {

  const dropdownBtn = document.getElementById('dropdown-btn');
  const dropdownContent = document.getElementById('dropdown-content');

  dropdownBtn.addEventListener('click', () => {
    dropdownContent.style.display = (dropdownContent.style.display === 'block') ? 'none' : 'block';
  });

  // Feche o menu se clicar fora dele
  window.addEventListener('click', (event) => {
    if (!event.target.matches('#dropdown-btn')) {
      dropdownContent.style.display = 'none';
    }
  });

  const lineNumbers = document.getElementById('line-numbers');
  const editor = document.getElementById('editor');

  function updateLineNumbers() {
    const content = editor.value;
    const lines = content.split('\n');
    const lineNumbersHTML = lines.map((_, index) => `<div>${index + 1}</div>`).join('');
    lineNumbers.innerHTML = lineNumbersHTML;
  }

  editor.addEventListener('input', () => {
    ipcRenderer.send('save-content', editor.value);
    updateLineNumbers();
  });

  // ...

  // Atualiza os números de coluna quando o conteúdo é carregado
  ipcRenderer.on('update-editor', (event, content) => {
    editor.value = content;
    updateLineNumbers();
  });
  // Adicione este código onde você deseja chamar a função de salvar o arquivo

  document.getElementById('saveFile').addEventListener('click', () => {
    const content = document.getElementById('editor').value;
    console.log(content)
    ipcRenderer.send('save-file-dialog', content);
  });

  editorTextarea.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Evita quebra de linha
        
        const text = editorTextarea.value.trim();
        const regex = /^\/todolist\s+(.+)/;
        const match = text.match(regex);

        if (match) {
          const itemText = match[1];

          const todoItem = document.createElement("div");
          todoItem.classList.add("todo-item");

          todoItem.innerHTML = `
              <input type="checkbox">
              <span>${itemText}</span>
          `;

          // Adiciona o evento de clique para animar quando concluído
          todoItem.querySelector("input").addEventListener("change", function () {
              if (this.checked) {
                  todoItem.classList.add("checked");
              } else {
                  todoItem.classList.remove("checked");
              }
          });

          todoList.appendChild(todoItem);
          todoSidebar.classList.add("show");
          textarea.value = "";
        }
    }
});

});

ipcRenderer.on('shortcut-triggered', (event, message) => {
  alert(message);
});

function getSelectedText() {
  const selection = window.getSelection();
  const selectedText = selection.toString();

  if (selectedText) {
    console.log('Texto selecionado:', selectedText);
    // Faça algo com o texto selecionado, como enviar para o processo principal
    ipcRenderer.send('selected-text', selectedText);
  } else {
    console.log('Nenhum texto selecionado.');
  }
}