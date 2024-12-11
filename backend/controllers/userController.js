const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const userController = {
    // Registro de usuário
    async register(req, res) {
        const { nome, email, senha, tipo_sanguineo } = req.body;

        try {
            // Verificar se o email já existe
            const userExists = await pool.query(
                'SELECT * FROM usuarios WHERE email = $1',
                [email]
            );

            if (userExists.rows.length > 0) {
                return res.status(400).json({ message: 'Email já cadastrado' });
            }

            // Criptografar a senha
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(senha, salt);

            // Iniciar uma transação
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // Inserir usuário
                const userResult = await client.query(
                    `INSERT INTO usuarios (nome, email, senha, tipo_usuario)
                     VALUES ($1, $2, $3, 'usuario')
                     RETURNING id, nome, email, tipo_usuario`,
                    [nome, email, hashedPassword]
                );

                // Inserir doador
                await client.query(
                    `INSERT INTO doadores (usuario_id, tipo_sanguineo)
                     VALUES ($1, $2)`,
                    [userResult.rows[0].id, tipo_sanguineo]
                );

                await client.query('COMMIT');

                // Gerar token JWT
                const token = jwt.sign(
                    { id: userResult.rows[0].id },
                    process.env.JWT_SECRET,
                    { expiresIn: '1d' }
                );

                res.status(201).json({
                    token,
                    user: userResult.rows[0]
                });
            } catch (err) {
                await client.query('ROLLBACK');
                throw err;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Erro no registro:', error);
            res.status(500).json({ message: 'Erro no servidor' });
        }
    },

    // Login de usuário
    async login(req, res) {
        const { email, senha } = req.body;

        try {
            // Buscar usuário
            const result = await pool.query(
                `SELECT u.*, d.tipo_sanguineo, d.pontos
                 FROM usuarios u
                 LEFT JOIN doadores d ON u.id = d.usuario_id
                 WHERE u.email = $1`,
                [email]
            );

            const user = result.rows[0];

            if (!user) {
                return res.status(401).json({ message: 'Email ou senha inválidos' });
            }

            // Verificar senha
            const validPassword = await bcrypt.compare(senha, user.senha);
            if (!validPassword) {
                return res.status(401).json({ message: 'Email ou senha inválidos' });
            }

            // Gerar token JWT
            const token = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            // Remover senha do objeto do usuário
            delete user.senha;

            res.json({
                token,
                user
            });
        } catch (error) {
            console.error('Erro no login:', error);
            res.status(500).json({ message: 'Erro no servidor' });
        }
    },

    // Obter perfil do usuário
    async getProfile(req, res) {
        try {
            const result = await pool.query(
                `SELECT u.id, u.nome, u.email, u.tipo_usuario,
                        d.tipo_sanguineo, d.pontos, d.ultima_doacao
                 FROM usuarios u
                 LEFT JOIN doadores d ON u.id = d.usuario_id
                 WHERE u.id = $1`,
                [req.user.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Usuário não encontrado' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
            res.status(500).json({ message: 'Erro no servidor' });
        }
    },

    // Atualizar perfil do usuário
    async updateProfile(req, res) {
        const { nome, tipo_sanguineo } = req.body;

        try {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // Atualizar usuário
                await client.query(
                    'UPDATE usuarios SET nome = $1 WHERE id = $2',
                    [nome, req.user.id]
                );

                // Atualizar doador
                if (tipo_sanguineo) {
                    await client.query(
                        'UPDATE doadores SET tipo_sanguineo = $1 WHERE usuario_id = $2',
                        [tipo_sanguineo, req.user.id]
                    );
                }

                await client.query('COMMIT');

                res.json({ message: 'Perfil atualizado com sucesso' });
            } catch (err) {
                await client.query('ROLLBACK');
                throw err;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            res.status(500).json({ message: 'Erro no servidor' });
        }
    }
};

module.exports = userController;
