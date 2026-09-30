const router = require('express').Router();
const ctrl = require('../controllers/orderController');
const { authenticate, requireRole } = require('../../..shared/middleware');

router.use(authenticate);

router.post('/checkout', ctrl.checkout);                               // POST /api/orders/checkout -> { orderId, url }
router.get('/', ctrl.list);                                            // GET  /api/orders           (comenzile mele)
router.get('/admin/all', requireRole('admin'), ctrl.listAll);          // GET  /api/orders/admin/all (înainte de /:id!)
router.get('/:id', ctrl.getOne);                                       // GET  /api/orders/:id
router.post('/:id/sync', ctrl.sync);                                   // POST /api/orders/:id/sync

module.exports = router;