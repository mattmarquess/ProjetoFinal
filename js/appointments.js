// Appointments Management
class AppointmentsManager {
    constructor() {
        this.db = firebase.firestore();
        this.appointmentsCollection = this.db.collection('agendamentos');
        this.donorsCollection = this.db.collection('doadores');
        this.calendar = null;
        this.currentPage = 1;
        this.pageSize = 10;
        this.lastDoc = null;
        this.firstDoc = null;
        this.searchTerm = '';
        this.statusFilter = '';
        this.dateFilter = '';

        this.initializeEventListeners();
        this.initializeCalendar();
        this.loadAppointments();
        this.loadDonors();
    }

    initializeEventListeners() {
        // View toggle
        document.querySelectorAll('.toggle-button').forEach(button => {
            button.addEventListener('click', () => this.toggleView(button.dataset.view));
        });

        // Add appointment button
        document.getElementById('addAppointmentBtn').addEventListener('click', () => this.openAppointmentModal());

        // Search and filters
        document.getElementById('appointmentSearch').addEventListener('input', debounce((e) => {
            this.searchTerm = e.target.value;
            this.resetPagination();
            this.loadAppointments();
        }, 500));

        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.statusFilter = e.target.value;
            this.resetPagination();
            this.loadAppointments();
        });

        document.getElementById('dateFilter').addEventListener('change', (e) => {
            this.dateFilter = e.target.value;
            this.resetPagination();
            this.loadAppointments();
        });

        // Pagination
        document.getElementById('prevPage').addEventListener('click', () => this.previousPage());
        document.getElementById('nextPage').addEventListener('click', () => this.nextPage());

        // Modal form
        document.getElementById('appointmentForm').addEventListener('submit', (e) => this.handleAppointmentSubmit(e));
        document.querySelector('.close-button').addEventListener('click', () => this.closeAppointmentModal());

        // Date and time validation
        document.getElementById('data').addEventListener('change', () => this.validateDateTime());
        document.getElementById('horario').addEventListener('change', () => this.validateDateTime());
    }

    initializeCalendar() {
        const calendarEl = document.getElementById('calendar');
        this.calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            locale: 'pt-br',
            buttonText: {
                today: 'Hoje',
                month: 'Mês',
                week: 'Semana',
                day: 'Dia'
            },
            selectable: true,
            select: (info) => {
                this.openAppointmentModal(null, info.startStr);
            },
            eventClick: (info) => {
                this.openAppointmentModal(info.event.id);
            },
            events: (info, successCallback) => {
                this.loadCalendarEvents(info.start, info.end, successCallback);
            }
        });

        this.calendar.render();
    }

    toggleView(view) {
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        document.getElementById(`${view}View`).classList.add('active');

        document.querySelectorAll('.toggle-button').forEach(button => {
            button.classList.toggle('active', button.dataset.view === view);
        });

        if (view === 'calendar') {
            this.calendar.render();
        }
    }

    async loadAppointments() {
        try {
            let query = this.appointmentsCollection.orderBy('data');

            // Apply filters
            if (this.statusFilter) {
                query = query.where('status', '==', this.statusFilter);
            }
            if (this.dateFilter) {
                const startDate = new Date(this.dateFilter);
                const endDate = new Date(this.dateFilter);
                endDate.setDate(endDate.getDate() + 1);
                query = query.where('data', '>=', startDate)
                           .where('data', '<', endDate);
            }

            // Pagination
            query = query.limit(this.pageSize);
            if (this.lastDoc && this.currentPage > 1) {
                query = query.startAfter(this.lastDoc);
            }

            const snapshot = await query.get();
            await this.updateAppointmentsTable(snapshot);
            this.updatePaginationControls(snapshot);
        } catch (error) {
            console.error('Error loading appointments:', error);
            showToast('Erro ao carregar agendamentos', 'error');
        }
    }

    async loadCalendarEvents(start, end, successCallback) {
        try {
            const snapshot = await this.appointmentsCollection
                .where('data', '>=', start)
                .where('data', '<=', end)
                .get();

            const events = [];
            for (const doc of snapshot.docs) {
                const appointment = doc.data();
                const donor = await this.donorsCollection.doc(appointment.doadorId).get();
                const donorData = donor.data();

                events.push({
                    id: doc.id,
                    title: `${donorData.nome} - ${appointment.horario}`,
                    start: `${appointment.data.toDate().toISOString().split('T')[0]}T${appointment.horario}`,
                    className: `status-${appointment.status}`,
                    extendedProps: {
                        status: appointment.status,
                        donor: donorData
                    }
                });
            }

            successCallback(events);
        } catch (error) {
            console.error('Error loading calendar events:', error);
            showToast('Erro ao carregar eventos do calendário', 'error');
        }
    }

    async updateAppointmentsTable(snapshot) {
        const tbody = document.getElementById('appointmentsTableBody');
        tbody.innerHTML = '';

        if (snapshot.empty) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">Nenhum agendamento encontrado</td>
                </tr>
            `;
            return;
        }

        for (const doc of snapshot.docs) {
            const appointment = doc.data();
            const donor = await this.donorsCollection.doc(appointment.doadorId).get();
            const donorData = donor.data();

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${appointment.data.toDate().toLocaleDateString()}</td>
                <td>${appointment.horario}</td>
                <td>${donorData.nome}</td>
                <td>${donorData.tipoSanguineo}</td>
                <td>
                    <span class="status-badge status-${appointment.status}">
                        ${this.getStatusText(appointment.status)}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-button edit" onclick="appointmentsManager.editAppointment('${doc.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-button delete" onclick="appointmentsManager.deleteAppointment('${doc.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        }

        // Update pagination references
        const documents = snapshot.docs;
        this.firstDoc = documents[0];
        this.lastDoc = documents[documents.length - 1];
    }

    updatePaginationControls(snapshot) {
        const prevButton = document.getElementById('prevPage');
        const nextButton = document.getElementById('nextPage');
        const currentPageSpan = document.getElementById('currentPage');

        prevButton.disabled = this.currentPage === 1;
        nextButton.disabled = snapshot.docs.length < this.pageSize;

        currentPageSpan.textContent = `Página ${this.currentPage}`;
    }

    async previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadAppointments();
        }
    }

    async nextPage() {
        this.currentPage++;
        this.loadAppointments();
    }

    resetPagination() {
        this.currentPage = 1;
        this.lastDoc = null;
        this.firstDoc = null;
    }

    async loadDonors() {
        try {
            const snapshot = await this.donorsCollection.orderBy('nome').get();
            const select = document.getElementById('doadorId');
            select.innerHTML = '<option value="">Selecione um doador</option>';

            snapshot.forEach(doc => {
                const donor = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = `${donor.nome} - ${donor.tipoSanguineo}`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading donors:', error);
            showToast('Erro ao carregar lista de doadores', 'error');
        }
    }

    openAppointmentModal(appointmentId = null, selectedDate = null) {
        const modal = document.getElementById('appointmentModal');
        const form = document.getElementById('appointmentForm');
        const title = document.getElementById('modalTitle');

        // Reset form
        form.reset();
        form.dataset.appointmentId = appointmentId;

        if (appointmentId) {
            title.textContent = 'Editar Agendamento';
            this.loadAppointmentData(appointmentId);
        } else {
            title.textContent = 'Novo Agendamento';
            if (selectedDate) {
                document.getElementById('data').value = selectedDate;
            }
        }

        modal.classList.add('active');
    }

    closeAppointmentModal() {
        const modal = document.getElementById('appointmentModal');
        modal.classList.remove('active');
    }

    async loadAppointmentData(appointmentId) {
        try {
            const doc = await this.appointmentsCollection.doc(appointmentId).get();
            if (doc.exists) {
                const appointment = doc.data();
                document.getElementById('doadorId').value = appointment.doadorId;
                document.getElementById('data').value = appointment.data.toDate().toISOString().split('T')[0];
                document.getElementById('horario').value = appointment.horario;
                document.getElementById('status').value = appointment.status;
                document.getElementById('observacoes').value = appointment.observacoes || '';
            }
        } catch (error) {
            console.error('Error loading appointment data:', error);
            showToast('Erro ao carregar dados do agendamento', 'error');
        }
    }

    async validateDateTime() {
        const dateInput = document.getElementById('data');
        const timeInput = document.getElementById('horario');
        const appointmentId = document.getElementById('appointmentForm').dataset.appointmentId;

        if (!dateInput.value || !timeInput.value) return;

        try {
            const date = dateInput.value;
            const time = timeInput.value;

            const query = this.appointmentsCollection
                .where('data', '==', new Date(date))
                .where('horario', '==', time);

            if (appointmentId) {
                query.where(firebase.firestore.FieldPath.documentId(), '!=', appointmentId);
            }

            const snapshot = await query.get();

            if (!snapshot.empty) {
                showToast('Já existe um agendamento neste horário', 'error');
                timeInput.value = '';
            }
        } catch (error) {
            console.error('Error validating date/time:', error);
        }
    }

    async handleAppointmentSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const appointmentId = form.dataset.appointmentId;
        const formData = new FormData(form);
        const appointmentData = {};

        formData.forEach((value, key) => {
            if (key === 'data') {
                appointmentData[key] = new Date(value);
            } else {
                appointmentData[key] = value;
            }
        });

        try {
            if (appointmentId) {
                await this.appointmentsCollection.doc(appointmentId).update(appointmentData);
                showToast('Agendamento atualizado com sucesso!', 'success');
            } else {
                await this.appointmentsCollection.add(appointmentData);
                showToast('Agendamento criado com sucesso!', 'success');
            }

            this.closeAppointmentModal();
            this.loadAppointments();
            this.calendar.refetchEvents();
        } catch (error) {
            console.error('Error saving appointment:', error);
            showToast('Erro ao salvar agendamento', 'error');
        }
    }

    async deleteAppointment(appointmentId) {
        if (confirm('Tem certeza que deseja excluir este agendamento?')) {
            try {
                await this.appointmentsCollection.doc(appointmentId).delete();
                showToast('Agendamento excluído com sucesso!', 'success');
                this.loadAppointments();
                this.calendar.refetchEvents();
            } catch (error) {
                console.error('Error deleting appointment:', error);
                showToast('Erro ao excluir agendamento', 'error');
            }
        }
    }

    async editAppointment(appointmentId) {
        this.openAppointmentModal(appointmentId);
    }

    getStatusText(status) {
        const statusMap = {
            'agendado': 'Agendado',
            'confirmado': 'Confirmado',
            'concluido': 'Concluído',
            'cancelado': 'Cancelado'
        };
        return statusMap[status] || status;
    }
}

// Initialize Appointments Manager
let appointmentsManager;
document.addEventListener('DOMContentLoaded', () => {
    appointmentsManager = new AppointmentsManager();
});
