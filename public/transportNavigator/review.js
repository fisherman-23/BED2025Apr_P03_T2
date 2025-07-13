class ReviewManager {
    constructor() {
        const urlParams = new URLSearchParams(window.location.search);
        this.facilityId = urlParams.get('facilityId');
        
        if (!this.facilityId) {
        console.error('Missing facilityId in URL');
        return;
        }
        this.currentUserId = null;
        this.reviews = [];
        this.currentSort = 'newest';
        this.currentEditReviewId = null;
        this.init();
    }

    async init() {
        if (!this.facilityId) {
            console.error("No facility ID found in URL");
            return;
        }

        await this.getCurrentUser();
        await this.loadFacilityDetails();
        this.createEditReviewModal();
        await this.loadReviews();
        this.setupEventListeners();
    }

    async getCurrentUser() {
        try {
            const res = await fetch('/me', {
                method: 'GET',
                headers: {
                    'content-Type': 'application/json',
                    'credentials': 'include'
                }
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

    async loadFacilityDetails() {
        try {
            const res = await fetch(`/facilities/id/${this.facilityId}`, {
                method: 'GET',
                headers: {
                    'content-Type': 'application/json',
                    'credentials': 'include'
                }
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

    renderFacilityDetails(facility) {
        document.getElementById('facilityName').textContent = facility.name;
        document.getElementById('facilityAddress').textContent = facility.address;
        document.getElementById('facilityPhone').textContent = facility.phoneNo;
        document.getElementById('facilityHours').textContent = facility.hours;
        document.getElementById('facilityImage').src = facility.image_url;
        document.getElementById('facilityMap').src = facility.static_map_url;
    }

    createEditReviewModal() {
        const modalHTML = `
        <div id="editReviewModal" class="edit-modal">
            <div class="modal-content">
                <h3>Edit Review</h3>
                <div class="rating-input">
                    <h4>Rating:</h4>
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

    closeEditModal() {
        this.currentEditReviewId = null;
        document.getElementById('editReviewModal').style.display = 'none';
    }

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
        try {
            const res = await fetch(`/reviews/${this.currentEditReviewId}`, {
                method: 'PUT',
                headers: {
                    'content-Type': 'application/json',
                    'credentials': 'include'
                },
                body: JSON.stringify({ rating, comment })
            });
            if (!res.ok) {
                throw new Error("Failed to update review");
            }
            const updatedReview = await res.json();
            console.log("Review updated:", updatedReview);
            alert("Review updated successfully.");
            await this.loadReviews();
            this.sortAndRenderReviews();
            this.closeEditModal();
        } catch (error) {
            console.error("Error updating review:", error);
            alert("Failed to update review. Please try again.");
        }
    }

    async loadReviews() {
        try {
            const res = await fetch(`/reviews/${this.facilityId}?sort=${this.currentSort}`, {
                method: 'GET',
                headers: {
                    'content-Type': 'application/json',
                    'credentials': 'include'
                }
            });
            if (!res.ok) {
                throw new Error("Failed to fetch reviews");
            }
            this.reviews = await res.json();            this.renderReviews();
        } catch (error) {
            console.error("Error loading reviews:", error);
        }
    }

    renderReviews() {
        const reviewList = document.getElementById('reviewsList');
        reviewList.innerHTML = '';
        if (this.reviews.length === 0) {
            reviewList.innerHTML = '<p>No reviews available for this facility.</p>';
            return;
        }

        this.reviews.forEach(review => {
            const reviewElement = this.createReviewElement(review);
            reviewList.appendChild(reviewElement);
        });
    }

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
                <div class="review-rating">Rating: ${review.rating}/5</div>
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
        <div class="review-content">${review.comment}</div>
        `;

        const menuButton = reviewElement.querySelector('.review-menu-button');
        const dropdown = reviewElement.querySelector('.review-menu-dropdown');

        menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });

        if (isCurrentUser) {
            reviewElement.querySelector('.review-edit-button').addEventListener('click', (e) => {
                e.stopPropagation();
                this.openEditModal(review);
            });
            
            reviewElement.querySelector('.review-delete-button').addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleDeleteReview(review.reviewId);
            });
        } else {
            reviewElement.querySelector('.review-report-button').addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleReportReview(review.reviewId);
            });
        }

        // Close dropdown when clicking outside 
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.review-actions')) {
                dropdown.classList.remove('show');
            }
        });
        
        return reviewElement;
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.review-actions')) {
                document.querySelectorAll('.review-menu-dropdown').forEach(dropdown => {
                    dropdown.classList.remove('show');
                });  
            }
        });

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

    async handleReportReview(reviewId) {
        console.log (`Reporting review with ID: ${reviewId}`);
        const reason = prompt("Please enter the reason for reporting this review:");
        if (!reason) {
            alert("Report cancelled. No reason provided.");
            return;
        }
        try {
            const res = await fetch(`/reports`, {
                method: 'POST',
                headers: {
                    'content-Type': 'application/json',
                    'credentials': 'include'
                },
                body: JSON.stringify({ 
                    reviewId: reviewId,
                    reason: reason
                })
            });
            if (!res.ok) {
            throw new Error("Failed to report review");
            }
            alert("Review reported successfully.");
        } catch (error) {
            console.error("Error reporting review:", error);
            alert("Failed to report review. Please try again.");
        }
    }

    async handleDeleteReview(reviewId) {
        if (confirm("Are you sure you want to delete this review?")) {
            try {
                const res = await fetch(`/reviews/${reviewId}`, {
                    method: 'DELETE',
                    headers: {
                        'content-Type': 'application/json',
                        'credentials': 'include'
                    }
                });
                if (!res.ok) {
                    throw new Error("Failed to delete review");
                }
                await this.loadReviews();
                alert("Review deleted successfully.");
            } catch (error) {
                console.error("Error deleting review:", error);
                alert("Failed to delete review. Please try again.");
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new ReviewManager();
});