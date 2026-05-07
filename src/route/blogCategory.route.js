const express = require('express');
const router = express.Router();
const blogCategoryService = require('../service/blogCategory.service');
const { adminAuthMiddleware, openAuthMiddleware } = require('../util/auth-middleware-jwt');
const responsehanlder = require('../util/response-handler');
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
const upload = require('../util/image-handler');

router.use(decryptMiddleware);

router.post('/createBlogCategory', adminAuthMiddleware, upload.single('featureImage'), async (req, res) => {
    try {
        const category = await blogCategoryService.createBlogCategory(req.body, req.file.filename);
        if (!category) {
            responsehanlder.hasError404(req, 'Category not found');
        } else {
            responsehanlder.success200(req, res, category);
        }
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.put('/updateBlogCategory/:id', upload.single('featureImage'), adminAuthMiddleware, async (req, res) => {
    try {
        const category = await blogCategoryService.updateBlogCategory(req.params.id, req.body, req.file.filename);
        if (!category) {
            responsehanlder.hasError404(req, 'Category not found');
        } else {
            responsehanlder.success200(req, res, category);
        }
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.delete('/deleteBlogCategory/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const blog = await blogCategoryService.deleteBlogCategory(req.params.id);
        if (!blog) {
            responsehanlder.hasError404(res, 'Blog not found');
        } else {
            responsehanlder.success200(req, res, blog);
        }
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.get('/getAllBlogCategories/:page/:pageSize', openAuthMiddleware, async (req, res) => {
    const page = parseInt(req.params.page) || 1;
    const pageSize = parseInt(req.params.pageSize) || 10;
    try {
        const result = await blogCategoryService.getAllBlogCategories(page, pageSize);
        responsehanlder.success200(req, res, result);
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.get('/getBlogCategoryById/:id', openAuthMiddleware, async (req, res) => {
    try {
        const category = await blogCategoryService.getBlogCategoryById(req.params.id);
        if (!category) {
            responsehanlder.hasError404(req, 'Category not found');
        } else {
            responsehanlder.success200(req, res, category);
        }
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.get('/getBlogCategoryByPathName/:pathName', openAuthMiddleware, async (req, res) => {
    try {
        const category = await blogCategoryService.getBlogCategoryByPathName(req.params.pathName);
        if (!category) {
            responsehanlder.hasError404(req, 'Category not found');
        } else {
            responsehanlder.success200(req, res, category);
        }
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.get('/getCategoryNames/:page?/:pageSize?', openAuthMiddleware, async (req, res) => {
    const page = parseInt(req.params.page) || null;
    const pageSize = parseInt(req.params.pageSize) || null;

    try {
        let blog;
        if (page && pageSize) {
            blog = await blogCategoryService.getCategoryNamesPaginated(page, pageSize);
        } else {
            blog = await blogCategoryService.getAllCategoryNames();
        }

        if (!blog) {
            return responsehanlder.hasError404(res, 'Blog not found');
        }

        responsehanlder.success200(req, res, blog);
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

module.exports = router;