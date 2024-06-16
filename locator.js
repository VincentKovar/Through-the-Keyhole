// Define global variables
let targetLocation = { latitude: 48.41890859784646, longitude: -122.33687234141873 };
let watchID = null;
let beepAudio = document.getElementById('beep-audio');
let distanceDisplay = document.getElementById('distance');
let instructionsDisplay = document.getElementById('instructions');
let previousDistance = null;
let beepInterval;
let facingCorrectDirection = false;
let currentLocation = { latitude: 0, longitude: 0 };  // Global to store current location

function startGame() {
    document.querySelector('button').style.display = 'none'; // Hide the start button
    watchID = navigator.geolocation.watchPosition(updatePosition, handleError, { enableHighAccuracy: true });
    window.addEventListener('deviceorientation', handleOrientation, true);
    console.log("Game started");
}

function updatePosition(position) {
    currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
    };
    console.log("Current location:", currentLocation);
    let distance = calculateDistance(currentLocation, targetLocation);
    distanceDisplay.textContent = `Distance to target: ${distance.toFixed(2)} meters`;

    if (distance < previousDistance || previousDistance === null) {
        adjustBeep(distance);
        adjustLogoBlink(distance);
    }

    previousDistance = distance;

    if (distance < 50) { // Show next button within 50 meters
        document.getElementById('next-container').style.display = 'block';
    }
}

function calculateDistance(loc1, loc2) {
    let R = 6371e3; // metres
    let φ1 = loc1.latitude * Math.PI / 180;
    let φ2 = loc2.latitude * Math.PI / 180;
    let Δφ = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    let Δλ = (loc2.longitude - loc1.longitude) * Math.PI / 180;

    let a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
}

function handleOrientation(event) {
    const alpha = event.alpha;
    const bearing = calculateBearing(currentLocation, targetLocation);
    facingCorrectDirection = Math.abs(alpha - bearing) <= 7;
    instructionsDisplay.textContent = facingCorrectDirection ? "Correct direction!" : "Adjust your direction.";
    adjustBeep(previousDistance); // Update beeping based on new orientation data
}

function calculateBearing(loc1, loc2) {
    let y = Math.sin(loc2.longitude - loc1.longitude) * Math.cos(loc2.latitude);
    let x = Math.cos(loc1.latitude) * Math.sin(loc2.latitude) - Math.sin(loc1.latitude) * Math.cos(loc2.latitude) * Math.cos(loc2.longitude - loc1.longitude);
    let bearing = Math.atan2(y, x) * (180 / Math.PI);
    bearing = (bearing + 360) % 360; // Normalize bearing
    return bearing;
}

function adjustBeep(distance) {
    clearInterval(beepInterval);
    let interval = distance < 25 ? 800 : distance < 50 ? 1000 : distance < 100 ? 1500 : distance < 200 ? 2000 : distance < 400 ? 3000 : 4000;
    beepInterval = setInterval(() => {
        if (facingCorrectDirection) {
            beepAudio.play();
            navigator.vibrate(200); // Haptic feedback
        }
    }, interval);
}

function adjustLogoBlink(distance) {
    let blinkRate = Math.max(0.5, 5 - distance / 80); // Adjust blink rate based on distance
    document.getElementById('logo').style.animation = `blink ${blinkRate}s steps(5, start) infinite`;
}

function handleError(error) {
    console.error("Error with geolocation: ", error);
    instructionsDisplay.textContent = "Unable to retrieve your location.";
}

function navigateToNext() {
    clearInterval(beepInterval);
    if (navigator.geolocation && watchID != null) {
        navigator.geolocation.clearWatch(watchID);
    }
    window.removeEventListener('deviceorientation', handleOrientation);
    window.location.href = 'slider.html';
}
