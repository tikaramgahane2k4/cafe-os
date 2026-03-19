// Example admin controller accessing DB models
const Cafe = require("../models/Cafe");

const getAllCafes = async (req, res) => {
  try {
    const cafes = await Cafe.find({});
    res.json({ message: "Welcome Super Admin!", cafes });
  } catch (error) {
    res.status(500).json({ message: "Server Error fetching cafes" });
  }
};

module.exports = { getAllCafes };
