// Initialize Mappls Map and related functionality
let map;
let directionsPlugin;
let searchPlugin;
let markers = [];
let currentLocationMarker;

// Price ranges by ride type
const priceRanges = {
    Bike: { min: 50, max: 80 },
    Car: { min: 150, max: 200 },
    xl: { min: 250, max: 350 }
};

// Initialize Mappls map
document.addEventListener('DOMContentLoaded', function() {
    initMap();
});

function initMap() {
    // Create a new map centered on a default location
    const defaultLocation = [77.2310, 28.6139]; // New Delhi coordinates [lng, lat]
    
    // Initialize Mappls map
    map = new mappls.Map('map', {
        center: defaultLocation,
        zoom: 12,
        zoomControl: true,
        location: true
    });
    
    // Initialize search (autocomplete) plugin
    searchPlugin = new mappls.search({
        map: map,
        click_callback: function(data) {
            console.log(data);
        }
    });
    
    // Initialize directions plugin
    directionsPlugin = new mappls.direction({
        map: map,
        divId: 'map'
    });
    
    // Setup autocomplete for pickup
    setupAutocomplete('pickup-location', function(place) {
        if (place) {
            document.getElementById('pickup-location').value = place.formatted_address || place.placeName;
            addMarker([place.longitude, place.latitude], 'pickup');
            
            checkForRoute();
        }
    });
    
    // Setup autocomplete for destination
    setupAutocomplete('destination', function(place) {
        if (place) {
            document.getElementById('destination').value = place.formatted_address || place.placeName;
            addMarker([place.longitude, place.latitude], 'destination');
            
            checkForRoute();
        }
    });
    
    // Try to get the user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = [position.coords.longitude, position.coords.latitude]; // [lng, lat]
                
                map.setCenter(pos);
                addCurrentLocationMarker(pos);
                
                // Use Mappls reverse geocoding to get address of current location
                mappls.reverseGeocode({
                    position: pos
                }, function(data) {
                    if (data && data.results && data.results[0]) {
                        document.getElementById('pickup-location').value = data.results[0].formatted_address;
                    }
                });
            },
            () => {
                // If geolocation fails
                console.log("Geolocation service failed.");
            }
        );
    } else {
        console.log("Browser doesn't support geolocation.");
    }
    
    // Add event listeners
    setupEventListeners();
}

// Setup autocomplete for input fields
function setupAutocomplete(inputId, callback) {
    const input = document.getElementById(inputId);
    
    // Listen for input changes
    input.addEventListener('input', function() {
        if (this.value.length > 2) { // Start searching after 2 characters
            mappls.search({
                keywords: this.value,
                location: map.getCenter().lng + ',' + map.getCenter().lat, // Use current map center as focus
                zoom: 5,
                pod: 'city,street,village,locality'
            }, function(data) {
                if (data && data.suggestedLocations && data.suggestedLocations.length > 0) {
                    // Create a simple dropdown for results
                    showAutocompleteResults(inputId, data.suggestedLocations, callback);
                }
            });
        }
    });
}

// Show autocomplete results in a dropdown
function showAutocompleteResults(inputId, results, callback) {
    // Remove any existing dropdown
    const existingDropdown = document.getElementById(inputId + '-dropdown');
    if (existingDropdown) {
        existingDropdown.remove();
    }
    
    // Create dropdown element
    const dropdown = document.createElement('div');
    dropdown.id = inputId + '-dropdown';
    dropdown.className = 'autocomplete-dropdown';
    
    // Add results to dropdown
    results.forEach((result, index) => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.textContent = result.placeName || result.formatted_address;
        
        item.addEventListener('click', function() {
            // Call the callback with the selected place
            callback(result);
            
            // Remove dropdown
            dropdown.remove();
        });
        
        dropdown.appendChild(item);
    });
    
    // Add dropdown to the page
    const input = document.getElementById(inputId);
    input.parentNode.style.position = 'relative';
    input.parentNode.appendChild(dropdown);
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function closeDropdown(e) {
        if (!dropdown.contains(e.target) && e.target !== input) {
            dropdown.remove();
            document.removeEventListener('click', closeDropdown);
        }
    });
}

// Add marker to the map
function addMarker(location, type) {
    // Clear previous markers of the same type
    markers = markers.filter(marker => {
        if (marker.type === type) {
            map.removeLayer(marker.marker);
            return false;
        }
        return true;
    });
    
    // Create marker icon based on type
    let icon;
    if (type === 'pickup') {
        icon = {
            url: 'https://apis.mapmyindia.com/map_v3/1.png',
            width: 32,
            height: 32
        };
    } else {
        icon = {
            url: 'https://apis.mapmyindia.com/map_v3/2.png',
            width: 32,
            height: 32
        };
    }
    
    // Add new marker
    const marker = new mappls.Marker({
        position: location,
        map: map,
        icon: icon,
        popupHtml: type === 'pickup' ? 'Pickup Location' : 'Destination'
    });
    
    markers.push({ type, marker });
    
    // Center the map on the marker
    map.setCenter(location);
    if (markers.length === 1) {
        map.setZoom(14);
    }
}

