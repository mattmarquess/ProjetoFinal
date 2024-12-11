const pool = require('../config/database');

const chatbotController = {
    // Processar mensagem do usuário
    processMessage: async (req, res) => {
        try {
            const { mensagem } = req.body;

            // Busca resposta mais relevante
            const response = await pool.query(
                'SELECT resposta FROM chatbot_mensagens WHERE pergunta ILIKE $1 OR pergunta ILIKE $2',
                [`%${mensagem}%`, `%${mensagem.split(' ').join('%')}%`]
            );

            if (response.rows.length > 0) {
                res.json({ resposta: response.rows[0].resposta });
            } else {
                // Resposta padrão caso não encontre correspondência
                res.json({
                    resposta: 'Desculpe, não entendi sua pergunta. Você pode tentar reformular ou falar com um de nossos atendentes.'
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao processar mensagem' });
        }
    },

    // Adicionar nova resposta ao chatbot (admin)
    addResponse: async (req, res) => {
        try {
            const { pergunta, resposta, categoria } = req.body;

            await pool.query(
                'INSERT INTO chatbot_mensagens (pergunta, resposta, categoria) VALUES ($1, $2, $3)',
                [pergunta, resposta, categoria]
            );

            res.status(201).json({ message: 'Resposta adicionada com sucesso!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao adicionar resposta' });
        }
    }
};

module.exports = chatbotController;
