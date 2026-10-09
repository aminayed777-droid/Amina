const API_BASE_URL = 'https://dummyjson.com';

async function sendRequest(url, options = {}) {
  const response = await fetch(url, options);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Не удалось выполнить запрос.');
  }

  return result;
}

export async function getTodos() {
  const result = await sendRequest(`${API_BASE_URL}/todos?limit=0`);
  return result.todos;
}

export function addTodo(todo, userId) {
  return sendRequest(`${API_BASE_URL}/todos/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ todo, completed: false, userId })
  });
}

export function updateTodo(id, changes) {
  return sendRequest(`${API_BASE_URL}/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes)
  });
}

export function deleteTodo(id) {
  return sendRequest(`${API_BASE_URL}/todos/${id}`, { method: 'DELETE' });
}