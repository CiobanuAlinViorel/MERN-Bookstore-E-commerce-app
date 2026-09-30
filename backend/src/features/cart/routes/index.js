const router = require('express').Router();
const ctrl = require('../controllers/cartController');
const { authenticate } = require('../../../shared/middleware');

router.use(authenticate); // tot coșul cere autentificare

router.get('/', ctrl.get);                        // GET    /api/cart
router.post('/items', ctrl.addItem);              // POST   /api/cart/items          { bookId, quantity }
router.patch('/items/:bookId', ctrl.updateItem);  // PATCH  /api/cart/items/:bookId  { quantity }
router.delete('/items/:bookId', ctrl.removeItem); // DELETE /api/cart/items/:bookId
router.delete('/', ctrl.clear);                   // DELETE /api/cart

module.exports = router;