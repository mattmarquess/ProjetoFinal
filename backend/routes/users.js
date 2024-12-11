const router = require('express').Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Rotas públicas
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/confirm/:token', userController.confirmEmail);
router.post('/request-reset', userController.requestPasswordReset);
router.post('/reset-password', userController.resetPassword);

// Rotas protegidas
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);

module.exports = router;
