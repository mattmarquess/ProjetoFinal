// Inventory Management
class InventoryManager {
    constructor() {
        this.db = firebase.firestore();
        this.inventoryCollection = this.db.collection('estoque');
        this.movementsCollection = this.db.collection('movimentacoes');
        this.currentPage = 1;
        this.pageSize = 10;
        this.lastDoc = null;
        this.firstDoc = null;
        this.bloodTypeFilter = '';
        this.movementTypeFilter = '';
        this.dateFilter = '';

        // Blood type thresholds
        this.thresholds = {
            'A+': { low: 10, critical: 5 },
            'A-': { low: 8, critical: 4 },
            'B+': { low: 8, critical: 4 },
            'B-': { low: 6, critical: 3 },
            'AB+': { low: 6, critical: 3 },
            'AB-': { low: 4, critical: 2 },
            'O+': { low: 12, critical: 6 },
            'O-': { low: 10, critical: 5 }
        };

        this.initializeEventListeners();
        this.loadInventory();
        this.loadMovements();
    }

    initializeEventListeners() {
        // Add inventory button
        document.getElementById('addInventoryBtn').addEventListener('click', () => this.openInventoryModal());

        // Search and filters
        document.getElementById('bloodTypeFilter').addEventListener('change', (e) => {
            this.bloodTypeFilter = e.target.value;
            this.resetPagination();
            this.loadMovements();
        });

        document.getElementById('movementTypeFilter').addEventListener('change', (e) => {
            this.movementTypeFilter = e.target.value;
            this.resetPagination();
            this.loadMovements();
        });

        document.getElementById('dateFilter').addEventListener('change', (e) => {
            this.dateFilter = e.target.value;
            this.resetPagination();
            this.loadMovements();
        });

        // Pagination
        document.getElementById('prevPage').addEventListener('click', () => this.previousPage());
        document.getElementById('nextPage').addEventListener('click', () => this.nextPage());

        // Modal form
        document.getElementById('inventoryForm').addEventListener('submit', (e) => this.handleInventorySubmit(e));
        document.querySelector('.close-button').addEventListener('click', () => this.closeInventoryModal());

        // Quantity validation
        document.getElementById('quantidade').addEventListener('change', (e) => this.validateQuantity(e.target.value));
        document.getElementById('tipo').addEventListener('change', () => {
            const quantidade = document.getElementById('quantidade');
            quantidade.value = '';
            this.validateQuantity(quantidade.value);
        });
    }

    async loadInventory() {
        try {
            const snapshot = await this.inventoryCollection.get();
            const inventory = {};
            
            // Initialize inventory with zeros
            Object.keys(this.thresholds).forEach(type => {
                inventory[type] = 0;
            });

            // Update with actual values
            snapshot.forEach(doc => {
                const data = doc.data();
                inventory[doc.id] = data.quantidade;
            });

            this.updateInventoryCards(inventory);
        } catch (error) {
            console.error('Error loading inventory:', error);
            showToast('Erro ao carregar estoque', 'error');
        }
    }

    updateInventoryCards(inventory) {
        const cards = document.querySelectorAll('.blood-type-card');
        cards.forEach(card => {
            const type = card.dataset.type;
            const quantity = inventory[type] || 0;
            const threshold = this.thresholds[type];

            // Update quantity
            card.querySelector('.quantity').textContent = quantity;

            // Update level bar
            const levelBar = card.querySelector('.level-bar');
            const percentage = Math.min((quantity / threshold.low) * 100, 100);
            levelBar.style.width = `${percentage}%`;

            // Update status
            const status = card.querySelector('.status');
            if (quantity <= threshold.critical) {
                status.textContent = 'Crítico';
                status.className = 'status status-critical';
                levelBar.style.backgroundColor = 'var(--danger)';
            } else if (quantity <= threshold.low) {
                status.textContent = 'Baixo';
                status.className = 'status status-low';
                levelBar.style.backgroundColor = 'var(--warning)';
            } else {
                status.textContent = 'Normal';
                status.className = 'status status-normal';
                levelBar.style.backgroundColor = 'var(--success)';
            }
        });
    }

