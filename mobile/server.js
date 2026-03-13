const express = require('express');
const path    = require('path');
const app     = express();

const DIST = path.join(__dirname, 'dist');

app.use(express.static(DIST));

app.get('*', (req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`HeyMate running on http://0.0.0.0:${PORT}`);
});
