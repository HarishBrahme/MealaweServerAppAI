const MetaManagement = require('../model/metaManagement.model');

async function createMetaManagement(data, session = null) {
  try {
    const record = new MetaManagement(data);
    return await record.save(session ? { session } : undefined);
  } catch (error) {
    throw new Error('Error creating MetaManagement: ' + error.message);
  }
}

async function getAllMetaManagements(page = 1, pageSize = 10) {
  try {
    const skip = (page - 1) * pageSize;
    const [records, total] = await Promise.all([MetaManagement.find().skip(skip).limit(pageSize), MetaManagement.countDocuments()]);
    return { records, total };
  } catch (error) {
    throw new Error('Error fetching MetaManagements: ' + error.message);
  }
}

async function getMetaManagementById(id) {
  try {
    return await MetaManagement.findById(id);
  } catch (error) {
    throw new Error('Error fetching MetaManagement by ID: ' + error.message);
  }
}

async function getMetaManagementByPathName(pagePathName, pageType) {
  try {
    const meta = await MetaManagement.findOne({ pagePathName, pageType });
    return meta;
  } catch (error) {
    throw new Error('Error fetching MetaManagement by PathName: ' + error.message);
  }
}

async function getMetaManagementByPageId(pageId) {
  try {
    return await MetaManagement.findOne({ pageId });
  } catch (error) {
    throw new Error('Error fetching MetaManagement by pageId: ' + error.message);
  }
}

async function updateMetaManagement(id, data, session = null) {
  try {
    return await MetaManagement.findByIdAndUpdate(id, data, { new: true, ...(session && { session }) });
  } catch (error) {
    throw new Error('Error updating MetaManagement: ' + error.message);
  }
}

async function updateMetaByPageId(pageId, data, session = null) {
  try {
    const options = { new: true };
    if (session) options.session = session;
    return await MetaManagement.findOneAndUpdate({ pageId }, data, options);
  } catch (error) {
    throw new Error('Error updating MetaManagement by pageId: ' + error.message);
  }
}

async function deleteMetaManagement(id, session = null) {
  try {
    return await MetaManagement.findByIdAndDelete(id, session ? { session } : undefined);
  } catch (error) {
    throw new Error('Error deleting MetaManagement: ' + error.message);
  }
}

async function deleteMetaByPageId(pageId, session = null) {
  try {
    return await MetaManagement.deleteMany({ pageId }, session ? { session } : undefined);
  } catch (error) {
    throw new Error('Error deleting MetaManagement by pageId: ' + error.message);
  }
}

module.exports = {
  createMetaManagement,
  getAllMetaManagements,
  getMetaManagementById,
  getMetaManagementByPathName,
  getMetaManagementByPageId,
  updateMetaManagement,
  updateMetaByPageId,
  deleteMetaManagement,
  deleteMetaByPageId,
};