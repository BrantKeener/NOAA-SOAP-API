const express = require('express');
const app = express();
const axios = require('axios');
const xmlparser = require('express-xml-bodyparser');
const xmlToJSON = require('./xmlToJSON');

const numDays = 4;
const units = 'e';
const PORT = process.env.PORT || 8081;
const soapURL = 'https://graphical.weather.gov/xml/SOAP_server/ndfdXMLserver.php';
const xmlData = 
  `<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
  <Body>
      <NDFDgenByDay xmlns="https://graphical.weather.gov/xml/DWMLgen/wsdl/ndfdXML.wsdl">
          <latitude>39.742902</latitude>
          <longitude>-104.841890</longitude>
          <startDate>2019-04-28</startDate>
          <numDays>${numDays}</numDays>
          <Unit>${units}</Unit>
          <format>12 hourly</format>
      </NDFDgenByDay>
  </Body>
  </Envelope>`;

// Setup some parsing middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(xmlparser());

// Make an XML request to NOAA
app.get('/', (req, res) => {

  axios.post(soapURL, xmlData,
    { headers: 
      { 'Content-Type': 'text/xml' } 
    })
    .then(response => {
      const initalRes = response.data;
      const lessRegEx = /&lt;/g;
      const greatRegEx = /&gt;/g;
      const quoteRegEx = /&quot;/g;
      const lessClean = initalRes.replace(lessRegEx, '<');
      const greatClean = lessClean.replace(greatRegEx, '>');
      const quoteClean = greatClean.replace(quoteRegEx, '"');
      res.json(xmlToJSON(quoteClean, units, numDays));
    })
    .catch(err => console.log(err));
});

// Listen on port, and tell everyone which port
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));