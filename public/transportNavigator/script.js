class FacilityManager {
  constructor() {
    this.currentLocation = null;
    this.facilities = [];
    this.filtered = [];
    this.selectedFilter = null;

    this.locationElement = document.getElementById('currentLocation');
    this.activeFiltersContainer = document.getElementById('activeFilters');
    this.list = document.getElementById('facilityList');
    this.placeholder = document.getElementById('detailsPlaceholder');
    this.details = document.getElementById('facilityDetails');
    this.facilityMap = document.getElementById('facilityMap');
    this.startNavigation = document.getElementById('startNavButton');

    this.init();
  }

  async init() {
    await this.fetchFacilities();
    document.getElementById('userLocation').addEventListener('click', () => {
      this.handleLocationAccess();
    });
    this.bindSearch();
    this.bindFilters();
    this.renderList();
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
      this.fetchFacilitiesByType('Saved');
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
    }
}

document.addEventListener('DOMContentLoaded', () => {
  const facilityManager = new FacilityManager();
});