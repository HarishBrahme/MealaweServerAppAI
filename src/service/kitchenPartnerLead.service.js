const dao = require('../dao/kitchenPartnerLead.dao');
const { welcomeLeadsms } = require('../util/sms-provider-util');


const saveNewKitchenPatnerLead = (kitchenPartner) => {
    return new Promise(async (resolve, reject) => {
        try {
            const lead = await dao.kitchenPartnerLead(kitchenPartner);
            if (lead && lead._id) {
                welcomeLeadsms(lead.name, lead.phoneNo);
            }
            resolve(lead)
        } catch (error) {
            reject(error);
        }
    });
};

const getkitchlead = async () => {
    return dao.getKitchenLead()
}

const deleteKitchenLead = async (id) => {
    return dao.deleteKitchenPartnerLead(id);
}

const updatekitchenleadstatus = async (id, status) => {
    return dao.updatekitchenleadstatus(id, status);
}

const leadnoteligible = async (body) => {
    return dao.leadnoteligible(body);
}

module.exports = {
    getkitchlead,
    saveNewKitchenPatnerLead,
    updatekitchenleadstatus,
    deleteKitchenLead,
    leadnoteligible
}