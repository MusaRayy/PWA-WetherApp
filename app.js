// IndexedDB setup
const dbPromise = idb.openDB('weather-store', 1, {
    upgrade(db) {
        if (!db.objectStoreNames.contains('locations')) {
            db.createObjectStore('locations', { keyPath: 'name' });
        }
    }
});

// Capture the beforeinstallprompt event
let deferredPrompt;
const installButton = document.createElement('button');
installButton.id = 'install-button';
installButton.innerText = 'Install';
installButton.style.display = 'none';  // Initially hidden
document.body.appendChild(installButton);

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installButton.style.display = 'block';

    installButton.addEventListener('click', () => {
        installButton.style.display = 'none';
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the A2HS prompt');
            } else {
                console.log('User dismissed the A2HS prompt');
            }
            deferredPrompt = null;
        });
    });
});

// Weather application logic
document.getElementById('get-weather-btn').addEventListener('click', async () => {
    const location = document.getElementById('location-input').value.trim();
    if (location) {
        showProgress();
        hideError();
        try {
        const weather = await fetchWeather(location);
        displayWeather(weather);
        } catch (error) {
            showError('Unable to fetch weather data. Please try again.');
        } finally {
            hideProgress();
        }
    } else {
        showError('Please enter a location.');
    }
});

async function fetchWeather(location) {
    const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=8cfd7ac38343404fb0710547250906&q=${location}`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    const weather = await response.json();
    await storeWeather(location, weather);
    return weather;
}

async function storeWeather(location, weather) {
    const db = await dbPromise;
    await db.put('locations', { name: location, data: weather });
}

async function getStoredWeather(location) {
    const db = await dbPromise;
    return await db.get('locations', location);
}

function displayWeather(weather) {
    const weatherInfo = document.getElementById('weather-info');
    weatherInfo.innerHTML = `
        <h2>${weather.location.name}</h2>
        <p>${weather.current.temp_c}°C, ${weather.current.condition.text}</p>
        <img src="${weather.current.condition.icon}" alt="Weather icon">
    `;
}

function showProgress() {
    document.getElementById('progress-bar').classList.remove('hidden');
}

function hideProgress() {
    document.getElementById('progress-bar').classList.add('hidden');
}

function showError(message) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.classList.remove('hidden');
    errorMessage.textContent = message;
}

function hideError() {
    const errorMessage = document.getElementById('error-message');
    errorMessage.classList.add('hidden');
    errorMessage.textContent = '';
}

// Register Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(() => console.log('Service Worker Registered'));
}
