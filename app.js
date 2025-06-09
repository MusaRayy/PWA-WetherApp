const dbPromise = idb.openDB('weather-store', 1, {
    upgrade(db) {
        if (!db.objectStoreNames.contains('locations')) {
            db.createObjectStore('locations', { keyPath: 'name' });
        }
    }
});

document.getElementById('get-weather-btn').addEventListener('click', async () => {
    const location = document.getElementById('location-input').value.trim();
    if (location) {
        const weather = await fetchWeather(location);
        displayWeather(weather);
    } else {
        alert('Please enter a location.');
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

async function displayWeather(weather) {
    const weatherInfo = document.getElementById('weather-info');
    weatherInfo.innerHTML = `
        <h2>${weather.location.name}</h2>
        <p>${weather.current.temp_c}°C, ${weather.current.condition.text}</p>
        <img src="${weather.current.condition.icon}" alt="Weather icon">
    `;
}

// Register Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(() => console.log('Service Worker Registered'));
}
