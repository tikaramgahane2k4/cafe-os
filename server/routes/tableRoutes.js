const express = require('express');
const router = express.Router();
const {
    generateTables,
    getTables,
    getTableStatus,
    occupyTable,
    freeTable
} = require('../controllers/tableController');

router.post('/generate', generateTables);
router.get('/:cafeId', getTables);
router.get('/:cafeId/:tableNumber', getTableStatus);
router.post('/:cafeId/:tableNumber/occupy', occupyTable);
router.post('/:cafeId/:tableNumber/free', freeTable);

module.exports = router;
