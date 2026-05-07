const BlogAuthor = require('../model/blogAuthor.model');

async function createBlogAuthor(data, options = {}) {
    try {
        const author = new BlogAuthor(data);
        return await author.save(options.session ? { session: options.session } : undefined);
    } catch (error) {
        throw new Error('Error creating blog author: ' + error.message);
    }
}

async function getAllBlogAuthors(page, pageSize) {
    try {
        const skip = (page - 1) * pageSize;
        const [authors, total] = await Promise.all([
            BlogAuthor.find().skip(skip).limit(pageSize),
            BlogAuthor.countDocuments()
        ]);
        return { authors, total };
    } catch (error) {
        throw new Error('Error fetching blog authors: ' + error.message);
    }
}

async function getBlogAuthorById(id) {
    try {
        return await BlogAuthor.findById(id);
    } catch (error) {
        throw new Error('Error fetching blog author by ID: ' + error.message);
    }
}

async function getBlogAuthorByPathName(pathName) {
    try {
        return await BlogAuthor.findOne({ pathName: pathName });
    } catch (error) {
        throw new Error('Error fetching blog author by path name: ' + error.message);
    }
}

async function updateBlogAuthor(id, data, options = {}) {
    try {
        return await BlogAuthor.findByIdAndUpdate(
            id,
            data,
            { new: true, ...(options.session && { session: options.session }) }
        );
    } catch (error) {
        throw new Error('Error updating blog author: ' + error.message);
    }
}

async function deleteBlogAuthor(id, options = {}) {
    try {
        return await BlogAuthor.findByIdAndDelete(
            id,
            options.session ? { session: options.session } : undefined
        );
    } catch (error) {
        throw new Error('Error deleting blog author: ' + error.message);
    }
}

async function getAllAuthorNames() {
    try {
        return await BlogAuthor.find({}, { authorName: 1, _id: 1 });
    } catch (error) {
        throw new Error('Error fetching blog author names: ' + error.message);
    }
}

module.exports = {
    createBlogAuthor,
    getAllBlogAuthors,
    getBlogAuthorById,
    getBlogAuthorByPathName,
    updateBlogAuthor,
    deleteBlogAuthor,
    getAllAuthorNames,
};
