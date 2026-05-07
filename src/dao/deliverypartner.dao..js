const DeliveryPartner = require('../model/deliveryPartner.model');
const { deleteImage } = require('../service/images.service');


const saveDeliveryPartner = async (deliverypartner, imageName) => {
  const nSaveDeliveryPartner = new DeliveryPartner();
  nSaveDeliveryPartner.name = deliverypartner.name;
  nSaveDeliveryPartner.imageUrl = imageName;
  nSaveDeliveryPartner.geolocation = JSON.parse(deliverypartner.geolocation);
  nSaveDeliveryPartner.vehicleNo = deliverypartner.vehicleNo;
  nSaveDeliveryPartner.phoneNo = deliverypartner.phoneNo;
  nSaveDeliveryPartner.email = deliverypartner.email;
  const isInserted = await nSaveDeliveryPartner.save();
  return isInserted;
}

const getDeliveryPartner = async (id) => {
  const getpartner = await DeliveryPartner.findById(id);
  return getpartner;
}

const updateDeliveryPartner = async (id, deliverypartner, imageName) => {
  const delivery = await DeliveryPartner.findOne({ _id: id });
  if (delivery) {
    const nSaveDeliveryPartner = {};
    nSaveDeliveryPartner.name = deliverypartner.userName || delivery.userName;
    nSaveDeliveryPartner.imageUrl = imageName || delivery.imageUrl;
    nSaveDeliveryPartner.geolocation = JSON.parse(deliverypartner.geolocation) || delivery.geolocation;
    nSaveDeliveryPartner.vehicleNo = deliverypartner.vehicleNo || delivery.phoneNo;
    nSaveDeliveryPartner.phoneNo = deliverypartner.phoneNo || delivery.email;
    nSaveDeliveryPartner.email = deliverypartner.email || delivery.preferences;
    const update = await CustomerProfile.findOneAndUpdate({ _id: id }, { $set: nSaveDeliveryPartner }, { new: true })
    if (imageName) {
      deleteImage(delivery.imageUrl);
    }
    return update;
  } else {
    return delivery;
  }
}

const updateCurrentLocation = async (id,) => {
  var location = {};

  const locationupdate = DeliveryPartner.findOne({ _id: id }, { $set: location }, { new: true });
  return locationupdate;
}

const getcurrentlocation = async (id) => {

  const currentloc = DeliveryPartner.findOne({ _id: id }).then(loc => {
    if (loc) {
      return loc.geolocation;
    } else {
      return "no coordinates found"
    }
  })
  return currentloc
}

const deleteDeliveryPartner = async (id) => {
  const deletedeliverypartner = await DeliveryPartner.findByIdAndRemove({ _id })
  return deletedeliverypartner;
}
module.exports = {
  saveDeliveryPartner,
  getDeliveryPartner,
  updateDeliveryPartner,
  updateCurrentLocation,
  getcurrentlocation,
  deleteDeliveryPartner
}