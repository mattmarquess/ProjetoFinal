document.addEventListener('DOMContentLoaded', function() {
    const auth = new Auth(); 
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.querySelector('.toggle-password');

    // Verificar se já está autenticado
    auth.onAuthStateChanged((user) => {
        if (user && user.role === 'admin') {
            window.location.href = 'dashboard.html';
        }
    });

    // Toggle password visibility
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const senhaInput = document.getElementById('senha');
            const type = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
            senhaInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            
            try {
                await auth.login(email, senha);
                window.location.href = 'dashboard.html';
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });
    }
});

// Função para mostrar notificações
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}
