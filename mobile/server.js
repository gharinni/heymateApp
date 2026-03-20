const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// Serve static files from dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP' });
});

// Handle all routes — fix for new Express/path-to-regexp
app.use((req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('HeyMate is starting...');
  }
});

// Listen on 0.0.0.0 for Railway
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ HeyMate running on port ${PORT}`);
});