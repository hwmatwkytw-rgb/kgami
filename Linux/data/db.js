// data/db.js
const mongoose = require("mongoose");
const log = require("../logger")
const config = require('../config.json')

async function connectDB() {
  try {
    await mongoose.connect(config.mongoURI);
    log.system("Connected to MongoDB Atlas.");
  } catch (err) {
    log.error(`MongoDB Connection Error:\n ${err}`);
    process.exit(1);
  }
}

module.exports = connectDB;

