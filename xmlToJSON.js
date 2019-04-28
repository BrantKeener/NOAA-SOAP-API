// Convert our XML to JSON
// Right now I have location and time in rough formats
// We need temp max, temp min, and precipitation chance
const xmlToJSON = (xml, units, numDays) => {

  const regExOpen = /<[a-z]+>/g;
  const regExClose = /<\/[a-z]+>/g;
  const regExWhite = /\s\s/g;
  const head = xml.split('<head>')[1].split('</head>')[0];
  const title = head.split('<title>')[1].split('</title>')[0].replace('NOAA&apos;s ', '');
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
  const precipArray = precipCat.split('</name>')[1].replace(regExOpen, '').replace(regExClose, '').split(/\n/g);
  const precipArrayClean = [];
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

  precipArray.forEach(precip => {
    const precipNoWhite = parseInt(precip);
    if(!isNaN(precipNoWhite)) {
      precipArrayClean.push(precipNoWhite);
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
    let maxTemp = `maxTemp${units === 'e' ? 'Farenheit' : 'Celsius'}`;
    let minTemp = `minTemp${units === 'e' ? 'Farenheit' : 'Celsius'}`;
    dateArray[index][maxTemp] = temp;
    dateArray[index][minTemp] = tempMinArrayClean[index];
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
    dateArrayX = 0;
  };

  if(weatherArray3.length === numDays * 2) {
    weatherOrPrecipAdd(weatherArray3, 'weather');
    weatherOrPrecipAdd(precipArrayClean, 'precipitationAsPercentage')
  } else {
    weatherArray3.unshift("You've already experienced this weather.");
    weatherOrPrecipAdd(weatherArray3, 'weather');
    weatherOrPrecipAdd(precipArrayClean, 'precipitationAsPercentage');
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
      dateWeather: dateArray
    }
  };
  return json;
};

module.exports = xmlToJSON;