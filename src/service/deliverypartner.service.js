const dao = require('../dao/deliverypartner.dao.');

const saveDeliveryPartner = async (deliverypartner, imageName) => {
    return dao.saveDeliveryPartner(deliverypartner, imageName);
}

const getDeliveryPartner = async (id) => {
    return dao.getDeliveryPartner(id)
}



const updateDeliveryPartner = async (id, deliverypartner, imageName) => {
    const updatedeliverypartner = await dao.updateDeliveryPartner(id, deliverypartner, imageName)
    return updatedeliverypartner
}

const updateLocation = async (id) => {
    const updatelocation = await dao.updateCurrentLocation(id);
    return updatelocation;
}


const getCurrentLocation = async (id) => {
    const current = await dao.getcurrentlocation(id);
    return current;
}


const DeleteDeliveryPartner = async (id) => {
    return dao.deleteDeliveryPartner(id)
}


module.exports = {
    saveDeliveryPartner,
    getDeliveryPartner,
    updateDeliveryPartner,
    updateLocation,
    getCurrentLocation,
    DeleteDeliveryPartner
}