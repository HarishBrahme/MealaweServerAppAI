const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn }= require('../config/dbConfig');
const { remoteMongoDb } = getDBconn();

const blogSchema = new Schema({
    name: { type: String, required: true },
    pathName: { type: String, required: true, unique: true },
    shortDescription: { type: String },
    blogCategory: [{ type: Schema.Types.ObjectId, ref: 'BlogCategory', required: true }],
    featureImage: { type: String },
    blogContent: { type: String },
    publishedDate: { type: Date },
    author: { type: Schema.Types.ObjectId, ref: 'BlogAuthor', required: true },
    featuresBlogs: [{ type: Schema.Types.ObjectId, ref: 'Blog' }],
    viewed: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    timeread: { type: String },
    featureToHome: { type: Boolean },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' }
}, {
    timestamps: true
});
blogSchema.index({ name: 1 });
module.exports = remoteMongoDb.model('Blog', blogSchema);
