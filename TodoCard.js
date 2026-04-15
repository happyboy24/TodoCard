const tasksListEl = document.getElementById('tasks-list');
const todoForm = document.getElementById('todo-form');
const titleInput = document.getElementById('todo-title');
const descriptionInput = document.getElementById('todo-description');
const dueDateInput = document.getElementById('todo-due-date');
const priorityInput = document.getElementById('todo-priority');
const tagsInput = document.getElementById('todo-tags');

const STORAGE_KEY = 'todo-app-state';
let nextTodoId = 1;
let todos = [];
let timeUpdateInterval;

function formatDueDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getTimeRemaining(dateString, status) {
  if (status === 'done') {
    return 'Completed';
  }

  const now = Date.now();
  const dueTime = new Date(dateString).getTime();
  const diffMs = dueTime - now;

  if (diffMs < 0) {
    const overdueMs = Math.abs(diffMs);
    const minutes = Math.floor(overdueMs / (1000 * 60));
    const hours = Math.floor(overdueMs / (1000 * 60 * 60));
    const days = Math.floor(overdueMs / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return `Overdue by ${days} ${days === 1 ? 'day' : 'days'}`;
    } else if (hours > 0) {
      return `Overdue by ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    } else {
      return `Overdue by ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    }
  }

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days > 0) {
    return `Due in ${days} ${days === 1 ? 'day' : 'days'}`;
  } else if (hours > 0) {
    return `Due in ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  } else {
    return `Due in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const state = JSON.parse(raw);
    if (Array.isArray(state.todos) && typeof state.nextTodoId === 'number') {
      todos = state.todos.map(todo => ({
        ...todo,
        status: todo.status || (todo.completed ? 'done' : 'pending'), // Migrate old data
        completed: undefined // Remove completed, use status
      }));
      nextTodoId = state.nextTodoId;
    }
  } catch (_) {
    // Ignore invalid saved state and use a clean start.
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ todos, nextTodoId }));
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

  // Start time updates if there are pending/in-progress tasks
  const hasActiveTasks = todos.some(todo => todo.status !== 'done');
  if (hasActiveTasks && !timeUpdateInterval) {
    timeUpdateInterval = setInterval(() => {
      updateTimeDisplays();
    }, 30000); // Update every 30 seconds
  } else if (!hasActiveTasks && timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
    timeUpdateInterval = null;
  }
}

function updateTimeDisplays() {
  todos.forEach(todo => {
    if (todo.status === 'done') return;
    const timeEl = document.querySelector(`[data-task-id="${todo.id}"] .time-remaining`);
    if (timeEl) {
      timeEl.textContent = getTimeRemaining(todo.due, todo.status);
      timeEl.setAttribute('aria-live', 'polite');
    }
  });
}

