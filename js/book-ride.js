// Global variables
let map;
let markers = [];
let routeLine;
let isSelectingPickup = true; // Flag to determine if selecting pickup or destination
let pickupMarker, destinationMarker;
let formSubmitHandlerAdded = false; // Flag to track if form submit handler was added
let searchTimeoutId = null; // To store the timeout ID for cancellation

// Price ranges by ride type
const priceRanges = {
    Bike: { baseFare: 20, perKm: 5 },
    Car: { baseFare: 50, perKm: 10 },
    xl: { baseFare: 100, perKm: 15 }
};

// Custom icons for markers
const pickupIcon = L.icon({
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const destinationIcon = L.icon({
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const userLocationIcon = L.icon({
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing map...");
    
    // Initialize map
    initMap();
    
    // Set up event listeners
    setupEventListeners();
    
    // Setup form submission handler
    setupFormSubmitHandler();
    
    // Add event listener for confirm ride button
    document.getElementById('confirmRideBtn').addEventListener('click', function() {
        // Close the confirmation modal
        const confirmationModal = document.getElementById('dummyConfirmationModal');
        const bsModal = bootstrap.Modal.getInstance(confirmationModal);
        bsModal.hide();
        
        // Show success message
        Swal.fire({
            title: 'Ride Confirmed!',
            text: 'Your ride has been confirmed. Your buddy will pick you up shortly.',
            icon: 'success',
            confirmButtonText: 'OK'
        });
        
        // Reset the booking form
        document.getElementById('bookingForm').reset();
    });
    
    // Add event listener for confirm ride button in dummy modal
    const confirmRideBtn = document.getElementById('confirmRideBtn');
    if (confirmRideBtn) {
        confirmRideBtn.addEventListener('click', function() {
            // Get ride details from the modal
            const pickup = document.getElementById('dummyPickup').textContent;
            const destination = document.getElementById('dummyDestination').textContent;
            const rideType = document.getElementById('dummyRideType').textContent;
            const fare = document.getElementById('dummyFare').textContent;
            
            // Close the confirmation modal
            const confirmationModal = document.getElementById('dummyConfirmationModal');
            const bsModal = bootstrap.Modal.getInstance(confirmationModal);
            bsModal.hide();
            
            // Redirect to payment page with ride details
            window.location.href = `payment.html?pickup=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(destination)}&rideType=${encodeURIComponent(rideType)}&fare=${encodeURIComponent(fare)}`;
        });
    }
});

// Initialize Leaflet map
function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error("Map element does not exist!");
        return;
    }
    
    // Check if element has dimensions
    const mapWidth = mapElement.offsetWidth;
    const mapHeight = mapElement.offsetHeight || 400;
    
    console.log(`Map container dimensions: ${mapWidth}x${mapHeight}`);
    
    if (mapWidth === 0) {
        console.error("Map container has zero width, setting explicit size");
        mapElement.style.width = "100%";
    }
    
    if (mapHeight === 0) {
        console.error("Map container has zero height, setting explicit size");
        mapElement.style.height = "400px";
    }
    
    // Initialize the map with a view over India
    map = L.map('map').setView([20.5937, 78.9629], 5);
    
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Add click handler to map
    map.on('click', onMapClick);
    
    // Try to get user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                console.log("Got user's position:", [lat, lng]);
                map.setView([lat, lng], 15);
                
                // Add marker for current location
                L.marker([lat, lng], {icon: userLocationIcon})
                    .addTo(map)
                    .bindPopup("Your Location")
                    .openPopup();
                
                // Get address from coordinates and set as pickup
                reverseGeocode([lat, lng], function(address) {
                    document.getElementById('pickup-location').value = address;
                });
            },
            (error) => {
                console.error("Error getting current location:", error);
            }
        );
    }
}

