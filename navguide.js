document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURATION ---
  const TARGET_LAT = 47.74269947016799;
  const TARGET_LON = -122.17991178492984;
  const EARTH_RADIUS_METERS = 6371000;
  const COMPLETION_DISTANCE_METERS = 15;

  // --- DOM ELEMENTS ---
  const startButton = document.getElementById("startButton");
  const container = document.getElementById("navigationContainer");
  const arrow = document.getElementById("arrow");
  const distanceDisplay = document.getElementById("distanceDisplay");
  const compassButton = document.getElementById("compassPermissionButton");
  const beepAudio = document.getElementById("beepAudio");

  // --- STATE ---
  let deviceHeading = 0;
  let pulseInterval = null;

  // --- MATH FUNCTIONS ---
  function toRadians(deg) { return deg * Math.PI / 180; }
  function toDegrees(rad) { return rad * 180 / Math.PI; }

  function getDistance(lat1, lon1, lat2, lon2) {
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_METERS * c;
  }

  function getBearing(lat1, lon1, lat2, lon2) {
    const dLon = toRadians(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRadians(lat2));
    const x = Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
              Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLon);
    return (toDegrees(Math.atan2(y, x)) + 360) % 360;
  }

  // --- DEVICE HANDLERS ---
  function handleOrientation(event) {
    if (event.webkitCompassHeading !== undefined) {
      deviceHeading = event.webkitCompassHeading;
    } else if (event.alpha !== null) {
      deviceHeading = event.alpha;
    }
  }

  function locationUpdate(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const distance = getDistance(lat, lon, TARGET_LAT, TARGET_LON);
    const bearing = getBearing(lat, lon, TARGET_LAT, TARGET_LON);
    const rotation = (bearing - deviceHeading + 360) % 360;

    arrow.style.transform = `rotate(${rotation}deg)`;
    distanceDisplay.textContent = `Distance: ${distance.toFixed(1)} meters`;

    if (distance < COMPLETION_DISTANCE_METERS) {
      triggerNextClue();
    } else {
      controlFeedback(distance);
    }
  }

  function controlFeedback(distance) {
    if (pulseInterval) clearInterval(pulseInterval);
    const interval = (distance > 100) ? 3000 : (distance > 50) ? 1500 : 500;
    pulseInterval = setInterval(() => {
      navigator.vibrate(50);
      if (beepAudio) {
        beepAudio.currentTime = 0;
        beepAudio.play().catch(() => {});
      }
    }, interval);
  }

  function triggerNextClue() {
    alert("You've reached the building! Here's your next clue.");
    if (pulseInterval) clearInterval(pulseInterval);
  }

  function activateCompass() {
    compassButton.style.display = "none";
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission().then(response => {
        if (response === "granted") {
          window.addEventListener("deviceorientation", handleOrientation);
        } else {
          alert("Compass permission denied.");
        }
      });
    } else {
      window.addEventListener("deviceorientation", handleOrientation);
    }
  }

  function startNavigation() {
    startButton.style.display = "none";
    container.style.display = "block";

    navigator.geolocation.watchPosition(locationUpdate, err => {
      distanceDisplay.textContent = `Location error: ${err.message}`;
    }, { enableHighAccuracy: true });

    navigator.vibrate(50);
    if (beepAudio) {
      beepAudio.play().then(() => {
        beepAudio.pause();
        beepAudio.currentTime = 0;
      }).catch(() => {});
    }
  }

  // --- EVENT LISTENERS ---
  startButton.addEventListener("click", startNavigation);
  compassButton.addEventListener("click", activateCompass);
});
