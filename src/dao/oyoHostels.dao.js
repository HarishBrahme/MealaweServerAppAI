const OyoHotel = require('../model/oyoHotels.model');
const { deleteImage } = require('../service/images.service');

// Create a new Hotel document
const createHotel = async (data, filename) => {
  const geoLocation = JSON.parse(data.geolocation);

  const saveObject = {
    ...data,
    imageUrl: filename,
    geolocation: geoLocation,
    location: {
      type: "Point",
      coordinates: [geoLocation.lng, geoLocation.lat]
    }
  }

  return await OyoHotel.create(saveObject);
}

// Get all Hotel documents
const getAllHotels = async () => {
  return await OyoHotel.find();
}

// Get a single Hotel by ID
const getHotelById = async (id) => {
  return await OyoHotel.findById(id);
}

// Update Hotel by ID
const updateHotel = async (id, data, filename) => {
  const hotel = await OyoHotel.findOne({ _id: id });

  if (!hotel) {
    return null;
  }

  let geoLocation;
  if (typeof data.geolocation === 'string') {
    const locationData = JSON.parse(data.geolocation);
    geoLocation = {
      type: 'Point',
      coordinates: [locationData.lng, locationData.lat],
    };
  } else {
    geoLocation = {
      type: 'Point',
      coordinates: [data.geolocation.lng, data.geolocation.lat],
    };
  }
  if(data.kitchenInfo.kitchenGeolocation.lng == 'null'){
    data.kitchenInfo.kitchenGeolocation = typeof data.geolocation === 'string' ? JSON.parse(data.geolocation) : data.geolocation
  }

  const saveObject = {
    ...data,
    geolocation: typeof data.geolocation === 'string' ? JSON.parse(data.geolocation) : data.geolocation,
    location: geoLocation,
    imageUrl: filename || hotel.imageUrl
  };

  const update = await OyoHotel.findOneAndUpdate({ _id: id }, { $set: saveObject }, { new: true });

  if (filename) {
    try {
      deleteImage(hotel.imageUrl);
    } catch (error) {
      console.error("Error deleting old image:", error.message);
    }
  }

  return update;
};


// Delete Hotel by ID
const deleteHotel = async (id) => {
  return OyoHotel.findByIdAndDelete(id);
}

// Get Hotels List By User Lat, Long
const getNearestHotel = async (lng, lat) => {
  const hotelList = await OyoHotel.find({
    location: { $near: { $geometry: { type: "Point", coordinates: [lng, lat] }, $maxDistance: 100 } },
  }).exec();

  return hotelList;
};

// Get Hotels List By User Lat, Long
const getNearestHotelCountobj = async (lng, lat) => {
  const hotelCount = await OyoHotel.find({
    location: { $near: { $geometry: { type: "Point", coordinates: [lng, lat] }, $maxDistance: 100 } },
  }).count();
  const response = {
    count: hotelCount
  }

  return response;
};
const getNearestHotelCount = async (lng, lat) => {
  const hotelCount = await OyoHotel.find({
    location: { $near: { $geometry: { type: "Point", coordinates: [lng, lat] }, $maxDistance: 100 } },
  }).count();


  return hotelCount;
};

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
