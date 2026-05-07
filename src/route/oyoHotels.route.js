const express = require('express');
const oyoHotelService = require('../service/oyoHotels.service');
const responseHandler = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { adminAuthMiddleware, userAuthMiddleware, } = require('../util/auth-middleware-jwt');
const upload = require('../util/image-handler');

// Create
router.post('/saveHotel', adminAuthMiddleware, upload.single('image'), async (req, res) => {
  try {
    const filename = req.file && req.file.filename ? req.file.filename : undefined;
    const Hotel = req.body;
    if (Hotel) {
      const saved = await oyoHotelService.createHotel(Hotel, filename);
      responseHandler.success200(req, res, saved);
    } else {
      responseHandler.hasError500(res, 'Invalid request');
    }
  } catch (error) {
    responseHandler.hasError500(res);
  }
});

// Get All
router.get('/getAllHotels', async (req, res) => {
  try {
    const Hotels = await oyoHotelService.getAllHotels();
    responseHandler.success200(req, res, Hotels);
  } catch (error) {
    responseHandler.hasError500(res);
  }
});

// Get by ID
router.get('/getHotelByID/:id', async (req, res) => {
  try {
    const Hotel = await oyoHotelService.getHotelById(req.params.id);
    if (Hotel) {
      responseHandler.success200(req, res, Hotel);
    } else {
      responseHandler.hasError500(res, 'Hotel not found');
    }
  } catch (error) {
    responseHandler.hasError500(res);
  }
});

// Update
router.put('/updateHotel/:id', adminAuthMiddleware, upload.single('image'), async (req, res) => {
  try {
    const filename = req.file && req.file.filename ? req.file.filename : undefined;
    const updated = await oyoHotelService.updateHotel(req.params.id, req.body, filename);
    responseHandler.success200(req, res, updated);
  } catch (error) {
    console.log(error);

    responseHandler.hasError500(res);
  }
});

// Delete
router.delete('/deleteHotel/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const deletedHotel = await oyoHotelService.deleteHotel(req.params.id);
    responseHandler.success200(req, res, deletedHotel);
  } catch (error) {
    responseHandler.hasError500(res);
  }
});

// GET USER LAT LNG
router.get('/getNearestHotel/:lng/:lat', async (req, res) => {
  try {
    const lng = req.params.lng
    const lat = req.params.lat

    const HotelList = await oyoHotelService.getNearestHotel(lng, lat);
    if (HotelList) {
      responseHandler.success200(req, res, HotelList);
    } else {
      responseHandler.hasError500(res, 'Hotel not found');
    }
  } catch (error) {
    responseHandler.hasError500(res);
  }
});

// GET USER LAT LNG
router.get('/getNearestHotelCount/:lng/:lat', async (req, res) => {
  try {
    const lng = req.params.lng
    const lat = req.params.lat

    if (typeof lng === 'undefined' || typeof lat === 'undefined' || isNaN(lng) || isNaN(lat)) {
      return responseHandler.success200(req, res, 0);
    }

    const response = await oyoHotelService.getNearestHotelCount(lng, lat);
    responseHandler.success200(req, res, response);
  } catch (error) {
    responseHandler.hasError500(res);
  }
});

// GET USER LAT LNG
router.get('/getNearestHotelCountobj/:lng/:lat', async (req, res) => {
  try {
    const lng = req.params.lng
    const lat = req.params.lat

    if (typeof lng === 'undefined' || typeof lat === 'undefined' || isNaN(lng) || isNaN(lat)) {
      let response = {
        count: 0
      }
      return responseHandler.success200(req, res, response);
    }

    const response = await oyoHotelService.getNearestHotelCountobj(lng, lat);
    responseHandler.success200(req, res, response);
  } catch (error) {
    responseHandler.hasError500(res);
  }
});

module.exports = router;