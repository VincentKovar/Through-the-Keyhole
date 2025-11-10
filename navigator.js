// --- CONFIGURATION ---
const TARGET_LAT = 47.74269947016799;
const TARGET_LON = -122.17991178492984;
const EARTH_RADIUS_METERS = 6371000;
const COMPLETION_DISTANCE_METERS = 13.7; 

// --- DOM ELEMENTS (Includes the necessary debug/audio elements) ---
const startButton = document.getElementById('startButton');
const container = document.getElementById('navigationContainer');
const arrow = document.getElementById('arrow');
const distanceDisplay = document.getElementById('distanceDisplay');
const headingDisplay = document.getElementById('headingDisplay'); // New Debug Element
const beepAudio = document.getElementById('beepAudio'); 

// --- STATE ---
let deviceHeading = 0; 
let pulseInterval = null;
let watchID = null; 

// --- UTILITY FUNCTIONS (THE MATH) ---
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function getDistance(lat1, lon1, lat2, lon2) {
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_METERS * c; 
}

function getBearing(lat1, lon1, lat2, lon2) {
    lat1 = toRadians(lat1);
    lon1 = toRadians(lon1);
    lat2 = toRadians(lat2);
    lon2 = toRadians(lon2);
    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
              Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    let bearing = Math.atan2(y, x);
    bearing = bearing * (180 / Math.PI);
    return (bearing + 360) % 360;
}

// --- DEVICE HANDLERS ---
function handleOrientation(event) {
    // Captures the device's compass reading
    if (event.alpha !== null) {
        deviceHeading = event.alpha;
    } else if (event.webkitCompassHeading !== undefined) {
        deviceHeading = event.webkitCompassHeading; 
    }
}

function locationUpdate(position) {
    const currentLat = position.coords.latitude;
    const currentLon = position.coords.longitude;

    const distance = getDistance(currentLat, currentLon, TARGET_LAT, TARGET_LON);
    const targetBearing = getBearing(currentLat, currentLon, TARGET_LAT, TARGET_LON);
    
    // Arrow Rotation: Target Bearing minus Device Compass Heading (THE FIX)
    const rotationAngle = targetBearing - deviceHeading;
    arrow.style.transform = `rotate(${rotationAngle}deg)`;

    distanceDisplay.textContent = `Distance: ${distance.toFixed(1)} meters`;
    
    // **DEBUGGING OUTPUT**
    if (headingDisplay) {
        headingDisplay.innerHTML = `
            Compass (Alpha): ${deviceHeading.toFixed(1)}°<br>
            Rotation Angle: ${rotationAngle.toFixed(1)}°
        `;
    }
    
    if (distance < COMPLETION_DISTANCE_METERS) {
        triggerNextPuzzle();
    } else {
        controlFeedback(distance);
    }
}

function controlFeedback(distance) {
    if (pulseInterval) {
        clearInterval(pulseInterval);
    }

    let intervalTime = 0; 
    if (distance > 100) {
        intervalTime = 3000; 
    } else if (distance > 50) {
        intervalTime = 1500; 
    } else { 
        intervalTime = 500; 
    }
    
    pulseInterval = setInterval(() => {
        // Haptic Pulse (50ms)
        navigator.vibrate(50); 
        
        // Audio Beep Logic
        if (beepAudio) {
            beepAudio.currentTime = 0; 
            beepAudio.play().catch(e => {
                console.log("Audio play failed inside loop: " + e);
            });
        }
    }, intervalTime);
}

function triggerNextPuzzle() {
    if (watchID) navigator.geolocation.clearWatch(watchID);
    if (pulseInterval) clearInterval(pulseInterval);
    window.removeEventListener('deviceorientation', handleOrientation);

    navigator.vibrate(0); 
    if (beepAudio) beepAudio.pause();

    alert("Target Reached! Opening Next Puzzle...");
}

// --- INITIALIZATION (THE START GATE) ---
function startNavigation() {
    startButton.style.display = 'none';
    container.style.display = 'block';

    // 1. Initialize Geolocation
    const watchOptions = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };
    watchID = navigator.geolocation.watchPosition(locationUpdate, (error) => {
        distanceDisplay.textContent = `Error ${error.code}: ${error.message}. Location failed.`;
        console.error(error);
    }, watchOptions);

    // 2. Initialize Compass (Device Orientation) - INCLUDES MODERN PERMISSION CHECK
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(permissionState => {
            if (permissionState === 'granted') {
                window.addEventListener('deviceorientation', handleOrientation);
            } else {
                alert('Compass permission denied. Arrow will be unreliable.');
            }
        });
    } else {
        window.addEventListener('deviceorientation', handleOrientation);
    }

    // 3. **MAXIMUM COMPATIBILITY FIX**: Activate Haptics and Audio
    navigator.vibrate(50); // Initial activation pulse

    if (beepAudio) {
        beepAudio.play().then(() => {
            beepAudio.pause();
            beepAudio.currentTime = 0;
        }).catch(e => {
            console.log("Audio initialization blocked. Beep will not work. Error: " + e);
        });
    }
}

// Attach the main function to the start button
startButton.addEventListener('click', startNavigation);
