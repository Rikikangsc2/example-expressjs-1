// app.js
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const yt = require('./api/yt');
const gemini = require('./api/gemini');

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('json spaces', 2);

app.get('/yt',yt)
app.get('/gemini',gemini)

// global error
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
});
// Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