// Add marker for current location
function addCurrentLocationMarker(location) {
    // Remove previous current location marker if it exists
    if (currentLocationMarker) {
        map.removeLayer(currentLocationMarker);
    }
    
    // Create a custom marker for current location
    currentLocationMarker = new mappls.Marker({
        position: location,
        map: map,
        icon: {
            url: 'https://apis.mapmyindia.com/map_v3/you.png',
            width: 24,
            height: 24
        },
        popupHtml: 'Your Location'
    });
}

// Check if both pickup and destination are set to calculate route
function checkForRoute() {
    const pickupMarker = markers.find(m => m.type === 'pickup');
    const destinationMarker = markers.find(m => m.type === 'destination');
    
    if (pickupMarker && destinationMarker) {
        calculateRoute(
            pickupMarker.marker.getPosition(),
            destinationMarker.marker.getPosition()
        );
    }
}

// Calculate and display route between two points
function calculateRoute(origin, destination) {
    // Convert to string format required by Mappls
    const originStr = origin[0] + ',' + origin[1]; // lng,lat
    const destinationStr = destination[0] + ',' + destination[1]; // lng,lat
    
    // Calculate route
    directionsPlugin.remove(); // Clear previous routes
    
    directionsPlugin = new mappls.direction({
        map: map,
        divId: 'map',
        source: originStr,
        destination: destinationStr,
        overview: "full"
    });
    
    directionsPlugin.calculate({
        sourcePosition: origin,
        destinationPosition: destination,
        callback: function(data) {
            if (data) {
                // Extract route information
                const route = data.routes[0];
                const distanceKm = route.distance / 1000; // Convert meters to kilometers
                const durationMin = Math.round(route.duration / 60); // Convert seconds to minutes
                
                document.getElementById('route-distance').textContent = distanceKm.toFixed(1) + ' km';
                document.getElementById('route-time').textContent = durationMin + ' min';
                document.querySelector('.route-info').style.display = 'block';
                
                // Update price estimate based on the selected ride type and distance
                updatePriceEstimate(distanceKm);
            }
        }
    });
}

// Update price estimate based on distance and ride type
function updatePriceEstimate(distanceKm) {
    const selectedRideType = document.querySelector('.ride-type.active').getAttribute('data-type');
    const priceRange = priceRanges[selectedRideType];
    
    // Calculate estimated price based on distance and ride type
    const minPrice = Math.round(priceRange.min + (distanceKm * 5));  // Higher rate per km for rupees
    const maxPrice = Math.round(priceRange.max + (distanceKm * 7));  // Higher rate per km for rupees
    
    document.querySelector('.estimate-value').textContent = `₹${minPrice}-${maxPrice}`;
}

// Handle using current location button
function useCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = [position.coords.longitude, position.coords.latitude]; // [lng, lat]
                
                // Use Mappls reverse geocoding to get address
                mappls.reverseGeocode({
                    position: pos
                }, function(data) {
                    if (data && data.results && data.results[0]) {
                        document.getElementById('pickup-location').value = data.results[0].formatted_address;
                        
                        // Add marker for current location
                        addMarker(pos, 'pickup');
                        
                        // Check if we need to calculate a route
                        checkForRoute();
                    }
                });
                
                map.setCenter(pos);
                map.setZoom(15);
            },
            () => {
                console.log("Geolocation service failed.");
                alert("Unable to get your current location. Please check your browser settings.");
            }
        );
    } else {
        console.log("Browser doesn't support geolocation.");
        alert("Your browser doesn't support geolocation.");
    }
}

// Setup event listeners
function setupEventListeners() {
    // Ride type selection
    const rideTypes = document.querySelectorAll('.ride-type');
    rideTypes.forEach(type => {
        type.addEventListener('click', () => {
            // Remove active class from all ride types
            rideTypes.forEach(t => t.classList.remove('active'));
            
            // Add active class to the clicked ride type
            type.classList.add('active');
            
            // Update price estimate if a route is already calculated
            const distanceText = document.getElementById('route-distance').textContent;
            if (distanceText !== '0 km') {
                const distanceKm = parseFloat(distanceText.replace(' km', ''));
                updatePriceEstimate(distanceKm);
            }
        });
    });
    
    // Schedule for later option
    const rideTimeSelect = document.getElementById('ride-time');
    const scheduleOptions = document.getElementById('schedule-options');
    
    rideTimeSelect.addEventListener('change', function() {
        if (this.value === 'schedule') {
            scheduleOptions.style.display = 'block';
            
            // Set default date and time (1 hour from now)
            const now = new Date();
            const oneHourLater = new Date(now.getTime() + (60 * 60 * 1000));
            
            const dateInput = document.getElementById('schedule-date');
            const timeInput = document.getElementById('schedule-time');
            
            // Format date as YYYY-MM-DD
            const dateString = oneHourLater.toISOString().split('T')[0];
            dateInput.value = dateString;
            
            // Format time as HH:MM
            const hours = oneHourLater.getHours().toString().padStart(2, '0');
            const minutes = oneHourLater.getMinutes().toString().padStart(2, '0');
            timeInput.value = `${hours}:${minutes}`;
        } else {
            scheduleOptions.style.display = 'none';
        }
    });
    
    // Current location button
    const currentLocationBtn = document.getElementById('current-location-btn');
    currentLocationBtn.addEventListener('click', useCurrentLocation);
} 