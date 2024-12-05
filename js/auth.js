class Auth {
    constructor() {
        this.auth = firebase.auth();
        this.db = firebase.firestore();
    }

    // Login com email/senha
    async login(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const userDoc = await this.db.collection('usuarios').doc(userCredential.user.uid).get();
            
            if (!userDoc.exists || userDoc.data().role !== 'admin') {
                await this.auth.signOut();
                throw new Error('Acesso não autorizado');
            }
            
            return userCredential.user;
        } catch (error) {
            console.error('Erro no login:', error);
            throw error;
        }
    }

    // Logout
    async logout() {
        try {
            await this.auth.signOut();
        } catch (error) {
            console.error('Erro no logout:', error);
            throw error;
        }
    }

    // Verificar estado da autenticação
    onAuthStateChanged(callback) {
        return this.auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDoc = await this.db.collection('usuarios').doc(user.uid).get();
                if (userDoc.exists) {
                    callback({ ...user, role: userDoc.data().role });
                } else {
                    callback(null);
                }
            } else {
                callback(null);
            }
        });
    }

    // Verificar se usuário está autenticado
    isAuthenticated() {
        return this.auth.currentUser !== null;
    }

    // Obter usuário atual
    getCurrentUser() {
        return this.auth.currentUser;
    }
}
