function handleOrientation(event) {
    let alpha = event.alpha; // Alpha is the compass direction
    if (alpha !== null) {
        let userLat = position.coords.latitude;
        let userLon = position.coords.longitude;
        let targetLat = targetLocation.latitude;
        let targetLon = targetLocation.longitude;

        // Calculate the bearing (direction) between the user and the target
        let bearing = calculateBearing(userLat, userLon, targetLat, targetLon);

        // Adjust the arrow direction
        arrow.style.transform = `rotate(${alpha}deg)`;

        // Check if the device is pointing towards the target
        if (alpha >= (bearing - 10) && alpha <= (bearing + 10)) {
            arrow.style.backgroundColor = 'green';
            arrow.classList.add('pulse');
        } else {
            arrow.style.backgroundColor = 'red';
            arrow.classList.remove('pulse');
        }
    }
}

function calculateBearing(lat1, lon1, lat2, lon2) {
    let phi1 = lat1 * Math.PI / 180;
    let phi2 = lat2 * Math.PI / 180;
    let lambda1 = lon1 * Math.PI / 180;
    let lambda2 = lon2 * Math.PI / 180;

    let y = Math.sin(lambda2 - lambda1) * Math.cos(phi2);
    let x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(lambda2 - lambda1);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;

    return (bearing + 360) % 360; // Normalize bearing to 0-360 degrees
}
