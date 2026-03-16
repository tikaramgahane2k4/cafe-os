const express = require('express');
const router  = express.Router();
const { createUser, getAllUsers, updateUser, deleteUser, getRolePermissions } = require('../controllers/userController');

router.get('/role-permissions', getRolePermissions);  // BEFORE /:id
router.get('/',       getAllUsers);
router.post('/',      createUser);
router.patch('/:id',  updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
