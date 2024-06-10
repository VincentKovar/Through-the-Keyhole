function handleOrientation(event) {
    let alpha = event.alpha || 0; // Compass direction in degrees
    let adjustedAlpha = (alpha + 180) % 360; // Adjust for holding phone in front
    let currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
    };
    let directionToTarget = calculateBearing(currentLocation.latitude, currentLocation.longitude, targetLocation.latitude, targetLocation.longitude);

    console.log("Alpha:", alpha);
    console.log("Direction to target:", directionToTarget);

    if (Math.abs(adjustedAlpha - directionToTarget) < 10) {
        instructionsDisplay.textContent = "You're facing the right direction!";
        logo.style.animationName = "blink";
        logo.style.animationDuration = "0.5s";
        beepAudio.play().catch(error => console.error("Audio play error:", error));
        adjustBeep(distance);
        adjustLogoBlink(distance);
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
            console.log("Vibrating");
        }
    } else {
        instructionsDisplay.textContent = "Adjust your direction.";
        logo.style.animationName = "none";
        beepAudio.pause();
    }
}
