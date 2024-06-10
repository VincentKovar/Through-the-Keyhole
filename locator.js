let targetLocation = {
    latitude: 47.7426886199104, // Replace with your target latitude
    longitude: -122.1798975139412 // Replace with your target longitude
};

let watchID;
let compassNeedle = document.getElementById('needle');
let beepAudio = document.getElementById('beep-audio');
let previousDistance = null;

function startGame() {
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
}

function updatePosition(position) {
    let userLat = position.coords.latitude;
    let userLon = position.coords.longitude;
    let distance = calculateDistance(userLat, userLon, targetLocation.latitude, targetLocation.longitude);

    document.getElementById('distance').innerText = `Distance to target: ${distance.toFixed(2)} meters`;

    let beepRate = Math.max(1000, (distance / 100) * 1000);
    if (beepInterval) clearInterval(beepInterval);
    beepInterval = setInterval(() => beepAudio.play(), beepRate);

    if (distance < 10) {
        compassNeedle.style.backgroundColor = 'green';
        compassNeedle.classList.add('pulse');
    } else {
        compassNeedle.style.backgroundColor = 'red';
        compassNeedle.classList.remove('pulse');
    }
    previousDistance = distance;
}

function handleOrientation(event) {
    let alpha = event.alpha || 0;
    let adjustedAlpha = (alpha + 180) % 360;
    compassNeedle.style.transform = `translateX(-50%) rotate(${adjustedAlpha}deg)`;
}

function handleError(error) {
    console.error(error);
    document.getElementById('error-message').innerText = "Error getting location. Please try again.";
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    let R = 6371e3; // metres
    let φ1 = lat1 * Math.PI/180;
    let φ2 = lat2 * Math.PI/180;
    let Δφ = (lat2 - lat1) * Math.PI/180;
    let Δλ = (lon2 - lon1) * Math.PI/180;

    let a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}
