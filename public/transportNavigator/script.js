class FacilityManager {
  constructor() {
    this.currentLocation = null;
    this.facilities = [];
    this.filtered = [];
    this.selectedFilter = null;
    this.currentFacility = null;
  }

  async initializeElements() {
    this.locationElement = document.getElementById('currentLocation');
    this.activeFiltersContainer = document.getElementById('activeFilters');
    this.list = document.getElementById('facilityList');
    this.placeholder = document.getElementById('detailsPlaceholder');
    this.details = document.getElementById('facilityDetails');
    this.facilityMap = document.getElementById('facilityMap');
    this.startNavigation = document.getElementById('startNavButton');
    this.bookmarkPopup = document.getElementById('bookmarkPopup');
    this.locationNameInput = document.getElementById('locationName');
    this.locationNotesInput = document.getElementById('locationNotes');
  }

  async init() {
    try {
      await this.initializeElements();
      await this.fetchFacilities();
      document.getElementById('userLocation').addEventListener('click', () => {
        this.handleLocationAccess();
      });
      this.bindSearch();
      this.bindFilters();

      // Set up event listeners for the bookmark popup
      document.getElementById('closeBookmarkPopup').addEventListener('click', () => {
        this.hideBookmarkPopup();
      });
      
      document.getElementById('saveBookmark').addEventListener('click', (e) => {
        e.preventDefault();
        this.saveBookmark();
      });

      this.renderList();
      } catch (error) {
      console.error("Error initializing FacilityManager:", error);
      }
  }

  // Handles the user's request to access their current location
  async handleLocationAccess() {
    this.locationElement.innerText = "Finding your current location...";
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          this.currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          await this.updateLocationName();
          await this.loadNearbyFacilities();
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to access your location. Please enable location services.");
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      this.locationElement.innerText = "Geolocation is not supported by this browser.";
    }
  }

  // Updates the location name based on the current location
  async updateLocationName() {
    try {
      const res = await fetch (`/api/geocode?lat=${this.currentLocation.latitude}&lng=${this.currentLocation.longitude}`, {
        method: "GET",
        credentials: "include"
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch location name: ${res.statusText}`);
      }
      const data = await res.json();
      const displaylocation = data.district || data.address || "Unknown Location";
      this.locationElement.innerText = displaylocation;
    } catch (error) {
      console.error("Error updating location name:", error);
      this.locationElement.innerText = "Unable to determine current location.";
    }
  }

  // Loads nearby facilities based on the current location
  async loadNearbyFacilities() {
    try {
      const res = await fetch(`/facilities/nearby?lat=${this.currentLocation.latitude}&lng=${this.currentLocation.longitude}`, {
        method: "GET",
        credentials: "include"
      });
      console.log ("Response status:", res.status);
      if (!res.ok) {
        throw new Error(`Failed to fetch nearby facilities: ${res.statusText}`);
      }
      const facilities = await res.json();

      if (facilities.length === 0) {
        this.list.innerHTML = '<p>No nearby facilities found. Getting all facilities...</p>';
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.fetchFacilities();
      } else {
        this.facilities = facilities; 
      }
      this.filtered = this.facilities;
      this.renderList();
    } catch (error) {
      console.error("Error loading nearby facilities:", error);
    }
  }

  //  Fetches all facilities from the database
  async fetchFacilities() {
    try {
      const res = await fetch(`/facilities`, {
        method: "GET",
        credentials: "include"
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch facilities: ${res.statusText}`);
      }
      this.facilities = await res.json();
      this.filtered = this.facilities; // initialize filtered with all facilities
      this.selectedFilter = null;
      this.activeFiltersContainer.innerHTML = '';
      this.renderList();
    } catch (error) {
      console.error("Error fetching facilities:", error);
      this.list.innerHTML = '<p>Error loading facilities. Please try again later.</p>';
      this.placeholder.style.display = 'none';
    }
  }

  //  Fetches facilities by type from the database
  async fetchFacilitiesByType(facilityType) {
    try {
      const encodedType = encodeURIComponent(facilityType);
      const res = await fetch(`/facilities/${encodedType}`, {
        method: "GET",
        credentials: "include"
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch facilities by type: ${res.statusText}`);
      }
      this.facilities = await res.json();
      this.filtered = this.facilities; // reset filtered to the new facilities
      this.selectedFilter = facilityType;
      this.updateActiveFilters(facilityType);
      this.renderList();
    } catch (error) {
      console.error("Error fetching facilities by type:", error);
      this.list.innerHTML = '<p>Error loading facilities. Please try again later.</p>';
      this.placeholder.style.display = 'none';
    }
  }

  async fetchBookmarkedFacilities() {
    try {
      const res = await fetch(`/bookmarks`, {
        method: "GET",
        credentials: "include"
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch bookmarked facilities: ${res.statusText}`);
      }
      this.facilities = await res.json();
      this.filtered = this.facilities;
      this.selectedFilter = 'Saved';
      this.updateActiveFilters('Saved');
      this.renderList();
    } catch (error) {
      console.error("Error fetching bookmarked facilities:", error);
      this.list.innerHTML = '<p>Error loading facilities. Please try again later.</p>';
      this.placeholder.style.display = 'none';
    }
  }

  // Binds the search input to filter facilities based on user input
  bindSearch() {
    const searchInput = document.getElementById('search');
    searchInput.addEventListener('input', () => {
      const keyword = searchInput.value.toLowerCase();
      this.filtered = this.facilities.filter(f =>
        f.name.toLowerCase().includes(keyword) ||
        f.address.toLowerCase().includes(keyword) ||
        f.facilityType.toLowerCase().includes(keyword)
      );
      this.renderList();
    });
  }

  // Binds filter buttons to fetch facilities by type
  bindFilters() {
    document.getElementById('filterByAll').addEventListener('click', () => {
      this.fetchFacilities();
    });
    document.getElementById('filterByPolyclinics').addEventListener('click', () => {
      this.fetchFacilitiesByType('Polyclinic');
    });
    document.getElementById('filterByCommunityCentres').addEventListener('click', () => {
      this.fetchFacilitiesByType('Community Center');
    });
    document.getElementById('filterByParks').addEventListener('click', () => {
      this.fetchFacilitiesByType('Park');
    });
    document.getElementById('filterBySaved').addEventListener('click', () => {
      this.fetchBookmarkedFacilities();
    });
    document.getElementById('filterByHospitals').addEventListener('click', () => {
      this.fetchFacilitiesByType('Hospital');
    });
  }

  // Updates the active filters display
  updateActiveFilters(facilityType) {
    this.activeFiltersContainer.innerHTML = '<h3>Active Filters:</h3>';
    const button = document.createElement('button');
    button.className = 'active-filter';
    button.innerHTML = `${facilityType} <span class="remove-filter">&times;</span>`;
    button.addEventListener('click', () => this.removeFilter());
    this.activeFiltersContainer.appendChild(button);
  }

  // Removes the selected filter and resets the facility list
  async removeFilter() {
    this.selectedFilter = null;
    this.activeFiltersContainer.innerHTML = '';
    await this.fetchFacilities(); // Reset to all facilities
    this.renderList();
  }

  // Renders the list of facilities based on the current filter
  renderList() {
    this.list.innerHTML = '';
    if (this.filtered.length === 0) {
      this.list.innerHTML = '<p>No facilities found.</p>';
      return;
    }

    this.filtered.forEach((facility, index) => {
      const card = document.createElement('div');
      card.className = 'facility-cards';
      card.innerHTML = `
        <div class="card-wrapper">
            <div class="bg-overlay"></div>
            <div class="facility-card">
            <h3>${facility.name}</h3>
            <p>${facility.address}</p>
            </div>
        </div>
      `;
      card.addEventListener('click', () => this.showDetails(facility));
      this.list.appendChild(card);
    });
  }

  // Displays the details of the selected facility
  showDetails(facility) {
    this.currentFacility = facility;
    this.placeholder.style.display = 'none';

    document.getElementById('facilityImage').classList.add('visible');
    document.querySelector('.facility-header').classList.add('visible');
    document.querySelector('.facility-info').classList.add('visible');
    document.getElementById('startNavButton').classList.add('visible');
    document.getElementById('facilityMap').classList.add('visible');
    document.getElementById('facilityImage').src = facility.image_url;
    document.getElementById('facilityName').innerText = facility.name;
    document.getElementById('facilityAddress').innerText = facility.address;
    document.getElementById('facilityPhone').innerText = facility.phoneNo || 'N/A';
    document.getElementById('facilityHours').innerText = facility.hours;
    document.getElementById('facilityMap').src = facility.static_map_url;

    this.initBookmarkButton(facility);
  }

  // Initializes the bookmark button for the selected facility
  async initBookmarkButton(facility) {
    const bookmarkButton = document.getElementById('bookmarkButton');
    const bookmarkIcon = document.getElementById('bookmarkIcon');

    // Check if the facility is already bookmarked
    const { isBookmarked, bookmarkId } = await this.checkIfBookmarked(facility.facilityId);
    bookmarkIcon.src = isBookmarked
      ? '/assets/icons/bookmark-filled.svg'
      : '/assets/icons/bookmark.svg';

    // Set up click event for the bookmark button
    bookmarkButton.onclick = () => {
      if(!isBookmarked) {
        this.showBookmarkPopup(facility);
      } else {
        if(confirm("Remove this bookmark?")) {
          this.removeBookmark(bookmarkId);
          bookmarkIcon.src = '/assets/icons/bookmark.svg';
          alert("Bookmark removed successfully!");
        }
      }
    };
  }

  async checkIfBookmarked(facilityId) {
    try {
      const res = await fetch(`/bookmarks/${facilityId}`, {
        method: 'GET',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`Failed to check bookmark status: ${res.statusText}`);
      }
      const data = await res.json();
      console.log("Bookmark status data:", data);
      return {
        isBookmarked: data.isBookmarked,
        bookmarkId: data.bookmarkId
      };

    } catch (error) {
      console.error("Error checking bookmark status:", error);
      return false;
    }
  }

  // Show bookmark popup with facility name input
  showBookmarkPopup(facility) {
    this.currentFacility = facility;
    this.bookmarkPopup.style.visibility = 'visible';
    this.locationNameInput.value = facility.name || '';
  }

  // Hides the bookmark popup
  hideBookmarkPopup() {
    this.bookmarkPopup.style.visibility = 'hidden';
    this.locationNameInput.value = '';
  }

  // Saves the current facility as a bookmark
  async saveBookmark() {
        console.log("Saving bookmark for facility:", this.currentFacility.facilityId);
    if (!this.currentFacility || !this.currentFacility.facilityId ) {
      console.error("No facility ID or missing required data for bookmarking.");
      return;
    }

    try {
      // Store bookmark data
      const bookmarkData = {
        facilityId: this.currentFacility.facilityId,
        locationName: this.locationNameInput.value || this.currentFacility.name,
        note: this.locationNotesInput.value || ''
      };
      console.log("Bookmark data:", bookmarkData);

      const res = await fetch(`/bookmarks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bookmarkData),
        credentials: "include"
      });

      if (!res.ok) {
        throw new Error(`Failed to save bookmark: ${res.statusText}`);
      }

      await this.initBookmarkButton(this.currentFacility);

      alert("Bookmark saved successfully!");
      this.hideBookmarkPopup();
      console.log("Bookmark saved successfully for facility:", this.currentFacility.facilityId);

    } catch (error) {
      console.error("Error saving bookmark:", error);
      alert("Failed to save bookmark. Please try again later.");
    }
  }

  async removeBookmark(bookmarkId) {
    try {
      const res = await fetch(`/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(`Failed to remove bookmark: ${res.statusText}`);
      }
      if (this.currentFacility) {
        await this.initBookmarkButton(this.currentFacility);
      }
    } catch (error) {
      console.error("Error removing bookmark:", error);
      alert("Failed to remove bookmark. Please try again later.");
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const facilityManager = new FacilityManager();
  facilityManager.init().catch(error => {
    console.error("Error initializing FacilityManager:", error);
    alert("Failed to initialize facilities. Please try again later.");
  });
});