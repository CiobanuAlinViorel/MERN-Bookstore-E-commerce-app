const router = require('express').Router();
const ctrl = require('../controllers/bookController');

const { authenticate, requireRole } = require('../../../shared/middleware');
 
const adminOnly = [authenticate, requireRole('admin')];

router.get('/', ctrl.list);                  // GET /api/books?search=&category=&sortBy=price&order=desc&page=1
router.get('/categories', ctrl.categories);  // GET /api/books/categories  (înainte de /:id!)
router.get('/:id', ctrl.getOne); 

// Doar admin
router.post('/', adminOnly, ctrl.create);        // POST   /api/books
router.put('/:id', adminOnly, ctrl.update);      // PUT    /api/books/:id
router.delete('/:id', adminOnly, ctrl.remove);   // DELETE /api/books/:id
 

module.exports = router;