let targetLocation = {
    latitude: 47.8105591297596, // Replace with your target latitude
    longitude: -122.36506298761152 // Replace with your target longitude
};
let beepInterval;
let beepAudio = new Audio('beep.mp3');
let watchID;
let compassNeedle = document.getElementById('needle');
let previousDistance = null;

function startGame() {
    if (navigator.geolocation) {
        watchID = navigator.geolocation.watchPosition(updatePosition, handleError, { enableHighAccuracy: true });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function stopGame() {
    if (navigator.geolocation) {
        navigator.geolocation.clearWatch(watchID);
        clearInterval(beepInterval);
        beepAudio.pause();
        beepAudio.currentTime = 0;
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

        // Check if the device is facing SSE (150-210 degrees)
        if (heading >= 150 && heading <= 210) {
            compassNeedle.style.backgroundColor = 'green';
        } else {
            compassNeedle.style.backgroundColor = 'red';
        }
    }
}
