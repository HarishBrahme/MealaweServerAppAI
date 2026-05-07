const mongoose = require('mongoose');
const blogDao = require('../dao/blogs.dao');
const metaManagementDao = require('../dao/metaManagement.dao');
const { deleteImage } = require('../service/images.service');

async function createBlog(data, filename) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { generalInfo, seoInfo } = data;
        const blogData = JSON.parse(generalInfo);
        const seoData = JSON.parse(seoInfo);
        seoData.pagePathName = blogData.pathName;
        seoData.pageType = 'blog';
        if (filename) {
            seoData.featureImage = filename;
            blogData.featureImage = filename;
        }
        const createdBlog = await blogDao.createBlog(blogData, { session });
        seoData.pageId = createdBlog._id;
        await metaManagementDao.createMetaManagement(seoData, session);
        await session.commitTransaction();
        session.endSession();
        return createdBlog;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

async function updateBlog(id, data, filename) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { generalInfo, seoInfo } = data;
        let blogData = typeof generalInfo === 'string' ? JSON.parse(generalInfo) : generalInfo;
        let seoData = typeof seoInfo === 'string' ? JSON.parse(seoInfo) : seoInfo;
        seoData.pagePathName = blogData.pathName;
        seoData.pageType = 'blog';
        seoData.pageId = id;
        if (filename) {
            if (seoData.featureImage) {
                deleteImage(seoData.featureImage);
            }
            seoData.featureImage = filename;
            blogData.featureImage = filename;
        }
        const updatedBlog = await blogDao.updateBlog(id, blogData, { session });
        await metaManagementDao.updateMetaByPageId(id, seoData, session);
        await session.commitTransaction();
        session.endSession();
        return updatedBlog;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

async function getAllBlogs(page, pageSize, status) {
    return blogDao.getAllBlogs(page, pageSize, status);
}

async function getBlogById(id) {
    const blog = await blogDao.getBlogById(id);
    const seoData = await metaManagementDao.getMetaManagementByPageId(id);
    return { blog, seoData };
}

async function getBlogByPathName(pathName) {
    const blog = await blogDao.getBlogByPathName(pathName);
    return blog;
}

async function getBlogByCategory(categoryId) {
    const blogs = await blogDao.getBlogByCategory(categoryId);
    return blogs;
}

async function getBlogByAuthor(categoryId) {
    const blogs = await blogDao.getBlogByAuthor(categoryId);
    return blogs;
}

async function getBlogFeaturedPosts() {
    const blogs = await blogDao.getBlogFeaturedPosts();
    return blogs;
}

async function deleteBlog(id) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const blogToDelete = await blogDao.getBlogById(id);
        await blogDao.deleteBlog(id, { session });
        const meta = await metaManagementDao.getMetaManagementByPageId(id);
        if (meta?.featureImge) {
            deleteImage(meta.featureImge);
        }
        await metaManagementDao.deleteMetaByPageId(id, session);
        await session.commitTransaction();
        session.endSession();
        return blogToDelete;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

async function incrementViewed(id) {
    return blogDao.incrementViewed(id);
}

async function incrementLikes(id) {
    return blogDao.incrementLikes(id);
}

async function incrementCommentCount(id) {
    return blogDao.incrementCommentCount(id);
}

async function updateStatus(id, status) {
    return blogDao.updateStatus(id, status);
}

async function publishBlog(id) {
    return blogDao.publishBlog(id);
}

async function searchBlogsByName(text) {
    return blogDao.searchBlogsByName(text);
}

module.exports = {
    createBlog,
    updateBlog,
    getAllBlogs,
    getBlogById,
    getBlogByPathName,
    getBlogByCategory,
    getBlogByAuthor,
    getBlogFeaturedPosts,
    deleteBlog,
    incrementViewed,
    incrementLikes,
    incrementCommentCount,
    updateStatus,
    publishBlog,
    searchBlogsByName
};
