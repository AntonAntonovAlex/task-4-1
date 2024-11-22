import '../scss/styles.scss';
import * as bootstrap from 'bootstrap';

const MILLISECONDS_IN_A_DAY = 1000 * 60 * 60 * 24;
const BASE_URL = 'http://localhost:3000/api/users';
const registrationContainer = document.querySelector('#registration');
const registrationForm = document.querySelector('#registrationForm');
const loginContainer = document.getElementById('loginForm');
const usersTableContainer = document.querySelector('#usersTable');
const tableBody = document.querySelector('#usersTableBody');
const goToRegister = document.getElementById('goToRegister');
const loginForm = document.getElementById('userLoginForm');
const deleteSelectedUsers = document.getElementById('deleteSelected');
const blockSelectedUsers = document.getElementById('blockSelected');
const unblockSelectedUsers = document.getElementById('unblockSelected');
const logoutButton = document.getElementById('logoutButton');
const filterInput = document.getElementById('filterInput');
let userInformation = {};

filterInput.addEventListener('input', () => {
  const filterValue = filterInput.value.toLowerCase();
  const rows = document.querySelectorAll('#usersTableBody tr');

  rows.forEach(row => {
    const nameCell = row.querySelector('td:nth-child(2)');
    if (nameCell) {
      const name = nameCell.textContent.toLowerCase();
      if (name.includes(filterValue)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      };
    };
  });
});

logoutButton.addEventListener('click', () => {
  logoutAndClear();
});

unblockSelectedUsers.addEventListener('click', async () => {
  await handleUserAction('unblock');
});

blockSelectedUsers.addEventListener('click', async () => {
  await handleUserAction('block');
});

deleteSelectedUsers.addEventListener('click', async () => {
  await handleUserAction('delete');
});

loginForm.addEventListener('submit', (event) => {
  if (!loginForm.checkValidity()) {
    event.preventDefault();
    event.stopPropagation();
    loginForm.classList.add('was-validated');
  } else {
    event.preventDefault();
  const loginEmailInput = document.getElementById('loginEmail').value;
  const loginPasswordInput = document.getElementById('loginPassword').value;
  const loginErrorMessage = document.getElementById('loginErrorMessage')

  loginUser(loginEmailInput, loginPasswordInput)
    .then(user => {
      loadUsers();
      loginContainer.classList.add('hidden');
      usersTableContainer.classList.remove('hidden');
      userInformation = user.user;
    })
    .catch(error => {
      loginErrorMessage.textContent = error.message;
      loginErrorMessage.classList.remove('hidden');
    });
  };
});

goToRegister.addEventListener('click', (event) => {
  event.preventDefault();
  loginContainer.classList.add('hidden');
  registrationContainer.classList.remove('hidden');
});

registrationForm.addEventListener('submit', async (event) => {
  if (!registrationForm.checkValidity()) {
    event.preventDefault();
    event.stopPropagation();
    registrationForm.classList.add('was-validated');
  } else {
    event.preventDefault();
    const name = document.getElementById('nameInput').value;
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const userId = await addUser(name, email, password);
    userInformation.id = userId;
  };
});

function calculateDaysAgo(lastLoginDate) {
  const today = new Date();
  const lastLogin = new Date(lastLoginDate);
  const diffTime = Math.abs(today - lastLogin);
  return Math.ceil(diffTime / MILLISECONDS_IN_A_DAY);
};

function showMessage(message) {
  const messageBox = document.getElementById('messageBox');
  messageBox.textContent = message;
  messageBox.classList.remove('hidden');
  setTimeout(() => {
    messageBox.classList.add('hidden');
  }, 2000);
};

function logoutAndClear() {
  loginContainer.classList.remove('hidden');
  usersTableContainer.classList.add('hidden');
  tableBody.innerHTML = '';
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('nameInput').value = '';
  document.getElementById('emailInput').value = '';
  document.getElementById('passwordInput').value = '';
  loginForm.classList.remove('was-validated');
  document.getElementById('loginErrorMessage').classList.add('hidden');
};

function getSelectedUsers() {
  const checkboxes = document.querySelectorAll('.userCheckbox:checked');
  return Array.from(checkboxes).map(checkbox => checkbox.getAttribute('data-id'));
};

function attachCheckboxHandlers() {
  document.getElementById('selectAll').addEventListener('change', (event) => {
    const checkboxes = document.querySelectorAll('.userCheckbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = event.target.checked;
    });
  });
};

async function loadUsers() {
  const response = await fetch(BASE_URL);
  const users = await response.json();
  tableBody.innerHTML = '';
  users.forEach(user => {
    const row = document.createElement('tr');
    const daysAgo = calculateDaysAgo(user.last_login);
    row.innerHTML = `
      <td><input type="checkbox" class="userCheckbox" data-id="${user.id}"></td>
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>${user.status}</td>
      <td title="User logged in ${daysAgo} days ago">${user.last_login}</td>
    `;
    tableBody.appendChild(row);
    attachCheckboxHandlers();
  });
};

async function addUser(name, email, password) {
  const addUserErrorMessage = document.getElementById('addUserErrorMessage');
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      throw new Error('Error adding user');
    };

    const data = await response.json();
    await loadUsers();
    registrationContainer.classList.add('hidden');
    usersTableContainer.classList.remove('hidden');
    return data.userId;

  } catch (error) {
    addUserErrorMessage.textContent = error.message;
    addUserErrorMessage.classList.remove('hidden');
  };
};

async function loginUser(email, password) {
  try {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    };
    return await response.json();
  } catch (error) {
    throw new Error(error.message);
  };
};

async function deleteUser(usersIds) {
  try {
    const response = await fetch(BASE_URL, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usersIds }),
    });
    if (!response.ok) {
      throw new Error(await response.text());
    };

    const message = await response.text();
    await loadUsers();
    showMessage(message);
  } catch (error) {
    showMessage(error.message);
  };
};

async function blockUsers(usersIds) {
  try {
    const response = await fetch(`${BASE_URL}/block`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usersIds }),
    });
    if (!response.ok) {
      throw new Error(await response.text());
    };

    const message = await response.text();
    await loadUsers();
    showMessage(message);
  } catch (error) {
    showMessage(error.message);
  };
};

async function unblockUsers(usersIds) {
  try {
    const response = await fetch(`${BASE_URL}/unblock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usersIds }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    };

    const message = await response.text();
    await loadUsers();
    showMessage(message);
  } catch (error) {
    showMessage(error.message);
  };
};

async function checkUserStatus(userId) {
  try {
    const response = await fetch(`${BASE_URL}/status?id=${userId}`, {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error(await response.text());
    };
    const data = await response.json();
    return data.status === 'active';
  } catch (error) {
    showMessage(error.message);
    return null;
  };
};

async function handleUserAction(action) {
  const usersIds = getSelectedUsers();
  if (usersIds.length === 0) {
    return;
  };
  if (await checkUserStatus(userInformation.id)) {
    switch (action) {
      case 'block':
        const checkboxes = document.querySelectorAll('.userCheckbox');
        await blockUsers(usersIds);
        if (checkboxes.length === usersIds.length) {
          logoutAndClear();
        };
        break;
      case 'unblock':
        await unblockUsers(usersIds);
        break;
      case 'delete':
        await deleteUser(usersIds);
        break;
    };
    document.getElementById('selectAll').checked = false;
  } else {
    loginContainer.classList.remove('hidden');
    usersTableContainer.classList.add('hidden');
    tableBody.innerHTML = '';
  };
};
