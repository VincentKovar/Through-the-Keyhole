// --- CONFIGURATION ---
const TARGET_LAT = 47.74269947016799;
const TARGET_LON = -122.17991178492984;
const EARTH_RADIUS_METERS = 6371000;
const COMPLETION_DISTANCE_METERS = 13.7; 

// --- DOM ELEMENTS ---
const startButton = document.getElementById('startButton');
const container = document.getElementById('navigationContainer');
const arrow = document.getElementById('arrow');
const distanceDisplay = document.getElementById('distanceDisplay');
const headingDisplay = document.getElementById('headingDisplay'); 
const compassButton = document.getElementById('compassPermissionButton'); // NEW BUTTON
const beepAudio = document.getElementById('beepAudio'); 

// --- STATE ---
let deviceHeading = 0; 
let pulseInterval = null;
let watchID = null; 

// --- MATH FUNCTIONS (Unchanged) ---
function toRadians(degrees) { return degrees * (Math.PI / 180); }
function getDistance(lat1, lon1, lat2, lon2) { /* ... math ... */ }
function getBearing(lat1, lon1, lat2, lon2) { /* ... math ... */ }

// --- DEVICE HANDLERS ---
function handleOrientation(event) {
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
    
    const rotationAngle = targetBearing - deviceHeading;
    arrow.style.transform = `rotate(${rotationAngle}deg)`;

    distanceDisplay.textContent = `Distance: ${distance.toFixed(1)} meters`;
    
    // DEBUGGING OUTPUT
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
    // Logic for intervalTime based on distance remains here...
    if (pulseInterval) clearInterval(pulseInterval);

    let intervalTime = (distance > 100) ? 3000 : (distance > 50) ? 1500 : 500;
    
    pulseInterval = setInterval(() => {
        navigator.vibrate(50); 
        if (beepAudio) {
            beepAudio.currentTime = 0; 
            beepAudio.play().catch(e => console.log("Audio play failed inside loop: " + e));
        }
    }, intervalTime);
}

function triggerNextPuzzle() { /* ... unchanged ... */ }

// --- DEDICATED COMPASS ACTIVATION FUNCTION ---
function activateCompass() {
    compassButton.style.display = 'none'; // Hide button after press

    // 1. **MODERN iOS/Android Permission Check**
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(permissionState => {
            if (permissionState === 'granted') {
                window.addEventListener('deviceorientation', handleOrientation);
                alert('Compass enabled! The arrow should now work.');
            } else {
                alert('Compass permission denied. Arrow will be unreliable.');
            }
        });
    } else {
        // 2. **Standard Activation (For most Android versions)**
        window.addEventListener('deviceorientation', handleOrientation);
        alert('Compass activated (Standard Method). Try rotating your phone.');
    }
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

    // 2. Initial Haptics and Audio Activation
    navigator.vibrate(50); 
    if (beepAudio) {
        beepAudio.play().then(() => {
            beepAudio.pause();
            beepAudio.currentTime = 0;
        }).catch(e => console.log("Audio initialization blocked."));
    }
    
    // 3. Compass is NOT automatically activated here. It's done via the separate button.
}

// Attach the main functions
startButton.addEventListener('click', startNavigation);
compassButton.addEventListener('click', activateCompass);
