const bcrypt = require("bcrypt");

async function hash(password) {
  const saltRounds = 5;
  const hashed = await bcrypt.hash(password, saltRounds);
  return hashed;
}

async function compare(password, hashedPassword) {
  const isMatch = await bcrypt.compare(password, hashedPassword);
  return isMatch;
}

module.exports = { hash, compare };