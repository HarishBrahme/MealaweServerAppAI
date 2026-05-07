const express = require('express');
const router = express.Router();
const blogService = require('../service/blogs.service');
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
const upload = require('../util/image-handler');
const { adminAuthMiddleware, openAuthMiddleware } = require('../util/auth-middleware-jwt');
const responsehanlder = require('../util/response-handler');

router.use(decryptMiddleware);

router.post('/createBlog', adminAuthMiddleware, upload.single('featureImage'), async (req, res) => {
    try {
        const blog = await blogService.createBlog(req.body, req.file?.filename);
        responsehanlder.success200(req, res, blog);
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.put('/updateBlog/:id', adminAuthMiddleware, upload.single('featureImage'), async (req, res) => {
    try {
        const blog = await blogService.updateBlog(req.params.id, req.body, req.file?.filename);
        if (!blog) {
            responsehanlder.hasError404(res, 'Blog not found');
        } else {
            responsehanlder.success200(req, res, blog);
        }
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.delete('/deleteBlog/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const result = await blogService.deleteBlog(req.params.id);
        if (!result) {
            responsehanlder.hasError404(res, 'Blog not found');
        } else {
            responsehanlder.success200(req, res, result);
        }
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.get('/getAllBlogs/:page/:pageSize/:status', openAuthMiddleware, async (req, res) => {
    const page = parseInt(req.params.page) || 1;
    const pageSize = parseInt(req.params.pageSize) || 10;
    const status = req.params.status;
    try {
        const result = await blogService.getAllBlogs(page, pageSize, status);
        responsehanlder.success200(req, res, result);
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.get('/getBlogById/:id', openAuthMiddleware, async (req, res) => {
    try {
        const blog = await blogService.getBlogById(req.params.id);
        if (!blog) {
            responsehanlder.hasError404(res, 'Blog not found');
        } else {
            responsehanlder.success200(req, res, blog);
        }
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.get('/getBlogByPathName/:pathName', openAuthMiddleware, async (req, res) => {
    try {
        const blog = await blogService.getBlogByPathName(req.params.pathName);
        if (!blog) {
            responsehanlder.hasError404(res, 'Blog not found');
        } else {
            responsehanlder.success200(req, res, blog);
        }
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.get('/getBlogByCategory/:categoryId', openAuthMiddleware, async (req, res) => {
    try {
        const blog = await blogService.getBlogByCategory(req.params.categoryId);
        if (!blog) {
            responsehanlder.hasError404(res, 'Blog not found');
        } else {
            responsehanlder.success200(req, res, blog);
        }
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.get('/getBlogByAuthor/:authorId', openAuthMiddleware, async (req, res) => {
    try {
        const blog = await blogService.getBlogByAuthor(req.params.authorId);
        if (!blog) {
            responsehanlder.hasError404(res, 'Blog not found');
        } else {
            responsehanlder.success200(req, res, blog);
        }
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.get('/getBlogFeaturedPosts', openAuthMiddleware, async (req, res) => {
    try {
        const blogs = await blogService.getBlogFeaturedPosts();
        responsehanlder.success200(req, res, blogs);
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.get('/searchBlogsByName/:search', openAuthMiddleware, async (req, res) => {
    try {
        const blogs = await blogService.searchBlogsByName(req.params.search);
        responsehanlder.success200(req, res, blogs);
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.patch('/incrementViewed/:id', openAuthMiddleware, async (req, res) => {
    try {
        const blog = await blogService.incrementViewed(req.params.id);
        if (!blog) {
            responsehanlder.hasError404(res, 'Blog not found');
        } else {
            responsehanlder.success200(req, res, blog);
        }
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.patch('/incrementLikes/:id', openAuthMiddleware, async (req, res) => {
    try {
        const blog = await blogService.incrementLikes(req.params.id);
        if (!blog) {
            responsehanlder.hasError404(res, 'Blog not found');
        } else {
            responsehanlder.success200(req, res, blog);
        }
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.patch('/updateStatus/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const blog = await blogService.updateStatus(req.params.id, req.body.status);
        if (!blog) {
            responsehanlder.hasError404(res, 'Blog not found');
        } else {
            responsehanlder.success200(req, res, blog);
        }
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.patch('/publishBlog/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const blog = await blogService.publishBlog(req.params.id);
        if (!blog) {
            responsehanlder.hasError404(res, 'Blog not found');
        } else {
            responsehanlder.success200(req, res, blog);
        }
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

module.exports = router;