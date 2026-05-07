const oyoHotelDao = require('../dao/oyoHostels.dao');

// Create a new Hotel
const createHotel = async (data, filename) => {
  return await oyoHotelDao.createHotel(data, filename);
}

// Get all Hotels
const getAllHotels = async () => {
  return await oyoHotelDao.getAllHotels();
}

// Get Hotel by ID
const getHotelById = async (id) => {
  return await oyoHotelDao.getHotelById(id);
}

// Update Hotel by ID
const updateHotel = async (id, data, filename) => {
  return await oyoHotelDao.updateHotel(id, data, filename);
}

// Delete Hotel by ID
const deleteHotel = async (id) => {
  return await oyoHotelDao.deleteHotel(id);
}

// Get Hotels List By User Lat, Long
const getNearestHotel = async (lng, lat) => {
  return await oyoHotelDao.getNearestHotel(lng, lat);
}

// Get Hotels List By User Lat, Long
const getNearestHotelCountobj = async (lng, lat) => {
  return await oyoHotelDao.getNearestHotelCountobj(lng, lat);
}
const getNearestHotelCount = async (lng, lat) => {
  return await oyoHotelDao.getNearestHotelCount(lng, lat);
}

module.exports = {
  createHotel,
  getAllHotels,
  getHotelById,
  updateHotel,
  deleteHotel,
  getNearestHotel,
  getNearestHotelCount,
  getNearestHotelCountobj
};
