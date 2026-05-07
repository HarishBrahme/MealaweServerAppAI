//apartment.service.js
const apartmentDao = require('../dao/apartment.dao');
const {getKitchensByApartmentId} = require('../dao/kitchenPartner.dao');

// Create a new Apartment
const createApartment = async (data, filename) => {
  return await apartmentDao.createApartment(data, filename);
};

// Get all Apartments
const getAllApartments = async () => {
  return await apartmentDao.getAllApartments();
};
const toggleActiveStatus = async (id, isActive) => {
  return await apartmentDao.toggleActiveStatus(id, isActive);
};

// Get Apartment by ID
const getApartmentById = async (id) => {
  return await apartmentDao.getApartmentById(id);
};

// Update Apartment by ID
const updateApartment = async (id, data, filename) => {
  return await apartmentDao.updateApartment(id, data, filename);
};

// Delete Apartment by ID
const deleteApartment = async (id) => {
  return await apartmentDao.deleteApartment(id);
};

// Get Apartments List By User Lat, Long
const getNearestApartment = async (lng, lat) => {
  let apartment= await apartmentDao.getNearestApartment(lng, lat);
  
  if (!apartment._id) {
  return [];
}

  const allKitchens = await getKitchensByApartmentId(apartment._id);
    // console.log({allKitchens});
  // return await apartmentDao.getNearestApartment(lng, lat);
  return allKitchens;

};

const getApartmentidWiseKitchen = async (id) => {
  return await getKitchensByApartmentId(id);
};

// Get Apartments Count By User Lat, Long (Object)
const getNearestApartmentCountobj = async (lng, lat) => {
  return await apartmentDao.getNearestApartmentCountobj(lng, lat);
};

// Get Apartments Count By User Lat, Long
const getNearestApartmentCount = async (lng, lat) => {
  return await apartmentDao.getNearestApartmentCount(lng, lat);
};

module.exports = {
  createApartment,
  getAllApartments,
  getApartmentById,
  updateApartment,
  deleteApartment,
  getNearestApartment,
  getNearestApartmentCount,
  getNearestApartmentCountobj,
  getApartmentidWiseKitchen,
  toggleActiveStatus
};