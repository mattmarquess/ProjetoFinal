// Donors Management
class DonorsManager {
    constructor() {
        this.db = firebase.firestore();
        this.donorsCollection = this.db.collection('doadores');
        this.currentPage = 1;
        this.pageSize = 10;
        this.lastDoc = null;
        this.firstDoc = null;
        this.searchTerm = '';
        this.bloodTypeFilter = '';
        this.statusFilter = '';

        this.initializeEventListeners();
        this.loadDonors();
    }

    initializeEventListeners() {
        // Add donor button
        document.getElementById('addDonorBtn').addEventListener('click', () => this.openDonorModal());

        // Search and filters
        document.getElementById('donorSearch').addEventListener('input', debounce((e) => {
            this.searchTerm = e.target.value;
            this.resetPagination();
            this.loadDonors();
        }, 500));

        document.getElementById('bloodTypeFilter').addEventListener('change', (e) => {
            this.bloodTypeFilter = e.target.value;
            this.resetPagination();
            this.loadDonors();
        });

        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.statusFilter = e.target.value;
            this.resetPagination();
            this.loadDonors();
        });

        // Pagination
        document.getElementById('prevPage').addEventListener('click', () => this.previousPage());
        document.getElementById('nextPage').addEventListener('click', () => this.nextPage());

        // Modal form
        document.getElementById('donorForm').addEventListener('submit', (e) => this.handleDonorSubmit(e));
        document.querySelector('.close-button').addEventListener('click', () => this.closeDonorModal());

        // CEP auto-complete
        document.getElementById('cep').addEventListener('blur', (e) => this.handleCEPSearch(e.target.value));
    }

    async loadDonors() {
        try {
            let query = this.donorsCollection.orderBy('nome');

            // Apply filters
            if (this.bloodTypeFilter) {
                query = query.where('tipoSanguineo', '==', this.bloodTypeFilter);
            }
            if (this.statusFilter) {
                query = query.where('status', '==', this.statusFilter);
            }
            if (this.searchTerm) {
                query = query.where('nome', '>=', this.searchTerm)
                           .where('nome', '<=', this.searchTerm + '\uf8ff');
            }

            // Pagination
            query = query.limit(this.pageSize);
            if (this.lastDoc && this.currentPage > 1) {
                query = query.startAfter(this.lastDoc);
            }

            const snapshot = await query.get();
            this.updateDonorsTable(snapshot);
            this.updatePaginationControls(snapshot);
        } catch (error) {
            console.error('Error loading donors:', error);
            showToast('Erro ao carregar doadores', 'error');
        }
    }

    updateDonorsTable(snapshot) {
        const tbody = document.getElementById('donorsTableBody');
        tbody.innerHTML = '';

        if (snapshot.empty) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">Nenhum doador encontrado</td>
                </tr>
            `;
            return;
        }

        snapshot.forEach(doc => {
            const donor = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${donor.nome}</td>
                <td>${donor.email}</td>
                <td>${donor.telefone}</td>
                <td>${donor.tipoSanguineo}</td>
                <td>${donor.ultimaDoacao ? new Date(donor.ultimaDoacao.toDate()).toLocaleDateString() : 'Nunca'}</td>
                <td>
                    <span class="status-badge status-${donor.status}">
                        ${this.getStatusText(donor.status)}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-button edit" onclick="donorsManager.editDonor('${doc.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-button delete" onclick="donorsManager.deleteDonor('${doc.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

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
            this.loadDonors();
        }
    }

    async nextPage() {
        this.currentPage++;
        this.loadDonors();
    }

    resetPagination() {
        this.currentPage = 1;
        this.lastDoc = null;
        this.firstDoc = null;
    }

    openDonorModal(donorId = null) {
        const modal = document.getElementById('donorModal');
        const form = document.getElementById('donorForm');
        const title = document.getElementById('modalTitle');

        // Reset form
        form.reset();
        form.dataset.donorId = donorId;

        if (donorId) {
            title.textContent = 'Editar Doador';
            this.loadDonorData(donorId);
        } else {
            title.textContent = 'Novo Doador';
        }

        modal.classList.add('active');
    }

    closeDonorModal() {
        const modal = document.getElementById('donorModal');
        modal.classList.remove('active');
    }

    async loadDonorData(donorId) {
        try {
            const doc = await this.donorsCollection.doc(donorId).get();
            if (doc.exists) {
                const donor = doc.data();
                Object.entries(donor).forEach(([key, value]) => {
                    const input = document.getElementById(key);
                    if (input) {
                        if (input.type === 'date' && value instanceof firebase.firestore.Timestamp) {
                            input.value = value.toDate().toISOString().split('T')[0];
                        } else {
                            input.value = value;
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error loading donor data:', error);
            showToast('Erro ao carregar dados do doador', 'error');
        }
    }

    async handleDonorSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const donorId = form.dataset.donorId;
        const formData = new FormData(form);
        const donorData = {};

        formData.forEach((value, key) => {
            donorData[key] = value;
        });

        try {
            if (donorId) {
                await this.donorsCollection.doc(donorId).update(donorData);
                showToast('Doador atualizado com sucesso!', 'success');
            } else {
                donorData.status = 'ativo';
                donorData.dataCadastro = firebase.firestore.FieldValue.serverTimestamp();
                await this.donorsCollection.add(donorData);
                showToast('Doador cadastrado com sucesso!', 'success');
            }

            this.closeDonorModal();
            this.loadDonors();
        } catch (error) {
            console.error('Error saving donor:', error);
            showToast('Erro ao salvar doador', 'error');
        }
    }

    async deleteDonor(donorId) {
        if (confirm('Tem certeza que deseja excluir este doador?')) {
            try {
                await this.donorsCollection.doc(donorId).delete();
                showToast('Doador excluído com sucesso!', 'success');
                this.loadDonors();
            } catch (error) {
                console.error('Error deleting donor:', error);
                showToast('Erro ao excluir doador', 'error');
            }
        }
    }

    async editDonor(donorId) {
        this.openDonorModal(donorId);
    }

    async handleCEPSearch(cep) {
        if (!cep || cep.length !== 8) return;

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (!data.erro) {
                document.getElementById('rua').value = data.logradouro;
                document.getElementById('bairro').value = data.bairro;
                document.getElementById('cidade').value = data.localidade;
                document.getElementById('estado').value = data.uf;
            }
        } catch (error) {
            console.error('Error searching CEP:', error);
        }
    }

    getStatusText(status) {
        const statusMap = {
            'ativo': 'Ativo',
            'inativo': 'Inativo',
            'suspenso': 'Suspenso'
        };
        return statusMap[status] || status;
    }
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize Donors Manager
let donorsManager;
document.addEventListener('DOMContentLoaded', () => {
    donorsManager = new DonorsManager();
});
