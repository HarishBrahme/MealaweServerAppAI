const Blog = require('../model/blogs.model');

async function createBlog(data, options = {}) {
    const blog = new Blog(data);
    return blog.save(options.session ? { session: options.session } : undefined);
}

async function getAllBlogs(page, pageSize, status) {
    const skip = (page - 1) * pageSize;
    const filter = status && status !== "all" ? { status } : {};

    const blogs = await Blog.find(filter, { blogContent: 0 })
        .sort({ publishedDate: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate({
            path: 'blogCategory',
            select: 'blogCategoryName pathName'
        })
        .populate({
            path: 'author',
            select: 'authorName pathName'
        });

    const total = await Blog.countDocuments(filter);
    return { blogs, total };
}

async function getBlogById(id) {
    return Blog.findById(id)
        .populate({ path: 'blogCategory', select: 'blogCategoryName pathName' })
        .populate({ path: 'featuresBlogs', select: 'name' })
}


async function getBlogByPathName(pathName) {
    return Blog.findOne({ pathName })
        .populate({ path: 'blogCategory', select: 'blogCategoryName pathName' })
        .populate({ path: 'featuresBlogs' })
        .populate({ path: 'author', select: 'authorName pathName description locationName socialMedia' });
}


async function getBlogFeaturedPosts() {
    return Blog.find({ featureToHome: true })
        .populate({ path: 'author', select: 'authorName pathName' });
}

async function getBlogByCategory(categoryId) {
    return Blog.find({ blogCategory: categoryId, status: 'published' })
        .populate({ path: 'blogCategory', select: 'blogCategoryName pathName' })
        .populate({ path: 'author', select: 'authorName pathName' })
        .sort({ publishedDate: -1 });
}

async function getBlogByAuthor(authorId) {
    return Blog.find({ author: authorId, status: 'published' })
        .populate({ path: 'blogCategory', select: 'blogCategoryName pathName' })
        .populate({ path: 'author', select: 'authorName pathName' })
        .sort({ publishedDate: -1 });
}

async function updateBlog(id, data, options = {}) {
    return Blog.findByIdAndUpdate(id, data, { new: true, ...options });
}

async function deleteBlog(id, options = {}) {
    return Blog.findByIdAndDelete(id, { ...options });
}

async function incrementViewed(id, options = {}) {
    return Blog.findByIdAndUpdate(id, { $inc: { viewed: 1 } }, { new: true, ...options });
}

async function incrementLikes(id, options = {}) {
    return Blog.findByIdAndUpdate(id, { $inc: { likes: 1 } }, { new: true, ...options });
}

async function incrementCommentCount(id, options = {}) {
    return Blog.findByIdAndUpdate(id, { $inc: { commentCount: 1 } }, { new: true, ...options });
}

async function updateStatus(id, status, options = {}) {
    return Blog.findByIdAndUpdate(id, { status }, { new: true, ...options });
}

async function publishBlog(id, options = {}) {
    return Blog.findByIdAndUpdate(id, { status: 'published', publishedDate: new Date() }, { new: true, ...options });
}

async function searchBlogsByName(searchTerm) {
    if (!searchTerm) return [];
    const regex = new RegExp('^' + searchTerm, 'i');
    return Blog.find({ name: regex }, { _id: 1, name: 1 }).sort({ publishedDate: -1 }).limit(20);
}

module.exports = {
    createBlog,
    getAllBlogs,
    getBlogById,
    getBlogByPathName,
    getBlogByCategory,
    getBlogByAuthor,
    getBlogFeaturedPosts,
    updateBlog,
    deleteBlog,
    incrementViewed,
    incrementLikes,
    incrementCommentCount,
    updateStatus,
    publishBlog,
    searchBlogsByName,
};
