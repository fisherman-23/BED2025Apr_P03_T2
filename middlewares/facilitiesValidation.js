const Joi = require("joi");

const coordinateSchema = Joi.number().required().messages({
    "number.base": "Coordinates must be valid numbers",
    "any.required": "Both latitude and longitude are required for location services",
})

const radiusSchema = Joi.number().positive().optional().messages({
    "number.base": "Search radius must be a valid number",
    "number.positive": "Search radius must be greater than 0",
});

function validateLocationAccess(req, res, next) {
    const schema = Joi.object({
        lat: coordinateSchema,
        lng: coordinateSchema,
    });

    const { error } = schema.validate(req.query, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((d) => d.message).join(", ");
        return res.status(400).json({ error: `Location access failed: ${errorMessages}` });
    }
    next();
}

function validateNearbyFacilities(req, res, next) {
    const schema = Joi.object({
        lat: coordinateSchema,
        lng: coordinateSchema,
        rad: radiusSchema,
    });

    const { error } = schema.validate(req.query, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((d) => d.message).join(", ");
        return res.status(400).json({ error: `Nearby search failed: ${errorMessages}` });
    }
    next();
}

function validateFacilityId(req, res, next) {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid facility ID" });
    }
    next();
}

function validateFacilityType(req, res, next) {
    const type = req.params.type;
    const validTypes = ["Polyclinic", "Hospital", "Community Center", "Park"];
    if (!type || !validTypes.includes(type)) {
        return res.status(400).json({ 
            error: "Invalid facility type. Must be one of: Polyclinic, Hospital, Community Center, or Park" 
        });
    }
    next();
}

module.exports = {
    validateLocationAccess,
    validateNearbyFacilities,
    validateFacilityId,
    validateFacilityType,
};