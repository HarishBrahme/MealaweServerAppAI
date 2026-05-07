const utmEventDao = require('../dao/utm-events.dao');

const getUtmEvents = async (filters = {}) => {
    return await utmEventDao.getUtmEvents(filters);
};

const saveUtmEvent = async (utmEventObj) => {
    return await utmEventDao.saveUtmEvent(utmEventObj);
};

module.exports = { getUtmEvents, saveUtmEvent };
