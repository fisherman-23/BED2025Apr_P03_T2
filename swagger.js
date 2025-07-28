const swaggerAutogen = require("swagger-autogen")();

const outputFile = "./swagger-output.json"; // Output file for the spec
const routes = ["./app.js"]; // Path to your API route files

const doc = {
  info: {
    title: "CircleAge API",
    description:
      "API documentation for CircleAge application, providing a range of features designed to promote healthy, independent, and socially connected aging among seniors. This API supports user account management, health appointments, transportation management, event management, fitness management, and social engagement features.",
  },
  host: "localhost:3000",

  schemes: ["http"],

  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description:
        'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"',
    },
  },

  security: [
    {
      bearerAuth: [],
    },
  ],
};

swaggerAutogen(outputFile, routes, doc);
