document.addEventListener('DOMContentLoaded', () => {
    const todoSidebar = document.getElementById('todo-sidebar');
    const todoToggle = document.getElementById('todo-toggle');
    const todoClose = document.getElementById('todo-close');
    let isOpen = false;

    function toggleSidebar() {
        isOpen = !isOpen;
        todoSidebar.style.right = isOpen ? '0' : '-300px';
        todoToggle.style.right = isOpen ? '310px' : '10px';
    }

    todoToggle.addEventListener('click', toggleSidebar);
    todoClose.addEventListener('click', toggleSidebar);
}); 