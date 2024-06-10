let targetLocation = {
    latitude: 47.7426886199104, // Replace with your target latitude
    longitude: -122.1798975139412 // Replace with your target longitude
};
let beepInterval;
let watchID;
let compassNeedle = document.getElementById('needle');
let previousDistance = null;
let beepAudio;

function startGame() {
    beepAudio = new Audio('beep.mp3');
    if (navigator.geolocation) {
        watchID = navigator.geolocation.watchPosition(updatePosition, handleError, { enableHighAccuracy: false });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleOrientation, true);
    } else {
        alert("Device orientation is not supported by this browser.");
    }
}

function stopGame() {
    if (navigator.geolocation) {
        navigator.geolocation.clearWatch(watchID);
        clearInterval(beepInterval);
        beepAudio.pause();
        beepAudio.currentTime = 0;
    }
    if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation, true);
    }
}

function updatePosition(position) {
    let userLat = position.coords.latitude;
    let userLon = position.coords.longitude;
    let distance = calculateDistance(userLat, userLon, targetLocation.latitude, targetLocation.longitude);

    document.getElementById('distance').textContent = `Distance to target: ${distance.toFixed(2)} meters`;

    if (previousDistance !== null && distance < previousDistance) {
        beepAudio.volume = Math.min(1, beepAudio.volume + 0.1); // Increase volume when moving towards the target
    } else {
        beepAudio.volume = Math.max(0.2, beepAudio.volume - 0.1); // Decrease volume
