const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// Serve static files from dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// Handle all routes — return index.html for React Navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Listen on 0.0.0.0 so Railway can reach it
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ HeyMate frontend running on port ${PORT}`);
});