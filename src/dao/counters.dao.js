const Counters = require('../model/counters.model');

const getNextSequenceValue = async (collectionName) => {
    const counter = await Counters.findOne({ collectionName });
    if (counter && counter._id) {
        const ncounter = {};
        ncounter.collectionName = collectionName;
        ncounter.sequenceValue = counter.sequenceValue + 1;
        const update = await Counters.findOneAndUpdate({ _id: counter._id }, { $set: ncounter }, { new: true });
        return update.sequenceValue;
    } else {
        const nCounter = new Counters();
        nCounter.collectionName = collectionName;
        nCounter.sequenceValue = 1;
        const isInserted = await nCounter.save();
        return isInserted.sequenceValue;
    }
}

module.exports = {
    getNextSequenceValue
};