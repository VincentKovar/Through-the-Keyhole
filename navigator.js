// --- CONFIGURATION ---
const TARGET_LAT = 47.74269947016799;
const TARGET_LON = -122.17991178492984;
const EARTH_RADIUS_METERS = 6371000;
const COMPLETION_DISTANCE_METERS = 13.7; // 15 yards is approx 13.7m

// --- DOM ELEMENTS ---
const startButton = document.getElementById('startButton');
const container = document.getElementById('navigationContainer');
const arrow = document.getElementById('arrow');
const distanceDisplay = document.getElementById('distanceDisplay');

// --- STATE ---
let deviceHeading = 0; // The mobile device's current compass heading (0-360)
let pulseInterval = null;
let watchID = null; // Variable to store the watch position ID

// --- UTILITY FUNCTIONS (THE MATH) ---

// 1. Convert Degrees to Radians
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// 2. Haversine Formula (Calculates distance in meters)
function getDistance(lat1, lon1, lat2, lon2) {
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_METERS * c; // Distance in meters
}

// 3. Calculates Bearing (Angle from current location to target)
function getBearing(lat1, lon1, lat2, lon2) {
    lat1 = toRadians(lat1);
    lon1 = toRadians(lon1);
    lat2 = toRadians(lat2);
    lon2 = toRadians(lon2);

    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
              Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    let bearing = Math.atan2(y, x);
    
    // Convert bearing to degrees and normalize to 0-360
    bearing = bearing * (180 / Math.PI);
    return (bearing + 360) % 360;
}

// --- MAIN LOGIC ---

// Updates the DeviceHeading based on compass sensor.
function handleOrientation(event) {
    // Standard property for compass heading. Fallback for older iOS is sometimes needed 
    // but we prioritize the standard alpha property.
    if (event.alpha !== null) {
        deviceHeading = event.alpha;
    }
}

// Main function that runs whenever a new GPS position is received.
function locationUpdate(position) {
    const currentLat = position.coords.latitude;
    const currentLon = position.coords.longitude;

    const distance = getDistance(currentLat, currentLon, TARGET_LAT, TARGET_LON);
    const targetBearing = getBearing(currentLat, currentLon, TARGET_LAT, TARGET_LON);
    
    // 1. ARROW ROTATION (The Fix: Target Bearing minus Device Compass Heading)
    const rotationAngle = targetBearing - deviceHeading;
    arrow.style.transform = `rotate(${rotationAngle}deg)`;

    // 2. FEEDBACK AND COMPLETION
    distanceDisplay.textContent = `Distance: ${distance.toFixed(1)} meters`;
    
    if (distance < COMPLETION_DISTANCE_METERS) {
        // SUCCESS: Trigger Next Puzzle
        triggerNextPuzzle();
    } else {
        // CONTROL HAPTIC/AUDIO FEEDBACK
        controlFeedback(distance);
    }
}

// Adjusts the frequency of the haptic pulse and sound based on distance.
function controlFeedback(distance) {
    // Clear any existing interval to adjust speed
    if (pulseInterval) {
        clearInterval(pulseInterval);
    }

    let intervalTime = 0; // in milliseconds

    // Slow ( > 100m)
    if (distance > 100) {
        intervalTime = 3000; 
    } 
    // Medium (100m - 50m)
    else if (distance > 50) {
        intervalTime = 1500; 
    } 
    // Fast (50m - 13.7m)
    else {
        intervalTime = 500; 
    }
    
    // Set a new interval for the haptic pulse 
    pulseInterval = setInterval(() => {
        // Vibrate for 100ms (The Haptic Pulse)
        navigator.vibrate(100); 
        // NOTE: Your custom audio playback would go here to sync with the pulse.
    }, intervalTime);
}

// Final action when target is reached.
function triggerNextPuzzle() {
    // Clear all running processes
    if (watchID) {
        navigator.geolocation.clearWatch(watchID);
    }
    if (pulseInterval) {
        clearInterval(pulseInterval);
    }
    window.removeEventListener('deviceorientation', handleOrientation);

    // Stop haptic/audio
    navigator.vibrate(0); 

    // Redirect the player
    alert("Target Reached! Opening Next Puzzle...");
    // If you have a file called next_puzzle.html:
    // window.location.href = "next_puzzle.html"; 
}

// --- INITIALIZATION (THE START GATE) ---

function startNavigation() {
    startButton.style.display = 'none';
    container.style.display = 'block';

    // 1. Initialize Geolocation
    const watchOptions = {
        // CRUCIAL: Request high accuracy for better results
        enableHighAccuracy: true,
        timeout: 10000, 
        maximumAge: 0 
    };

    // Start the location tracking
    watchID = navigator.geolocation.watchPosition(
        locationUpdate, 
        (error) => {
            distanceDisplay.textContent = `Error: ${error.message}. Please ensure location and HTTPS are used.`;
            console.error(error);
        }, 
        watchOptions
    );

    // 2. Initialize Compass (Device Orientation)
    window.addEventListener('deviceorientation', handleOrientation);

    // 3. Initialize Haptics (To gain permission)
    // Runs inside the user-driven button click, which is the most reliable way.
    navigator.vibrate(0); // Silent initialization pulse
    
    // NOTE: If using an Audio element, initialize it here as well (e.g., audio.play(); audio.pause();)
}

// Attach the main function to the start button
startButton.addEventListener('click', startNavigation);
