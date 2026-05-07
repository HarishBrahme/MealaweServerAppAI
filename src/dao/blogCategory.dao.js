const BlogCategory = require('../model/blogCategory.model');

async function createBlogCategory(data, options = {}) {
    try {
        const category = new BlogCategory(data);
        return await category.save(options.session ? { session: options.session } : undefined);
    } catch (error) {
        throw new Error('Error creating blog category: ' + error.message);
    }
}

async function getAllBlogCategories(page, pageSize) {
    try {
        const skip = (page - 1) * pageSize;
        const [categories, total] = await Promise.all([BlogCategory.find().skip(skip).limit(pageSize), BlogCategory.countDocuments()]);
        return { categories, total };
    } catch (error) {
        throw new Error('Error fetching blog categories: ' + error.message);
    }
}

async function getBlogCategoryById(id) {
    try {
        return await BlogCategory.findById(id);
    } catch (error) {
        throw new Error('Error fetching blog category by ID: ' + error.message);
    }
}

async function getBlogCategoryByPathName(pathName) {
    try {
        return await BlogCategory.findOne({ pathName: pathName });
    } catch (error) {
        throw new Error('Error fetching blog category by path name: ' + error.message);
    }
}

async function updateBlogCategory(id, data, options = {}) {
    try {
        return await BlogCategory.findByIdAndUpdate(id, data, { new: true, ...(options.session && { session: options.session }) });
    } catch (error) {
        throw new Error('Error updating blog category: ' + error.message);
    }
}

async function deleteBlogCategory(id, options = {}) {
    try {
        return await BlogCategory.findByIdAndDelete(id, options.session ? { session: options.session } : undefined);
    } catch (error) {
        throw new Error('Error deleting blog category: ' + error.message);
    }
}

async function getAllCategoryNames() {
    try {
        return await BlogCategory.find({}, { blogCategoryName: 1, _id: 1 });
    } catch (error) {
        throw new Error('Error fetching blog category names: ' + error.message);
    }
}


async function getCategoryNamesPaginated(page, pageSize) {
    try {
        const skip = (page - 1) * pageSize;
        const projection = { blogCategoryName: 1, pathName: 1, _id: 0 };
        const [categories, total] = await Promise.all([BlogCategory.find({}, projection).skip(skip).limit(pageSize), BlogCategory.countDocuments()]);
        return { categories, total };
    } catch (error) {
        throw new Error('Error fetching paginated blog category names: ' + error.message);
    }
}
module.exports = {
    createBlogCategory,
    getAllBlogCategories,
    getBlogCategoryById,
    getBlogCategoryByPathName,
    updateBlogCategory,
    deleteBlogCategory,
    getAllCategoryNames,
    getCategoryNamesPaginated,
};