class FacilityManager {
  constructor() {
    this.facilities = [];
    this.filtered = [];
    this.selectedFilter = null;
    this.activeFiltersContainer = document.getElementById('activeFilters');

    this.list = document.getElementById('facilityList');
    this.placeholder = document.getElementById('detailsPlaceholder');
    this.details = document.getElementById('facilityDetails');
    this.startNavigation = document.getElementById('startNavButton');

    this.init();
  }

  async init() {
    await this.fetchFacilities();
    this.bindSearch();
    this.bindFilters();
    this.renderList();
  }

  async fetchFacilities() {
    try {
      const res = await fetch(`/facilities`, {
        method: "GET",
        /*credentials: "include"*/
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch facilities: ${res.statusText}`);
      }
      this.facilities = await res.json();
      this.filtered = this.facilities; // initialize filtered with all facilities
    } catch (error) {
      console.error("Error fetching facilities:", error);
      this.list.innerHTML = '<p>Error loading facilities. Please try again later.</p>';
      this.placeholder.style.display = 'none';
    }
  }

  async fetchFacilitiesByType(facilityType) {
    try {
      const encodedType = encodeURIComponent(facilityType);
      const res = await fetch(`/facilities/${encodedType}`, {
        method: "GET",
        /*credentials: "include"*/
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch facilities by type: ${res.statusText}`);
      }
      this.facilities = await res.json();
      this.filtered = this.facilities; // reset filtered to the new facilities
      this.renderList();
    } catch (error) {
      console.error("Error fetching facilities by type:", error);
      this.list.innerHTML = '<p>Error loading facilities. Please try again later.</p>';
      this.placeholder.style.display = 'none';
    }
  }

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

  bindFilters() {
    document.getElementById('filterByPolyclinics').addEventListener('click', () => this.applyFilter('Polyclinic'));
    document.getElementById('filterByCommunityCentres').addEventListener('click', () => this.applyFilter('Community Centre'));
    document.getElementById('filterByParks').addEventListener('click', () => this.applyFilter('Park'));
    document.getElementById('filterBySaved').addEventListener('click', () => this.applyFilter('Saved'));
  }

  applyFilter(facilityType) {
      if (this.selectedFilter === facilityType) {
        this.removeFilter();
        return;
      }

      this.selectedFilter = facilityType;
      this.updateActiveFilters(facilityType);

      if (facilityType === 'Saved') {
        // Implement logic to filter saved facilities
      } else {
        this.filtered = this.facilities.filter(f => f.facilityType === facilityType);
      }
      this.renderList();
    }

    updateActiveFilters(facilityType) {
      this.activeFiltersContainer.innerHTML = '<h3>Active Filters:</h3>';
      const button = document.createElement('button');
      button.className = 'active-filter';
      button.innerHTML = `${facilityType} <span class="remove-filter">&times;</span>`;
      button.addEventListener('click', () => this.removeFilter());
      this.activeFiltersContainer.appendChild(button);
    }

  removeFilter() {
    this.selectedFilter = null;
    this.activeFiltersContainer.innerHTML = '';
    this.filtered = this.facilities;
    this.renderList();
  }

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

  showDetails(facility) {
    this.placeholder.style.display = 'none';

    document.getElementById('facilityImage').classList.add('visible');
    document.querySelector('.facility-header').classList.add('visible');
    document.querySelector('.facility-info').classList.add('visible');
    document.getElementById('startNavButton').classList.add('visible');

    document.getElementById('facilityImage').src = facility.image_url;
    document.getElementById('facilityName').innerText = facility.name;
    document.getElementById('facilityLocation').innerText = facility.location;
    document.getElementById('facilityAddress').innerText = facility.address;
    document.getElementById('facilityPhone').innerText = facility.phone || 'N/A';
    document.getElementById('facilityHours').innerText = facility.hours;
    }
}

document.addEventListener('DOMContentLoaded', () => {
  const facilityManager = new FacilityManager();
});