//apartment.dao.js
const Apartment = require('../model/apartment.model');
const { deleteImage } = require('../service/images.service');
const pointInPolygon = require('point-in-polygon');

// Create a new Apartment document
// Create a new Apartment document
const createApartment = async (data, filename) => {
  let geoLocation;

  // Handle if geolocation comes as string or object
  if (typeof data.geolocation === "string") {
    geoLocation = JSON.parse(data.geolocation);
  } else {
    geoLocation = data.geolocation;
  }

  const saveObject = {
    ...data,
    imageUrl: filename,
    geolocation: geoLocation,
    location: {
      type: "Point",
      coordinates: [geoLocation.lng, geoLocation.lat]
    }
  };

  return await Apartment.create(saveObject); 
};


// Get all Apartment documents
const getAllApartments = async () => {
  let apartmentData= await Apartment.find({});
  return apartmentData;
  
};

// Get a single Apartment by ID
const getApartmentById = async (id) => {
  return await Apartment.findById(id);
};

// Update Apartment by ID
const updateApartment = async (id, data, filename) => {
  const apartment = await Apartment.findOne({ _id: id });

  if (!apartment) {
    return null;
  }

  let geoLocation;
  if (typeof data.geolocation === 'string') {
    const locationData = JSON.parse(data.geolocation);
    geoLocation = {
      type: 'Point',
      coordinates: [locationData.lng, locationData.lat]
    };
  } else {
    geoLocation = {
      type: 'Point',
      coordinates: [data.geolocation.lng, data.geolocation.lat]
    };
  }

  const saveObject = {
    ...data,
    geolocation: typeof data.geolocation === 'string' ? JSON.parse(data.geolocation) : data.geolocation,
    location: geoLocation,
    imageUrl: filename || apartment.imageUrl
  };

  const update = await Apartment.findOneAndUpdate({ _id: id }, { $set: saveObject }, { new: true });

  if (filename) {
    try {
      deleteImage(apartment.imageUrl);
    } catch (error) {
      console.error("Error deleting old image:", error.message);
    }
  }

  return update;
};

// Delete Apartment by ID
const deleteApartment = async (id) => {
  return Apartment.findByIdAndDelete(id);
};

// Get Apartments List By User Lat, Long
const getNearestApartment = async (lng, lat) => {
  try {
    const apartmentList = await Apartment.find({
      location: { $near: { $geometry: { type: "Point", coordinates: [lng, lat] } } },
      isActive:true
    }).exec();
    let apartment={}
    
  apartmentList.forEach((apt) => {
            const polygon = apt.coordinates.map(coordinateObj => [coordinateObj.lat, coordinateObj.lng]);
            
           const clusterFound = pointInPolygon([lat, lng], polygon);
            // console.log(clusterFound,cluster.clusterId,cluster.clusterName);               
            console.log({clusterFound});
            
            if (clusterFound) {
              apartment=apt
              
              // mappedClusterList.push({ clusterId: cluster.clusterId, clusterName: cluster.clusterName });
            }
          });
    return apartment;
    
  } catch (error) {
    console.log({error});
    
    
  }
};

// Get Apartments Count By User Lat, Long (Object)
const getNearestApartmentCountobj = async (lng, lat) => {
  const apartmentCount = await Apartment.find({
    location: { $near: { $geometry: { type: "Point", coordinates: [lng, lat] }, $maxDistance: 100 } }
  }).count();
  
  const response = {
    count: apartmentCount
  };

  return response;
};

// Get Apartments Count By User Lat, Long
const getNearestApartmentCount = async (lng, lat) => {
  const apartmentCount = await Apartment.find({
    location: { $near: { $geometry: { type: "Point", coordinates: [lng, lat] }, $maxDistance: 100 } }
  }).count();

  return apartmentCount;
};
checkLatLngInCluster = (latLngObj) => {
  return new Promise(async (resolve, reject) => {
    try {
      let geoFencinglist = [];
      if (geoClusterList) {
        geoFencinglist = geoClusterList;
      } else {
        geoClusterList = await getGeoFencingList();
        geoFencinglist = geoClusterList;
      }
      const mappedClusterList = []
      if (geoFencinglist && geoFencinglist.length > 0 && latLngObj && latLngObj.lat && latLngObj.lng) {
        let clusterFound = false;

        geoFencinglist.forEach((cluster) => {
          const polygon = cluster.clusterCoordinates.map(coordinateObj => [coordinateObj.lat, coordinateObj.lng]);
          clusterFound = pointInPolygon([latLngObj.lat, latLngObj.lng], polygon);
          // console.log(clusterFound,cluster.clusterId,cluster.clusterName);               
          if (clusterFound) {
            mappedClusterList.push({ clusterId: cluster.clusterId, clusterName: cluster.clusterName });
          }
        });
        
      }
      if (mappedClusterList.length > 0) {
        resolve(mappedClusterList[0]);
      } else {
        resolve(false)
      }

    } catch (error) {
      reject(error);
    }
  });
}
const toggleActiveStatus = async (id, isActive) => {
  const updateData = { 
    isActive: isActive,
    updatedAt: new Date()
  };
  
  return await Apartment.findByIdAndUpdate(
    id, 
    { $set: updateData }, 
    { new: true } // Return updated document
  );
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
  toggleActiveStatus
};