function createTaskElement(todo) {
  const taskDiv = document.createElement('div');
  taskDiv.className = `task-item ${todo.status === 'done' ? 'completed' : ''} ${getTimeRemaining(todo.due, todo.status).includes('Overdue') ? 'overdue' : ''}`;
  taskDiv.setAttribute('data-task-id', todo.id);

  const isEditing = todo.isEditing || false;
  const isOverdue = getTimeRemaining(todo.due, todo.status).includes('Overdue');
  const isExpanded = todo.isExpanded || false;
  const shouldCollapse = todo.description.length > 100;

  if (isEditing) {
    taskDiv.innerHTML = `
      <form class="edit-form" data-testid="test-todo-edit-form" data-todo-id="${todo.id}">
        <div class="task-header">
          <input
            type="checkbox"
            id="edit-complete-toggle-${todo.id}"
            class="task-complete-toggle"
            data-testid="test-todo-complete-toggle"
            ${todo.status === 'done' ? 'checked' : ''}
          />
          <div class="edit-fields">
            <label for="edit-title-${todo.id}">Title</label>
            <input id="edit-title-${todo.id}" data-testid="test-todo-edit-title-input" type="text" value="${todo.title}" required placeholder="Task title">
            <label for="edit-priority-${todo.id}">Priority</label>
            <select id="edit-priority-${todo.id}" data-testid="test-todo-edit-priority-select">
              <option value="high" ${todo.priority === 'high' ? 'selected' : ''}>High</option>
              <option value="medium" ${todo.priority === 'medium' ? 'selected' : ''}>Medium</option>
              <option value="low" ${todo.priority === 'low' ? 'selected' : ''}>Low</option>
            </select>
          </div>
        </div>
        <div class="task-content">
          <label for="edit-description-${todo.id}">Description</label>
          <textarea id="edit-description-${todo.id}" data-testid="test-todo-edit-description-input" rows="2" placeholder="Task description">${todo.description}</textarea>
          <div class="task-meta">
            <label for="edit-due-date-${todo.id}">Due date</label>
            <input id="edit-due-date-${todo.id}" data-testid="test-todo-edit-due-date-input" type="date" value="${todo.due}">
            <input id="edit-tags-${todo.id}" type="text" value="${todo.tags.join(', ')}" placeholder="Tags">
          </div>
        </div>
        <div class="task-actions">
          <button type="submit" data-testid="test-todo-save-button" class="save-button">Save</button>
          <button type="button" data-testid="test-todo-cancel-button" class="cancel-button">Cancel</button>
        </div>
      </form>
    `;

    const form = taskDiv.querySelector('.edit-form');
    const completeToggle = taskDiv.querySelector('.task-complete-toggle');

    completeToggle.addEventListener('change', (event) => {
      updateTodoStatus(todo.id, event.target.checked ? 'done' : 'pending');
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      saveEdit(todo.id);
    });

    taskDiv.querySelector('.cancel-button').addEventListener('click', () => {
      cancelEdit(todo.id);
    });
  } else {
    const priorityIndicator = `<span class="priority-indicator ${todo.priority}" data-testid="test-todo-priority-indicator"></span>`;
    const statusOptions = ['pending', 'in-progress', 'done'].map(status =>
      `<option value="${status}" ${todo.status === status ? 'selected' : ''}>${status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>`
    ).join('');

    taskDiv.innerHTML = `
      <div class="task-header">
        <input
          type="checkbox"
          id="complete-toggle-${todo.id}"
          class="task-complete-toggle"
          data-testid="test-todo-complete-toggle"
          ${todo.status === 'done' ? 'checked' : ''}
        />
        <div class="task-info">
          ${priorityIndicator}
          <h3 class="task-title ${todo.status === 'done' ? 'completed' : ''}">${todo.title}</h3>
          <div class="task-meta">
            <span class="priority ${todo.priority}">${todo.priority}</span>
            <select class="status-control" data-testid="test-todo-status-control" aria-label="Task status">
              ${statusOptions}
            </select>
            <time datetime="${todo.due}">${formatDueDate(todo.due)}</time>
            <span class="time-remaining ${isOverdue ? 'overdue-indicator' : ''}" data-testid="${isOverdue ? 'test-todo-overdue-indicator' : ''}" aria-live="polite">${getTimeRemaining(todo.due, todo.status)}</span>
          </div>
        </div>
        <div class="task-actions">
          ${shouldCollapse ? `<button type="button" data-testid="test-todo-expand-toggle" class="expand-toggle" aria-expanded="${isExpanded}" aria-controls="collapsible-${todo.id}">Expand</button>` : ''}
          <button type="button" class="edit-button">Edit</button>
          <button type="button" class="delete-button">Delete</button>
        </div>
      </div>
      <div class="task-content" data-testid="test-todo-collapsible-section" id="collapsible-${todo.id}" ${shouldCollapse ? `style="display: ${isExpanded ? 'block' : 'none'};"` : ''}>
        <p class="task-description">${todo.description}</p>
        ${todo.tags.length > 0 ? `<div class="task-tags">${todo.tags.map(tag => `<span class="tag">${tag.trim()}</span>`).join('')}</div>` : ''}
      </div>
    `;

    taskDiv.querySelector('.task-complete-toggle').addEventListener('change', (event) => {
      updateTodoStatus(todo.id, event.target.checked ? 'done' : 'pending');
    });

    const statusControl = taskDiv.querySelector('.status-control');
    statusControl.addEventListener('change', (event) => {
      updateTodoStatus(todo.id, event.target.value);
    });

    if (shouldCollapse) {
      const expandToggle = taskDiv.querySelector('.expand-toggle');
      expandToggle.addEventListener('click', () => {
        toggleExpand(todo.id);
      });
    }

    taskDiv.querySelector('.edit-button').addEventListener('click', () => {
      startEdit(todo.id);
    });

    taskDiv.querySelector('.delete-button').addEventListener('click', () => {
      deleteTodo(todo.id);
    });
  }

  return taskDiv;
}

function updateTodoStatus(todoId, status) {
  const todo = todos.find((item) => item.id === todoId);
  if (!todo) return;
  todo.status = status;
  saveState();
  renderTodos();
}

function toggleExpand(todoId) {
  const todo = todos.find((item) => item.id === todoId);
  if (!todo) return;
  todo.isExpanded = !todo.isExpanded;
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
    status: 'pending',
  });

  todoForm.reset();
  saveState();
  renderTodos();
}

todoForm.addEventListener('submit', (event) => {
  event.preventDefault();
  addNewTodo();
});

loadState();
renderTodos();
