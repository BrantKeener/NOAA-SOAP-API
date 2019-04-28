const express = require('express');
const router = express.Router();
const xmlToJSON = require('../../xmlToJSON');
const axios = require('axios');

const numDays = 4;
const units = 'e';

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



// Make an XML request to NOAA
router.get('/', (req, res) => {

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

module.exports = router;