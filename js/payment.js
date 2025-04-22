// Payment page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get URL parameters to populate ride details
    const urlParams = new URLSearchParams(window.location.search);
    const pickup = urlParams.get('pickup') || 'Hinjewadi Phase 1, Pune';
    const destination = urlParams.get('destination') || 'Koregaon Park, Pune';
    const rideType = urlParams.get('rideType') || 'Car';
    const fare = urlParams.get('fare') || '₹250';
    
    // Update summary
    document.getElementById('summaryPickup').textContent = pickup;
    document.getElementById('summaryDestination').textContent = destination;
    document.getElementById('summaryRideType').textContent = rideType;
    document.getElementById('summaryFare').textContent = fare;
    
    // Update all payment buttons to show correct amount
    const payButtons = document.querySelectorAll('.btn-primary:not([type="button"])');
    payButtons.forEach(button => {
        if (button.textContent.includes('Pay')) {
            button.textContent = button.textContent.replace(/₹\d+/, fare);
        }
    });
    
    // Payment method selection
    const paymentMethods = document.querySelectorAll('.payment-method');
    paymentMethods.forEach(method => {
        method.querySelector('.payment-method-header').addEventListener('click', function() {
            // Remove active class from all methods
            paymentMethods.forEach(m => m.classList.remove('active'));
            // Add active class to clicked method
            method.classList.add('active');
        });
    });
    
    // Card number formatting
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            let formattedValue = '';
            
            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 4 === 0) {
                    formattedValue += ' ';
                }
                formattedValue += value[i];
            }
            
            e.target.value = formattedValue;
        });
    }
    
    // Card expiry formatting
    const cardExpiryInput = document.getElementById('cardExpiry');
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length > 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            
            e.target.value = value;
        });
    }
    
    // Form submission
    const cardForm = document.getElementById('cardPaymentForm');
    if (cardForm) {
        cardForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic validation
            const cardNumber = document.getElementById('cardNumber').value;
            const cardName = document.getElementById('cardName').value;
            const cardExpiry = document.getElementById('cardExpiry').value;
            const cardCvv = document.getElementById('cardCvv').value;
            
            if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
                showAlert('Please fill in all card details', 'danger');
                return;
            }
            
            // Check card number format (simple validation)
            if (cardNumber.replace(/\s/g, '').length < 16) {
                showAlert('Please enter a valid card number', 'danger');
                return;
            }
            
            processPayment('card');
        });
    }
    
    // UPI form submission
    const upiForm = document.querySelector('.payment-method[data-method="upi"] .btn-primary.w-100');
    if (upiForm) {
        upiForm.addEventListener('click', function(e) {
            e.preventDefault();
            const upiId = document.getElementById('upiId').value;
            
            if (upiId && upiId.includes('@')) {
                processPayment('upi');
            } else {
                showAlert('Please enter a valid UPI ID or select a UPI app', 'danger');
            }
        });
    }
    
    // Cash confirmation
    const cashButton = document.querySelector('.payment-method[data-method="cash"] .btn-primary');
    if (cashButton) {
        cashButton.addEventListener('click', function() {
            processPayment('cash');
        });
    }
    
    // Complete payment button
    const proceedButton = document.getElementById('proceedButton');
    if (proceedButton) {
        proceedButton.addEventListener('click', function() {
            const activeMethod = document.querySelector('.payment-method.active');
            if (activeMethod) {
                const methodType = activeMethod.getAttribute('data-method');
                
                // Validate based on method
                if (methodType === 'card') {
                    document.getElementById('cardPaymentForm').dispatchEvent(new Event('submit'));
                } else if (methodType === 'upi') {
                    const upiId = document.getElementById('upiId').value;
                    if (upiId && upiId.includes('@')) {
                        processPayment('upi');
                    } else {
                        showAlert('Please enter a valid UPI ID or select a UPI app', 'danger');
                    }
                } else {
                    processPayment(methodType);
                }
            }
        });
    }
    
    // Back button
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', function() {
            window.location.href = 'book-ride.html';
        });
    }
    
    // UPI options click handler
    const upiOptions = document.querySelectorAll('.upi-option');
    upiOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Add active class to selected UPI option
            upiOptions.forEach(opt => opt.classList.remove('bg-light'));
            this.classList.add('bg-light');
            
            const appName = this.querySelector('span').textContent;
            simulateUpiApp(appName);
        });
    });
    
    // Function to show alerts
    function showAlert(message, type = 'danger') {
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
            const bsAlert = new bootstrap.Alert(alertElement);
            bsAlert.close();
        }, 5000);
    }
    
    // Simulate UPI app opening
    function simulateUpiApp(appName) {
        showAlert(`Opening ${appName} for payment. Please complete the transaction in the app.`, 'info');
        
        // In a real app, this would trigger the UPI intent or deep link
        setTimeout(() => {
            const proceed = confirm(`${appName} simulation: Payment of ${fare} to Travel with Buddy. Proceed?`);
            if (proceed) {
                processPayment('upi');
            }
        }, 1000);
    }
    
    // Process payment function
    function processPayment(method) {
        // Show loading state
        const loadingBtn = document.querySelector('.payment-method.active .btn-primary');
        if (loadingBtn) {
            const originalText = loadingBtn.innerHTML;
            loadingBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
            loadingBtn.disabled = true;
            
            // Simulate payment processing (would be an API call in real app)
            setTimeout(() => {
                loadingBtn.innerHTML = originalText;
                loadingBtn.disabled = false;
                
                // If user is logged in, save payment to Firestore
                const user = firebase.auth().currentUser;
                if (user) {
                    savePaymentData(user, method);
                }
                
                // Show success modal
                const successModal = new bootstrap.Modal(document.getElementById('paymentSuccessModal'));
                successModal.show();
            }, 2000);
        }
    }
    
    // Save payment data to Firestore
    function savePaymentData(user, paymentMethod) {
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            console.error("Firestore not available");
            return;
        }
        
        const paymentData = {
            userId: user.uid,
            userEmail: user.email,
            paymentMethod: paymentMethod,
            amount: document.getElementById('summaryFare').textContent,
            rideDetails: {
                pickup: document.getElementById('summaryPickup').textContent,
                destination: document.getElementById('summaryDestination').textContent,
                rideType: document.getElementById('summaryRideType').textContent
            },
            status: 'completed',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        firebase.firestore().collection('payments')
            .add(paymentData)
            .then(docRef => {
                console.log('Payment saved successfully with ID:', docRef.id);
            })
            .catch(error => {
                console.error('Error saving payment:', error);
            });
    }
    
    // Credit card validation (basic)
    function validateCreditCard(number) {
        // Remove spaces and non-digits
        number = number.replace(/\D/g, '');
        
        // Check length
        if (number.length < 13 || number.length > 19) {
            return false;
        }
        
        // Luhn algorithm (basic check digit validation)
        let sum = 0;
        let double = false;
        
        for (let i = number.length - 1; i >= 0; i--) {
            let digit = parseInt(number.charAt(i));
            
            if (double) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            
            sum += digit;
            double = !double;
        }
        
        return (sum % 10) === 0;
    }
}); 