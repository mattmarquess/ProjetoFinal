document.addEventListener('DOMContentLoaded', function() {
    const auth = new Auth();
    const db = firebase.firestore();

    // Verificar autenticação
    auth.onAuthStateChanged((user) => {
        if (!user || user.role !== 'admin') {
            window.location.href = 'index.html';
        } else {
            initializeDashboard();
            initializePageNavigation();
        }
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            await auth.logout();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    });

    // Navegação do sidebar
    document.querySelectorAll('.sidebar-nav li').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            changePage(page);
        });
    });

    function changePage(pageId) {
        // Remove active class from all pages and nav items
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.querySelectorAll('.sidebar-nav li').forEach(item => item.classList.remove('active'));

        // Add active class to selected page and nav item
        document.getElementById(pageId).classList.add('active');
        document.querySelector(`[data-page="${pageId}"]`).classList.add('active');
    }

    async function initializeDashboard() {
        try {
            await Promise.all([
                updateStats(),
                createBloodTypeChart(),
                createDonationsChart(),
                loadRecentActivities()
            ]);
        } catch (error) {
            console.error('Erro ao inicializar dashboard:', error);
        }
    }

    async function updateStats() {
        try {
            // Total de doadores
            const doadoresSnapshot = await db.collection('doadores').get();
            document.getElementById('totalDonors').textContent = doadoresSnapshot.size;

            // Agendamentos hoje
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const amanha = new Date(hoje);
            amanha.setDate(amanha.getDate() + 1);

            const agendamentosSnapshot = await db.collection('agendamentos')
                .where('data', '>=', hoje)
                .where('data', '<', amanha)
                .get();
            document.getElementById('todayAppointments').textContent = agendamentosSnapshot.size;

            // Doações este mês
            const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            const doacoesMesSnapshot = await db.collection('agendamentos')
                .where('data', '>=', primeiroDiaMes)
                .where('status', '==', 'concluido')
                .get();
            document.getElementById('monthlyDonations').textContent = doacoesMesSnapshot.size;

            // Campanhas ativas
            const campanhasSnapshot = await db.collection('campanhas')
                .where('status', '==', 'ativa')
                .get();
            document.getElementById('activeCampaigns').textContent = campanhasSnapshot.size;

        } catch (error) {
            console.error('Erro ao atualizar estatísticas:', error);
        }
    }

    async function createBloodTypeChart() {
        try {
            const doadoresSnapshot = await db.collection('doadores').get();
            const bloodTypes = {
                'A+': 0, 'A-': 0,
                'B+': 0, 'B-': 0,
                'AB+': 0, 'AB-': 0,
                'O+': 0, 'O-': 0
            };

            doadoresSnapshot.forEach(doc => {
                const tipoSanguineo = doc.data().tipoSanguineo;
                if (bloodTypes.hasOwnProperty(tipoSanguineo)) {
                    bloodTypes[tipoSanguineo]++;
                }
            });

            const ctx = document.getElementById('bloodTypeChart').getContext('2d');
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(bloodTypes),
                    datasets: [{
                        data: Object.values(bloodTypes),
                        backgroundColor: [
                            '#FF6384', '#36A2EB',
                            '#FFCE56', '#4BC0C0',
                            '#9966FF', '#FF9F40',
                            '#FF6384', '#36A2EB'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'right'
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao criar gráfico de tipos sanguíneos:', error);
        }
    }

    async function createDonationsChart() {
        try {
            const ultimos6Meses = Array.from({length: 6}, (_, i) => {
                const data = new Date();
                data.setMonth(data.getMonth() - i);
                return data;
            }).reverse();

            const labels = ultimos6Meses.map(data => {
                return data.toLocaleDateString('pt-BR', { month: 'short' });
            });

            const doacoesPorMes = await Promise.all(ultimos6Meses.map(async (data) => {
                const inicio = new Date(data.getFullYear(), data.getMonth(), 1);
                const fim = new Date(data.getFullYear(), data.getMonth() + 1, 0);

                const snapshot = await db.collection('agendamentos')
                    .where('data', '>=', inicio)
                    .where('data', '<=', fim)
                    .where('status', '==', 'concluido')
                    .get();

                return snapshot.size;
            }));

            const ctx = document.getElementById('donationsChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Doações',
                        data: doacoesPorMes,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao criar gráfico de doações:', error);
        }
    }

    async function loadRecentActivities() {
        try {
            const activityList = document.getElementById('activityList');
            activityList.innerHTML = '';

            // Últimas atividades (agendamentos e doações)
            const agendamentosSnapshot = await db.collection('agendamentos')
                .orderBy('dataCriacao', 'desc')
                .limit(5)
                .get();

            agendamentosSnapshot.forEach(doc => {
                const data = doc.data();
                const activity = document.createElement('div');
                activity.className = 'activity-item';
                
                const date = data.dataCriacao.toDate();
                const timeAgo = getTimeAgo(date);

                activity.innerHTML = `
                    <div class="activity-icon">
                        <i class="fas ${data.status === 'concluido' ? 'fa-check-circle' : 'fa-calendar-check'}"></i>
                    </div>
                    <div class="activity-info">
                        <p>${data.status === 'concluido' ? 'Doação realizada' : 'Novo agendamento'}</p>
                        <span>${timeAgo}</span>
                    </div>
                `;

                activityList.appendChild(activity);
            });
        } catch (error) {
            console.error('Erro ao carregar atividades recentes:', error);
        }
    }

    function getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Agora mesmo';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutos atrás`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} horas atrás`;
        return `${Math.floor(diffInSeconds / 86400)} dias atrás`;
    }

    function initializePageNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const pages = document.querySelectorAll('.page');

        function showPage(pageId) {
            pages.forEach(page => {
                if (page.id === pageId) {
                    page.style.display = 'block';
                } else {
                    page.style.display = 'none';
                }
            });

            navItems.forEach(item => {
                if (item.dataset.page === pageId) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });

            // Save current page to localStorage
            localStorage.setItem('currentPage', pageId);
        }

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = item.dataset.page;
                showPage(pageId);
            });
        });

        // Load last active page or default to dashboard
        const lastPage = localStorage.getItem('currentPage') || 'dashboard';
        showPage(lastPage);
    }
});
