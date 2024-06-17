// Define global variables
let targetLocation = { latitude: 48.41890859784646, longitude: -122.33687234141873 };
let watchID = null;
let beepAudio = document.getElementById('beep-audio');
let distanceDisplay = document.getElementById('distance');
let instructionsDisplay = document.getElementById('instructions');
let previousDistance = null;
let beepInterval;
let facingCorrectDirection = false;
let currentLocation = { latitude: 0, longitude: 0 };

// Function to calculate distance between two coordinates
function calculateDistance(loc1, loc2) {
  // Haversine formula implementation
}

// Function to calculate bearing between two coordinates
function calculateBearing(loc1, loc2) {
  // Implementation
}

// Function to handle device orientation
function handleOrientation(event) {
  const alpha = event.alpha;
  const bearing = calculateBearing(currentLocation, targetLocation);
  facingCorrectDirection = Math.abs(alpha - bearing) <= 8;
  instructionsDisplay.textContent = facingCorrectDirection ? "Correct direction!" : "Adjust your direction.";
  adjustBeep(previousDistance); // Update beeping based on new orientation data
}

// Function to adjust beeping frequency based on distance
function adjustBeep(distance) {
  clearInterval(beepInterval);
  let interval = distance < 25 ? 800 : distance < 500 ? 4000 : 4000;
  beepInterval = setInterval(() => {
    if (facingCorrectDirection) {
      beepAudio.play();
      navigator.vibrate(200); // Haptic feedback
    }
  }, interval);
}

// Function to update position and display distance
function updatePosition(position) {
  currentLocation = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude
  };
  let distance = calculateDistance(currentLocation, targetLocation);
  distanceDisplay.textContent = `Distance to target: ${distance.toFixed(2)} meters`;

  if (distance < previousDistance || previousDistance === null) {
    adjustBeep(distance);
  }

  previousDistance = distance;

  if (distance < 25) { // Show stop button within 25 meters
    document.getElementById('stop-button').style.display = 'block';
  }
}

// Function to handle errors
function handleError(error) {
  console.error("Error with geolocation: ", error);
  instructionsDisplay.textContent = "Unable to retrieve your location.";
}

// Function to navigate to slider.html
function navigateToNext() {
  window.location.href = 'slider.html';
}

// Add event listeners
document.getElementById('stop-button').addEventListener('click', navigateToNext);
document.getElementById('logo').addEventListener('click', () => {
  if (event.detail === 3) { // Cheat code: triple-click logo to navigate to slider.html
    navigateToNext();
  }
});

// Start game
startGame();
// Initialize the game UI
document.getElementById('distance').textContent = 'Distance to target: --';
document.getElementById('instructions').textContent = 'Start the game to begin';

// Hide the stop button initially
document.getElementById('stop-button').style.display = 'none';
