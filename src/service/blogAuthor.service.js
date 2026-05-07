const mongoose = require('mongoose');
const blogAuthorDao = require('../dao/blogAuthor.dao');
const metaManagementDao = require('../dao/metaManagement.dao');
const { deleteImage } = require('../service/images.service');

async function createBlogAuthor(data, images = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { generalInfo, seoInfo } = data;
        const blogAuthorData = JSON.parse(generalInfo);
        const seoData = JSON.parse(seoInfo);
        if (images.profilePicture) {
            blogAuthorData.profilePicture = images.profilePicture;
        }
        const createdAuthor = await blogAuthorDao.createBlogAuthor(blogAuthorData, { session });
        seoData.pagePathName = blogAuthorData.pathName;
        seoData.pageType = 'blog-author';
        seoData.pageId = createdAuthor._id;
        if (images.featureImage) {
            seoData.featureImage = images.featureImage;
        }
        await metaManagementDao.createMetaManagement(seoData, session);
        await session.commitTransaction();
        session.endSession();
        return createdAuthor;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

async function updateBlogAuthor(id, data, images = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { generalInfo, seoInfo } = data;
        const blogAuthorData = typeof generalInfo === 'string' ? JSON.parse(generalInfo) : generalInfo;
        const seoData = typeof seoInfo === 'string' ? JSON.parse(seoInfo) : seoInfo;
        const authorRaw = await blogAuthorDao.getBlogAuthorById(id);
        const seoDataRaw = await metaManagementDao.getMetaManagementByPageId(id);

        if (images.profilePicture) {
            if (authorRaw.profilePicture) deleteImage(authorRaw.profilePicture);
            blogAuthorData.profilePicture = images.profilePicture;
        }
        const updatedAuthor = await blogAuthorDao.updateBlogAuthor(id, blogAuthorData, { session });
        seoData.pagePathName = blogAuthorData.pathName;
        seoData.pageType = 'blog-author';
        if (images.featureImage) {
            if (seoDataRaw.featureImage) deleteImage(seoDataRaw.featureImage);
            seoData.featureImage = images.featureImage;
        }
        await metaManagementDao.updateMetaByPageId(id, seoData, session);
        await session.commitTransaction();
        session.endSession();
        return updatedAuthor;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

async function getAllBlogAuthors(page, pageSize) {
    return await blogAuthorDao.getAllBlogAuthors(page, pageSize);
}

async function getBlogAuthorById(id) {
    const author = await blogAuthorDao.getBlogAuthorById(id);
    const seoData = await metaManagementDao.getMetaManagementByPageId(id);
    return { author, seoData };
}

async function getBlogAuthorByPathName(pathName) {
    return await blogAuthorDao.getBlogAuthorByPathName(pathName);
}

async function getAllAuthorNames() {
    return await blogAuthorDao.getAllAuthorNames();
}

async function deleteBlogAuthor(id) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const author = await blogAuthorDao.getBlogAuthorById(id);
        if (author && author.profilePicture) deleteImage(meta.profilePicture);
        await blogAuthorDao.deleteBlogAuthor(id, { session });
        const meta = await metaManagementDao.getMetaManagementByPageId(id);
        if (meta && meta.featureImage) deleteImage(meta.featureImage);
        await metaManagementDao.deleteMetaByPageId(id, session);
        await session.commitTransaction();
        session.endSession();
        return author;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

module.exports = {
    createBlogAuthor,
    updateBlogAuthor,
    getAllBlogAuthors,
    getBlogAuthorById,
    getBlogAuthorByPathName,
    deleteBlogAuthor,
    getAllAuthorNames,
};