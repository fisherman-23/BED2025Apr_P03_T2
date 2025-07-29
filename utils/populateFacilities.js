require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { saveFacility } = require('../../models/facilitiesModel.js');

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
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
}

// Validation function to check if facility data meets database constraints
function validateFacilityData(facilityData) {
    const errors = [];
    
    // Check all required fields
    if (!facilityData.name || facilityData.name.trim() === '') {
        errors.push('Name is required');
    } else if (facilityData.name.length > 100) {
        errors.push(`Name too long (${facilityData.name.length}/100 chars): "${facilityData.name.substring(0, 50)}..."`);
    }
    
    if (!facilityData.address || facilityData.address.trim() === '') {
        errors.push('Address is required');
    }
    
    if (!facilityData.facilityType || facilityData.facilityType.trim() === '') {
        errors.push('Facility type is required');
    } else {
        const validTypes = ['Polyclinic', 'Hospital', 'Park', 'Community Center'];
        if (!validTypes.includes(facilityData.facilityType)) {
            errors.push(`Invalid facility type: "${facilityData.facilityType}". Must be one of: ${validTypes.join(', ')}`);
        }
    }
    
    // Phone number is required
    if (!facilityData.phoneNo || facilityData.phoneNo.trim() === '') {
        errors.push('Phone number is required');
    } else if (facilityData.phoneNo.length > 20) {
        errors.push(`Phone number too long (${facilityData.phoneNo.length}/20 chars)`);
    }
    
    // Hours are required
    if (!facilityData.hours || facilityData.hours.trim() === '') {
        errors.push('Hours are required');
    } else if (facilityData.hours.length > 1000) {
        errors.push(`Hours too long (${facilityData.hours.length}/1000 chars)`);
    }
    
    // Image URL is required
    if (!facilityData.image_url || facilityData.image_url.trim() === '') {
        errors.push('Image URL is required');
    } else if (facilityData.image_url.length > 1000) {
        errors.push(`Image URL too long (${facilityData.image_url.length}/1000 chars)`);
    }
    
    // Static map URL is required
    if (!facilityData.static_map_url || facilityData.static_map_url.trim() === '') {
        errors.push('Static map URL is required');
    } else if (facilityData.static_map_url.length > 500) {
        errors.push(`Static map URL too long (${facilityData.static_map_url.length}/500 chars)`);
    }
    
    // Google place ID is required
    if (!facilityData.google_place_id || facilityData.google_place_id.trim() === '') {
        errors.push('Google place ID is required');
    } else if (facilityData.google_place_id.length > 100) {
        errors.push(`Google place ID too long (${facilityData.google_place_id.length}/100 chars)`);
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

async function populateAllFacilities() {
  const types = [
    { googleType: 'hospital', keyword: 'polyclinic', ourType: 'Polyclinic' },
    { googleType: 'hospital', ourType: 'Hospital' },
    { googleType: 'point_of_interest', keyword: "community centre", ourType: 'Community Center' },
    { googleType: 'park', ourType: 'Park' }
  ];

  try {
    for (const type of types) {
        console.log(`\n--- Searching for ${type.ourType} (${type.googleType}) ---`);
        const results = await googleMapsClient.placesNearby({
        location: '1.3644,103.8227', // Singapore coordinates
        radius: 12000, // 12km to cover Singapore better
        type: type.googleType,
        keyword: type.keyword || null,
        }).asPromise();
        
        console.log(`Found ${results.json.results.length} potential results for ${type.ourType}`);

    for (const place of results.json.results) {
        // Get detailed place information first to check address
        const details = await googleMapsClient.place({
            placeid: place.place_id
        }).asPromise();
        
        const fullAddress = details.json.result.formatted_address || place.vicinity || '';
        
        // Filter out places outside Singapore by checking address and coordinates
        const isInSingapore = fullAddress.toLowerCase().includes('singapore') ||
                             fullAddress.toLowerCase().includes('sg') ||
                             (place.geometry.location.lat >= 1.2 && place.geometry.location.lat <= 1.5 &&
                              place.geometry.location.lng >= 103.6 && place.geometry.location.lng <= 104.0);
        
        if (!isInSingapore) {
            console.log(`Skipping ${place.name} - not in Singapore (${fullAddress})`);
            continue;
        }

        // Special filtering for community centers
        if (type.googleType === 'point_of_interest') {
            const name = place.name.toLowerCase();
            const hasCommunityCentre = name.includes('community centre') || name.includes('community center');
            const hasCommunityClub = name.includes('community club');
            
            if (!hasCommunityCentre && !hasCommunityClub) {
                console.log(`Skipping ${place.name} - not a community centre/club`);
                continue;
            }
            console.log(`Found community facility: ${place.name}`);
        }

        const facilityType = determineFacilityType(place.types);
        if (!facilityType) {
            console.log(`Skipping ${place.name} - no matching facility type`);
            continue;
        }
        
        const photoRef = place.photos?.[0]?.photo_reference;
        const photoUrl = photoRef ? await getGooglePlacePhoto(photoRef) : null;

        // Generate full static map URL with API key for database storage
        const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${
            place.geometry.location.lat},${place.geometry.location.lng
        }&zoom=15&size=400x200&markers=color:red%7C${
            place.geometry.location.lat},${place.geometry.location.lng
        }&key=${process.env.GOOGLE_MAPS_API_KEY}`;

        // Prepare facility data
        const facilityData = {
            name: place.name,
            address: details.json.result.formatted_address || place.vicinity,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            facilityType: type.ourType,
            phoneNo: details.json.result.formatted_phone_number || 'Not available',
            hours: (details.json.result.opening_hours?.weekday_text?.join(' ') || 'Hours not available')
                .replace(/\u00A0/g, ' ')  // Replace non-breaking spaces
                .replace(/\u2009/g, ' ')  // Replace thin spaces
                .replace(/\u202F/g, ' ')  // Replace narrow no-break spaces
                .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ')  // Replace all unicode spaces
                .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
                .trim(),
            image_url: photoUrl || 'No image available',
            static_map_url: staticMapUrl,
            google_place_id: place.place_id
        };

        // Validate facility data before saving
        const validation = validateFacilityData(facilityData);
        if (!validation.isValid) {
            console.log(`Validation failed for ${place.name}:`);
            validation.errors.forEach(error => console.log(`   - ${error}`));
            continue;
        }

        await saveFacility(facilityData);
        console.log(`Saved ${place.name} as ${type.ourType} in Singapore`);
        }
    }
    console.log('All facilities populated successfully.');
  } catch (error) {
    console.error('Error populating facilities:', error);
  }
}

populateAllFacilities();