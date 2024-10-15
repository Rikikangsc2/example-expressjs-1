// app.js
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes page
const indexRouter = require('./routes/index');
app.use('/', indexRouter);

//Routes Api
const apiRouter = require('./routes/api');
app.use('/api/v1', apiRouter);

// Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
