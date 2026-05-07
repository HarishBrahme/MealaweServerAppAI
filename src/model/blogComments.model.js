const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const blogCommentSchema = new Schema({
    blogId: { type: Schema.Types.ObjectId, ref: 'Blog', required: true },
    parentCommentId: { type: Schema.Types.ObjectId, ref: 'BlogComments', default: null },
    userName: { type: String, required: true },
    userPhone: { type: String },
    message: { type: String, required: true }
}, {
    timestamps: true
});

module.exports = remoteMongoDb.model('BlogComments', blogCommentSchema);
