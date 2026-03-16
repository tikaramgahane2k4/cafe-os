const express = require('express');
const router = express.Router();
const { createPlan, getAllPlans, updatePlan, deletePlan, getPlanDistribution } = require('../controllers/planController');

router.get('/distribution', getPlanDistribution);
router.post('/', createPlan);
router.get('/', getAllPlans);
router.patch('/:id', updatePlan);
router.delete('/:id', deletePlan);

module.exports = router;
