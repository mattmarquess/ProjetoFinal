const router = require('express').Router();
const userController = require('../controllers/userController');

// Rotas públicas
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/confirm/:token', userController.confirmEmail);
router.post('/request-reset', userController.requestPasswordReset);
router.post('/reset-password', userController.resetPassword);

module.exports = router;
