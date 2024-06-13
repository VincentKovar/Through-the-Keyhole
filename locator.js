let targetLocation = {
    latitude: 47.7428185240591,
    longitude: -122.17928062009655
};
let watchID;
let beepAudio = document.getElementById('beep-audio');
let logo = document.getElementById('logo');
let distanceDisplay = document.getElementById('distance');
let instructionsDisplay = document.getElementById('instructions');
let previousDistance = null;
let beepInterval; // Add a variable for the beep interval
let facingCorrectDirection = false; // Add a variable to track if the user is facing the correct direction

function startGame() {
    if (navigator.geolocation) {
        watchID = navigator.geolocation.watchPosition(updatePosition, handleError, { enableHighAccuracy: true });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleOrientation, true);
    } else {
        alert("Device orientation is not supported by this browser.");
    }
    // Play audio and vibrate on user interaction
    if (beepAudio) {
        beepAudio.loop = false; // Set loop to false to control beeping manually
        beepAudio.play().catch(error => console.error("Audio play error:", error));
    }
    if (navigator.vibrate) {
        navigator.vibrate(200);
    }
    console.log("Game started");
}

function stopGame() {
    if (navigator.geolocation) {
        navigator.geolocation.clearWatch(watchID);
    }
    if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation);
    }
    if (beepAudio) {
        beepAudio.pause();
        beepAudio.currentTime = 0;
    }
    if (beepInterval) {
        clearInterval(beepInterval); // Clear the beep interval
    }
    if (logo) {
        logo.style.animationDuration = "1s";
        logo.style.animationName = "none";
    }
    console.log("Game stopped");
}

function updatePosition(position) {
    let currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
    };

    console.log("Current location:", currentLocation);

    let distance = calculateDistance(currentLocation, targetLocation);
    if (distanceDisplay) {
        distanceDisplay.textContent = `Distance to target: ${distance.toFixed(2)} meters`;
    }

    if (distance < previousDistance || previousDistance === null) {
        adjustBeep(distance);
        adjustLogoBlink(distance);
    }

    previousDistance = distance;
}

function calculateDistance(loc1, loc2) {
    let R = 6371e3; // metres
    let φ1 = loc1.latitude * Math.PI/180; // φ, λ in radians
    let φ2 = loc2.latitude * Math.PI/180;
    let Δφ = (loc2.latitude-loc1.latitude) * Math.PI/180;
    let Δλ = (loc2.longitude-loc1.longitude) * Math.PI/180;

    let a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    let d = R * c; // in metres
    return d;
}

function handleOrientation(event) {
    let alpha = event.alpha || 0; // Compass direction in degrees
    let adjustedAlpha = (alpha + 180) % 360; // Adjust for holding phone in front
    if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
        navigator.geolocation.getCurrentPosition(function(position) {
            let currentLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            let directionToTarget = calculateBearing(currentLocation.latitude, currentLocation.longitude, targetLocation.latitude, targetLocation.longitude);

            console.log("Alpha:", alpha);
            console.log("Direction to target:", directionToTarget);

            if (Math.abs(adjustedAlpha - directionToTarget) < 10) {
                if (instructionsDisplay) {
                    instructionsDisplay.textContent = "You're facing the right direction!";
                }
                if (logo) {
                    logo.classList.add('blink');
                }
                facingCorrectDirection = true;
                if (beepAudio) {
                    beepAudio.play().catch(error => console.error("Audio play error:", error));
                }
                if (navigator.vibrate) {
                    navigator.vibrate([200, 100, 200]);
                    console.log("Vibrating");
                }
            } else {
                if (instructionsDisplay) {
                    instructionsDisplay.textContent = "Adjust your direction.";
                }
                if (logo) {
                    logo.classList.remove('blink');
                }
                facingCorrectDirection = false;
                if (beepAudio) {
                    beepAudio.pause();
                }
            }
        });
    }
}

function calculateBearing(lat1, lon1, lat2, lon2) {
    let φ1 = lat1 * Math.PI/180; // φ, λ in radians
    let φ2 = lat2 * Math.PI/180;
    let λ1 = lon1 * Math.PI/180;
    let λ2 = lon2 * Math.PI/180;
    let y = Math.sin(λ2-λ1) * Math.cos(φ2);
    let x = Math.cos(φ1)*Math.sin(φ2) -
            Math.sin(φ1)*Math.cos(φ2)*Math.cos(λ2-λ1);
    let θ = Math.atan2(y, x);
    let bearing = (θ*180/Math.PI + 360) % 360; // in degrees
    if (isNaN(bearing)) bearing = 0; // Check if bearing is NaN and set to 0 if true
    return bearing;
}

function adjustBeep(distance) {
    let interval;

    if (distance < 25) {
        interval = 750; // Beep every 0.75 seconds within 25 meters
    } else if (distance < 50) {
        interval = 1000; // Beep every 1 second within 50 meters
    } else if (distance < 100) {
        interval = 1500; // Beep every 1.5 seconds within 100 meters
    } else if (distance < 200) {
        interval = 2000; // Beep every 2 seconds within 200 meters
    } else if (distance < 400) {
        interval = 3000; // Beep every 3 seconds within 400 meters
    } else {
        interval = 4000; // Beep every 4 seconds beyond 400 meters
    }

    if (beepInterval) clearInterval(beepInterval);
    beepInterval = setInterval(() => {
        if (beepAudio) beepAudio.play().catch(error => console.error("Audio play error:", error));
        if (facingCorrectDirection && navigator.vibrate) {
            navigator.vibrate(200);
        }
    }, interval);

    console.log("Beep adjusted: interval =", interval, "distance =", distance);
}

function adjustLogoBlink(distance) {
    let blinkRate = Math.max(0.5, 5 - distance / 20); // Adjust the blink rate based on distance
    if (logo) {
        logo.style.animationDuration = `${blinkRate}s`;
    }
    console.log("Blink rate adjusted:", blinkRate);
}

function handleError(error) {
    console.error("Error with geolocation: ", error);
    if (instructionsDisplay) {
        instructionsDisplay.textContent = "Unable to retrieve your location.";
    }
}
