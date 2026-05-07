const UtmEvent = require('../model/utm-events.model');

const getUtmEvents = async (filters = {}) => {
  try {
    const query = {};

    if (filters.userName) {
      query.userName = { $regex: filters.userName, $options: 'i' };
    }
    if (filters.userPhoneNumber) {
      query.userPhoneNumber = { $regex: filters.userPhoneNumber, $options: 'i' };
    }
    if (filters.userEmail) {
      query.userEmail = { $regex: filters.userEmail, $options: 'i' };
    }
    if (filters.platformName) {
      query.platformName = { $regex: filters.platformName, $options: 'i' };
    }
    if (filters.clusterName) {
      query.clusterName = { $regex: filters.clusterName, $options: 'i' };
    }

    if (filters.startDate && filters.endDate) {
      query.createdAt = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate),
      };
    } else if (filters.startDate) {
      query.createdAt = { $gte: new Date(filters.startDate) };
    } else if (filters.endDate) {
      query.createdAt = { $lte: new Date(filters.endDate) };
    }

    const events = await UtmEvent.find(query)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return events;
  } catch (error) {
    console.error('Error fetching UTM Events:', error);
    throw error;
  }
};

const saveUtmEvent = async (utmEventObj) => {
  try {
    const newEvent = new UtmEvent({
      utm_source: utmEventObj.utm_source?.trim(),
      utm_medium: utmEventObj.utm_medium?.trim(),
      utm_campaign: utmEventObj.utm_campaign?.trim(),
      utm_term: utmEventObj.utm_term?.trim(),
      platformName: utmEventObj.platformName,
      userId: utmEventObj.userId || null,
      userName: utmEventObj.userName?.trim() || null,
      userPhoneNumber: String(utmEventObj.userPhoneNumber || ''),
      userEmail: utmEventObj.userEmail?.trim() || null,
      activity: utmEventObj.activity?.trim() || null,
      pincode: String(utmEventObj.pincode || ''),
      clusterId: utmEventObj.clusterId || null,
      clusterName: utmEventObj.clusterName?.trim() || null,
      createdAt: new Date(),
    });

    return await newEvent.save();
  } catch (error) {
    console.error('Error saving UTM Event:', error);
    throw error;
  }
};

module.exports = {
  getUtmEvents,
  saveUtmEvent,
};