const API_URL = 'http://localhost:5000/api';

// Função para fazer requisições à API
async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const defaultHeaders = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: { ...defaultHeaders, ...options.headers }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ocorreu um erro');
        }

        return await response.json();
    } catch (error) {
        showError(error.message);
        throw error;
    }
}

// Funções de autenticação
const auth = {
    async login(email, senha) {
        const data = await fetchAPI('/users/login', {
            method: 'POST',
            body: JSON.stringify({ email, senha })
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
    },

    async register(userData) {
        const data = await fetchAPI('/users/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        return data;
    },

    async logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/index.html';
    },

    isAuthenticated() {
        return !!localStorage.getItem('token');
    }
};

// Funções para doadores
const doadores = {
    async getProfile() {
        return await fetchAPI('/users/profile');
    },

    async updateProfile(data) {
        return await fetchAPI('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
};

// Funções para recompensas
const recompensas = {
    async listar() {
        return await fetchAPI('/rewards');
    },

    async resgatar(recompensaId) {
        return await fetchAPI(`/rewards/${recompensaId}/redeem`, {
            method: 'POST'
        });
    }
};

// Função para mostrar erros
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

// Função para mostrar mensagens de sucesso
function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 5000);
    }
}
