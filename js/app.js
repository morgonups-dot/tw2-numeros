let users = [];
let currentPage = 1;
const itemsPerPage = 10;
let userIdToDelete = null;
let isEditing = false;

document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    setupSearch();
});

function loadUsers() {
    const stored = localStorage.getItem('users');
    users = stored ? JSON.parse(stored) : [];
    renderTable();
    updateStats();
}

function saveToStorage() {
    localStorage.setItem('users', JSON.stringify(users));
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        currentPage = 1;
        renderTable(e.target.value);
    });
}

function renderTable(searchTerm = '') {
    const tbody = document.getElementById('userTableBody');
    const filtered = users.filter(user => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            user.nombre.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term) ||
            user.telefono.includes(term) ||
            user.direccion?.toLowerCase().includes(term)
        );
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);

    if (paginated.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <p>${searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}</p>
                    </div>
                </td>
            </tr>
        `;
        document.getElementById('pagination').innerHTML = '';
        return;
    }

    tbody.innerHTML = paginated.map(user => `
        <tr>
            <td><strong>${escapeHtml(user.nombre)}</strong></td>
            <td>${escapeHtml(user.email)}</td>
            <td>${user.telefono}</td>
            <td>${escapeHtml(user.direccion || '-')}</td>
            <td>${formatDate(user.nacimiento)}</td>
            <td>
                <button class="btn-icon btn-edit" onclick="editUser('${user.id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-delete" onclick="deleteUser('${user.id}')" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');

    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const pagination = document.getElementById('pagination');
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span style="padding: 0 5px;">...</span>`;
        }
    }

    html += `
        <button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    pagination.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    renderTable(document.getElementById('searchInput').value);
}

function updateStats() {
    document.getElementById('totalUsers').textContent = `Total: ${users.length} usuario${users.length !== 1 ? 's' : ''}`;
}

function openModal(user = null) {
    const modal = document.getElementById('userModal');
    const form = document.getElementById('userForm');
    const title = document.getElementById('modalTitle');

    form.reset();
    clearErrors();

    if (user) {
        isEditing = true;
        title.innerHTML = '<i class="fas fa-user-edit"></i> Editar Usuario';
        document.getElementById('userId').value = user.id;
        document.getElementById('nombre').value = user.nombre;
        document.getElementById('email').value = user.email;
        document.getElementById('telefono').value = user.telefono;
        document.getElementById('direccion').value = user.direccion || '';
        document.getElementById('nacimiento').value = user.nacimiento || '';
    } else {
        isEditing = false;
        title.innerHTML = '<i class="fas fa-user-plus"></i> Nuevo Usuario';
        document.getElementById('userId').value = '';
    }

    modal.classList.add('show');
    document.getElementById('nombre').focus();
}

function closeModal() {
    document.getElementById('userModal').classList.remove('show');
    clearErrors();
}

function clearErrors() {
    document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
    document.querySelectorAll('input').forEach(el => el.classList.remove('error'));
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
    return /^[0-9]{10}$/.test(phone);
}

function saveUser(e) {
    e.preventDefault();
    clearErrors();

    const id = document.getElementById('userId').value;
    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const direccion = document.getElementById('direccion').value.trim();
    const nacimiento = document.getElementById('nacimiento').value;

    let isValid = true;

    if (nombre.length < 2) {
        showError('nombre', 'El nombre debe tener al menos 2 caracteres');
        isValid = false;
    }

    if (!validateEmail(email)) {
        showError('email', 'Ingresa un correo electrónico válido');
        isValid = false;
    }

    if (!validatePhone(telefono)) {
        showError('telefono', 'El teléfono debe tener 10 dígitos');
        isValid = false;
    }

    if (!isValid) return;

    if (id) {
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            users[index] = { ...users[index], nombre, email, telefono, direccion, nacimiento };
            showToast('Usuario actualizado correctamente', 'success');
        }
    } else {
        const newUser = {
            id: generateId(),
            nombre,
            email,
            telefono,
            direccion,
            nacimiento
        };
        users.unshift(newUser);
        showToast('Usuario agregado correctamente', 'success');
    }

    saveToStorage();
    closeModal();
    renderTable();
    updateStats();
}

function editUser(id) {
    const user = users.find(u => u.id === id);
    if (user) {
        openModal(user);
    }
}

function deleteUser(id) {
    userIdToDelete = id;
    document.getElementById('confirmModal').classList.add('show');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('show');
    userIdToDelete = null;
}

function confirmDelete() {
    if (userIdToDelete) {
        users = users.filter(u => u.id !== userIdToDelete);
        saveToStorage();
        renderTable();
        updateStats();
        showToast('Usuario eliminado correctamente', 'success');
    }
    closeConfirmModal();
}

function showError(field, message) {
    const input = document.getElementById(field);
    const errorSpan = document.getElementById(field + 'Error');
    input.classList.add('error');
    errorSpan.textContent = message;
}

function showToast(message, type) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

document.getElementById('userModal').addEventListener('click', (e) => {
    if (e.target.id === 'userModal') closeModal();
});

document.getElementById('confirmModal').addEventListener('click', (e) => {
    if (e.target.id === 'confirmModal') closeConfirmModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeConfirmModal();
    }
});
