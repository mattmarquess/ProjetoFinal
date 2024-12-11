const pool = require('../config/database');

const rewardController = {
    // Listar recompensas disponíveis
    listRewards: async (req, res) => {
        try {
            const rewards = await pool.query(
                'SELECT * FROM recompensas WHERE ativo = true AND (quantidade_disponivel > 0 OR quantidade_disponivel = -1)'
            );
            res.json(rewards.rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao listar recompensas' });
        }
    },

    // Resgatar recompensa
    redeemReward: async (req, res) => {
        try {
            const { recompensa_id } = req.body;
            const usuario_id = req.user.id; // Vem do middleware de autenticação

            // Verifica se recompensa existe e está disponível
            const reward = await pool.query(
                'SELECT * FROM recompensas WHERE id = $1 AND ativo = true AND (quantidade_disponivel > 0 OR quantidade_disponivel = -1)',
                [recompensa_id]
            );

            if (reward.rows.length === 0) {
                return res.status(400).json({ message: 'Recompensa não disponível' });
            }

            // Verifica se usuário tem pontos suficientes
            const user = await pool.query(
                'SELECT pontos FROM doadores WHERE usuario_id = $1',
                [usuario_id]
            );

            if (user.rows[0].pontos < reward.rows[0].pontos_necessarios) {
                return res.status(400).json({ message: 'Pontos insuficientes' });
            }

            // Inicia transação
            await pool.query('BEGIN');

            // Atualiza pontos do usuário
            await pool.query(
                'UPDATE doadores SET pontos = pontos - $1 WHERE usuario_id = $2',
                [reward.rows[0].pontos_necessarios, usuario_id]
            );

            // Atualiza quantidade disponível da recompensa
            if (reward.rows[0].quantidade_disponivel > 0) {
                await pool.query(
                    'UPDATE recompensas SET quantidade_disponivel = quantidade_disponivel - 1 WHERE id = $1',
                    [recompensa_id]
                );
            }

            // Registra o resgate
            await pool.query(
                'INSERT INTO resgates (usuario_id, recompensa_id, pontos_gastos) VALUES ($1, $2, $3)',
                [usuario_id, recompensa_id, reward.rows[0].pontos_necessarios]
            );

            await pool.query('COMMIT');

            res.json({ message: 'Recompensa resgatada com sucesso!' });
        } catch (error) {
            await pool.query('ROLLBACK');
            console.error(error);
            res.status(500).json({ message: 'Erro ao resgatar recompensa' });
        }
    },

    // Adicionar pontos (após doação)
    addPoints: async (req, res) => {
        try {
            const { usuario_id, pontos } = req.body;

            await pool.query(
                'UPDATE doadores SET pontos = pontos + $1 WHERE usuario_id = $2',
                [pontos, usuario_id]
            );

            res.json({ message: 'Pontos adicionados com sucesso!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao adicionar pontos' });
        }
    }
};

module.exports = rewardController;
