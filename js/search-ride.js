document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const rideRequestsList = document.getElementById('ride-requests-list');
    const noRidesMessage = document.getElementById('no-rides-message');
    const authRequiredMessage = document.getElementById('auth-required');
    const loadingRides = document.getElementById('loading-rides');
    const ridesContainer = document.getElementById('rides-container');
    const statusOnlineBtn = document.getElementById('status-online');
    const statusOfflineBtn = document.getElementById('status-offline');

    // State variables
    let isOnline = true;
    let currentUser = null;
    let rideRequestsListener = null;

    // Listen for authentication state changes
    document.addEventListener('userAuthChanged', function(e) {
        const user = e.detail.user;
        currentUser = user;
        
        if (user) {
            console.log('Driver logged in:', user.email);
            // Hide auth required message
            authRequiredMessage.classList.add('d-none');
            // Load ride requests
            loadRideRequests();
        } else {
            console.log('No user logged in');
            // Show auth required message
            authRequiredMessage.classList.remove('d-none');
            ridesContainer.classList.add('d-none');
            // Detach listener if exists
            detachRideRequestsListener();
        }
    });

    // Check initial auth state
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in
            console.log('User is signed in:', user.email);
            
            // Wait for Firestore to be available
            if (firebase.firestore) {
                // Check if user is a driver
                localStorage.setItem('user_type', 'driver');
                
                // Update UI
                authRequiredMessage.classList.add('d-none');
                ridesContainer.classList.remove('d-none');
                loadingRides.classList.remove('d-none');
                
                // Load ride requests
                loadRideRequests();
            }
        } else {
            // User is not signed in
            console.log('User is not signed in');
            authRequiredMessage.classList.remove('d-none');
            ridesContainer.classList.add('d-none');
            loadingRides.classList.add('d-none');
        }
    });

    // Status toggle buttons
    if (statusOnlineBtn && statusOfflineBtn) {
        statusOnlineBtn.addEventListener('click', () => {
            setDriverStatus(true);
        });
        
        statusOfflineBtn.addEventListener('click', () => {
            setDriverStatus(false);
        });
    }

    function setDriverStatus(online) {
        isOnline = online;
        
        if (online) {
            statusOnlineBtn.classList.remove('d-none');
            statusOfflineBtn.classList.add('d-none');
            statusOnlineBtn.classList.add('btn-success');
            statusOfflineBtn.classList.remove('btn-success');
            statusOfflineBtn.classList.add('btn-secondary');
            
            // Update driver status in Firestore
            updateDriverStatus('online');
            
            // Reload ride requests
            loadRideRequests();
        } else {
            statusOnlineBtn.classList.add('d-none');
            statusOfflineBtn.classList.remove('d-none');
            statusOfflineBtn.classList.add('btn-success');
            statusOnlineBtn.classList.remove('btn-success');
            statusOnlineBtn.classList.add('btn-secondary');
            
            // Update driver status in Firestore
            updateDriverStatus('offline');
            
            // Clear ride requests
            displayRideRequests([]);
        }
    }

    function updateDriverStatus(status) {
        const user = firebase.auth().currentUser;
        if (!user) return;
        
        firebase.firestore().collection('users').doc(user.uid).update({
            driverStatus: status,
            lastStatusUpdate: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            console.log('Driver status updated to:', status);
        }).catch(error => {
            console.error('Error updating driver status:', error);
        });
    }

    function loadRideRequests() {
        if (!isOnline || !firebase.auth().currentUser) {
            ridesContainer.classList.add('d-none');
            return;
        }
        
        // Show loading state
        loadingRides.classList.remove('d-none');
        ridesContainer.classList.add('d-none');
        
        // Detach any existing listener
        detachRideRequestsListener();
        
        // Listen for ride requests in Firestore
        rideRequestsListener = firebase.firestore()
            .collection('rides')
            .where('status', '==', 'booked')
            .orderBy('timestamp', 'desc')
            .onSnapshot(snapshot => {
                // Hide loading state
                loadingRides.classList.add('d-none');
                ridesContainer.classList.remove('d-none');
                
                const rides = [];
                snapshot.forEach(doc => {
                    const rideData = doc.data();
                    rides.push({
                        id: doc.id,
                        pickup: rideData.pickup,
                        destination: rideData.destination,
                        distance: rideData.fareDetails?.distanceKm ? `${rideData.fareDetails.distanceKm} km` : 'N/A',
                        time: 'N/A', // We don't have this in the Firestore data yet
                        fare: rideData.fareDetails?.totalFare || rideData.estimatedPrice || 'N/A',
                        passengerName: rideData.userEmail || 'Anonymous',
                        rating: 4.5, // Placeholder until we implement user ratings
                        type: rideData.rideType || 'Car',
                        timestamp: rideData.timestamp
                    });
                });
                
                displayRideRequests(rides);
            }, error => {
                console.error('Error listening for ride requests:', error);
                loadingRides.classList.add('d-none');
                noRidesMessage.style.display = 'block';
            });
    }

    function detachRideRequestsListener() {
        if (rideRequestsListener) {
            rideRequestsListener();
            rideRequestsListener = null;
        }
    }

    function displayRideRequests(requests) {
        // Clear existing placeholders or requests
        rideRequestsList.innerHTML = '';

        if (requests.length === 0) {
            noRidesMessage.style.display = 'block';
            return;
        }

        noRidesMessage.style.display = 'none';

        requests.forEach(request => {
            const card = createRideRequestCard(request);
            rideRequestsList.appendChild(card);
        });
    }

    function createRideRequestCard(request) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 ride-request-item'; 
        col.dataset.rideId = request.id; 

        // Basic card structure
        col.innerHTML = `
            <div class="ride-request-card h-100">
                <div class="card-body">
                    <div class="ride-info">
                        <div class="info-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <div>
                                <span class="info-label">Pickup</span>
                                <span class="info-value pickup-address">${request.pickup}</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-map-pin"></i>
                            <div>
                                <span class="info-label">Destination</span>
                                <span class="info-value destination-address">${request.destination}</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-road"></i>
                            <div>
                                <span class="info-label">Distance / Time</span>
                                <span class="info-value">${request.distance} / ${request.time}</span>
                            </div>
                        </div>
                         <div class="info-item">
                            <i class="fas fa-user-circle"></i>
                            <div>
                                <span class="info-label">Passenger</span>
                                <span class="info-value">${request.passengerName} (${request.rating} <i class="fas fa-star text-warning"></i>)</span>
                            </div>
                        </div>
                         <div class="info-item">
                            <i class="fas fa-car"></i>
                            <div>
                                <span class="info-label">Ride Type</span>
                                <span class="info-value">${request.type}</span>
                            </div>
                        </div>
                    </div>
                    <div class="fare-estimate">
                        Est. Fare: ${request.fare}
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-success btn-accept">Accept</button>
                    <button class="btn btn-danger btn-reject">Reject</button>
                </div>
            </div>
        `;

        // Add event listeners for buttons
        const acceptBtn = col.querySelector('.btn-accept');
        const rejectBtn = col.querySelector('.btn-reject');

        acceptBtn.addEventListener('click', () => handleAcceptRide(request, col));
        rejectBtn.addEventListener('click', () => handleRejectRide(request.id, col));

        return col;
    }

    function handleAcceptRide(request, cardElement) {
        console.log(`Accepted ride: ${request.id}`);
        
        const user = firebase.auth().currentUser;
        if (!user) {
            alert('You must be logged in to accept rides');
            return;
        }
        
        // Disable buttons and show 'Accepted'
        cardElement.querySelector('.btn-accept').disabled = true;
        cardElement.querySelector('.btn-reject').disabled = true;
        cardElement.querySelector('.btn-accept').textContent = 'Accepted';
        cardElement.querySelector('.card-footer').innerHTML = `<div class="text-success fw-bold">Ride Accepted! Navigating...</div>`;
        
        // Update ride in Firestore
        const driverInfo = {
            id: user.uid,
            name: user.displayName || user.email,
            email: user.email,
            phone: user.phoneNumber || ''
        };
        
        firebase.firestore().collection('rides').doc(request.id).update({
            status: 'accepted',
            driver: driverInfo,
            acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            console.log('Ride status updated to accepted');
            
            // Also update all other cards to show this driver is busy
            const otherCards = document.querySelectorAll(`.ride-request-item:not([data-ride-id="${request.id}"])`);
            otherCards.forEach(card => {
                card.querySelector('.btn-accept').disabled = true;
                card.querySelector('.btn-reject').disabled = true;
                card.querySelector('.btn-accept').textContent = 'Unavailable';
                card.querySelector('.btn-reject').textContent = 'Driver Busy';
            });
            
            // Show details in modal
            showRideDetailsModal(request);
        }).catch(error => {
            console.error('Error accepting ride:', error);
            alert('Error accepting ride. Please try again.');
            
            // Reset the button state
            cardElement.querySelector('.btn-accept').disabled = false;
            cardElement.querySelector('.btn-reject').disabled = false;
            cardElement.querySelector('.btn-accept').textContent = 'Accept';
            cardElement.querySelector('.card-footer').innerHTML = `
                <button class="btn btn-success btn-accept">Accept</button>
                <button class="btn btn-danger btn-reject">Reject</button>
            `;
        });
    }
    
    function showRideDetailsModal(request) {
        const modal = new bootstrap.Modal(document.getElementById('rideDetailsModal'));
        const detailsContent = document.getElementById('ride-details-content');
        
        detailsContent.innerHTML = `
            <div class="ride-details">
                <div class="alert alert-success mb-4">
                    <i class="fas fa-check-circle me-2"></i> You've accepted this ride!
                </div>
                
                <div class="mb-4">
                    <h5 class="mb-3">Passenger Information</h5>
                    <div class="d-flex align-items-center mb-2">
                        <i class="fas fa-user-circle me-2 fs-3"></i>
                        <div>
                            <div class="fw-bold">${request.passengerName}</div>
                            <div class="text-muted small">Rating: ${request.rating} <i class="fas fa-star text-warning"></i></div>
                        </div>
                    </div>
                </div>
                
                <div class="mb-4">
                    <h5 class="mb-3">Route Information</h5>
                    <div class="info-item mb-2">
                        <i class="fas fa-map-marker-alt text-success"></i>
                        <div>
                            <span class="text-muted">Pickup Location:</span>
                            <div class="fw-bold">${request.pickup}</div>
                        </div>
                    </div>
                    <div class="info-item mb-2">
                        <i class="fas fa-map-pin text-danger"></i>
                        <div>
                            <span class="text-muted">Destination:</span>
                            <div class="fw-bold">${request.destination}</div>
                        </div>
                    </div>
                    <div class="d-flex justify-content-between text-center mt-3">
                        <div>
                            <div class="text-muted small">Distance</div>
                            <div class="fw-bold">${request.distance}</div>
                        </div>
                        <div>
                            <div class="text-muted small">Est. Time</div>
                            <div class="fw-bold">${request.time}</div>
                        </div>
                        <div>
                            <div class="text-muted small">Ride Type</div>
                            <div class="fw-bold">${request.type}</div>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h5 class="mb-3">Fare Information</h5>
                    <div class="alert alert-primary d-flex justify-content-between align-items-center">
                        <span>Estimated Total:</span>
                        <span class="fs-5 fw-bold">${request.fare}</span>
                    </div>
                </div>
            </div>
        `;
        
        const acceptRideBtn = document.getElementById('accept-ride-btn');
        acceptRideBtn.textContent = 'Navigate to Pickup';
        acceptRideBtn.onclick = function() {
            modal.hide();
            alert(`Navigating to pickup location: ${request.pickup}`);
        };
        
        modal.show();
    }

    function handleRejectRide(rideId, cardElement) {
        console.log(`Rejected ride: ${rideId}`);
        
        // Fade out and remove the card
        cardElement.style.transition = 'opacity 0.5s ease';
        cardElement.style.opacity = '0';
        setTimeout(() => {
            cardElement.remove();
            updateRideListState(); // Check if list is empty after removal
        }, 500);
    }
    
    function updateRideListState() {
        const remainingItems = rideRequestsList.querySelectorAll('.ride-request-item');
        if (remainingItems.length === 0) {
            noRidesMessage.style.display = 'block';
        } else {
            noRidesMessage.style.display = 'none';
        }
    }
}); 