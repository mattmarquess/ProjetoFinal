// Smooth scrolling para links de navegação
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.backgroundColor = '#ffffff';
        navbar.style.boxShadow = 'none';
    }
});

// Form validation and submission
const donationForm = document.getElementById('donationForm');
if (donationForm) {
    donationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const formData = {
            nome: document.getElementById('nome').value,
            email: document.getElementById('email').value,
            telefone: document.getElementById('telefone').value,
            data: document.getElementById('data').value,
            horario: document.getElementById('horario').value
        };

        // Basic validation
        if (!validateForm(formData)) {
            return;
        }

        // Here you would typically send the data to your backend
        // For now, we'll just show a success message
        showNotification('Agendamento realizado com sucesso! Entraremos em contato para confirmar.', 'success');
        donationForm.reset();
    });
}

// Form validation helper
function validateForm(data) {
    // Nome validation
    if (data.nome.length < 3) {
        showNotification('Por favor, insira seu nome completo.', 'error');
        return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        showNotification('Por favor, insira um email válido.', 'error');
        return false;
    }

    // Phone validation
    const phoneRegex = /^\d{10,11}$/;
    const phoneNumbers = data.telefone.replace(/\D/g, '');
    if (!phoneRegex.test(phoneNumbers)) {
        showNotification('Por favor, insira um telefone válido.', 'error');
        return false;
    }

    // Date validation
    const selectedDate = new Date(data.data);
    const today = new Date();
    if (selectedDate < today) {
        showNotification('Por favor, selecione uma data futura.', 'error');
        return false;
    }

    return true;
}

// Notification system
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Add notification to the page
    document.body.appendChild(notification);

    // Style the notification
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 25px';
    notification.style.borderRadius = '5px';
    notification.style.color = '#fff';
    notification.style.zIndex = '1000';
    
    if (type === 'success') {
        notification.style.backgroundColor = '#4caf50';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#d32f2f';
    }

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Phone number formatting
const telefoneInput = document.getElementById('telefone');
if (telefoneInput) {
    telefoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
            if (value.length > 2) {
                value = `(${value.substring(0,2)}) ${value.substring(2)}`;
            }
            if (value.length > 9) {
                value = `${value.substring(0,9)}-${value.substring(9)}`;
            }
            e.target.value = value;
        }
    });
}

// Date input restrictions
const dataInput = document.getElementById('data');
if (dataInput) {
    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    dataInput.setAttribute('min', today);
    
    // Set max date to 3 months from today
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    dataInput.setAttribute('max', maxDate.toISOString().split('T')[0]);
}

// Menu móvel
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = menuToggle.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
    });
}

// Fechar menu ao clicar em um link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const icon = menuToggle.querySelector('i');
        icon.classList.add('fa-bars');
        icon.classList.remove('fa-times');
    });
});
