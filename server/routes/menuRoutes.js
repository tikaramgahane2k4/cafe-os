const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
    getMenuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    updateStock,
} = require('../controllers/menuController');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const upload = multer({ storage: storage });

router.get('/', getMenuItems);
router.post('/', upload.single('image'), addMenuItem);
router.put('/:id', upload.single('image'), updateMenuItem);
router.delete('/:id', deleteMenuItem);
router.patch('/stock/:id', updateStock);

module.exports = router;


