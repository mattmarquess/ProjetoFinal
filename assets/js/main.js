// Funções para validação de formulários
function validateLoginForm(event) {
    // Implementar validação do formulário de login
}

function validateSignupForm(event) {
    // Implementar validação do formulário de cadastro
}

const API_URL = 'http://localhost:5000/api';

// Funções de autenticação
async function login(email, senha) {
    try {
        const response = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message);
        }

        // Salva o token no localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('userType', data.tipo_usuario);

        // Redireciona baseado no tipo de usuário
        if (data.tipo_usuario === 'admin') {
            window.location.href = '/admin/dashboard.html';
        } else {
            window.location.href = '/dashboard.html';
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function register(formData) {
    try {
        const response = await fetch(`${API_URL}/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message);
        }

        showMessage('Cadastro realizado com sucesso! Verifique seu email para confirmar o cadastro.', 'success');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 3000);
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Funções de recuperação de senha
async function requestPasswordReset(email) {
    try {
        const response = await fetch(`${API_URL}/users/request-reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message);
        }

        showMessage('Email de recuperação enviado! Verifique sua caixa de entrada.', 'success');
        
        // Mostra o formulário de redefinição
        document.getElementById('step1').style.display = 'none';
        document.getElementById('step2').style.display = 'block';
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function resetPassword(token, newPassword) {
    try {
        const response = await fetch(`${API_URL}/users/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token, newPassword })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message);
        }

        showMessage('Senha atualizada com sucesso!', 'success');
        setTimeout(() => {
            window.location.href = '/pages/login.html';
        }, 2000);
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Função para mostrar mensagens
function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('message');
    if (!messageDiv) {
        const div = document.createElement('div');
        div.id = 'message';
        document.body.appendChild(div);
    }
    
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Adicionar listeners aos formulários
    const loginForm = document.querySelector('#login-form');
    const signupForm = document.querySelector('#signup-form');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.querySelector('#email').value;
            const senha = document.querySelector('#senha').value;
            login(email, senha);
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = {
                nome: document.querySelector('#nome').value,
                email: document.querySelector('#email').value,
                senha: document.querySelector('#senha').value,
                tipo_sanguineo: document.querySelector('#tipo-sanguineo').value
            };
            register(formData);
        });
    }

    // Form de Recuperação de Senha
    const recoverForm = document.querySelector('#recover-form');
    if (recoverForm) {
        recoverForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.querySelector('#email').value;
            requestPasswordReset(email);
        });
    }

    // Form de Redefinição de Senha
    const resetForm = document.querySelector('#reset-form');
    if (resetForm) {
        resetForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const token = document.querySelector('#token').value;
            const newPassword = document.querySelector('#new-password').value;
            const confirmPassword = document.querySelector('#confirm-password').value;

            if (newPassword !== confirmPassword) {
                showMessage('As senhas não coincidem', 'error');
                return;
            }

            resetPassword(token, newPassword);
        });
    }

    // Verifica autenticação em páginas protegidas
    const protectedPages = ['/dashboard.html', '/admin/dashboard.html'];
    if (protectedPages.some(page => window.location.pathname.includes(page))) {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
        }
    }
});
