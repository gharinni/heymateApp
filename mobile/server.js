const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// Health check
app.get('/health', (req, res) => res.json({ status: 'UP' }));

// Handle ALL routes — use app.use() NOT app.get('*')
app.use((req, res) => {
  const index = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(index)) {
    res.sendFile(index);
  } else {
    res.status(200).send('HeyMate is starting...');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ HeyMate running on port ${PORT}`);
});