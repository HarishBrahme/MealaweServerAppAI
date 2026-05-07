const KitchenPartnerLead = require('../model/kitchenPartnerLead.model');


const kitchenPartnerLead = async (kitchenPartner) => {
  const kitchenleads = await KitchenPartnerLead.find({
    $or:
      [{ phoneNo: kitchenPartner.phoneNo }, { email: kitchenPartner.email }]
  });
  if (kitchenleads && kitchenleads.length > 0) {
    let emailPresent = false;
    let phonePresent = false;
    let erroCode = '101';
    kitchenleads.forEach(lead => {
      if (lead.email === kitchenPartner.email) {
        emailPresent = true;
      }
      if (lead.phoneNo === kitchenPartner.phoneNo) {
        phonePresent = true;
      }
    });
    if (emailPresent) {
      erroCode = '102';
    }
    if (phonePresent) {
      erroCode = '103';
    }
    if (emailPresent && phonePresent) {
      erroCode = '104';
    }
    return { erroCode };
  } else {
    // console.log('inside else')
    const nKitchenPartnerLead = new KitchenPartnerLead();
    nKitchenPartnerLead.name = kitchenPartner.name;
    nKitchenPartnerLead.address = kitchenPartner.address;
    nKitchenPartnerLead.phoneNo = kitchenPartner.phoneNo;
    nKitchenPartnerLead.email = kitchenPartner.email;
    nKitchenPartnerLead.maritalStatus = kitchenPartner.maritalStatus;
    nKitchenPartnerLead.leadStatus = 'started';
    nKitchenPartnerLead.installReferrer = kitchenPartner.installReferrer;
    const isInserted = await nKitchenPartnerLead.save();
    return isInserted;
  }
}

const getKitchenLead = async (id) => {
  const getkitchenlead = await KitchenPartnerLead.find({}).sort({ _id: -1 });
  return getkitchenlead;
}

const updatekitchenleadstatus = async (id, status) => {
  const update = await KitchenPartnerLead.findOneAndUpdate({ _id: id },
    { $set: { leadStatus: status } }, { new: true });
  return update;
}

const deleteKitchenPartnerLead = async (id) => {
  var id = req.params.id;
  const deletekitchepartnerlead = await KitchenPartnerLead.findByIdAndRemove({ _id })
  return deletekitchepartnerlead;
}
const leadnoteligible = async (body) => {
  const update = await KitchenPartnerLead.findOneAndUpdate({ _id: body._id },
    { $set: { leadStatus: 'noteligible', comment: body.comment } }, { new: true });
  return update;
}


module.exports = {
  kitchenPartnerLead,
  getKitchenLead,
  updatekitchenleadstatus,
  deleteKitchenPartnerLead,
  leadnoteligible
}
