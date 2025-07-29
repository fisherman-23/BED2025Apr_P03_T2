class ReviewManager {
    constructor() {
        // Get facilityId from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        this.facilityId = urlParams.get('facilityId');
        
        if (!this.facilityId) {
        console.error('Missing facilityId in URL');
        return;
        }
        // Initialize properties
        this.currentUserId = null;
        this.reviews = [];
        this.currentSort = 'newest';
        this.currentEditReviewId = null;
        this.init();
    }

    async init() {
        await this.getCurrentUser();
        await this.loadFacilityDetails();
        this.createEditReviewModal();
        await this.loadReviews();
        this.setupEventListeners();
    }
    // Fetch current user details for managing editing and deleting user's reviews
    async getCurrentUser() {
        try {
            const res = await fetch('/me', {
                method: "GET",
                credentials: "include"
            });
            if (!res.ok) {
                throw new Error("Failed to fetch current user");
            }
            const user = await res.json();
            this.currentUserId = user.id;
        } catch (error) {
            console.error("Error fetching current user:", error);
        }
    }
    // Load facility details to display on the page
    async loadFacilityDetails() {
        try {
            const res = await fetch(`/facilities/id/${this.facilityId}`, {
                method: "GET",
                credentials: "include"
            });
            if (!res.ok) {
                throw new Error("Failed to fetch facility details");
            }
            const facility = await res.json();
            console.log("Facility details loaded:", facility);
            this.renderFacilityDetails(facility);

        } catch (error) {
            console.error("Error loading facility details:", error);
        }
    }
    // Render facility details on the page
    renderFacilityDetails(facility) {
        document.getElementById('facilityName').textContent = facility.name;
        document.getElementById('facilityAddress').textContent = facility.address;
        document.getElementById('facilityPhone').textContent = facility.phoneNo;
        document.getElementById('facilityHours').textContent = facility.hours;
        document.getElementById('facilityImage').src = facility.image_url;
        document.getElementById('facilityMap').src = facility.static_map_url;
    }
    // Create modal for editing existing reviews by the user
    createEditReviewModal() {
        const modalHTML = `
        <div id="editReviewModal" class="edit-modal">
            <div class="modal-content">
                <h3>Edit Review</h3>
                <div class="rating-input">
                    <h4>Accessibility Rating:</h4>
                    <div class="number-rating" id="editRating">
                        ${[1, 2, 3, 4, 5].map(num => `
                            <button class="rating-number" data-value="${num}">${num}</button>
                        `).join('')}
                    </div>
                </div>
                <textarea id="editComment" placeholder="Edit your review here..."></textarea>
                <div class="modal-actions">
                    <button id="cancelEdit" class="cancel-edit-button">Cancel</button>
                    <button id="saveEdit" class="save-edit-button">Save</button>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.setupModalEventListeners();
    }
    // Set up event listeners for the edit modal
    setupModalEventListeners() {
        document.querySelectorAll('.rating-number').forEach(button => {
            button.addEventListener('click', (e) => {
                document.querySelectorAll('.rating-number').forEach(button => 
                    button.classList.remove('selected')
                );
                e.target.classList.add('selected');
            });
        });
        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.closeEditModal();
        });
        document.getElementById('saveEdit').addEventListener('click', async () => {
            await this.handleSaveEdit();
        });
    }
    // Open the edit modal with pre-filled review data
    openEditModal(review) {
        this.currentEditReviewId = review.reviewId;
        document.getElementById('editComment').value = review.comment;
        document.querySelectorAll('.rating-number').forEach(button => {
            button.classList.remove('selected');
            if (parseInt(button.dataset.value) === review.Rating) {
                button.classList.add('selected');
            }
        });
        document.getElementById('editReviewModal').style.display = 'flex';
    }
    // Close the edit modal
    closeEditModal() {
        this.currentEditReviewId = null;
        document.getElementById('editReviewModal').style.display = 'none';
    }
    // Handle saving the edited review
    async handleSaveEdit() {
        if (!this.currentEditReviewId) {
            console.error("No review ID set for editing");
            return;
        }
        const selected = document.querySelector('.rating-number.selected');
        if (!selected) {
            alert('Please select a rating');
            return;
        }
        
        const rating = selected.dataset.value;
        const comment = document.getElementById('editComment').value;
        // Send updated review data to the database
        try {
            const res = await fetch(`/reviews/${this.currentEditReviewId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ rating, comment })
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `Failed to update review: ${res.statusText}`);
            }
            const updatedReview = await res.json();
            console.log("Review updated:", updatedReview);
            alert("Review updated successfully.");
            await this.loadReviews();
            this.closeEditModal();
        } catch (error) {
            console.error("Error updating review:", error);
            alert(error.message || "Failed to update review. Please try again.");
        }
    }
    // Load reviews for the facility
    async loadReviews() {
        try {
            const res = await fetch(`/reviews/${this.facilityId}?sort=${this.currentSort}`, {
                method: "GET",
                credentials: "include"
            });
            if (!res.ok) {
                throw new Error("Failed to fetch reviews");
            }
            this.reviews = await res.json();
            this.renderReviews();
        } catch (error) {
            console.error("Error loading reviews:", error);
        }
    }
    // Render reviews on the page
    renderReviews() {
        const reviewList = document.getElementById('reviewsList');
        reviewList.innerHTML = '';
        if (this.reviews.length === 0) {
            reviewList.innerHTML = '<p>No reviews available for this facility.</p>';
            return;
        }
        // Sort reviews based on current sort type
        this.reviews.forEach(review => {
            const reviewElement = this.createReviewElement(review);
            reviewList.appendChild(reviewElement);
        });
    }
    // Create a review element for rendering
    createReviewElement(review) {
        const isCurrentUser = this.currentUserId === review.userId;
        const date = new Date(review.createdAt).toLocaleDateString();
        const reviewElement = document.createElement('div');
        reviewElement.className = 'review-card';
        reviewElement.dataset.reviewId = review.reviewId;

        reviewElement.innerHTML = `
        <div class="review-header">
            <div class="review-user-info">
                <img src="${review.ProfilePicture}" alt="User Profile Picture" class="user-profile-pic">
                <span class="user-name">${review.UserName}</span>
                <span class="review-date">${date}</span>
            </div>
            <div class="review-actions">
                <button class="button-icon review-menu-button">
                    <img src="/assets/icons/ellipsis-menu.svg" alt="Menu Icon">
                </button>
                <div class="review-menu-dropdown">
                    ${isCurrentUser ? `
                        <button class="review-edit-button">Edit</button>
                        <button class="review-delete-button">Delete</button>
                    ` : `
                        <button class="review-report-button">Report</button>
                    `}
                </div>
            </div>
        </div>
        <div class="review-rating">Accessibility Rating: ${review.rating}/5</div>
        <div class="review-content">${review.comment}</div>
        `;

        const menuButton = reviewElement.querySelector('.review-menu-button');
        const dropdown = reviewElement.querySelector('.review-menu-dropdown');

        menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        // Allow editing or deleting reviews only for the current user
        if (isCurrentUser) {
            reviewElement.querySelector('.review-edit-button').addEventListener('click', (e) => {
                e.stopPropagation();
                this.openEditModal(review);
            });     
            reviewElement.querySelector('.review-delete-button').addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleDeleteReview(review.reviewId);
            });
        // Allow reporting reviews for other user's reviews
        } else {
            reviewElement.querySelector('.review-report-button').addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleReportReview(review.reviewId);
            });
        }
        return reviewElement;
    }
    // Set up event listeners for the review actions
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.review-actions')) {
                document.querySelectorAll('.review-menu-dropdown').forEach(dropdown => {
                    dropdown.classList.remove('show');
                });  
            }
        });
        // Filter button functionality
        const filterButton = document.getElementById('filterButton');
        const filterDropdown = document.getElementById('filterDropdown');
        const currentFilter = document.getElementById('currentFilter');

        filterButton.addEventListener('click', (e) => {
            e.stopPropagation();
            filterDropdown.classList.toggle('show');
        });
        document.querySelectorAll('.filter-option').forEach(option => {
            option.addEventListener('click', async (e) => {
                e.stopPropagation();
                const sortType = e.target.dataset.sort;
                this.currentSort = sortType;
                currentFilter.textContent = e.target.textContent;
                filterDropdown.classList.remove('show');
                this.sortAndRenderReviews();
            });
        });
        document.addEventListener('click', () => {
            filterDropdown.classList.remove('show');
        });
    }
    // Sort and render reviews based on the current sort type
    sortAndRenderReviews() {
        if (this.currentSort === 'newest') {
            this.reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (this.currentSort === 'oldest') {
            this.reviews.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (this.currentSort === 'highest') {
            this.reviews.sort((a, b) => b.rating - a.rating);
        } else if (this.currentSort === 'lowest') {
            this.reviews.sort((a, b) => a.rating - b.rating);
        } else {
            this.reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        this.renderReviews();
    }
    // Handle reporting a review
    async handleReportReview(reviewId) {
        // Prompt user for report reason
        const reason = prompt("Please enter the reason for reporting this review:");
        try {
            const res = await fetch(`/reports`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ 
                    reviewId: reviewId,
                    reason: reason
                })
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `Failed to report review: ${res.statusText}`);
            }
            await this.loadReviews();
            alert("Review reported successfully.");
        } catch (error) {
            console.error("Error reporting review:", error);
            alert(error.message || "Failed to report review. Please try again.");
        }
    }
    // Handle deleting a review
    async handleDeleteReview(reviewId) {
        if (confirm("Are you sure you want to delete this review?")) {
            try {
                const res = await fetch(`/reviews/${reviewId}`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include"
                });
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || `Failed to delete review: ${res.statusText}`);
                }
                await this.loadReviews();
                alert("Review deleted successfully.");
            } catch (error) {
                console.error("Error deleting review:", error);
                alert(error.message || "Failed to delete review. Please try again.");
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new ReviewManager();
});