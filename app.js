const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hallo World!');
});

app.listen(8000, () => {
  console.log('Server listening on port 8000');
});