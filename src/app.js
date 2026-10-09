import { addTodo, deleteTodo, getTodos, updateTodo } from './todosApi.js';

const state = {
  todos: [],
  filter: 'all',
  search: '',
  editingId: null,
  busyId: null,
  isLoading: true,
  nextLocalId: 0
};

const elements = {
  createForm: document.querySelector('#create-form'),
  newTitle: document.querySelector('#new-title'),
  newUserId: document.querySelector('#new-user-id'),
  createMessage: document.querySelector('#create-message'),
  taskCount: document.querySelector('#task-count'),
  completedCount: document.querySelector('#completed-count'),
  searchInput: document.querySelector('#search-input'),
  filterButtons: document.querySelectorAll('[data-filter]'),
  resultsLabel: document.querySelector('#results-label'),
  taskList: document.querySelector('#task-list'),
  actionNotice: document.querySelector('#action-notice'),
  loadError: document.querySelector('#load-error'),
  loadErrorMessage: document.querySelector('#load-error-message'),
  retryButton: document.querySelector('#retry-button')
};

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function isLocalTodo(todo) {
  return typeof todo.id === 'string' && todo.id.startsWith('local-');
}

function createLocalId() {
  state.nextLocalId += 1;
  return `local-${Date.now()}-${state.nextLocalId}`;
}

function getVisibleTodos() {
  const search = state.search.trim().toLocaleLowerCase('ru');

  return state.todos.filter((todo) => {
    const matchesFilter = state.filter === 'all'
      || (state.filter === 'active' && !todo.completed)
      || (state.filter === 'completed' && todo.completed);
    const matchesSearch = todo.todo.toLocaleLowerCase('ru').includes(search);
    return matchesFilter && matchesSearch;
  });
}

function renderSummary() {
  const completedCount = state.todos.filter((todo) => todo.completed).length;
  elements.taskCount.textContent = String(state.todos.length);
  elements.completedCount.textContent = String(completedCount);
}

function renderTask(todo) {
  const card = createElement('article', `task-card${todo.completed ? ' is-complete' : ''}`);
  card.dataset.id = String(todo.id);

  if (state.editingId === todo.id) {
    const editForm = createElement('form', 'edit-form');
    editForm.dataset.id = String(todo.id);
    editForm.noValidate = true;

    const titleLabel = createElement('label', 'edit-field edit-title-field', 'Название задачи');
    const titleInput = createElement('input', 'edit-input');
    titleInput.name = 'title';
    titleInput.type = 'text';
    titleInput.maxLength = 180;
    titleInput.required = true;
    titleInput.value = todo.todo;
    titleLabel.append(titleInput);

    const userLabel = createElement('label', 'edit-field', 'ID пользователя');
    const userInput = createElement('input', 'edit-input');
    userInput.name = 'userId';
    userInput.type = 'number';
    userInput.min = '1';
    userInput.step = '1';
    userInput.required = true;
    userInput.value = String(todo.userId);
    userLabel.append(userInput);

    const actions = createElement('div', 'edit-actions');
    const saveButton = createElement('button', 'button button-primary', 'Сохранить');
    saveButton.type = 'submit';
    saveButton.disabled = state.busyId === todo.id;
    const cancelButton = createElement('button', 'button button-secondary', 'Отмена');
    cancelButton.type = 'button';
    cancelButton.dataset.action = 'cancel-edit';
    actions.append(saveButton, cancelButton);
    editForm.append(titleLabel, userLabel, actions);
    card.append(editForm);
    return card;
  }

  const checkButton = createElement('button', `check-button${todo.completed ? ' is-complete' : ''}`, todo.completed ? '✓' : '');
  checkButton.type = 'button';
  checkButton.dataset.action = 'toggle';
  checkButton.setAttribute('aria-label', todo.completed ? 'Вернуть задачу в работу' : 'Отметить задачу выполненной');
  checkButton.setAttribute('aria-pressed', String(todo.completed));
  checkButton.disabled = state.busyId === todo.id;

  const content = createElement('div', 'task-content');
  const title = createElement('p', 'task-title', todo.todo);
  const meta = createElement('div', 'task-meta');
  const status = createElement('span', `status-label${todo.completed ? ' is-complete' : ''}`);
  status.append(createElement('span', 'status-dot'));
  status.append(document.createTextNode(todo.completed ? 'Выполнена' : 'Активная'));
  const separator = createElement('span', 'meta-separator');
  separator.setAttribute('aria-hidden', 'true');
  meta.append(status, separator, createElement('span', '', `Пользователь ${todo.userId}`));
  content.append(title, meta);

  const actions = createElement('div', 'task-actions');
  const editButton = createElement('button', 'icon-button', '✎');
  editButton.type = 'button';
  editButton.dataset.action = 'edit';
  editButton.title = 'Редактировать';
  editButton.setAttribute('aria-label', 'Редактировать задачу');
  editButton.disabled = state.busyId === todo.id;

  const deleteButton = createElement('button', 'icon-button delete-button', '×');
  deleteButton.type = 'button';
  deleteButton.dataset.action = 'delete';
  deleteButton.title = 'Удалить';
  deleteButton.setAttribute('aria-label', 'Удалить задачу');
  deleteButton.disabled = state.busyId === todo.id;

  actions.append(editButton, deleteButton);
  card.append(checkButton, content, actions);
  return card;
}

