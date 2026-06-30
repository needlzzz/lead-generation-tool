const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dataStore = require('../lib/dataStore');
const { DEFAULT_CATEGORIES } = require('../lib/defaultCategories');

const router = express.Router();

// Seed defaults if categories.json is empty; otherwise add any newly-introduced
// default categories that are missing by name (e.g. "Fahrlehrer"). Existing
// categories are never overwritten, so user edits are preserved.
function ensureDefaults() {
  const existing = dataStore.getAll('categories');
  if (existing.length === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      dataStore.save('categories', cat);
    }
    return;
  }
  const existingNames = new Set(existing.map((c) => c.name));
  for (const cat of DEFAULT_CATEGORIES) {
    if (!existingNames.has(cat.name)) {
      dataStore.save('categories', { ...cat, id: uuidv4() });
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
  const { name, searchTerm, templates, tone } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  if (!searchTerm) return res.status(400).json({ error: 'searchTerm is required' });

  const category = {
    id: uuidv4(),
    name,
    searchTerm
  };
  if (tone !== undefined) category.tone = tone;
  if (templates !== undefined) category.templates = templates;

  dataStore.save('categories', category);
  res.status(201).json({ category });
});

// PUT /api/categories/:id
router.put('/:id', (req, res) => {
  const category = dataStore.get('categories', req.params.id);
  if (!category) return res.status(404).json({ error: 'Category not found' });

  if (req.body.name !== undefined) category.name = req.body.name;
  if (req.body.searchTerm !== undefined) category.searchTerm = req.body.searchTerm;
  if (req.body.tone !== undefined) category.tone = req.body.tone;
  if (req.body.templates !== undefined) category.templates = req.body.templates;

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
