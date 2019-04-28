const express = require('express');
const app = express();
const axios = require('axios');
const soap = require('soap');
const xmlparser = require('express-xml-bodyparser');

const numDays = 4;
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
  const tempMaxArray = tempMaxCat.split('</name>')[1].replace(regExOpen, '').replace(regExClose, '').split(/\n/g);
  const tempMaxArrayClean = [];
  const tempMinCat = xmlData2.split('<temperature type="minimum"')[1].split('</temperature>')[0];
  const tempMinArray = tempMinCat.split('</name>')[1].replace(regExOpen, '').replace(regExClose, '').split(/\n/g);
  const tempMinArrayClean = [];
  const precipCat = xmlData2.split('<probability-of-precipitation')[1].split('</probability-of-precipitation>')[0];
  const precipArray = precipCat.split('</name>')[1].split(/\n/g);
  const weatherCat = xmlData2.split('<weather time-layout')[1];
  const weatherArray1 = weatherCat.split('</name>')[1].split('</weather>')[0];
  const weatherArray2 = weatherArray1.split(/\n/g);
  const weatherArray3 = [];
  // This variable is used to allow us to iterate through the dateArray if our for loop is doing something other than ++
  let dateArrayX = 0;

  tempMaxArray.forEach(temp => {
    const tempNoWhite = parseInt(temp);
    if(!isNaN(tempNoWhite)) {
      tempMaxArrayClean.push(tempNoWhite);
    };
  });
  tempMinArray.forEach(temp => {
    const tempNoWhite = parseInt(temp);
    if(!isNaN(tempNoWhite)) {
      tempMinArrayClean.push(tempNoWhite);
    };
  });

  for(let i = 1; i < xmlTime.length - 1; i += 2) {
    const date = xmlTime[i].split('>')[1].split('T')[0];
    const day = xmlTime[i].split('<start-valid-time period-name="')[1].split('>')[0].replace('"', '');
    const dateBuild = {
      date,
      day,
    };
    dateArray.push(dateBuild);
  };

  tempMaxArrayClean.forEach((temp, index) => {
    dateArray[index].maxTemp = temp;
    dateArray[index].minTemp = tempMinArrayClean[index];
  });

  weatherArray2.forEach(condition => {
    const noWhite = condition.replace(regExWhite, '');
    if(noWhite.charAt(1) === 'w') {
      const valueOnly = noWhite.split('"')[1].split('"')[0];
      if(valueOnly !== 'true') {
        weatherArray3.push(valueOnly);
      };
    };
  });

  const weatherOrPrecipAdd = (array, type) => {
    for(let i = 0; i < array.length; i += 2) {
      const am = array[i];
      const pm = array[i + 1];
      dateArray[dateArrayX][type] = { am, pm };
      dateArrayX++;
    };
  };

  if(weatherArray3.length === numDays * 2) {
    weatherOrPrecipAdd(weatherArray3, 'weather');
  } else {
    weatherArray3.unshift("You've already experienced this weather.");
    weatherOrPrecipAdd(weatherArray3, 'weather');
  };
  
  const json = {
    head: {
      title
    },
    data: {
      location: {
        latitude,
        longitude
      },
      dateWeather: {
        dateArray
      }
    }
  };
  console.log(parseInt(precipArray));
  // console.log(weatherArray1);
  // console.log(weatherArray3);
  // console.log(json.data.time);
  // for(let i = 0; i < dateArray.length; i++) {
  //   console.log(json.data.dateWeather.dateArray[i]);
  // }
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