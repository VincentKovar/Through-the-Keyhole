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
        beepAudio.volume = Math.max(0.2, beepAudio.volume - 0.1); // Decrease volume when moving away from the target
    }
    previousDistance = distance;

    let interval = calculateBeepInterval(distance);
    updateBeeping(interval);

    updateCompass(position.coords.heading);
}

function handleError(error) {
    console.error("Error obtaining geolocation", error);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2 - lat1) * Math.PI/180;
    const Δλ = (lon2 - lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
}

function calculateBeepInterval(distance) {
    if (distance < 50) return 200; // 0-50 meters
    if (distance < 100) return 400; // 50-100 meters
    if (distance < 200) return 600; // 100-200 meters
    if (distance < 500) return 1000; // 200-500 meters
    return 2000; // 500+ meters
}

function updateBeeping(interval) {
    if (beepInterval) clearInterval(beepInterval);
    beepInterval = setInterval(() => beepAudio.play(), interval);
}

function updateCompass(heading) {
    if (typeof heading === 'number') {
        compassNeedle.style.transform = `rotate(${heading}deg)`;

        // Check if the device is facing towards the target direction
        let bearing = calculateBearing(targetLocation.latitude, targetLocation.longitude);
        if (Math.abs(heading - bearing) <= 10) {
            compassNeedle.style.backgroundColor = 'green';
            compassNeedle.classList.add('pulse');
        } else {
            compassNeedle.style.backgroundColor = 'red';
            compassNeedle.classList.remove('pulse');
        }
    }
}

function handleOrientation(event) {
    if (event.alpha !== null) {
        let alpha = event.alpha; // Compass direction in degrees
        updateCompass(alpha);
    }
}

function calculateBearing(targetLat, targetLon) {
    let userLat = targetLat; // Replace with user's latitude if available
    let userLon = targetLon; // Replace with user's longitude if available

    let φ1 = userLat * Math.PI / 180;
    let φ2 = targetLat * Math.PI / 180;
    let Δλ = (targetLon - userLon) * Math.PI / 180;

    let y = Math.sin(Δλ) * Math.cos(φ2);
    let x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    bearing = (bearing + 360) % 360; // Normalize bearing to 0-360 degrees
    return bearing;
}
