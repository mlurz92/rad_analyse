const express = require('express');
const router = express.Router();
const { filterInvestigations, getFilterOptions } = require('../controllers/filterController');

// Route für Filteranfragen
router.get('/api/filter', filterInvestigations);

// Route für das Abrufen der Filteroptionen
router.get('/api/filters', getFilterOptions);

module.exports = router;