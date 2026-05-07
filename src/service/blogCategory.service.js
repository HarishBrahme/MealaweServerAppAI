const mongoose = require('mongoose');
const blogCategoryDao = require('../dao/blogCategory.dao');
const metaManagementDao = require('../dao/metaManagement.dao');
const { deleteImage } = require('../service/images.service');

async function createBlogCategory(data, filename) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { generalInfo, seoInfo } = data;
        const blogCategoryData = JSON.parse(generalInfo);
        const seoData = JSON.parse(seoInfo);
        const createdCategory = await blogCategoryDao.createBlogCategory(blogCategoryData, { session });
        seoData.pagePathName = blogCategoryData.pathName;
        seoData.pageType = 'blog-category';
        seoData.pageId = createdCategory._id;
        if (filename) {
            seoData.featureImage = filename;
        }
        await metaManagementDao.createMetaManagement(seoData, session);
        await session.commitTransaction();
        session.endSession();
        return createdCategory;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

async function updateBlogCategory(id, data, filename) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { generalInfo, seoInfo } = data;
        let blogCategoryData = {};
        let seoData = {};
        if (filename) {
            blogCategoryData = JSON.parse(generalInfo);
            seoData = JSON.parse(seoInfo);
        } else {
            blogCategoryData = generalInfo;
            seoData = seoInfo;
        }
        const updatedCategory = await blogCategoryDao.updateBlogCategory(id, blogCategoryData, { session });
        seoData.pagePathName = blogCategoryData.pathName;
        seoData.pageType = 'blog-category';
        if (filename) {
            if (seoData.featureImage) {
                deleteImage(seoData.featureImage);
            }
            seoData.featureImage = filename;
        }
        await metaManagementDao.updateMetaByPageId(id, seoData, session);
        await session.commitTransaction();
        session.endSession();
        return updatedCategory;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

async function getAllBlogCategories(page, pageSize) {
    return await blogCategoryDao.getAllBlogCategories(page, pageSize);
}

async function getBlogCategoryById(id) {
    const category = await blogCategoryDao.getBlogCategoryById(id);
    const seoData = await metaManagementDao.getMetaManagementByPageId(id);
    return { category, seoData };
}

async function getBlogCategoryByPathName(id) {
    const category = await blogCategoryDao.getBlogCategoryByPathName(id);
    return category;
}

async function deleteBlogCategory(id) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const category = await blogCategoryDao.getBlogCategoryById(id);
        await blogCategoryDao.deleteBlogCategory(id, { session });
        const meta = await metaManagementDao.getMetaManagementByPageId(id);
        if (meta && meta.featureImage) {
            deleteImage(meta.featureImage);
        }
        await metaManagementDao.deleteMetaByPageId(id, session);
        await session.commitTransaction();
        session.endSession();
        return category;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

async function getAllCategoryNames() {
    return await blogCategoryDao.getAllCategoryNames();
}

async function getCategoryNamesPaginated(page, pageSize) {
    return await blogCategoryDao.getCategoryNamesPaginated(page, pageSize);
}

module.exports = {
    createBlogCategory,
    updateBlogCategory,
    getAllBlogCategories,
    getBlogCategoryById,
    getBlogCategoryByPathName,
    deleteBlogCategory,
    getAllCategoryNames,
    getCategoryNamesPaginated,
};