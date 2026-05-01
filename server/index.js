const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/leads', require('./routes/leads'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/scraper', require('./routes/scraper'));
app.use('/api/email', require('./routes/email'));
app.use('/api/csv', require('./routes/csv'));

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Lead Generation CRM running at http://localhost:${PORT}`);
});

module.exports = app;
