require('dotenv').config({ path: '../../.env' });
const { saveFacility } = require('../../models/facilitiesModel.js');

// populateFacilities.js
const googleMapsClient = require('@google/maps').createClient({
  key: process.env.GOOGLE_MAPS_API_KEY,
  Promise: Promise
});

// Facility type mapping
function determineFacilityType(googleTypes) {
    const typeMapping = {
        'hospital': 'Hospital',
        'health': 'Polyclinic',
        'doctor': 'Polyclinic',
        'clinic': 'Polyclinic',
        'point_of_interest': 'Community Center',
        'park': 'Park',
        'garden': 'Park'
    };

    for (const type of googleTypes) {
        if (typeMapping[type]) {
            return typeMapping[type];
        }
    }
    return null;
}


async function getGooglePlacePhoto(photoRef) {
    if (!photoRef) return null;
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    return photoUrl;
}

async function populateAllFacilities() {
  const types = [
    { googleType: 'hospital', keyword: 'polyclinic', ourType: 'Polyclinic' },
    { googleType: 'hospital', ourType: 'Hospital' },
    { googleType: 'point_of_interest', keyword: "community club", ourType: 'Community Center' },
    { googleType: 'park', ourType: 'Park' }
  ];

  try {
    for (const type of types) {
        const results = await googleMapsClient.placesNearby({
        location: '1.3521,103.8198', // Singapore coords
        radius: 10000, // 10km
        type: type.googleType,
        keyword: type.keyword || null
        }).asPromise();

    for (const place of results.json.results) {
        const facilityType = determineFacilityType(place.types);
        if (!facilityType) continue;
        const details = await googleMapsClient.place({
            placeid: place.place_id
        }).asPromise();
        
        const photoRef = place.photos?.[0]?.photo_reference;
        const photoUrl = photoRef ? await getGooglePlacePhoto(photoRef) : null;

        const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${
            place.geometry.location.lat},${place.geometry.location.lng
        }&zoom=15&size=400x200&markers=color:red%7C${
            place.geometry.location.lat},${place.geometry.location.lng
        }&key=${process.env.GOOGLE_MAPS_API_KEY}`;

        await saveFacility({
            name: place.name,
            address: place.vicinity || details.json.result.formatted_address,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            facilityType: type.ourType,
            phoneNo: details.json.result.formatted_phone_number || null,
            hours: details.json.result.opening_hours?.weekday_text?.join('; ') || null,
            image_url: photoUrl,
            static_map_url: staticMapUrl,
            google_place_id: place.place_id
        });
        console.log(`Saved ${place.name} as ${type.ourType}`);
        }
    }
    console.log('All facilities populated successfully.');
  } catch (error) {
    console.error('Error populating facilities:', error);
  }
}

populateAllFacilities();