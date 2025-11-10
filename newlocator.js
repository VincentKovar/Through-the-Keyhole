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
// Assuming you add this to navtest.html: <audio id="beepAudio" src="beep.mp3" preload="auto"></audio>
const beepAudio = document.getElementById('beepAudio'); 

// --- STATE ---
let deviceHeading = 0; // The mobile device's current compass heading (0-360)
let pulseInterval = null;
let watchID = null; 

// --- UTILITY FUNCTIONS (THE MATH) ---

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// Haversine Formula (Calculates distance in meters)
function getDistance(lat1, lon1, lat2, lon2) {
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_METERS * c; 
}

// Calculates Bearing (Angle from current location to target)
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

// **FIX for Wonky Arrow**: Capture the device's actual compass heading
function handleOrientation(event) {
    // 'alpha' is the standard compass heading, but we check for the older webkit property as a fallback.
    if (event.alpha !== null) {
        deviceHeading = event.alpha;
    } else if (event.webkitCompassHeading !== undefined) {
        deviceHeading = event.webkitCompassHeading; // iOS fallback for some older devices
    }
}

// Main function that runs whenever a new GPS position is received.
function locationUpdate(position) {
    const currentLat = position.coords.latitude;
    const currentLon = position.coords.longitude;

    const distance = getDistance(currentLat, currentLon, TARGET_LAT, TARGET_LON);
    const targetBearing = getBearing(currentLat, currentLon, TARGET_LAT, TARGET_LON);
    
    // **FIX for Wonky Arrow**: Arrow Rotation logic
    // Subtract the device's orientation (compass heading) to correct the visual direction.
    const rotationAngle = targetBearing - deviceHeading;
    arrow.style.transform = `rotate(${rotationAngle}deg)`;

    // 2. FEEDBACK AND COMPLETION
    distanceDisplay.textContent = `Distance: ${distance.toFixed(1)} meters`;
    
    if (distance < COMPLETION_DISTANCE_METERS) {
        triggerNextPuzzle();
    } else {
        controlFeedback(distance);
    }
}

// **FIX for Missing Haptic/Beep**: Adjusts frequency of feedback based on distance.
function controlFeedback(distance) {
    if (pulseInterval) {
        clearInterval(pulseInterval);
    }

    let intervalTime = 0; // in milliseconds

    if (distance > 100) {
        intervalTime = 3000; 
    } else if (distance > 50) {
        intervalTime = 1500; 
    } else { // Close range (50m - 13.7m)
        intervalTime = 500; 
    }
    
    pulseInterval = setInterval(() => {
        // Haptic Pulse (50ms)
        navigator.vibrate(50); 
        
        // Audio Beep Logic (Requires beep.mp3 and audio tag in HTML)
        if (beepAudio) {
            // Reset and play the sound to sync with the pulse
            beepAudio.currentTime = 0; 
            beepAudio.play().catch(e => console.log("Audio play failed, may need user interaction: " + e));
        }
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
    if (beepAudio) beepAudio.pause();

    // Redirect the player
    alert("Target Reached! Opening Next Puzzle...");
    // window.location.href = "next_puzzle.html"; 
}

// --- INITIALIZATION (THE START GATE) ---

function startNavigation() {
    startButton.style.display = 'none';
    container.style.display = 'block';

    // 1. Initialize Geolocation with High Accuracy
    const watchOptions = {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout for better stability
        maximumAge: 0 
    };

    watchID = navigator.geolocation.watchPosition(
        locationUpdate, 
        (error) => {
            distanceDisplay.textContent = `Error ${error.code}: ${error.message}. Ensure location is enabled and you are using HTTPS.`;
            console.error(error);
        }, 
        watchOptions
    );

    // 2. Initialize Compass (Device Orientation)
    // NOTE: On Android, this usually works without a permission prompt, but we check for iOS compatibility just in case.
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation);
                } else {
                    alert('Compass permission denied. Arrow direction will be unreliable.');
                }
            });
    } else {
        window.addEventListener('deviceorientation', handleOrientation);
    }

    // 3. **FIX for Missing Haptic/Beep**: Activate Haptics and Audio
    // Runs inside the user-driven button click to satisfy security requirements.
    navigator.vibrate(50); // Initial activation pulse

    if (beepAudio) {
        beepAudio.play().then(() => {
            beepAudio.pause();
            beepAudio.currentTime = 0;
        }).catch(e => {
            console.log("Audio initialization failed. Sound may not work.");
            // Hide the error, but alert the user if needed: alert("Tap failed to initialize sound!");
        });
    }
}

// Attach the main function to the start button
startButton.addEventListener('click', startNavigation);
