const { registerTestKitchen } = require("./authKitchen.service");
const dao = require('../dao/kitchenPartner.dao');

registerTestKitchen
const createKitchenTestUser = async (kitchenPartner) => {
    return new Promise(async (resolve, reject) => {
        if (kitchenPartner.phoneNo) {
            try {
                const kitchenAuthObj = await registerTestKitchen(kitchenPartner.phoneNo);
                // console.log(kitchenAuthObj);
                kitchenPartner.loginId = kitchenAuthObj.kitchenId;
                const kitchenProfile = await dao.saveNewKitchenPatner(kitchenPartner, null);
                resolve(kitchenProfile);
            } catch (e) {
                reject(e);
            }
        } else {
            reject('Phone no. is not provided')
        }
    });
}

module.exports = {
    createKitchenTestUser
}