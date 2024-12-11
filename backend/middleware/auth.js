const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        // Obter o token do header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Token não fornecido' });
        }

        // Verificar o token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Adicionar o usuário à requisição
        req.user = decoded;
        
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido' });
    }
};
