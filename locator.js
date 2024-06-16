// Define global variables
let targetLocation = { latitude: 48.41890859784646, longitude: -122.33687234141873 };
let watchID = null;
let beepAudio = document.getElementById('beep-audio');
let distanceDisplay = document.getElementById('distance');
let instructionsDisplay = document.getElementById('instructions');
let previousDistance = null;
let beepInterval;
let facingCorrectDirection = false;

function startGame() {
    document.querySelector('button').style.display = 'none'; // Hide the start button
    watchID = navigator.geolocation.watchPosition(updatePosition, handleError, { enableHighAccuracy: true });
    window.addEventListener('deviceorientation', handleOrientation, true);
    console.log("Game started");
}

function updatePosition(position) {
    let currentLocation = {
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
    // Add orientation handling logic here
}

function adjustBeep(distance) {
    // Adjust the beep frequency based on distance
}

function adjustLogoBlink(distance) {
    // Adjust logo blink rate based on proximity
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
