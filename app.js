// IndexedDB setup
const dbPromise = idb.openDB('weather-store', 1, {
    upgrade(db) {
        if (!db.objectStoreNames.contains('locations')) {
            db.createObjectStore('locations', {keyPath: 'name'});
        }
    }
});

// Capture the beforeinstallprompt event
let deferredPrompt;
const installModal = document.getElementById('install-modal');
const installButton = document.getElementById('install-pwa-btn');
const closeModal = document.getElementById('close-modal');

const historyModal = document.getElementById('history-modal');
const closeHistoryModal = document.getElementById('close-history-modal');
const historyGrid = document.getElementById('history-grid');

// Clear input button functionality
const clearInputButton = document.getElementById('clear-input-btn');
const locationInput = document.getElementById('location-input');

clearInputButton.addEventListener('click', () => {
    locationInput.value = '';
    clearInputButton.style.display = 'none';
});

// Show clear button when input is focused and has text
locationInput.addEventListener('input', () => {
    clearInputButton.style.display = locationInput.value ? 'block' : 'none';
});

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installModal.style.display = 'block'; // Show the install modal
});

// Close the modals
closeModal.addEventListener('click', () => {
    installModal.style.display = 'none';
});

closeHistoryModal.addEventListener('click', () => {
    historyModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === installModal) {
        installModal.style.display = 'none';
    }
    if (e.target === historyModal) {
        historyModal.style.display = 'none';
    }
});

installButton.addEventListener('click', () => {
    installModal.style.display = 'none';
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
            clearInputButton.style.display = 'none'; // Hide clear button after fetching data
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
    await db.put('locations', {name: location, data: weather});
}

async function getStoredWeather() {
    const db = await dbPromise;
    return await db.getAll('locations');
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

async function showStoredData() {
    const locations = await getStoredWeather();
    if (!locations.length) {
        alert('No stored weather data available.');
        return;
    }

    historyGrid.innerHTML = '';
    locations.forEach(location => {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
            <h3>${location.name}</h3>
            <p>${location.data.current.temp_c}°C</p>
            <p>${location.data.current.condition.text}</p>
            <img src="${location.data.current.condition.icon}" alt="Weather icon">
        `;
        historyGrid.appendChild(card);
    });

    historyModal.style.display = 'block';
}

// Register Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(() => console.log('Service Worker Registered'));
}