function renderTasks() {
  elements.taskList.replaceChildren();
  elements.taskList.setAttribute('aria-busy', String(state.isLoading || state.busyId !== null));

  if (state.isLoading) {
    elements.taskList.append(createElement('div', 'loading-state', 'Загружаем задачи...'));
    return;
  }

  const visibleTodos = getVisibleTodos();
  elements.resultsLabel.textContent = `Показано: ${visibleTodos.length}`;

  if (visibleTodos.length === 0) {
    const emptyState = createElement('div', 'empty-state');
    const title = createElement('strong', '', state.todos.length === 0 ? 'Пока нет задач' : 'Ничего не найдено');
    const description = createElement('span', '', state.todos.length === 0
      ? 'Добавьте первую задачу в форму выше.'
      : 'Измените запрос или выберите другой фильтр.');
    emptyState.append(title, description);
    elements.taskList.append(emptyState);
    return;
  }

  const fragment = document.createDocumentFragment();
  visibleTodos.forEach((todo) => fragment.append(renderTask(todo)));
  elements.taskList.append(fragment);
}

function showNotice(message, isSuccess = false) {
  elements.actionNotice.textContent = message;
  elements.actionNotice.classList.toggle('is-success', isSuccess);
  elements.actionNotice.hidden = !message;
}

async function loadTodos() {
  state.isLoading = true;
  elements.loadError.hidden = true;
  renderTasks();

  try {
    state.todos = await getTodos();
    state.todos.sort((first, second) => first.id - second.id);
    state.isLoading = false;
    renderSummary();
    renderTasks();
  } catch (error) {
    state.isLoading = false;
    elements.loadErrorMessage.textContent = error.message;
    elements.loadError.hidden = false;
    renderTasks();
  }
}

function validateTask(title, userId) {
  if (!title.trim()) return 'Введите название задачи.';
  if (!Number.isInteger(userId) || userId <= 0) return 'ID пользователя должен быть положительным целым числом.';
  return '';
}

elements.createForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  elements.createMessage.textContent = '';

  const title = elements.newTitle.value;
  const userId = Number(elements.newUserId.value);
  const validationMessage = validateTask(title, userId);
  if (validationMessage) {
    elements.createMessage.textContent = validationMessage;
    return;
  }

  const submitButton = elements.createForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  showNotice('Создаём задачу...');

  try {
    const response = await addTodo(title.trim(), userId);
    state.todos.unshift({
      id: createLocalId(),
      todo: title.trim(),
      completed: false,
      userId: response.userId ?? userId
    });
    elements.createForm.reset();
    elements.newUserId.value = '1';
    state.filter = 'all';
    state.search = '';
    elements.searchInput.value = '';
    updateFilterButtons();
    renderSummary();
    renderTasks();
    showNotice('Задача добавлена. Она будет доступна до перезагрузки страницы.', true);
  } catch (error) {
    showNotice(`Не удалось добавить задачу: ${error.message}`);
  } finally {
    submitButton.disabled = false;
  }
});

function updateFilterButtons() {
  elements.filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === state.filter;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

elements.filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    state.filter = button.dataset.filter;
    updateFilterButtons();
    renderTasks();
  });
});

elements.searchInput.addEventListener('input', () => {
  state.search = elements.searchInput.value;
  renderTasks();
});

elements.retryButton.addEventListener('click', loadTodos);

elements.taskList.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const card = button.closest('.task-card');
  const todo = state.todos.find((item) => String(item.id) === card?.dataset.id);
  if (!todo) return;

  if (button.dataset.action === 'cancel-edit') {
    state.editingId = null;
    renderTasks();
    return;
  }

  if (button.dataset.action === 'edit') {
    state.editingId = todo.id;
    showNotice('');
    renderTasks();
    elements.taskList.querySelector('.edit-input[name="title"]')?.focus();
    return;
  }

  if (button.dataset.action === 'toggle') {
    state.busyId = todo.id;
    renderTasks();
    try {
      if (!isLocalTodo(todo)) await updateTodo(todo.id, { completed: !todo.completed });
      todo.completed = !todo.completed;
      renderSummary();
      showNotice(todo.completed ? 'Задача отмечена выполненной.' : 'Задача возвращена в работу.', true);
    } catch (error) {
      showNotice(`Не удалось изменить статус: ${error.message}`);
    } finally {
      state.busyId = null;
      renderTasks();
    }
    return;
  }

  if (button.dataset.action === 'delete') {
    if (!window.confirm(`Удалить задачу «${todo.todo}»?`)) return;
    state.busyId = todo.id;
    renderTasks();
    try {
      if (!isLocalTodo(todo)) await deleteTodo(todo.id);
      state.todos = state.todos.filter((item) => item.id !== todo.id);
      renderSummary();
      showNotice('Задача удалена.', true);
    } catch (error) {
      showNotice(`Не удалось удалить задачу: ${error.message}`);
    } finally {
      state.busyId = null;
      renderTasks();
    }
  }
});

elements.taskList.addEventListener('submit', async (event) => {
  const form = event.target.closest('.edit-form');
  if (!form) return;
  event.preventDefault();

  const todo = state.todos.find((item) => String(item.id) === form.dataset.id);
  if (!todo) return;
  const title = form.elements.title.value;
  const userId = Number(form.elements.userId.value);
  const validationMessage = validateTask(title, userId);
  if (validationMessage) {
    showNotice(validationMessage);
    return;
  }

  state.busyId = todo.id;
  renderTasks();
  try {
    const changes = { todo: title.trim(), userId };
    if (!isLocalTodo(todo)) await updateTodo(todo.id, changes);
    Object.assign(todo, changes);
    state.editingId = null;
    renderSummary();
    showNotice('Изменения сохранены до перезагрузки страницы.', true);
  } catch (error) {
    showNotice(`Не удалось сохранить изменения: ${error.message}`);
  } finally {
    state.busyId = null;
    renderTasks();
  }
});

loadTodos();