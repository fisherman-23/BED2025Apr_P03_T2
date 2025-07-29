document.addEventListener('DOMContentLoaded', function() {
    // Get facility ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    let facilityId = urlParams.get('facilityId');
    
    let map;
    let directionsService;
    let directionsRenderer;
    let autocompletePlace = null;
    let facilityCoords = null;
    let currentMode = 'TRANSIT'; // Default mode
    let latestDirectionsResponse = null;
    
    const startInput = document.getElementById('startLocation');
    const endInput = document.getElementById('endLocation');

    // Initialize the map
    async function initMap() {
        await google.maps.importLibrary('places');

        map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: 1.3521, lng: 103.8198 }, // Default to Singapore
            zoom: 12
        });

        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer({
            map: map,
            suppressMarkers: false
        });
        // Set up autocomplete for start location
        const autocomplete = new google.maps.places.Autocomplete(startInput, {
            componentRestrictions: { country: 'SG' },
            fields: ['formatted_address', 'geometry'],
        });
        // Listen for place changes
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (!place || !place.geometry) return;
            // Update autocompletePlace with selected place
            autocompletePlace = {
                geometry: { location: place.geometry.location },
                formatted_address: place.formatted_address
            };
            // Set the start input value to the formatted address
            startInput.value = place.formatted_address;
            // If facility coordinates are set, try to route
            if (facilityCoords) tryRoute();
        });
        
        // Fetch facility details and set destination
        const facility = await fetchFacilityDetails(facilityId);
        if (facility && facility.latitude && facility.longitude) {
            endInput.value = facility.name;
            facilityCoords = { lat: facility.latitude, lng: facility.longitude };
            map.setCenter(facilityCoords);
            tryRoute();
        } else {
            alert('Unable to load facility details. Please try again later.');
        }

        // Set up transport mode buttons
        document.querySelectorAll('.transport-option').forEach(button => {
            button.addEventListener('click', function() {
                document.querySelectorAll('.transport-option').forEach(btn => {
                    btn.classList.remove('active');
                });
                this.classList.add('active');
                currentMode = this.dataset.mode;
                tryRoute();
            });
        });
        // Update active button based on current mode
        document.querySelectorAll('.transport-option').forEach(button => {
            if (button.dataset.mode === currentMode) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        // Set up event listener for start input
        if (navigator.geolocation) {
            // Get user's current location
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const latlng = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    // Set map center to user's location
                    map.setCenter(latlng);
                    const geocoder = new google.maps.Geocoder();
                    geocoder.geocode({ location: latlng }, (results, status) => {
                        // Set start input to user's address
                        if (status === 'OK' && results[0]) {
                            startInput.value = results[0].formatted_address;
                            autocompletePlace = {
                                geometry: { location: results[0].geometry.location },
                                formatted_address: results[0].formatted_address
                            };
                            if (facilityCoords) tryRoute();
                        }
                    });
                },
                () => {
                    console.warn('Geolocation permission denied. Please enter your location manually.');
                }
            );
        }

        startInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const valid = startInput.value.trim();
                if (!valid) {
                    alert('Please enter a valid starting location.');
                    return;
                }
                processStartLocationInput(valid);
            }
        });
        // Handle focus on start input
        startInput.addEventListener('focus', (e) => {
            if (e.target.value === 'Enter your current location') {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const latlng = {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude
                            };
                            // Set map center to user's location
                            const geocoder = new google.maps.Geocoder();
                            geocoder.geocode({ location: latlng }, (results, status) => {
                                if (status === 'OK' && results[0]) {
                                    e.target.value = results[0].formatted_address;
                                    autocompletePlace = {
                                        geometry: { location: results[0].geometry.location },
                                        formatted_address: results[0].formatted_address
                                    };
                                    tryRoute();
                                }
                            });
                        },
                        () => {
                            console.warn('Geolocation permission denied. Please enter your location manually.');
                        }
                    );
                }
            }
        });
    }
    // Process start location input
    function processStartLocationInput(input) {
        if (autocompletePlace && autocompletePlace.formatted_address === input) {
            // If the input matches the autocomplete place, calculate route
            calculateAndDisplayRoute();
        } else {
            // If the input doesn't match, geocode the address
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address: input }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    autocompletePlace = {
                        geometry: { location: results[0].geometry.location },
                        formatted_address: results[0].formatted_address
                    };
                    calculateAndDisplayRoute();
                } else {
                    console.error('Geocode was not successful for the following reason:', status);
                }
            });
        }
    }
    // Try to route from start to end
    function tryRoute() {
        if (!facilityCoords) {
            console.warn('No facility coordinates available.');
            return;
        }
        if (!autocompletePlace || !autocompletePlace.geometry) {
            console.warn('No valid starting location selected.');
            return;
        }
        calculateAndDisplayRoute()
    }

    // Calculate and display route
    function calculateAndDisplayRoute() {
        const origin = autocompletePlace.geometry.location
        const destination = new google.maps.LatLng(facilityCoords.lat, facilityCoords.lng);
        // Request directions from Google Maps API
        directionsService.route({
            origin,
            destination,
            travelMode: google.maps.TravelMode[currentMode],
            provideRouteAlternatives: true,
            unitSystem: google.maps.UnitSystem.METRIC,
        }, (response, status) => {
            if (status === 'OK') {
                latestDirectionsResponse = response;
                displayRoutesList(response);
                showRouteOnMap(0);
            } else {
                console.error('Directions request failed:', status);
                alert('Could not calculate route. Please check your start location and try again.');
            }
        });
    }
    // Show route on map
    function showRouteOnMap(routeIndex) {
        if (!latestDirectionsResponse) return;
        const selectedRoute = {
            ...latestDirectionsResponse,
            routes: [latestDirectionsResponse.routes[routeIndex]]
        };
        directionsRenderer.setDirections(selectedRoute);
        map.fitBounds(selectedRoute.routes[0].bounds);
    }

    // Display routes in the sidebar
    function displayRoutesList(response) {
        const routesList = document.getElementById('routesList');
        routesList.innerHTML = '';
        
        // Sort routes by duration (fastest first)
        const sortedRoutes = response.routes
            .map((route, originalIndex) => ({ route, originalIndex }))
            .sort((a, b) => a.route.legs[0].duration.value - b.route.legs[0].duration.value);
        
        sortedRoutes.forEach(({ route, originalIndex }, i) => {
            const routeElement = document.createElement('div');
            routeElement.className = 'route-item';
            
            // Summary info
            const summary = document.createElement('div');
            summary.className = 'route-summary';
            summary.innerHTML = `
                <h3>Route ${i + 1}</h3>
                <p>${route.legs[0].distance.text} • ${route.legs[0].duration.text}</p>
            `;
            
            // Details (hidden by default)
            const details = document.createElement('div');
            details.className = 'route-details';
            details.style.display = 'none';
            
            // Add step-by-step instructions
            route.legs[0].steps.forEach(step => {
                const stepElement = document.createElement('div');
                stepElement.className = 'route-step';
                stepElement.innerHTML = `
                    <p>${step.instructions}</p>
                    <small>${step.distance.text} • ${step.duration.text}</small>
                `;
                details.appendChild(stepElement);
            });
            
            // Toggle details on click
            summary.addEventListener('click', () => {
                showRouteOnMap(originalIndex);
                showFocusedRoute(route, i + 1, originalIndex);
            });
            
            routeElement.appendChild(summary);
            routesList.appendChild(routeElement);
        });
    }

    // Show focused route details
    function showFocusedRoute(route, index) {
        const routesList = document.getElementById('routesList');
        routesList.innerHTML = '';
        const backButton = document.createElement('button');
        backButton.textContent = `< Back to all routes`;
        backButton.className = 'back-button';
        backButton.addEventListener('click', () => {
            displayRoutesList(latestDirectionsResponse);
            showRouteOnMap(0);
        });
        const routeElement = document.createElement('div');
        routeElement.className = 'focused-route';

        const summary = document.createElement('div');
        summary.className = 'route-summary';
        summary.innerHTML = `
            <h3>Route ${index + 1}</h3>
            <p>${route.legs[0].distance.text} • ${route.legs[0].duration.text}</p>
        `;

        const details = document.createElement('div');
        details.className = 'route-details';

        route.legs[0].steps.forEach(step => {
            const stepElement = document.createElement('div');
            stepElement.className = 'route-step';
            stepElement.innerHTML = `
                <p>${step.instructions}</p>
                <small>${step.distance.text} • ${step.duration.text}</small>
            `;
            details.appendChild(stepElement);
        });

        // Add actions buttons
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'route-actions';
        const reviewButton = document.createElement('button');
        reviewButton.textContent = 'Submit Review';
        reviewButton.className = 'review-button';
        reviewButton.addEventListener('click', () => {
            showReviewModal();
        });
        
        const endButton = document.createElement('button');
        endButton.textContent = 'End Navigation';
        endButton.className = 'end-button';
        endButton.addEventListener('click', () => {
            alert('Navigation ended. Thank you for using our service!');
            directionsRenderer.set('directions', null);
            routesList.innerHTML = '';
            window.location.href = "/facilities.html";
        });

        actionsContainer.appendChild(reviewButton);
        actionsContainer.appendChild(endButton);

        routeElement.appendChild(summary);
        routeElement.appendChild(details);
        routeElement.appendChild(actionsContainer);

        routesList.appendChild(backButton);
        routesList.appendChild(routeElement);
    }

    // Get facility details from the database for latitude and longitude
    async function fetchFacilityDetails(facilityId) {
        try {
            const res = await fetch(`/facilities/id/${facilityId}`, {
                method: "GET",
                credentials: "include"
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Network response was not ok' }));
                throw new Error(errorData.error || `Failed to fetch facility: ${res.statusText}`);
            }
            const facility = await res.json();
            return facility;
        } catch (error) {
            console.error('Error fetching facility details:', error);
            alert(error.message || 'Unable to load facility details. Please try again later.');
            window.location.href = '/facilities.html';
            return null;
        }
    }

    async function loadGoogleMaps() {
        try {
            // Fetch Google Maps configuration from backend
            const response = await fetch('/api/google-maps-config', {
                method: "GET",
                credentials: "include"
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to load map configuration' }));
                throw new Error(errorData.error || `Failed to load map configuration: ${response.statusText}`);
            }
            
            const config = await response.json();
            // Load Google Maps script dynamically
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${config.apiKey}&libraries=${config.libraries.join(',')}&callback=initMap&loading=${config.loading}`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        } catch (error) {
            console.error('Error loading Google Maps configuration:', error);
            alert(error.message || 'Unable to load map configuration. Please refresh the page and try again.');
        }
    }

    // Show review modal
    async function showReviewModal() {
        const modalHTML = `
        <div id="reviewModal" class="review-modal">
            <div class="modal-content">
                <h3>Leave a Review</h3>
                <div class="rating-input">
                    <h4>Accessibility Rating:</h4>
                    <div class="number-rating" id="editRating">
                        ${[1, 2, 3, 4, 5].map(num => `
                            <button class="rating-number" data-value="${num}">${num}</button>
                        `).join('')}
                    </div>
                </div>
                <textarea id="editComment" placeholder= "Leave a comment..."></textarea>
                <div class="modal-actions">
                    <button id="cancelReview" class="cancel-review-button">Cancel</button>
                    <button id="saveReview" class="submit-review-button">Submit</button>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setupReviewModalListeners();
    }

    // Set up review modal listeners
    function setupReviewModalListeners() {
        document.querySelectorAll('.rating-number').forEach(button => {
            button.addEventListener('click', (e) => {
                document.querySelectorAll('.rating-number').forEach(button => 
                    button.classList.remove('selected')
                );
                e.target.classList.add('selected');
            });
        });
        document.getElementById('cancelReview').addEventListener('click', () => {
            document.getElementById('reviewModal').remove();
        });
        document.getElementById('saveReview').addEventListener('click', async () => {
            await handleSaveReview();
        });
    }

    // Handle save review
    async function handleSaveReview() {
        const ratingButtons = document.querySelectorAll('.rating-number.selected');
        const rating = ratingButtons.length > 0 ? parseInt(ratingButtons[0].dataset.value) : null;
        const comment = document.getElementById('editComment').value.trim();

        if (!rating) {
            alert('Please select a rating before submitting your review.');
            return;
        }

        try {
            const response = await fetch(`/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ facilityId, rating, comment })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to submit review: ${response.status} - ${response.statusText}`);
            }

            alert('Thank you for your review!');
            document.getElementById('reviewModal').remove();
        } catch (error) {
            console.error('Error submitting review:', error);
            alert(error.message || 'Unable to submit your review. Please try again.');
        }
    }

    window.addEventListener('load', loadGoogleMaps);

    // Initialize when Google Maps API is loaded
    window.initMap = initMap;
});