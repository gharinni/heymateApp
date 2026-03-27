const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// API test
app.get('/health', (req, res) => {
  res.json({ status: 'UP' });
});

// Serve frontend
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// React routing fix
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});