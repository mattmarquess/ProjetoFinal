const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const path = require('path');

const app = express();

// Inicializar Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Rotas de Autenticação
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Aqui você deve implementar a lógica de autenticação
        // Por enquanto, vamos usar uma verificação simples
        if (email === 'admin@exemplo.com' && password === 'admin123') {
            res.json({ success: true });
        } else {
            res.status(401).json({ error: 'Credenciais inválidas' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rotas para Doadores
app.post('/api/doadores', async (req, res) => {
    try {
        const doadorRef = await db.collection('doadores').add(req.body);
        res.json({ id: doadorRef.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/doadores', async (req, res) => {
    try {
        const doadoresSnapshot = await db.collection('doadores').get();
        const doadores = [];
        doadoresSnapshot.forEach(doc => {
            doadores.push({ id: doc.id, ...doc.data() });
        });
        res.json(doadores);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rotas para Agendamentos
app.post('/api/agendamentos', async (req, res) => {
    try {
        const agendamentoRef = await db.collection('agendamentos').add(req.body);
        res.json({ id: agendamentoRef.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/agendamentos', async (req, res) => {
    try {
        const agendamentosSnapshot = await db.collection('agendamentos').get();
        const agendamentos = [];
        agendamentosSnapshot.forEach(doc => {
            agendamentos.push({ id: doc.id, ...doc.data() });
        });
        res.json(agendamentos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rotas para Estoque de Sangue
app.post('/api/estoque', async (req, res) => {
    try {
        const estoqueRef = await db.collection('estoque').add(req.body);
        res.json({ id: estoqueRef.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/estoque', async (req, res) => {
    try {
        const estoqueSnapshot = await db.collection('estoque').get();
        const estoque = [];
        estoqueSnapshot.forEach(doc => {
            estoque.push({ id: doc.id, ...doc.data() });
        });
        res.json(estoque);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rotas para Campanhas
app.post('/api/campanhas', async (req, res) => {
    try {
        const campanhaRef = await db.collection('campanhas').add(req.body);
        res.json({ id: campanhaRef.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/campanhas', async (req, res) => {
    try {
        const campanhasSnapshot = await db.collection('campanhas').get();
        const campanhas = [];
        campanhasSnapshot.forEach(doc => {
            campanhas.push({ id: doc.id, ...doc.data() });
        });
        res.json(campanhas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
