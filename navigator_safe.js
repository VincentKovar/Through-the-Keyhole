// --- CONFIGURATION ---
const TARGET_LAT = 47.74269947016799;
const TARGET_LON = -122.17991178492984;
const EARTH_RADIUS_METERS = 6371000;
const COMPLETION_DISTANCE_METERS = 13.7; // 15 yards is approx 13.7m

// --- DOM ELEMENTS ---
const startButton = document.getElementById('startButton');
const container = document.getElementById('navigationContainer');
const distanceDisplay = document.getElementById('distanceDisplay');
const feedbackDisplay = document.getElementById('feedbackDisplay'); // New element for Warmer/Colder
const beepAudio = document.getElementById('beepAudio'); 
const arrow = document.getElementById('arrow'); // Still grabbing the arrow to hide it

// --- STATE ---
let pulseInterval = null;
let watchID = null;
let lastDistance = Infinity; // Track the previous distance for warmer/colder logic

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

// --- DEVICE HANDLERS ---

// Main function that runs whenever a new GPS position is received.
function locationUpdate(position) {
    const currentLat = position.coords.latitude;
    const currentLon = position.coords.longitude;

    const currentDistance = getDistance(currentLat, currentLon, TARGET_LAT, TARGET_LON);
    
    // 1. **WARMER/COLDER LOGIC**
    if (currentDistance < lastDistance) {
        feedbackDisplay.textContent = "Getting CLOSER! 🔥";
        feedbackDisplay.style.color = 'green';
    } else if (currentDistance > lastDistance) {
        feedbackDisplay.textContent = "Moving AWAY! 🥶";
        feedbackDisplay.style.color = 'red';
    } else {
        feedbackDisplay.textContent = "Holding Steady...";
        feedbackDisplay.style.color = 'gray';
    }
    
    // Update the last distance for the next check
    lastDistance = currentDistance; 

    // 2. DISTANCE DISPLAY AND COMPLETION
    distanceDisplay.textContent = `Distance: ${currentDistance.toFixed(1)} meters`;
    
    if (currentDistance < COMPLETION_DISTANCE_METERS) {
        triggerNextPuzzle();
    } else {
        controlFeedback(currentDistance);
    }
}

// **AGRESSIVE FIX for Missing Haptic/Beep**: Adjusts frequency of feedback based on distance.
function controlFeedback(distance) {
    if (pulseInterval) {
        clearInterval(pulseInterval);
    }

    let intervalTime = 0; // in milliseconds

    // Speed up pulse as we get closer
    if (distance > 100) {
        intervalTime = 3000; 
    } else if (distance > 50) {
        intervalTime = 1500; 
    } else { 
        intervalTime = 500; 
    }
    
    pulseInterval = setInterval(() => {
        // Haptic Pulse (50ms) - Vibrate API is usually available
        navigator.vibrate(50); 
        
        // Audio Beep Logic (If browser allowed activation)
        if (beepAudio) {
            beepAudio.currentTime = 0; 
            beepAudio.play().catch(e => {
                console.log("Periodic Audio blocked by browser.");
            });
        }
    }, intervalTime);
}

function triggerNextPuzzle() {
    // Clear all running processes
    if (watchID) navigator.geolocation.clearWatch(watchID);
    if (pulseInterval) clearInterval(pulseInterval);
    
    // Stop haptic/audio
    navigator.vibrate(0); 
    if (beepAudio) beepAudio.pause();

    alert("Target Reached! Opening Next Puzzle...");
}

// --- INITIALIZATION (THE START GATE) ---

function startNavigation() {
    startButton.style.display = 'none';
    container.style.display = 'block';
    if (arrow) arrow.style.display = 'none'; // Hide the arrow as it's no longer useful

    // 1. Initialize Geolocation
    const watchOptions = {
        enableHighAccuracy: true,
        timeout: 15000, 
        maximumAge: 0 
    };

    watchID = navigator.geolocation.watchPosition(
        locationUpdate, 
        (error) => {
            distanceDisplay.textContent = `Error ${error.code}: ${error.message}. Location failed.`;
            console.error(error);
        }, 
        watchOptions
    );

    // 2. **AGRESSIVE FIX**: Activate Haptics and Audio (Requires user gesture)
    navigator.vibrate(100); // Noticeable pulse to activate API

    if (beepAudio) {
        beepAudio.play().then(() => {
            beepAudio.pause();
            beepAudio.currentTime = 0;
            // Success! This initial play satisfies browser requirements for subsequent plays.
        }).catch(e => {
            console.log("Audio initialization blocked. Beep may not work.");
        });
    }
}

// Attach the main function to the start button
startButton.addEventListener('click', startNavigation);
