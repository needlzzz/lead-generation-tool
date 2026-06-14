const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dataStore = require('../lib/dataStore');
const { DEFAULT_CATEGORIES } = require('../lib/defaultCategories');

const router = express.Router();

// Seed defaults if categories.json is empty
function ensureDefaults() {
  const existing = dataStore.getAll('categories');
  if (existing.length === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      dataStore.save('categories', cat);
    }
  }
}

// GET /api/categories
router.get('/', (req, res) => {
  ensureDefaults();
  const categories = dataStore.getAll('categories');
  res.json({ categories });
});

// GET /api/categories/:id
router.get('/:id', (req, res) => {
  const category = dataStore.get('categories', req.params.id);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  res.json({ category });
});

// POST /api/categories
router.post('/', (req, res) => {
  const { name, searchTerm } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  if (!searchTerm) return res.status(400).json({ error: 'searchTerm is required' });

  const category = {
    id: uuidv4(),
    name,
    searchTerm
  };

  dataStore.save('categories', category);
  res.status(201).json({ category });
});

// PUT /api/categories/:id
router.put('/:id', (req, res) => {
  const category = dataStore.get('categories', req.params.id);
  if (!category) return res.status(404).json({ error: 'Category not found' });

  if (req.body.name !== undefined) category.name = req.body.name;
  if (req.body.searchTerm !== undefined) category.searchTerm = req.body.searchTerm;

  dataStore.save('categories', category);
  res.json({ category });
});

// DELETE /api/categories/:id
router.delete('/:id', (req, res) => {
  const category = dataStore.get('categories', req.params.id);
  if (!category) return res.status(404).json({ error: 'Category not found' });

  // Check if any leads reference this category
  const leads = dataStore.getAll('leads', { category: category.name });
  if (leads.length > 0) {
    return res.status(400).json({
      error: `Cannot delete category "${category.name}" — ${leads.length} lead(s) still reference it`
    });
  }

  dataStore.remove('categories', req.params.id);
  res.json({ success: true });
});

module.exports = router;
