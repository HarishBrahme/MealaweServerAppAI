const mongoose = require('mongoose');
const { Schema } = mongoose;
const { getDBconn } = require('../config/dbConfig');
const { remoteMongoDb } = getDBconn()

const marketPlaceItemReviewSchema = new Schema(
    {
        itemId: { type: Schema.Types.ObjectId, ref: 'MarketPlaceItem', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        title: { type: String, trim: true, maxlength: 1000 },
        review: { type: String, trim: true, maxlength: 1000 },
        reviewImages: [{ type: String, trim: true }],
        customerName: { type: String, required: true, trim: true },
        verified: { type: Boolean, default: false },
        pinned: { type: Boolean, default: false },
        customerEmail: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
        },
    },
    {
        timestamps: true,
    }
);

module.exports = remoteMongoDb.model('MarketPlaceItemReview', marketPlaceItemReviewSchema);