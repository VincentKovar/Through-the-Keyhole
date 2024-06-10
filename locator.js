let targetLocation = {
    latitude: 48.41888808828569,
    longitude: -122.33687937826562
};
let watchID;
let beepAudio;
let logo = document.getElementById('logo');
let distanceDisplay = document.getElementById('distance');
let instructionsDisplay = document.getElementById('instructions');
let previousDistance = null;

function startGame() {
    beepAudio = document.getElementById('beep-audio');
    if (navigator.geolocation) {
        watchID = navigator.geolocation.watchPosition(updatePosition, handleError, { enableHighAccuracy: true });
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
    }
    if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation);
    }
    clearInterval(beepInterval);
    beepAudio.pause();
    beepAudio.currentTime = 0;
    logo.style.animationDuration = "1s";
}

function updatePosition(position) {
    let currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
    };

    let distance = calculateDistance(currentLocation, targetLocation);
    distanceDisplay.textContent = `Distance to target: ${distance.toFixed(2)} meters`;

    if (distance < previousDistance || previousDistance === null) {
        adjustBeep(distance);
        adjustLogoBlink(distance);
    }

    previousDistance = distance;
}

function calculateDistance(loc1, loc2) {
    let R = 6371e3; // metres
    let φ1 = loc1.latitude * Math.PI/180; // φ, λ in radians
    let φ2 = loc2.latitude * Math.PI/180;
    let Δφ = (loc2.latitude-loc1.latitude) * Math.PI/180;
    let Δλ = (loc2.longitude-loc1.longitude) * Math.PI/180;

    let a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    let d = R * c; // in metres
    return d;
}

function handleOrientation(event) {
    let alpha = event.alpha || 0; // Compass direction in degrees
    let adjustedAlpha = (alpha + 180) % 360; // Adjust for holding phone in front
    let directionToTarget = calculateBearing(event.latitude, event.longitude, targetLocation.latitude, targetLocation.longitude);

    if (Math.abs(adjustedAlpha - directionToTarget) < 10) {
        instructionsDisplay.textContent = "You're facing the right direction!";
        logo.style.animationDuration = "0.5s";
        beepAudio.play();
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
    } else {
        instructionsDisplay.textContent = "Adjust your direction.";
        logo.style.animationDuration = "1s";
        beepAudio.pause();
    }
}

function calculateBearing(lat1, lon1, lat2, lon2) {
    let φ1 = lat1 * Math.PI/180; // φ, λ in radians
    let φ2 = lat2 * Math.PI/180;
    let λ1 = lon1 * Math.PI/180;
    let λ2 = lon2 * Math.PI/180;
    let y = Math.sin(λ2-λ1) * Math.cos(φ2);
    let x = Math.cos(φ1)*Math.sin(φ2) -
            Math.sin(φ1)*Math.cos(φ2)*Math.cos(λ2-λ1);
    let θ = Math.atan2(y, x);
    let bearing = (θ*180/Math.PI + 360) % 360; // in degrees
    return bearing;
}

function adjustBeep(distance) {
    let rate = Math.max(1, 100 - distance / 10); // Adjust the rate based on distance
    beepAudio.playbackRate = rate;
    beepAudio.volume = Math.min(1, 1 / distance); // Adjust the volume based on distance
    beepAudio.play();
}

function adjustLogoBlink(distance) {
    let blinkRate = Math.max(0.5, 5 - distance / 20); // Adjust the blink rate based on distance
    logo.style.animationDuration = `${blinkRate}s`;
}

function handleError(error) {
    console.error("Error with geolocation: ", error);
    instructionsDisplay.textContent = "Unable to retrieve your location.";
}
