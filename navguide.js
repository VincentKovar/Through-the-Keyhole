<script>
const TARGET_LAT = 47.74269947016799;
const TARGET_LON = -122.17991178492984;
const COMPLETION_DISTANCE_METERS = 15;
const EARTH_RADIUS_METERS = 6371000;

let deviceHeading = 0;
let watchID = null;
let pulseInterval = null;

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

  document.getElementById("arrow").style.transform = `rotate(${rotation}deg)`;
  document.getElementById("distanceDisplay").textContent = `Distance: ${distance.toFixed(1)} meters`;

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
    const beep = document.getElementById("beepAudio");
    if (beep) {
      beep.currentTime = 0;
      beep.play().catch(() => {});
    }
  }, interval);
}

function triggerNextClue() {
  alert("You've reached the building! Here's your next clue.");
  if (pulseInterval) clearInterval(pulseInterval);
}

function activateCompass() {
  const button = document.getElementById("compassPermissionButton");
  button.style.display = "none";

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
  document.getElementById("startButton").style.display = "none";
  document.getElementById("navigationContainer").style.display = "block";

  navigator.geolocation.watchPosition(locationUpdate, err => {
    document.getElementById("distanceDisplay").textContent = `Location error: ${err.message}`;
  }, { enableHighAccuracy: true });

  activateCompass(); // Optional: auto-activate if gesture already occurred
}

document.getElementById("startButton").addEventListener("click", startNavigation);
document.getElementById("compassPermissionButton").addEventListener("click", activateCompass);
</script>
