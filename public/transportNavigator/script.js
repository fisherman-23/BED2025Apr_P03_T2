class FacilityManager {
  constructor(facilities) {
    this.facilities = facilities;
    this.filtered = facilities;

    this.list = document.getElementById('facilityList');
    this.placeholder = document.getElementById('detailsPlaceholder');
    this.details = document.getElementById('facilityDetails');
    this.startNavigation = document.getElementById('startNavButton');

    this.bindSearch();
    this.renderList();
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

    document.getElementById('facilityImage').src = facility.image;
    document.getElementById('facilityName').innerText = facility.name;
    document.getElementById('facilityLocation').innerText = facility.location;
    document.getElementById('facilityAddress').innerText = facility.address;
    document.getElementById('facilityPhone').innerText = facility.phone || 'N/A';
    document.getElementById('facilityHours').innerText = facility.hours;
    }
}

// Sample data for facilities
const sampleFacilities = [
  {
    facilityID: 1,
    name: "Raffles Medical - Clementi",
    location: "Blk 446 Clementi Ave 3",
    address: "Clementi Ave 3, #01-189, Singapore 120446",
    postalCode: "120446",
    facilityType: "polyclinic",
    phone: "6872 9043",
    hours: "8:00 AM - 9:30 PM",
    image: "/transportNavigator/images/raffles-medical.png"
  },
  {
    facilityID: 2,
    name: "West Coast Community Centre",
    location: "2 Clementi West St 2",
    address: "2 Clementi West St 2, Singapore 129605",
    postalCode: "129605",
    facilityType: "community centre",
    phone: "6779 1098",
    hours: "10:00 AM - 10:00 PM",
    image: "https://www.pa.gov.sg/images/default-source/pa-community-centres/west-coast-community-club.jpg"
  },
  {
    facilityID: 3,
    name: "Clementi Woods Park",
    location: "West Coast Rd",
    address: "West Coast Rd, Singapore 126800",
    postalCode: "126800",
    facilityType: "park",
    phone: "",
    hours: "Open 24 hours",
    image: "https://www.nparks.gov.sg/-/media/nparks-real-content/gardens-parks-and-nature/parks-and-nature-reserves/clementi-woods-park/1.jpg"
  }
];

const facilityManager = new FacilityManager(sampleFacilities);
