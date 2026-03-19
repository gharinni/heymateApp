const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// Health check route — Railway checks this
app.get('/', (req, res) => {
  res.send('HeyMate Server is working ✅');
});

app.get('/health', (req, res) => {
  res.json({ status: 'UP', message: 'HeyMate frontend running' });
});

// Serve static files from dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// Handle all routes for React Navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Listen on 0.0.0.0 — required by Railway
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ HeyMate running on port ${PORT}`);
});
