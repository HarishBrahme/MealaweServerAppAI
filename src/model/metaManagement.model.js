const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const metaTagSchema = new Schema({
    pageType: { type: String, required: true },
    pageId: { type: Schema.Types.ObjectId },
    pagePathName: { type: String, required: true },
    description: { type: String, required: true },
    keywords: { type: String, required: true },
    author: { type: String, required: true },
    platformType: { type: String, required: true },
    title: { type: String, required: true },
    featureImage: { type: String, required: true },
    featureImageAlt: { type: String, required: true },
    featureImageType: { type: String, required: true },
    featureImageWidth: { type: Number, required: true },
    featureImageHeight: { type: Number, required: true },
}, {
    timestamps: true
});

metaTagSchema.index({ pageType: 1, pageId: 1, pagePathName: 1 }, { unique: true });
module.exports = remoteMongoDb.model('MetaTag', metaTagSchema);