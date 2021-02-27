const apiKey = "<api-key-here>";
const harrisburgZipCode = 17057;

const grid = document.createElement("div");
const gridItem = document.createElement("div");

let cityElem = null;
let zipcodeElem = null;
let unitsElem = null;
let updateButton = null;

grid.className = "grid";
gridItem.className = "grid-item";

grid.style.gridTemplateColumns = "1fr ".repeat(5);
grid.style.gridTemplateRows = "1fr ";

const createElement = (className, innerText, parent) => {
  const item = document.createElement(className);

  item.innerText = innerText;
  parent.appendChild(item);

  return item;
};

createElement("h4", "", gridItem);

const getHourString = (hours) => {
  if (hours == 0) {
    return "12:00 AM";
  }

  let zone = "AM";
  if (hours > 12) {
    hours -= 12;
    zone = "PM";
  }

  // left-pad with zeros if necessary
  if (hours < 10) {
    return `0${hours}:00 ${zone}`;
  }

  return `${hours}:00 ${zone}`;
};

const FAHRENHEIT = "imperial";
const CELSIUS = "metric";
const KELVIN = "";

const createForecastContainer = (parent) => {
  const container = createElement("div", "", parent);
  container.className = "weather-forecast";

  const img = createElement("img", "", container);

  img.src = `http://openweathermap.org/img/wn/10d.png`;
  img.className = "weather-icon";

  createElement("span", "12:00 AM: 273ºK", container);
};

const storeForecast = (container, hours, icon, temp, units) => {
  const img = container.childNodes[0];

  img.className = "weather-icon";
  img.src = `http://openweathermap.org/img/wn/${icon}.png`;

  let unitLetter = "";
  if (units === FAHRENHEIT) {
    unitLetter = "F";
  } else if (units === CELSIUS) {
    unitLetter = "C";
  } else if (units === KELVIN) {
    unitLetter = "K";
  }

  container.childNodes[1].innerText = `${getHourString(
    hours
  )}: ${temp}º${unitLetter}`;

  container.style.visibility = "";
};

const FORECAST_COUNT = 8;
for (let i = 0; i < FORECAST_COUNT; i++) {
  createForecastContainer(gridItem);
}

for (let i = 0; i < 5; i++) {
  grid.appendChild(gridItem.cloneNode(true));
}

const getForecastInfo = async (zipcode, units) => {
  const unitString = units != "" ? `&units=${units}` : "";
  return new Promise((resolve, reject) => {
    const url = `https://api.openweathermap.org/data/2.5/forecast?zip=${zipcode},us&appid=${apiKey}${unitString}&lang=en`;
    fetch(url)
      .then((res) => {
        if (res.ok) {
          resolve(res.json());
        } else {
          reject(res.statusText);
        }
      })
      .catch(reject);
  });
};

const dateTimeFormatOptions = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
};

const dateFmt = new Intl.DateTimeFormat("en-US", dateTimeFormatOptions);
const createGrid = async (zipcode, units) => {
  let forecastInfo = null;
  try {
    forecastInfo = await getForecastInfo(zipcode, units);
    if (!("city" in forecastInfo)) {
      throw `Zipcode ${zipcode} not found`;
    }
  } catch (err) {
    grid.childNodes.forEach((child) => {
      child.innerHTML = "";
    });

    cityElem.innerText = `Error: ${err}`;
    return;
  }

  cityElem.innerText = `${forecastInfo.city.name}, ${zipcode}`;

  let gridChildIndex = 0;
  for (
    let i = 0;
    i < forecastInfo.cnt && gridChildIndex < 5;
    gridChildIndex++
  ) {
    const item = grid.childNodes[gridChildIndex];
    const firstInfo = forecastInfo.list[i];
    const firstInfoDate = firstInfo.dt_txt.split(" ")[0];
    const formattedDate = dateFmt.format(new Date(firstInfo.dt_txt));

    item.childNodes[0].innerText = formattedDate;
    let forecastCount = 0;

    for (; i < forecastInfo.cnt; i++, forecastCount++) {
      const nextInfo = forecastInfo.list[i];
      // Check to make sure the day-month-year (not time) are the same
      if (firstInfoDate != nextInfo.dt_txt.split(" ")[0]) {
        break;
      }

      storeForecast(
        item.childNodes[forecastCount + 1], // Add one because we have an h4 element at front
        new Date(nextInfo.dt_txt).getHours(),
        nextInfo.weather[0].icon,
        nextInfo.main.temp,
        units
      );
    }

    // We expect 8 forecasts/day (24 hours/1 forecast every 3 hours) at most.
    for (let j = forecastCount; j < FORECAST_COUNT; j++) {
      // Because the forecasts we'll be missing are from earlier, not later, we
      // push back our existing forecasts by moving back to front.

      let backItem = item.childNodes.item(item.childNodes.length - 1);
      backItem.style.visibility = "hidden";

      // First element in childNodes is the date.
      item.insertBefore(backItem, item.childNodes[1]);
    }
  }
};

const updateZipcode = (event) => {
  event.preventDefault();
  createGrid(zipcodeElem.value, unitsElem.value);
};

const handleFormEnter = (event) => {
  event.preventDefault();
  createGrid(zipcodeElem.value, unitsElem.value);
};

const zipcodeOnInput = (event) => {
  updateButton.disabled = !event.target.validity.valid;
};

createGrid(harrisburgZipCode, FAHRENHEIT);
document.addEventListener("DOMContentLoaded", () => {
  cityElem = document.getElementById("city");
  zipcodeElem = document.getElementById("zipcode");
  unitsElem = document.getElementById("units");
  updateButton = document.getElementById("updateButton");

  const form = document.getElementById("zipcode-form");
  zipcodeElem.value = harrisburgZipCode;
  root.insertBefore(grid, form);
});
