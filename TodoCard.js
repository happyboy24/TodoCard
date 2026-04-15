const tasksListEl = document.getElementById('tasks-list');
const todoForm = document.getElementById('todo-form');
const titleInput = document.getElementById('todo-title');
const descriptionInput = document.getElementById('todo-description');
const dueDateInput = document.getElementById('todo-due-date');
const priorityInput = document.getElementById('todo-priority');
const tagsInput = document.getElementById('todo-tags');

let nextTodoId = 2;
const todos = [
  {
    id: 1,
    title: 'Design new landing page hero section',
    description: 'Create modern hero section with gradient background, animated call-to-action button, and responsive typography. Include testimonials carousel and feature highlights.',
    due: '2026-03-01',
    priority: 'high',
    tags: ['work', 'urgent', 'design'],
    completed: false,
  },
];

function formatDueDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getTimeRemaining(dateString) {
  const now = Date.now();
  const dueTime = new Date(dateString).getTime();
  const diffMs = dueTime - now;

  if (diffMs < 0) {
    const overdueMs = Math.abs(diffMs);
    const hours = Math.floor(overdueMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    return days > 0
      ? `Overdue by ${days} ${days === 1 ? 'day' : 'days'}`
      : `Overdue by ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }

  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return days === 1 ? 'Due tomorrow' : `Due in ${days} ${days === 1 ? 'day' : 'days'}`;
}

function renderTodos() {
  tasksListEl.innerHTML = '';

  if (todos.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-tasks';
    emptyMessage.textContent = 'No tasks yet. Add your first task above!';
    tasksListEl.appendChild(emptyMessage);
    return;
  }

  todos.forEach((todo) => {
    tasksListEl.appendChild(createTaskElement(todo));
  });
}

function createTaskElement(todo) {
  const taskDiv = document.createElement('div');
  taskDiv.className = 'task-item';
  taskDiv.setAttribute('data-task-id', todo.id);

  const isEditing = todo.isEditing || false;

  if (isEditing) {
    taskDiv.innerHTML = `
      <form class="edit-form" data-todo-id="${todo.id}">
        <div class="task-header">
          <input
            type="checkbox"
            id="edit-complete-toggle-${todo.id}"
            class="task-complete-toggle"
            ${todo.completed ? 'checked' : ''}
          />
          <div class="edit-fields">
            <input id="edit-title-${todo.id}" type="text" value="${todo.title}" required placeholder="Task title">
            <select id="edit-priority-${todo.id}">
              <option value="high" ${todo.priority === 'high' ? 'selected' : ''}>High</option>
              <option value="medium" ${todo.priority === 'medium' ? 'selected' : ''}>Medium</option>
              <option value="low" ${todo.priority === 'low' ? 'selected' : ''}>Low</option>
            </select>
          </div>
        </div>
        <div class="task-content">
          <textarea id="edit-description-${todo.id}" rows="2" placeholder="Task description">${todo.description}</textarea>
          <div class="task-meta">
            <input id="edit-due-date-${todo.id}" type="date" value="${todo.due}">
            <input id="edit-tags-${todo.id}" type="text" value="${todo.tags.join(', ')}" placeholder="Tags">
          </div>
        </div>
        <div class="task-actions">
          <button type="submit" class="save-button">Save</button>
          <button type="button" class="cancel-button">Cancel</button>
        </div>
      </form>
    `;

    const form = taskDiv.querySelector('.edit-form');
    const completeToggle = taskDiv.querySelector('.task-complete-toggle');

    completeToggle.addEventListener('change', (event) => {
      updateTodoCompletion(todo.id, event.target.checked);
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      saveEdit(todo.id);
    });

    taskDiv.querySelector('.cancel-button').addEventListener('click', () => {
      cancelEdit(todo.id);
    });
  } else {
    taskDiv.innerHTML = `
      <div class="task-header">
        <input
          type="checkbox"
          id="complete-toggle-${todo.id}"
          class="task-complete-toggle"
          ${todo.completed ? 'checked' : ''}
        />
        <div class="task-info">
          <h3 class="task-title ${todo.completed ? 'completed' : ''}">${todo.title}</h3>
          <div class="task-meta">
            <span class="priority ${todo.priority}">${todo.priority}</span>
            <span class="status ${todo.completed ? 'done' : 'in-progress'}">${todo.completed ? 'Done' : 'In Progress'}</span>
            <time datetime="${todo.due}">${formatDueDate(todo.due)}</time>
            <span class="time-remaining">${getTimeRemaining(todo.due)}</span>
          </div>
        </div>
        <div class="task-actions">
          <button type="button" class="edit-button">Edit</button>
          <button type="button" class="delete-button">Delete</button>
        </div>
      </div>
      <div class="task-content">
        <p class="task-description">${todo.description}</p>
        ${todo.tags.length > 0 ? `<div class="task-tags">${todo.tags.map(tag => `<span class="tag">${tag.trim()}</span>`).join('')}</div>` : ''}
      </div>
    `;

    taskDiv.querySelector('.task-complete-toggle').addEventListener('change', (event) => {
      updateTodoCompletion(todo.id, event.target.checked);
    });

    taskDiv.querySelector('.edit-button').addEventListener('click', () => {
      startEdit(todo.id);
    });

    taskDiv.querySelector('.delete-button').addEventListener('click', () => {
      deleteTodo(todo.id);
    });
  }

  return taskDiv;
}

function updateTodoCompletion(todoId, completed) {
  const todo = todos.find((item) => item.id === todoId);
  if (!todo) return;
  todo.completed = completed;
  saveState();
  renderTodos();
}

function parseDateInput(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function startEdit(todoId) {
  const todo = todos.find((item) => item.id === todoId);
  if (!todo) return;
  todo.isEditing = true;
  renderTodos();
}

function saveEdit(todoId) {
  const todo = todos.find((item) => item.id === todoId);
  if (!todo) return;

  const titleInput = document.getElementById(`edit-title-${todoId}`);
  const descriptionInput = document.getElementById(`edit-description-${todoId}`);
  const dueDateInput = document.getElementById(`edit-due-date-${todoId}`);
  const priorityInput = document.getElementById(`edit-priority-${todoId}`);
  const tagsInput = document.getElementById(`edit-tags-${todoId}`);

  const newTitle = titleInput.value.trim();
  const newDescription = descriptionInput.value.trim();
  const newDue = dueDateInput.value;
  const newPriority = priorityInput.value;
  const newTags = tagsInput.value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!newTitle || !newDue) {
    return; // Don't save if required fields are empty
  }

  const parsedDue = parseDateInput(newDue);
  if (!parsedDue) {
    return; // Don't save if date is invalid
  }

  todo.title = newTitle;
  todo.description = newDescription;
  todo.due = parsedDue;
  todo.priority = newPriority;
  todo.tags = newTags;
  todo.isEditing = false;

  saveState();
  renderTodos();
}

function cancelEdit(todoId) {
  const todo = todos.find((item) => item.id === todoId);
  if (!todo) return;
  todo.isEditing = false;
  renderTodos();
}

function deleteTodo(todoId) {
  const index = todos.findIndex((item) => item.id === todoId);
  if (index === -1) return;
  todos.splice(index, 1);
  saveState();
  renderTodos();
}

function addNewTodo() {
  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const dueDate = dueDateInput.value;
  const priority = priorityInput.value;
  const tags = tagsInput.value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (!title || !dueDate) {
    return;
  }

  todos.push({
    id: nextTodoId++,
    title,
    description,
    due: dueDate,
    priority,
    tags,
    completed: false,
  });

  todoForm.reset();
  renderTodos();
}

todoForm.addEventListener('submit', (event) => {
  event.preventDefault();
  addNewTodo();
});

renderTodos();
