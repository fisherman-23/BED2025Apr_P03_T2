const Joi = require("joi");

const coordinateSchema = Joi.number().required().messages({
    "number.base": "Latitude and Longitude must be numbers",
    "any.required": "Latitude and Longitude are required",
})

const radiusSchema = Joi.number().positive().optional().messages({
    "number.base": "Radius must be a number",
    "number.positive": "Radius must be a positive number",
})

const facilityIdSchema = Joi.object({
    id: Joi.number().integer().positive().required().messages({
        "number.base": "Facility ID must be a number",
        "number.integer": "Facility ID must be an integer",
        "number.positive": "Facility ID must be a positive number",
        "any.required": "Facility ID is required",
    }),
});

const facilityTypeSchema = Joi.object({
    type: Joi.string().valid("Polyclinic", "Hospital", "Community Center", "Park").required().messages({
        "string.base": "Facility type must be a string",
        "any.only": "Facility type must be one of the following: Polyclinic, Hospital, Community Center, Park",
        "any.required": "Facility type is required",
    }),
});

function validateLocationAccess(req, res, next) {
    const schema = Joi.object({
        lat: coordinateSchema,
        lng: coordinateSchema,
    });

    const { error } = schema.validate(req.query, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((d) => d.message).join(", ");
        return res.status(400).json({ error: errorMessages });
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
        return res.status(400).json({ error: errorMessages });
    }
    next();
}

function validateFacilityId(req, res, next) {
    const params = { id: Number(req.params.id) };
    const { error } = facilityIdSchema.validate(params, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((d) => d.message).join(", ");
        return res.status(400).json({ error: errorMessages });
    }
    next();
}

function validateFacilityType(req, res, next) {
    const params = { type: req.params.type };
    const { error } = facilityTypeSchema.validate(params, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((d) => d.message).join(", ");
        return res.status(400).json({ error: errorMessages });
    }
    next();
}

module.exports = {
    validateLocationAccess,
    validateNearbyFacilities,
    validateFacilityId,
    validateFacilityType,
};