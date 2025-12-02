
// === CORE CONFIGURATION ===
// API Key provided in the last turn (539913ac9d508a3e5d5adcf117c96cde)
const API_KEY = "539913ac9d508a3e5d5adcf117c96cde"; 
const API_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

// Polling interval: 60 seconds (60 * 1000 milliseconds) for dynamic updates
const POLLING_INTERVAL = 60000; 

// Variable to hold the interval timer ID
let weatherInterval = null;

// === DOM ELEMENTS ===
const elements = {
    body: document.body, 
    form: document.getElementById('search-form'),
    input: document.getElementById('city-input'),
    display: document.getElementById('weather-display'),
    message: document.getElementById('message-area'),
    location: document.getElementById('location'),
    icon: document.getElementById('weather-icon'),
    description: document.getElementById('description'),
    temperature: document.getElementById('temperature'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('wind-speed'),
    feelsLike: document.getElementById('feels-like'),
};

// Utility function to convert Kelvin to Celsius (fixed to 1 decimal place)
const kelvinToCelsius = (k) => (k - 273.15).toFixed(1); 

/**
 * Displays an error message to the user.
 * @param {string} msg - The error message to display.
 */
function displayError(msg) {
    elements.message.innerHTML = `<span class="text-red-600">${msg}</span>`;
    elements.display.classList.add('hidden');
    stopPolling();
    elements.body.removeAttribute('data-weather');
}

/**
 * Clears all messages and hides the weather card.
 */
function clearDisplay() {
    elements.message.innerHTML = '';
    elements.display.classList.add('hidden');
}

/**
 * Clears any existing interval to stop automatic updates.
 */
function stopPolling() {
    if (weatherInterval) {
        clearInterval(weatherInterval);
        weatherInterval = null;
    }
}

/**
 * Starts the polling mechanism for the currently displayed city.
 * @param {string} city - The name of the city to poll.
 */
function startPolling(city) {
    stopPolling(); 
    
    const pollFunction = async () => {
        const url = `${API_BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Polling error for ${city}: Status ${response.status}`);
                return; 
            }
            const data = await response.json();
            displayWeather(data);

        } catch (error) {
            console.error("Polling fetch error:", error);
        }
    };
    
    weatherInterval = setInterval(pollFunction, POLLING_INTERVAL);
    console.log(`Auto-updating weather for ${city} every ${POLLING_INTERVAL / 1000} seconds.`);
}

/**
 * Initiates the weather fetch and starts the polling loop.
 * @param {string} city - The name of the city.
 */
async function fetchWeatherAndStartPolling(city) {
    // Check for placeholder key before making API call
    if (API_KEY === "YOUR_OPENWEATHERMAP_API_KEY") {
        displayError("Please replace 'YOUR_OPENWEATHERMAP_API_KEY' in app.js with your actual API key.");
        return;
    }

    stopPolling();
    clearDisplay();
    elements.message.innerHTML = '<span class="text-sky-blue">Loading weather data...</span>';

    const url = `${API_BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}`;

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorData = await response.json();
            let errorMessage = errorData.message || `API error (${response.status})`;

            if (response.status === 404) {
                 errorMessage = `City not found: ${city}.`;
            } else if (response.status === 401) {
                 errorMessage = `Invalid API key (${response.status}). Please check your OpenWeatherMap key and ensure it has been activated.`;
            }

            throw new Error(errorMessage);
        }

        const data = await response.json();
        displayWeather(data);
        
        // Start polling after a successful initial load
        startPolling(city);

    } catch (error) {
        console.error("Fetch error:", error);
        displayError(`Failed to fetch weather: ${error.message}.`);
    }
}

/**
 * Updates the DOM with the fetched weather data and sets the background theme.
 * @param {object} data - The weather data object from the API.
 */
function displayWeather(data) {
    elements.message.innerHTML = '';
    elements.display.classList.remove('hidden');

    const tempC = kelvinToCelsius(data.main.temp);
    const feelsLikeC = kelvinToCelsius(data.main.feels_like);
    const iconCode = data.weather[0].icon;
    const mainCondition = data.weather[0].main;

    // Sets the data-weather attribute on the <body> tag, triggering CSS theme change.
    elements.body.setAttribute('data-weather', mainCondition);


    elements.location.textContent = `${data.name}, ${data.sys.country}`;
    elements.icon.src = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;
    elements.description.textContent = data.weather[0].description;
    elements.temperature.textContent = `${tempC}°C`;
    elements.humidity.textContent = `${data.main.humidity}%`;
    elements.windSpeed.textContent = `${data.wind.speed.toFixed(1)} m/s`;
    elements.feelsLike.textContent = `${feelsLikeC}°C`;
}


// === EVENT LISTENER AND INITIALIZATION ===

// Handle form submission
elements.form.addEventListener('submit', (event) => {
    event.preventDefault(); 
    const city = elements.input.value.trim();
    if (city) {
        fetchWeatherAndStartPolling(city);
        elements.input.blur(); 
    }
});

// Initial load behavior
window.onload = () => {
    // Remove the default city load. Now the field starts empty.
    elements.message.innerHTML = 'Enter a city name to begin!';
};

// Safety measure: Stop polling when the user leaves the page
window.onbeforeunload = stopPolling;