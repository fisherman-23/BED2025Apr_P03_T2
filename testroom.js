// testRoom.js (temporary)
require("dotenv").config();
const { createRoom } = require("./models/meetingsModel");

createRoom("test-room")
  .then(r => console.log("Created room:", r))
  .catch(console.error);
