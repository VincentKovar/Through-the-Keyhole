let targetLocation = {
    latitude: 47.7426886199104, // Replace with your target latitude
    longitude: -122.1798975139412 // Replace with your target longitude
};
let beepInterval;
let watchID;
let arrow = document.getElementById('arrow');
let previousDistance = null;
let beepAudio;
let isWalkingCorrectly = false;

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
    document.getElementById('startButton').disabled = true;
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
    document.getElementById('startButton').disabled = false;
}

