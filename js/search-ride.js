document.addEventListener('DOMContentLoaded', () => {
    const rideRequestsList = document.getElementById('ride-requests-list');
    const noRidesMessage = document.getElementById('no-rides-message');

    // --- Dummy Ride Request Data (Replace with real-time data source) ---
    const dummyRideRequests = [
        {
            id: 'ride123',
            pickup: '123 Main St, Anytown',
            destination: '456 Oak Ave, Anytown',
            distance: '5.2 km',
            time: '15 min',
            fare: '₹180-220',
            passengerName: 'Alice B.',
            rating: 4.8,
            type: 'Car'
        },
        {
            id: 'ride456',
            pickup: '789 Pine Ln, Somewhere City',
            destination: '101 Elm Blvd, Somewhere City',
            distance: '8.1 km',
            time: '22 min',
            fare: '₹250-300',
            passengerName: 'Bob C.',
            rating: 4.5,
            type: 'XL'
        },
        {
            id: 'ride789',
            pickup: '222 Maple Dr, Villagetown',
            destination: '333 Birch Rd, Villagetown',
            distance: '3.5 km',
            time: '10 min',
            fare: '₹60-90',
            passengerName: 'Charlie D.',
            rating: 4.9,
            type: 'Bike'
        },
    ];
    // ---------------------------------------------------------------------

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
        col.className = 'col-md-6 col-lg-4 ride-request-item'; // Added ride-request-item class
        col.dataset.rideId = request.id; // Store ride ID

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

        acceptBtn.addEventListener('click', () => handleAcceptRide(request.id, col));
        rejectBtn.addEventListener('click', () => handleRejectRide(request.id, col));

        return col;
    }

    function handleAcceptRide(rideId, cardElement) {
        console.log(`Accepted ride: ${rideId}`);
        // Add logic here: 
        // 1. Notify backend/server about acceptance
        // 2. Update UI (e.g., show confirmation, remove other requests, navigate to ride details)
        
        // Example: Disable buttons and show 'Accepted'
        cardElement.querySelector('.btn-accept').disabled = true;
        cardElement.querySelector('.btn-reject').disabled = true;
        cardElement.querySelector('.btn-accept').textContent = 'Accepted';
        cardElement.querySelector('.card-footer').innerHTML = `<div class="text-success fw-bold">Ride Accepted! Navigating...</div>`;

        // Simulate navigation or further action
        setTimeout(() => {
             alert(`Navigating to details for ride ${rideId}`);
             // Potentially remove the card or navigate away
             // cardElement.remove(); 
             // updateRideListState();
        }, 1500);
    }

    function handleRejectRide(rideId, cardElement) {
        console.log(`Rejected ride: ${rideId}`);
        // Add logic here: 
        // 1. Notify backend/server about rejection (optional)
        // 2. Remove the card from the UI

        // Example: Fade out and remove the card
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

    // --- Initial Load ---
    // Simulate loading time
    setTimeout(() => {
        displayRideRequests(dummyRideRequests); 
    }, 1500); // Simulate network delay

    // --- Real-time Updates (Placeholder) ---
    // In a real application, you would use WebSockets or Firebase Realtime Database 
    // to listen for new ride requests and update the list dynamically.
    // Example (Conceptual): 
    // firebase.database().ref('ride_requests').on('child_added', (snapshot) => {
    //     const newRequest = snapshot.val();
    //     addRideRequestCard(newRequest); // Function to add a single card
    // });
    // firebase.database().ref('ride_requests').on('child_removed', (snapshot) => {
    //     removeRideRequestCard(snapshot.key); // Function to remove a card by ID
    // });
}); 