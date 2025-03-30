const { ipcRenderer } = require('electron');

const tabsContainer = document.getElementById('tabs');
const editorTextarea = document.getElementById('editor');
const blocksContainer = document.getElementById("blocks");
const textarea = document.getElementById("editor");
const todoSidebar = document.getElementById("todo-sidebar");
const todoList = document.getElementById("todo-list");
const todoToggle = document.getElementById('todo-toggle');
const todoClose = document.getElementById('todo-close');
const todoExport = document.getElementById('todo-export');
const todoImport = document.getElementById('todo-import');

// Initial setup
ipcRenderer.send('update-tabs', [{ filePath: "untitled.txt", title: "Untitled", content: "" }]);

ipcRenderer.on('update-tabs', (event, tabs) => {
  tabsContainer.innerHTML = '';
  tabs.forEach((tab, index) => {
    const tabElement = document.createElement('div');
    tabElement.classList.add('tab');
    tabElement.textContent = tab.title || "Untitled";
    tabElement.dataset.index = index;
    
    // Add close button
    const closeButton = document.createElement('button');
    const icon = document.createElement('i');
    icon.classList.add('bi', 'bi-x');
    closeButton.classList.add('btn', 'btn-white');
    closeButton.appendChild(icon);
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent tab selection when clicking close
      ipcRenderer.send('close-tab', index);
    });
    
    tabElement.appendChild(closeButton);
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

document.addEventListener('DOMContentLoaded', (event) => {
  const dropdownBtn = document.getElementById('dropdown-btn');
  const dropdownContent = document.getElementById('dropdown-content');
  const todoDropdownBtn = document.getElementById('todo-dropdown-btn');
  const todoDropdownContent = document.getElementById('todo-dropdown-content');

  // Handle File menu
  dropdownBtn.addEventListener('click', () => {
    dropdownContent.style.display = (dropdownContent.style.display === 'block') ? 'none' : 'block';
    todoDropdownContent.style.display = 'none';
  });

  // Handle Todo List menu
  todoDropdownBtn.addEventListener('click', () => {
    todoDropdownContent.style.display = (todoDropdownContent.style.display === 'block') ? 'none' : 'block';
    dropdownContent.style.display = 'none';
  });

  // Close menus if clicking outside
  window.addEventListener('click', (event) => {
    if (!event.target.matches('#dropdown-btn') && !event.target.matches('#todo-dropdown-btn')) {
      dropdownContent.style.display = 'none';
      todoDropdownContent.style.display = 'none';
    }
  });

  // Handle New file button
  document.querySelector('.dropdown-item[href="#"]').addEventListener('click', (e) => {
    e.preventDefault();
    ipcRenderer.send('new-file');
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

  // Update line numbers when content is loaded
  ipcRenderer.on('update-editor', (event, content) => {
    editor.value = content;
    updateLineNumbers();
  });

  // Save file dialog
  document.getElementById('saveFile').addEventListener('click', () => {
    const content = document.getElementById('editor').value;
    ipcRenderer.send('save-file-dialog', content);
  });

  // Todo list functionality
  const todoToggle = document.getElementById('todo-toggle');
  const todoSidebar = document.getElementById('todo-sidebar');
  const todoClose = document.getElementById('todo-close');
  const todoList = document.getElementById('todo-list');
  const todoExport = document.getElementById('todo-export');
  const todoImport = document.getElementById('todo-import');

  // Export todo list
  todoExport.addEventListener('click', (e) => {
    e.preventDefault();
    const todoItems = Array.from(todoList.children).map(item => ({
      text: item.querySelector('.todo-text').textContent,
      checked: item.querySelector('input[type="checkbox"]').checked
    }));
    ipcRenderer.send('save-todo-list', todoItems);
  });

  // Import todo list
  todoImport.addEventListener('click', (e) => {
    e.preventDefault();
    ipcRenderer.send('load-todo-list-dialog');
  });

  // Handle imported todo list
  ipcRenderer.on('todo-list-loaded', (event, todoData) => {
    // Clear existing items
    todoList.innerHTML = '';
    
    // Add imported items
    todoData.forEach(item => {
      const todoItem = document.createElement("div");
      todoItem.classList.add("todo-item");
      todoItem.draggable = true;

      todoItem.innerHTML = `
        <input type="checkbox" ${item.checked ? 'checked' : ''}>
        <span class="todo-text">${item.text}</span>
        <button class="btn-remove-todo ms-auto">
          <i class="bi bi-trash"></i>
        </button>
      `;

      // Add all the event listeners
      setupTodoItemEventListeners(todoItem);
      todoList.appendChild(todoItem);
    });
  });

  // Todo sidebar toggle functionality
  todoToggle.addEventListener('click', () => {
    todoSidebar.style.right = '0';
    todoToggle.style.right = '310px';
  });

  todoClose.addEventListener('click', () => {
    todoSidebar.style.right = '-300px';
    todoToggle.style.right = '10px';
  });

  // Handle todo item creation
  editorTextarea.addEventListener("keydown", function (event) {
    if (event.key === "Tab") {
      event.preventDefault();
      
      const text = editorTextarea.value.trim();
      const regex = /^\/todolist\s+(.+)/;
      const match = text.match(regex);

      if (match) {
        const itemText = match[1];
        createTodoItem(itemText);
        
        // Get the current cursor position
        const cursorPosition = editorTextarea.selectionStart;
        const lines = editorTextarea.value.split('\n');
        const currentLineIndex = editorTextarea.value.substr(0, cursorPosition).split('\n').length - 1;
        
        // Remove the command line
        lines.splice(currentLineIndex, 1);
        
        // Update the textarea value
        editorTextarea.value = lines.join('\n');
        
        // Set cursor to the end of the previous line
        const newPosition = editorTextarea.value.length;
        editorTextarea.setSelectionRange(newPosition, newPosition);
      }
    }
  });

  // Command suggestions functionality
  const commandSuggestions = document.getElementById('command-suggestions');
  let selectedCommandIndex = 0;

  editor.addEventListener('input', function(e) {
    const cursorPosition = this.selectionStart;
    const textBeforeCursor = this.value.substring(0, cursorPosition);
    const currentLine = textBeforeCursor.split('\n').pop();

    if (currentLine.startsWith('/')) {
      const command = currentLine.substring(1);
      showCommandSuggestions(command);
      updateCommandSuggestionsPosition();
    } else {
      hideCommandSuggestions();
    }
  });

  editor.addEventListener('keydown', function(e) {
    if (commandSuggestions.style.display === 'none') return;

    const items = commandSuggestions.querySelectorAll('.command-item');
    
    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedCommandIndex = (selectedCommandIndex + 1) % items.length;
        updateSelectedCommand();
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectedCommandIndex = (selectedCommandIndex - 1 + items.length) % items.length;
        updateSelectedCommand();
        break;
      case 'Enter':
        e.preventDefault();
        if (items[selectedCommandIndex]) {
          insertCommand(items[selectedCommandIndex].dataset.command);
        }
        break;
      case 'Escape':
        e.preventDefault();
        hideCommandSuggestions();
        break;
    }
  });

  function showCommandSuggestions(command) {
    const items = commandSuggestions.querySelectorAll('.command-item');
    let hasVisibleItems = false;

    items.forEach(item => {
      const commandName = item.dataset.command.substring(1);
      if (commandName.startsWith(command)) {
        item.style.display = 'flex';
        hasVisibleItems = true;
      } else {
        item.style.display = 'none';
      }
    });

    if (hasVisibleItems) {
      commandSuggestions.style.display = 'block';
      selectedCommandIndex = 0;
      updateSelectedCommand();
    } else {
      hideCommandSuggestions();
    }
  }

  function hideCommandSuggestions() {
    commandSuggestions.style.display = 'none';
    selectedCommandIndex = 0;
  }

  function updateSelectedCommand() {
    const items = commandSuggestions.querySelectorAll('.command-item');
    items.forEach((item, index) => {
      if (index === selectedCommandIndex) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }

  function updateCommandSuggestionsPosition() {
    const editorRect = editor.getBoundingClientRect();
    const cursorPosition = editor.selectionStart;
    const textBeforeCursor = editor.value.substring(0, cursorPosition);
    const lines = textBeforeCursor.split('\n');
    const currentLineNumber = lines.length;
    const currentLineStart = textBeforeCursor.lastIndexOf('\n') + 1;
    const currentLinePosition = cursorPosition - currentLineStart;

    // Create a temporary element to measure text width
    const temp = document.createElement('span');
    temp.style.visibility = 'hidden';
    temp.style.position = 'absolute';
    temp.style.whiteSpace = 'pre';
    temp.style.font = window.getComputedStyle(editor).font;
    temp.textContent = textBeforeCursor.substring(currentLineStart, cursorPosition);
    document.body.appendChild(temp);

    const textWidth = temp.offsetWidth;
    document.body.removeChild(temp);

    // Calculate position
    const lineHeight = parseInt(window.getComputedStyle(editor).lineHeight);
    const top = editorRect.top + (currentLineNumber - 1) * lineHeight + lineHeight;
    const left = editorRect.left + textWidth + 10; // Add some padding

    commandSuggestions.style.top = `${top}px`;
    commandSuggestions.style.left = `${left}px`;
  }

  function insertCommand(command) {
    const cursorPosition = editor.selectionStart;
    const textBeforeCursor = editor.value.substring(0, cursorPosition);
    const textAfterCursor = editor.value.substring(cursorPosition);
    const lines = textBeforeCursor.split('\n');
    const currentLineIndex = lines.length - 1;
    
    // Get the current line content
    const currentLine = lines[currentLineIndex];

    // If the current line starts with /, replace it with the selected command
    if (currentLine.startsWith('/')) {
      lines[currentLineIndex] = command;
    } else {
      // If not, add the command as a new line
      lines.push(command);
    }
    
    // Update the editor value
    editor.value = lines.join('\n') + textAfterCursor;
    
    // Move cursor to the end of the command
    const newPosition = lines.join('\n').length;
    editor.setSelectionRange(newPosition, newPosition);
    
    // Hide suggestions
    hideCommandSuggestions();
  }
});

// Helper function to set up event listeners for todo items
function setupTodoItemEventListeners(todoItem) {
  // Add drag and drop functionality
  todoItem.addEventListener('dragstart', function(e) {
    e.dataTransfer.setData('text/plain', '');
    this.classList.add('dragging');
  });

  todoItem.addEventListener('dragend', function(e) {
    this.classList.remove('dragging');
  });

  todoItem.addEventListener('dragover', function(e) {
    e.preventDefault();
    const draggingItem = document.querySelector('.dragging');
    if (draggingItem === this) return;
    
    const rect = this.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'before' : 'after';
    
    if (position === 'before') {
      todoList.insertBefore(draggingItem, this);
    } else {
      todoList.insertBefore(draggingItem, this.nextSibling);
    }
  });

  // Add click event for editing
  const todoText = todoItem.querySelector('.todo-text');
  todoText.addEventListener('click', function(e) {
    e.stopPropagation();
    const currentText = this.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.classList.add('form-control', 'todo-edit-input');
    
    this.replaceWith(input);
    input.focus();
    
    function saveEdit() {
      const newText = input.value.trim();
      if (newText) {
        const newSpan = document.createElement('span');
        newSpan.classList.add('todo-text');
        newSpan.textContent = newText;
        input.replaceWith(newSpan);
        
        // Reattach click event
        newSpan.addEventListener('click', arguments.callee);
      } else {
        todoItem.remove();
      }
    }
    
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        saveEdit();
      }
    });
  });

  // Add checkbox functionality
  todoItem.querySelector("input").addEventListener("change", function (e) {
    e.stopPropagation();
    if (this.checked) {
      todoItem.classList.add("checked");
    } else {
      todoItem.classList.remove("checked");
    }
  });

  // Add remove button functionality
  todoItem.querySelector(".btn-remove-todo").addEventListener("click", function(e) {
    e.stopPropagation();
    todoItem.style.opacity = "0";
    todoItem.style.transform = "translateX(20px)";
    setTimeout(() => {
      todoItem.remove();
    }, 300);
  });
}

function createTodoItem(itemText) {
  const todoItem = document.createElement("div");
  todoItem.classList.add("todo-item");
  todoItem.draggable = true;

  todoItem.innerHTML = `
    <input type="checkbox">
    <span class="todo-text">${itemText}</span>
    <button class="btn-remove-todo ms-auto">
      <i class="bi bi-trash"></i>
    </button>
  `;

  // Set up event listeners
  setupTodoItemEventListeners(todoItem);

  todoList.appendChild(todoItem);
  // Show the sidebar when adding a new item
  todoSidebar.style.right = '0';
  // Update the toggle button position
  todoToggle.style.right = '310px';
}

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

function formatJSON() {
  const textarea = document.getElementById("editor");
  try {
      const parsedJSON = JSON.parse(textarea.value); // Converte para objeto
      const formattedJSON = JSON.stringify(parsedJSON, null, 4); // Formata com identação
      textarea.value = formattedJSON;
  } catch (error) {
      alert("JSON inválido!");
  }
}

function formatAndDisplayJSON() {
  const textarea = document.getElementById("editor");
  const output = document.getElementById("json-output").querySelector("code");

  try {
      const parsedJSON = JSON.parse(textarea.value);
      const formattedJSON = JSON.stringify(parsedJSON, null, 4);
      output.textContent = formattedJSON; // Mostra o JSON formatado
  } catch (error) {
      output.textContent = "JSON inválido!";
  }
}

function formatAndHighlightJSON() {
  const textarea = document.getElementById("editor");
  const output = document.getElementById("json-output").querySelector("code");

  try {
      const parsedJSON = JSON.parse(textarea.value);
      const formattedJSON = JSON.stringify(parsedJSON, null, 4);
      output.textContent = formattedJSON;
      Prism.highlightElement(output); // Aplica o highlight
  } catch (error) {
      output.textContent = "JSON inválido!";
  }
}