    async loadMovements() {
        try {
            let query = this.movementsCollection.orderBy('data', 'desc');

            // Apply filters
            if (this.bloodTypeFilter) {
                query = query.where('tipoSanguineo', '==', this.bloodTypeFilter);
            }
            if (this.movementTypeFilter) {
                query = query.where('tipo', '==', this.movementTypeFilter);
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
            this.updateMovementsTable(snapshot);
            this.updatePaginationControls(snapshot);
        } catch (error) {
            console.error('Error loading movements:', error);
            showToast('Erro ao carregar movimentações', 'error');
        }
    }

    updateMovementsTable(snapshot) {
        const tbody = document.getElementById('inventoryTableBody');
        tbody.innerHTML = '';

        if (snapshot.empty) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">Nenhuma movimentação encontrada</td>
                </tr>
            `;
            return;
        }

        snapshot.forEach(doc => {
            const movement = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${movement.data.toDate().toLocaleDateString()}</td>
                <td>${movement.tipoSanguineo}</td>
                <td>
                    <span class="movement-type movement-${movement.tipo}">
                        ${this.getMovementTypeText(movement.tipo)}
                    </span>
                </td>
                <td>${movement.quantidade} bolsas</td>
                <td>${movement.responsavel}</td>
                <td>${movement.observacoes || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-button delete" onclick="inventoryManager.deleteMovement('${doc.id}')">
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
            this.loadMovements();
        }
    }

    async nextPage() {
        this.currentPage++;
        this.loadMovements();
    }

    resetPagination() {
        this.currentPage = 1;
        this.lastDoc = null;
        this.firstDoc = null;
    }

    openInventoryModal() {
        const modal = document.getElementById('inventoryModal');
        const form = document.getElementById('inventoryForm');
        
        // Reset form
        form.reset();
        
        modal.classList.add('active');
    }

    closeInventoryModal() {
        const modal = document.getElementById('inventoryModal');
        modal.classList.remove('active');
    }

    async validateQuantity(quantity) {
        const tipo = document.getElementById('tipo').value;
        const tipoSanguineo = document.getElementById('tipoSanguineo').value;
        
        if (!tipo || !tipoSanguineo || !quantity) return;

        if (tipo === 'saida') {
            try {
                const doc = await this.inventoryCollection.doc(tipoSanguineo).get();
                const currentStock = doc.exists ? doc.data().quantidade : 0;

                if (quantity > currentStock) {
                    showToast('Quantidade maior que o estoque disponível', 'error');
                    document.getElementById('quantidade').value = '';
                }
            } catch (error) {
                console.error('Error validating quantity:', error);
            }
        }
    }

    async handleInventorySubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const movementData = {
            tipoSanguineo: formData.get('tipoSanguineo'),
            tipo: formData.get('tipo'),
            quantidade: parseInt(formData.get('quantidade')),
            observacoes: formData.get('observacoes'),
            data: new Date(),
            responsavel: firebase.auth().currentUser.email
        };

        try {
            // Start a batch
            const batch = this.db.batch();

            // Add movement
            const movementRef = this.movementsCollection.doc();
            batch.set(movementRef, movementData);

            // Update inventory
            const inventoryRef = this.inventoryCollection.doc(movementData.tipoSanguineo);
            const inventoryDoc = await inventoryRef.get();
            const currentQuantity = inventoryDoc.exists ? inventoryDoc.data().quantidade : 0;

            const newQuantity = movementData.tipo === 'entrada'
                ? currentQuantity + movementData.quantidade
                : currentQuantity - movementData.quantidade;

            batch.set(inventoryRef, { quantidade: newQuantity }, { merge: true });

            // Commit the batch
            await batch.commit();

            showToast('Movimentação registrada com sucesso!', 'success');
            this.closeInventoryModal();
            this.loadInventory();
            this.loadMovements();
        } catch (error) {
            console.error('Error saving movement:', error);
            showToast('Erro ao registrar movimentação', 'error');
        }
    }

    async deleteMovement(movementId) {
        if (confirm('Tem certeza que deseja excluir esta movimentação?')) {
            try {
                const movementDoc = await this.movementsCollection.doc(movementId).get();
                const movement = movementDoc.data();

                // Start a batch
                const batch = this.db.batch();

                // Delete movement
                batch.delete(this.movementsCollection.doc(movementId));

                // Update inventory
                const inventoryRef = this.inventoryCollection.doc(movement.tipoSanguineo);
                const inventoryDoc = await inventoryRef.get();
                const currentQuantity = inventoryDoc.exists ? inventoryDoc.data().quantidade : 0;

                // Reverse the movement
                const newQuantity = movement.tipo === 'entrada'
                    ? currentQuantity - movement.quantidade
                    : currentQuantity + movement.quantidade;

                batch.set(inventoryRef, { quantidade: newQuantity }, { merge: true });

                // Commit the batch
                await batch.commit();

                showToast('Movimentação excluída com sucesso!', 'success');
                this.loadInventory();
                this.loadMovements();
            } catch (error) {
                console.error('Error deleting movement:', error);
                showToast('Erro ao excluir movimentação', 'error');
            }
        }
    }

    getMovementTypeText(type) {
        const typeMap = {
            'entrada': 'Entrada',
            'saida': 'Saída'
        };
        return typeMap[type] || type;
    }
}

// Initialize Inventory Manager
let inventoryManager;
document.addEventListener('DOMContentLoaded', () => {
    inventoryManager = new InventoryManager();
});
