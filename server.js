const express = require('express');
const app = express();
const axios = require('axios');
const soap = require('soap');
const xmlparser = require('express-xml-bodyparser');

const PORT = process.env.PORT || 8081;
const soapURL = 'https://graphical.weather.gov/xml/SOAP_server/ndfdXMLserver.php';
const xmlData = 
  `<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
  <Body>
      <NDFDgenByDay xmlns="https://graphical.weather.gov/xml/DWMLgen/wsdl/ndfdXML.wsdl">
          <latitude>39.742902</latitude>
          <longitude>-104.841890</longitude>
          <startDate>2019-04-27</startDate>
          <numDays>4</numDays>
          <Unit>e</Unit>
          <format>12 hourly</format>
      </NDFDgenByDay>
  </Body>
  </Envelope>`;

// Setup some parsing middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(xmlparser());

// Convert our XML to JSON
// Right now I have location and time in rough formats
// We need temp max, temp min, and precipitation chance
const xmlToJSON = (xml) => {
  // console.log(xml);
  const initialValues = [4, 21]
  const regExOpen = /<[a-z]+>/g;
  const regExClose = /<\/[a-z]+>/g;
  const regExWhite = /\s\s/g;
  const head = xml.split('<head>')[1].split('</head>')[0];
  const title = head.split('<title>')[1].split('</title>')[0].replace('NOAA&apos;s', '');
  const xmlData1 = xml.split('<data>')[1];
  const xmlData2 = xmlData1.split('<conditions-icon')[0];
  const xmlLocationArray = xmlData2.split('latitude="')[1].split('"/>')[0].replace('"', '').replace(' ', '').split('longitude="');
  const latitude = parseFloat(xmlLocationArray[0]);
  const longitude = parseFloat(xmlLocationArray[1]);
  const xmlTime = xmlData2.split('</layout-key>')[1].split('</time-layout>')[0].split(/\n/g);
  const dateArray = [];
  const tempMaxCat = xmlData2.split('<temperature type="maximum"')[1].split('</temperature>')[0];
  const tempMaxArray = tempMaxCat.split('</name>')[1].split(/\n/g);
  const tempMaxLabel = tempMaxCat.split('<name>')[1].split('</name>')[0];
  const tempMinCat = xmlData2.split('<temperature type="minimum"')[1].split('</temperature>')[0];
  const tempMinArray = tempMinCat.split('</name>')[1].split(/\n/g);
  const tempMinLabel = tempMinCat.split('<name>')[1].split('</name>')[0];
  const precipCat = xmlData2.split('<probability-of-precipitation')[1].split('</probability-of-precipitation>')[0];
  const precipArray = precipCat.split('</name>')[1].split(/\n/g);
  const precipLabel = precipCat.split('<name>')[1].split('</name>')[0];
  const weatherCat = xmlData2.split('<weather time-layout')[1];
  const weatherArray1 = weatherCat.split('</name>')[1].split('</weather>')[0];
  const weatherArray2 = weatherArray1.split(/\n/g);
  const weatherArray3 = [];
  const weatherLabel = weatherCat.split('<name>')[1].split('</name>')[0];
  for(let i = 1; i < xmlTime.length - 1; i += 2) {
    const date = xmlTime[i].split('>')[1].split('T')[0];
    const day = xmlTime[i].split('<start-valid-time period-name="')[1].split('>')[0].replace('"', '');
    const dateBuild = {
      [date]: {
        day
      }
    };
    dateArray.push(dateBuild);
  };
  weatherArray2.forEach(condition => {
    const noWhite = condition.replace(regExWhite, '');
    if(noWhite.charAt(1) === 'w') {
      const valueOnly = noWhite.split('"')[1].split('"')[0];
      weatherArray3.push(valueOnly);
    };
  });
  const json = {
    head: {
      title
    },
    data: {
      location: {
        latitude,
        longitude
      },
      time: {
        dateArray
      }
    }
  };
  // console.log(xmlTime);
  console.log(weatherArray3);
  // console.log(weatherLabel, weatherArray2);
};

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
      xmlToJSON(quoteClean);
    })
    .catch(err => console.log(err));
});

// Listen on port, and tell everyone which port
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));