const express = require('express');
const app = express();
const xmlparser = require('express-xml-bodyparser');

const PORT = process.env.PORT || 8081;

// Setup some parsing middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(xmlparser());

// API router
app.use('/noaa_api', require('./routes/api/NOAA'));

// Listen on port, and tell everyone which port
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));