// Handle click on map
function onMapClick(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    console.log("Map clicked at:", [lat, lng]);
    
    // Determine if we're selecting pickup or destination
    if (isSelectingPickup) {
        addMarker([lat, lng], 'pickup');
        reverseGeocode([lat, lng], function(address) {
            document.getElementById('pickup-location').value = address;
            // After setting pickup, change to destination mode
            isSelectingPickup = false;
            updateLocationSelectionHighlight();
        });
    } else {
        addMarker([lat, lng], 'destination');
        reverseGeocode([lat, lng], function(address) {
            document.getElementById('destination').value = address;
        });
    }
    
    // Calculate route if both markers are set
    if (pickupMarker && destinationMarker) {
        calculateRoute();
    }
}

// Add marker to the map
function addMarker(latlng, type) {
    // Remove existing marker of the same type
    if (type === 'pickup' && pickupMarker) {
        map.removeLayer(pickupMarker);
    } else if (type === 'destination' && destinationMarker) {
        map.removeLayer(destinationMarker);
    }
    
    // Create new marker
    const icon = type === 'pickup' ? pickupIcon : destinationIcon;
    const title = type === 'pickup' ? 'Pickup Location' : 'Destination';
    
    const marker = L.marker(latlng, {icon: icon})
        .addTo(map)
        .bindPopup(title);
    
    // Store marker reference
    if (type === 'pickup') {
        pickupMarker = marker;
    } else {
        destinationMarker = marker;
    }
    
    // Fit map to show both markers if they exist
    if (pickupMarker && destinationMarker) {
        const group = new L.featureGroup([pickupMarker, destinationMarker]);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Calculate and display route between pickup and destination
function calculateRoute() {
    if (!pickupMarker || !destinationMarker) {
        console.error("Cannot calculate route: missing markers");
        return;
    }
    
    // Show route info container
    document.querySelector('.route-info').style.display = 'block';
    
    // Clear existing route line
    if (routeLine) {
        map.removeLayer(routeLine);
    }
    
    const pickupLatLng = pickupMarker.getLatLng();
    const destLatLng = destinationMarker.getLatLng();
    
    // Format coordinates for OSRM API
    const startCoord = `${pickupLatLng.lng},${pickupLatLng.lat}`;
    const endCoord = `${destLatLng.lng},${destLatLng.lat}`;
    
    // Use OSRM public API for routing
    fetch(`https://router.project-osrm.org/route/v1/driving/${startCoord};${endCoord}?overview=full&geometries=geojson`)
        .then(response => response.json())
        .then(data => {
            if (data.routes && data.routes.length > 0) {
                // Get the route geometry
                const routeGeometry = data.routes[0].geometry;
                
                // Draw the route on the map
                routeLine = L.geoJSON(routeGeometry, {
                    style: {
                        color: '#4361ee',
                        weight: 5,
                        opacity: 0.7
                    }
                }).addTo(map);
                
                // Get distance in kilometers and duration in minutes
                const distance = (data.routes[0].distance / 1000).toFixed(1);
                const duration = Math.round(data.routes[0].duration / 60);
                
                // Update the UI
                document.getElementById('route-distance').innerText = `${distance} km`;
                document.getElementById('route-time').innerText = `${duration} min`;
                
                // Update fare estimate based on distance and chosen ride type
                updateFareEstimate(parseFloat(distance));
                
                // Fit map to show the route
                map.fitBounds(routeLine.getBounds().pad(0.1));
            } else {
                throw new Error("No route found");
            }
        })
        .catch(error => {
            console.error("Routing error:", error);
            // Fallback to straight line if routing fails
            const lineCoords = [
                [pickupLatLng.lat, pickupLatLng.lng],
                [destLatLng.lat, destLatLng.lng]
            ];
            
            routeLine = L.polyline(lineCoords, {
                color: 'red',
                weight: 3,
                dashArray: '5, 10'
            }).addTo(map);
            
            // Calculate straight-line distance as fallback
            const distance = haversineDistance(
                [pickupLatLng.lat, pickupLatLng.lng],
                [destLatLng.lat, destLatLng.lng]
            ).toFixed(1);
            
            const estimatedTime = Math.round(parseFloat(distance) / 50 * 60); // Rough estimate: 50 km/h
            
            document.getElementById('route-distance').innerText = `~${distance} km`;
            document.getElementById('route-time').innerText = `~${estimatedTime} min`;
            
            // Update fare estimate based on distance
            updateFareEstimate(parseFloat(distance));
            
            // Fit map to show the route
            map.fitBounds(routeLine.getBounds().pad(0.1));
        });
}

// Calculate haversine distance between two points (direct distance)
function haversineDistance(coords1, coords2) {
    const R = 6371; // Radius of Earth in km
    const dLat = (coords2[0] - coords1[0]) * Math.PI / 180;
    const dLon = (coords2[1] - coords1[1]) * Math.PI / 180;
    const lat1 = coords1[0] * Math.PI / 180;
    const lat2 = coords2[0] * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
}

// Perform reverse geocoding to get address from coordinates
function reverseGeocode(latlng, callback) {
    // Use Nominatim for reverse geocoding
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng[0]}&lon=${latlng[1]}&zoom=18&addressdetails=1`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.display_name) {
                callback(data.display_name);
            } else {
                callback("Selected Location");
            }
        })
        .catch(error => {
            console.error("Error in reverse geocoding:", error);
            callback("Selected Location");
        });
}

// Geocode address to coordinates
function geocodeAddress(address, callback) {
    if (!address) {
        console.error("Cannot geocode empty address");
        return;
    }
    
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const result = data[0];
                callback([parseFloat(result.lat), parseFloat(result.lon)]);
            } else {
                console.error("No geocoding results found for:", address);
            }
        })
        .catch(error => {
            console.error("Error in geocoding:", error);
        });
}

// Update fare estimate based on distance
function updateFareEstimate(distance) {
    const rideType = document.querySelector('.ride-type.active').getAttribute('data-type');
    const pricing = priceRanges[rideType];
    
    if (!pricing) {
        console.error("No pricing for ride type:", rideType);
        return;
    }
    
    // Calculate exact fare based on base fare + per kilometer rate
    const baseFare = pricing.baseFare;
    const distanceCharge = Math.round(distance * pricing.perKm);
    const exactFare = baseFare + distanceCharge;
    
    // Add a small range for potential variations (traffic, etc.)
    const minPrice = Math.floor(exactFare * 0.95);  // 5% lower
    const maxPrice = Math.ceil(exactFare * 1.05);   // 5% higher
    
    const estimateElement = document.querySelector('.estimate-value');
    if (estimateElement) {
        if (minPrice === maxPrice) {
            estimateElement.textContent = `₹${exactFare}`;
        } else {
            estimateElement.textContent = `₹${minPrice}-${maxPrice}`;
        }
    }
    
    // Update fare breakdown
    const fareBreakdown = document.getElementById('fare-breakdown');
    const baseFareElement = document.getElementById('base-fare');
    const distanceKmElement = document.getElementById('distance-km');
    const distanceChargeElement = document.getElementById('distance-charge');
    const totalFareElement = document.getElementById('total-fare');
    
    if (fareBreakdown && baseFareElement && distanceKmElement && distanceChargeElement && totalFareElement) {
        // Show the breakdown
        fareBreakdown.style.display = 'block';
        
        // Update the breakdown values
        baseFareElement.textContent = `₹${baseFare}`;
        distanceKmElement.textContent = distance.toFixed(1);
        distanceChargeElement.textContent = `₹${distanceCharge}`;
        totalFareElement.textContent = `₹${exactFare}`;
    }
}

// Update visual indication of which location is being selected
function updateLocationSelectionHighlight() {
    const pickupInput = document.getElementById('pickup-location');
    const destInput = document.getElementById('destination');
    
    if (isSelectingPickup) {
        pickupInput.classList.add('active-selection');
        destInput.classList.remove('active-selection');
    } else {
        pickupInput.classList.remove('active-selection');
        destInput.classList.add('active-selection');
    }
}

// Setup form submission handler
function setupFormSubmitHandler() {
    if (formSubmitHandlerAdded) {
        return; // Avoid adding multiple handlers
    }
    
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleFormSubmit);
        formSubmitHandlerAdded = true;
        console.log("Form submit handler added");
    } else {
        console.error("Booking form not found");
    }
}

// Handle form submission
const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is authenticated
    const user = firebase.auth().currentUser;
    if (!user) {
        $('#loginModal').modal('show');
        return;
    }
    
    // Validate that both locations are set
    const isValid = validateLocations();
    if (!isValid) {
        return;
    }
    
    // Get ride details for the dummy confirmation
    const pickupLocation = document.getElementById('pickup-location').value;
    const destination = document.getElementById('destination').value;
    const selectedRideType = document.querySelector('.ride-type.active').getAttribute('data-type');
    const estimatedPrice = document.querySelector('.estimate-value').textContent;
    
    // Show the searching loader
    document.getElementById('searchingLoader').style.display = 'flex';
    
    // Simulate searching for a driver (3-5 seconds)
    setTimeout(() => {
        // Hide the searching loader
        document.getElementById('searchingLoader').style.display = 'none';
        
        // Set details in the dummy confirmation modal
        document.getElementById('dummyPickup').textContent = pickupLocation;
        document.getElementById('dummyDestination').textContent = destination;
        document.getElementById('dummyRideType').textContent = selectedRideType;
        document.getElementById('dummyFare').textContent = estimatedPrice;
        
        // Show the dummy confirmation modal
        const dummyModal = new bootstrap.Modal(document.getElementById('dummyConfirmationModal'));
        dummyModal.show();
        
        // Optional: Save ride data to Firestore in the background
        if (user) {
            try {
                saveRideData(user);
                console.log("Ride data saved to Firestore");
            } catch (error) {
                console.error("Error saving ride data:", error);
            }
        }
    }, Math.random() * 2000 + 3000); // Random time between 3-5 seconds
};

// Function to display alert messages with different styles
function showAlert(message, type = 'danger') {
    // Create alert element
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertElement.style.top = '20px';
    alertElement.style.right = '20px';
    alertElement.style.zIndex = '9999';
    alertElement.style.maxWidth = '400px';
    alertElement.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alertElement);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        // Try to use Bootstrap's Alert if available, otherwise just remove the element
        try {
            if (typeof bootstrap !== 'undefined' && bootstrap.Alert) {
                const bsAlert = new bootstrap.Alert(alertElement);
                bsAlert.close();
            } else {
                // Fallback if bootstrap is not available
                alertElement.classList.remove('show');
                setTimeout(() => {
                    alertElement.remove();
                }, 300);
            }
        } catch (e) {
            // If any error occurs, just remove the element
            alertElement.remove();
            console.error("Error closing alert:", e);
        }
    }, 5000);
}

// Reuse showAlert for error messages with the danger type
function showError(message) {
    showAlert(message, 'danger');
}

const displayBookingConfirmation = (rideData) => {
    // Set confirmation details in the modal
    document.getElementById('confirmationPickup').textContent = rideData.pickupLocation.address;
    document.getElementById('confirmationDestination').textContent = rideData.destination.address;
    document.getElementById('confirmationRideType').textContent = rideData.rideType;
    document.getElementById('confirmationFare').textContent = `₹${rideData.fare.total}`;
    
    // Show the confirmation modal
    $('#bookingConfirmationModal').modal('show');
};

// Validate pickup and destination locations
function validateLocations() {
    console.log("Validating locations...");
    
    const pickupLocation = document.getElementById('pickup-location').value;
    const destination = document.getElementById('destination').value;
    
    // Check if both text inputs have values
    if (!pickupLocation || !destination) {
        alert('Please enter both pickup location and destination');
        console.log("Missing text in location inputs");
        return false;
    }
    
    console.log("Text inputs OK");
    
    // Check if both markers are set
    if (!pickupMarker || !destinationMarker) {
        alert('Please set both pickup and destination locations on the map');
        console.log("Missing markers: pickup=", !!pickupMarker, "destination=", !!destinationMarker);
        return false;
    }
    
    console.log("Markers OK");
    
    // Check if route is calculated
    const routeDistance = document.getElementById('route-distance').textContent;
    if (routeDistance === '0 km') {
        alert('Please wait for the route to be calculated');
        console.log("Route not calculated");
        return false;
    }
    
    console.log("Route OK");
    
    return true;
}

// Save ride data to Firestore
function saveRideData(user) {
    if (typeof firebase === 'undefined' || !firebase.firestore) {
        console.error("Firestore not available");
        return;
    }
    
    console.log("Saving ride data for user:", user.uid);
    const selectedRideType = document.querySelector('.ride-type.active').getAttribute('data-type');
    const estimatedPrice = document.querySelector('.estimate-value').textContent;
    
    // Get fare breakdown details
    const baseFare = document.getElementById('base-fare').textContent;
    const distanceKm = document.getElementById('distance-km').textContent;
    const distanceCharge = document.getElementById('distance-charge').textContent;
    const totalFare = document.getElementById('total-fare').textContent;
    
    // Check if ride is scheduled
    const rideTimeSelect = document.getElementById('ride-time');
    let scheduledTime = null;
    
    if (rideTimeSelect && rideTimeSelect.value === 'schedule') {
        const dateInput = document.getElementById('schedule-date');
        const timeInput = document.getElementById('schedule-time');
        
        if (dateInput && timeInput && dateInput.value && timeInput.value) {
            scheduledTime = `${dateInput.value} ${timeInput.value}`;
        }
    }
    
    // Convert Leaflet LatLng objects to plain objects for Firestore
    const pickupLatLng = pickupMarker.getLatLng();
    const destLatLng = destinationMarker.getLatLng();
    
    const pickupLocation = {
        lat: pickupLatLng.lat,
        lng: pickupLatLng.lng,
        address: pickupMarker.getPopup().getContent()
    };
    
    const destinationLocation = {
        lat: destLatLng.lat,
        lng: destLatLng.lng,
        address: destinationMarker.getPopup().getContent()
    };
    
    return firebase.firestore().collection('rides').add({
        userId: user.uid,
        userEmail: user.email,
        pickup: pickupLocation,
        destination: destinationLocation,
        rideType: selectedRideType,
        estimatedPrice: estimatedPrice,
        fareDetails: {
            baseFare: baseFare,
            distanceKm: distanceKm,
            distanceCharge: distanceCharge,
            totalFare: totalFare
        },
        scheduledTime: scheduledTime,
        status: 'booked',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(docRef => {
        console.log('Ride information saved successfully');
        return {
            rideId: docRef.id,
            pickupLocation: pickupLocation,
            destination: destinationLocation,
            rideType: selectedRideType,
            fare: {
                base: baseFare,
                distanceKm: distanceKm,
                distanceCharge: distanceCharge,
                total: totalFare
            }
        };
    })
    .catch(error => {
        console.error('Error saving ride data:', error);
        throw error;
    });
}

// Setup event listeners
function setupEventListeners() {
    // Location input click events
    const pickupInput = document.getElementById('pickup-location');
    if (pickupInput) {
        pickupInput.addEventListener('click', function() {
            isSelectingPickup = true;
            updateLocationSelectionHighlight();
        });
        
        // Handle manual input
        pickupInput.addEventListener('change', function() {
            const address = this.value;
            if (address) {
                geocodeAddress(address, function(latlng) {
                    addMarker(latlng, 'pickup');
                    
                    // If destination is also set, calculate route
                    if (destinationMarker) {
                        calculateRoute();
                    }
                });
            }
        });
    }
    
    const destInput = document.getElementById('destination');
    if (destInput) {
        destInput.addEventListener('click', function() {
            isSelectingPickup = false;
            updateLocationSelectionHighlight();
        });
        
        // Handle manual input
        destInput.addEventListener('change', function() {
            const address = this.value;
            if (address) {
                geocodeAddress(address, function(latlng) {
                    addMarker(latlng, 'destination');
                    
                    // If pickup is also set, calculate route
                    if (pickupMarker) {
                        calculateRoute();
                    }
                });
            }
        });
    }
    
    // Current location button
    const currentLocationBtn = document.getElementById('current-location-btn');
    if (currentLocationBtn) {
        currentLocationBtn.addEventListener('click', function() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        
                        // Set as pickup location
                        addMarker([lat, lng], 'pickup');
                        
                        // Get address and update input
                        reverseGeocode([lat, lng], function(address) {
                            document.getElementById('pickup-location').value = address;
                            
                            // If destination is already set, calculate route
                            if (destinationMarker) {
                                calculateRoute();
                            }
                            
                            // Switch to destination selection
                            isSelectingPickup = false;
                            updateLocationSelectionHighlight();
                        });
                        
                        // Center map on location
                        map.setView([lat, lng], 15);
                    },
                    (error) => {
                        console.error("Error getting location:", error);
                        alert("Could not get your current location. Please check your browser settings.");
                    }
                );
            } else {
                alert("Geolocation is not supported by your browser.");
            }
        });
    }
    
    // Ride type selection
    const rideTypes = document.querySelectorAll('.ride-type');
    rideTypes.forEach(type => {
        type.addEventListener('click', function() {
            // Remove active class from all ride types
            rideTypes.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked ride type
            this.classList.add('active');
            
            // Update fare estimate if route is already calculated
            const routeDistance = document.getElementById('route-distance').textContent;
            if (routeDistance && routeDistance !== '0 km') {
                const distance = parseFloat(routeDistance.replace(' km', ''));
                if (!isNaN(distance)) {
                    updateFareEstimate(distance);
                }
            }
        });
    });
    
    // Schedule options toggle
    const rideTimeSelect = document.getElementById('ride-time');
    if (rideTimeSelect) {
        rideTimeSelect.addEventListener('change', function() {
            const scheduleOptions = document.getElementById('schedule-options');
            if (scheduleOptions) {
                scheduleOptions.style.display = this.value === 'schedule' ? 'block' : 'none';
                
                if (this.value === 'schedule') {
                    // Set default date and time (1 hour from now)
                    const now = new Date();
                    const oneHourLater = new Date(now.getTime() + (60 * 60 * 1000));
                    
                    const dateInput = document.getElementById('schedule-date');
                    const timeInput = document.getElementById('schedule-time');
                    
                    if (dateInput && timeInput) {
                        // Format date as YYYY-MM-DD
                        const dateString = oneHourLater.toISOString().split('T')[0];
                        dateInput.value = dateString;
                        
                        // Format time as HH:MM
                        const hours = oneHourLater.getHours().toString().padStart(2, '0');
                        const minutes = oneHourLater.getMinutes().toString().padStart(2, '0');
                        timeInput.value = `${hours}:${minutes}`;
                    }
                }
            }
        });
    }
    
    // Estimated fare click to toggle breakdown
    const estimateValue = document.querySelector('.estimate-value');
    if (estimateValue) {
        estimateValue.addEventListener('click', function() {
            const fareBreakdown = document.getElementById('fare-breakdown');
            if (fareBreakdown) {
                fareBreakdown.style.display = fareBreakdown.style.display === 'none' ? 'block' : 'none';
            }
        });
    }
} 