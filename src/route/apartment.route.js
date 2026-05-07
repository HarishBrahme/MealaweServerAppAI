//apartment.route.js
const express = require('express');
const apartmentService = require('../service/apartment.service');
const responseHandler = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { adminAuthMiddleware, userAuthMiddleware } = require('../util/auth-middleware-jwt');
const upload = require('../util/image-handler');

// Create
router.post('/saveApartment', upload.single('image'), async (req, res) => {
  try {
    const filename = req.file && req.file.filename ? req.file.filename : undefined;
    const apartment = req.body;
    
    console.log('Received apartment data:', apartment);
    console.log('Geolocation type:', typeof apartment.geolocation);
    
    if (apartment) {
      const saved = await apartmentService.createApartment(apartment, filename);
      responseHandler.success200(req, res, saved);
    } else {
      responseHandler.hasError500(res, 'Invalid request');
    }
  } catch (error) {
    console.error('Error in saveApartment route:', error);
    responseHandler.hasError500(res, error.message || 'Internal server error');
  }
});
// Toggle Active/Inactive Status
router.put('/toggleActiveStatus/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return responseHandler.hasError500(res, 'Invalid status value');
    }
    
    const updatedApartment = await apartmentService.toggleActiveStatus(req.params.id, isActive);
    responseHandler.success200(req, res, updatedApartment);
  } catch (error) {
    console.error('Error in toggleActiveStatus route:', error);
    responseHandler.hasError500(res, error.message || 'Internal server error');
  }
});


// Get All
router.get('/getAllApartments', async (req, res) => {
  try {
    const apartments = await apartmentService.getAllApartments();
    responseHandler.success200(req, res, apartments);
  } catch (error) {
    console.error('Error in getAllApartments route:', error);
    responseHandler.hasError500(res);
  }
});

// Get by ID
router.get('/getApartmentByID/:id', async (req, res) => {
  try {
    const apartment = await apartmentService.getApartmentById(req.params.id);
    if (apartment) {
      responseHandler.success200(req, res, apartment);
    } else {
      responseHandler.hasError500(res, 'Apartment not found');
    }
  } catch (error) {
    // console.error('Error in getApartmentByID route:', error);
    responseHandler.hasError500(res)
  }
});

router.get('/getApartmentidWiseKitchen/:id', async (req, res) => {
  try {
    const kitchen = await apartmentService.getApartmentidWiseKitchen(req.params.id);
    if (kitchen) {
      responseHandler.success200(req, res, kitchen);
    } else {
      responseHandler.hasError500(res, 'Apartment not found');
    }
  } catch (error) {
    // console.error('Error in getApartmentByID route:', error);
    responseHandler.hasError500(res)
  }
});

// Update
router.put('/updateApartment/:id', upload.single('image'), async (req, res) => {
  try {
    const filename = req.file && req.file.filename ? req.file.filename : undefined;
    const updated = await apartmentService.updateApartment(req.params.id, req.body, filename);
    responseHandler.success200(req, res, updated);
  } catch (error) {
    // console.error('Error in updateApartment route:', error);
    responseHandler.hasError500(res, error.message || 'Internal server error');
  }
});

// Delete
router.delete('/deleteApartment/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const deletedApartment = await apartmentService.deleteApartment(req.params.id);
    responseHandler.success200(req, res, deletedApartment);
  } catch (error) {
    // console.error('Error in deleteApartment route:', error);
    responseHandler.hasError500(res);
  }
});

// GET USER LAT LNG
router.get('/getNearestApartment/:lng/:lat', async (req, res) => {
  try {
    const lng = req.params.lng;
    const lat = req.params.lat;

    const apartmentList = await apartmentService.getNearestApartment(lng, lat);
    if (apartmentList) {
      responseHandler.success200(req, res, apartmentList);
    } else {
      responseHandler.hasError500(res, 'Apartment not found');
    }
  } catch (error) {
    // console.error('Error in getNearestApartment route:', error);
    responseHandler.hasError500(res);
  }
});

// GET USER LAT LNG COUNT
router.get('/getNearestApartmentCount/:lng/:lat', async (req, res) => {
  try {
    const lng = req.params.lng;
    const lat = req.params.lat;

    if (typeof lng === 'undefined' || typeof lat === 'undefined' || isNaN(lng) || isNaN(lat)) {
      return responseHandler.success200(req, res, 0);
    }

    const response = await apartmentService.getNearestApartmentCount(lng, lat);
    responseHandler.success200(req, res, response);
  } catch (error) {
    // console.error('Error in getNearestApartmentCount route:', error);
    responseHandler.hasError500(res);
  }
});

// GET USER LAT LNG COUNT OBJECT
router.get('/getNearestApartmentCountobj/:lng/:lat', async (req, res) => {
  try {
    const lng = req.params.lng;
    const lat = req.params.lat;

    if (typeof lng === 'undefined' || typeof lat === 'undefined' || isNaN(lng) || isNaN(lat)) {
      let response = {
        count: 0
      };
      return responseHandler.success200(req, res, response);
    }

    const response = await apartmentService.getNearestApartmentCountobj(lng, lat);
    responseHandler.success200(req, res, response);
  } catch (error) {
    // console.error('Error in getNearestApartmentCountobj route:', error);
    responseHandler.hasError500(res);
  }
});

module.exports = router;