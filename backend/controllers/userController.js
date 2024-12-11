const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../config/email');

const userController = {
    // Registro de usuário
    register: async (req, res) => {
        try {
            const { nome, email, senha, tipo_sanguineo } = req.body;
            
            // Verifica se usuário já existe
            const userExists = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
            if (userExists.rows.length > 0) {
                return res.status(400).json({ message: 'Email já cadastrado' });
            }

            // Cria hash da senha
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(senha, salt);

            // Cria token de confirmação
            const confirmationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });

            // Insere usuário
            const newUser = await pool.query(
                'INSERT INTO usuarios (nome, email, senha, token_confirmacao) VALUES ($1, $2, $3, $4) RETURNING id',
                [nome, email, hashedPassword, confirmationToken]
            );

            // Insere dados do doador
            await pool.query(
                'INSERT INTO doadores (usuario_id, tipo_sanguineo) VALUES ($1, $2)',
                [newUser.rows[0].id, tipo_sanguineo]
            );

            // Envia email de confirmação
            await sendEmail(
                email,
                'Confirme seu cadastro - Banco de Sangue',
                'Clique no link para confirmar seu cadastro',
                `<p>Olá ${nome},</p>
                <p>Clique <a href="${process.env.FRONTEND_URL}/confirmar/${confirmationToken}">aqui</a> para confirmar seu email.</p>`
            );

            res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao cadastrar usuário' });
        }
    },

    // Login
    login: async (req, res) => {
        try {
            const { email, senha } = req.body;

            // Busca usuário
            const user = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
            if (user.rows.length === 0) {
                return res.status(400).json({ message: 'Email ou senha inválidos' });
            }

            // Verifica senha
            const validPassword = await bcrypt.compare(senha, user.rows[0].senha);
            if (!validPassword) {
                return res.status(400).json({ message: 'Email ou senha inválidos' });
            }

            // Verifica se email foi confirmado
            if (!user.rows[0].email_confirmado) {
                return res.status(400).json({ message: 'Por favor, confirme seu email antes de fazer login' });
            }

            // Gera token JWT
            const token = jwt.sign(
                { id: user.rows[0].id, tipo_usuario: user.rows[0].tipo_usuario },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            res.json({ token, tipo_usuario: user.rows[0].tipo_usuario });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao fazer login' });
        }
    },

    // Confirmar email
    confirmEmail: async (req, res) => {
        try {
            const { token } = req.params;

            const user = await pool.query(
                'UPDATE usuarios SET email_confirmado = true WHERE token_confirmacao = $1 RETURNING email',
                [token]
            );

            if (user.rows.length === 0) {
                return res.status(400).json({ message: 'Token inválido ou expirado' });
            }

            res.json({ message: 'Email confirmado com sucesso!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao confirmar email' });
        }
    },

    // Solicitar recuperação de senha
    requestPasswordReset: async (req, res) => {
        try {
            const { email } = req.body;

            // Verifica se o usuário existe
            const user = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
            if (user.rows.length === 0) {
                return res.status(404).json({ message: 'Email não encontrado' });
            }

            // Gera token de recuperação
            const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

            // Atualiza o token no banco
            await pool.query(
                'UPDATE usuarios SET reset_token = $1 WHERE email = $2',
                [resetToken, email]
            );

            // Envia email com o token
            await sendEmail(
                email,
                'Recuperação de Senha - Banco de Sangue',
                'Use o código abaixo para recuperar sua senha',
                `<p>Olá,</p>
                <p>Você solicitou a recuperação de senha. Use o código abaixo para redefinir sua senha:</p>
                <h2 style="color: #C30000;">${resetToken.slice(-6)}</h2>
                <p>Este código expira em 1 hora.</p>
                <p>Se você não solicitou esta recuperação, ignore este email.</p>`
            );

            res.json({ message: 'Email de recuperação enviado com sucesso!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao processar recuperação de senha' });
        }
    },

    // Redefinir senha
    resetPassword: async (req, res) => {
        try {
            const { token, newPassword } = req.body;

            // Verifica o token
            const user = await pool.query('SELECT * FROM usuarios WHERE reset_token = $1', [token]);
            if (user.rows.length === 0) {
                return res.status(400).json({ message: 'Token inválido ou expirado' });
            }

            // Cria hash da nova senha
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // Atualiza a senha e remove o token
            await pool.query(
                'UPDATE usuarios SET senha = $1, reset_token = NULL WHERE reset_token = $2',
                [hashedPassword, token]
            );

            res.json({ message: 'Senha atualizada com sucesso!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Erro ao redefinir senha' });
        }
    }
};

module.exports = userController;
