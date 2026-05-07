const AdminProfile = require('../model/adminProfile.model');
const { deleteImage } = require('../service/images.service');
const { updatePhoneNo } = require('./authAdmin.dao');


const saveNewAdminProfile = async (adminProfile, imageName) => {
  const customer = await AdminProfile.findOne({ phoneNo: adminProfile.phoneNo });
  if (customer && customer._id) {
    return customer;
  } {
    try {
      const nAdminProfile = new AdminProfile();
      nAdminProfile.name = adminProfile.name;
      nAdminProfile.imageUrl = imageName;
      nAdminProfile.phoneNo = adminProfile.phoneNo;
      nAdminProfile.email = adminProfile.email;
      nAdminProfile.role = adminProfile.role;
      nAdminProfile.policy_name = adminProfile.policy;
      nAdminProfile.loginId = adminProfile.loginId;
      nAdminProfile.cluster_allowed = JSON.parse(adminProfile.cluster_allowed);
      if (adminProfile.delivery_route_no && adminProfile.delivery_route_no !== 'undefined') {
        nAdminProfile.delivery_route_no = parseInt(adminProfile.delivery_route_no);
      }
      if (nAdminProfile.role == "WAREHOUSEOPERATOR") {
        console.log(JSON.parse(adminProfile.inventoryDetails));
        nAdminProfile.inventoryDetails =
          JSON.parse(adminProfile.inventoryDetails) || profile.inventoryDetails;
      }
      if (adminProfile.oyo_details) {
        try {
          nAdminProfile.oyo_details = Array.isArray(adminProfile.oyo_details)
            ? adminProfile.oyo_details
            : JSON.parse(adminProfile.oyo_details);
        } catch (e) {
          console.error("Error parsing oyo_details:", e);
          nAdminProfile.oyo_details = [];
        }
      }
      console.log(nAdminProfile.delivery_route_no);
      const isInserted = await nAdminProfile.save();
      return isInserted;
    } catch (error) {
      console.log(error);
    }
  }

}
const updateAdminProfile = async (id, adminProfile, imageName) => {
  const profile = await AdminProfile.findOne({ _id: id });
  if (profile && profile._id) {
    const nAdminProfile = {};
    nAdminProfile.name = adminProfile.name || profile.name;
    nAdminProfile.imageUrl = imageName || profile.imageUrl;
    nAdminProfile.phoneNo = adminProfile.phoneNo || profile.phoneNo;
    nAdminProfile.email = adminProfile.email || profile.email;
    nAdminProfile.role = adminProfile.role || profile.role;
    nAdminProfile.policy_name = adminProfile.policy || profile.policy_name;
    nAdminProfile.cluster_allowed = JSON.parse(adminProfile.cluster_allowed) || profile.cluster_allowed;
    if (adminProfile.delivery_route_no && adminProfile.delivery_route_no !== 'undefined') {
      nAdminProfile.delivery_route_no = parseInt(adminProfile.delivery_route_no);
    }
    if (nAdminProfile.role == "WAREHOUSEOPERATOR") {
      console.log(JSON.parse(adminProfile.inventoryDetails));
      nAdminProfile.inventoryDetails =
        JSON.parse(adminProfile.inventoryDetails) || profile.inventoryDetails;
    }
    if (adminProfile.oyo_details) {
        try {
          nAdminProfile.oyo_details = Array.isArray(adminProfile.oyo_details)
            ? adminProfile.oyo_details
            : JSON.parse(adminProfile.oyo_details);
        } catch (e) {
          console.error("Error parsing oyo_details:", e);
          nAdminProfile.oyo_details = [];
        }
      }
    const update = await AdminProfile.findOneAndUpdate({ _id: id }, { $set: nAdminProfile }, { new: true });
    if (imageName) {
      deleteImage(profile.imageUrl);
    }
    if (adminProfile.phoneNo) {
      await updatePhoneNo(adminProfile.phoneNo);
    }
    return update;
  }
  else {
    // console.log('profile not found ', profile)
    return profile;
  }
}

const getAdminProfileList = async () => {
  const adminProfile = await AdminProfile.find({});
  return adminProfile;
};
const getAdminProfile = async (loginId) => {
  const adminProfile = await AdminProfile.findOne({ loginId })
  return adminProfile;
};

const searchAdmin = async (searchObj) => {
  const condition = {};
  if (searchObj.phoneNo) {
    condition.phoneNo = searchObj.phoneNo;
  }
  if (searchObj.email) {
    condition.email = searchObj.email;
  }
  if (searchObj.adminId) {
    condition.loginId = searchObj.adminId;
  }
  if (searchObj.adminName) {
    const regexText = new RegExp(searchObj.adminName, 'i');
    condition.name = regexText;
  }
  // console.log('searchAdmin',searchObj,condition);
  return await AdminProfile.find(condition);
}

const deleteAdmin = async (loginId) => {
  const admin = await AdminProfile.findOneAndDelete({ loginId });
  return admin;
};


module.exports = {
  saveNewAdminProfile,
  updateAdminProfile,
  getAdminProfileList,
  getAdminProfile,
  searchAdmin,
  deleteAdmin
}