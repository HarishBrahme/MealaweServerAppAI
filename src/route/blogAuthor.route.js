const express = require('express');
const router = express.Router();
const blogAuthorService = require('../service/blogAuthor.service');
const { adminAuthMiddleware, openAuthMiddleware } = require('../util/auth-middleware-jwt');
const responsehanlder = require('../util/response-handler');
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
const upload = require('../util/image-handler');

router.use(decryptMiddleware);
const blogAuthorUploadFields = [
    { name: 'featureImage', maxCount: 1 },
    { name: 'profilePicture', maxCount: 1 }
];

router.post('/createBlogAuthor', adminAuthMiddleware, upload.fields(blogAuthorUploadFields), async (req, res) => {
    try {
        const files = req.files || {};
        const featureImage = files.featureImage ? files.featureImage[0].filename : null;
        const profilePicture = files.profilePicture ? files.profilePicture[0].filename : null;

        const author = await blogAuthorService.createBlogAuthor(req.body, { featureImage, profilePicture });

        if (!author) {
            responsehanlder.hasError404(req, 'Author not found');
        } else {
            responsehanlder.success200(req, res, author);
        }
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
}
);

// ------------------ UPDATE AUTHOR ------------------
router.put('/updateBlogAuthor/:id', adminAuthMiddleware, upload.fields(blogAuthorUploadFields), async (req, res) => {
    try {
        const files = req.files || {};
        const featureImage = files.featureImage ? files.featureImage[0].filename : null;
        const profilePicture = files.profilePicture ? files.profilePicture[0].filename : null;
        const author = await blogAuthorService.updateBlogAuthor(req.params.id, req.body, { featureImage, profilePicture });
        if (!author) {
            responsehanlder.hasError404(req, 'Author not found');
        } else {
            responsehanlder.success200(req, res, author);
        }
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
}
);

router.delete('/deleteBlogAuthor/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const author = await blogAuthorService.deleteBlogAuthor(req.params.id);
        if (!author) {
            responsehanlder.hasError404(res, 'Author not found');
        } else {
            responsehanlder.success200(res, res, author);
        }
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.get('/getAllBlogAuthors/:page/:pageSize', openAuthMiddleware, async (req, res) => {
    const page = parseInt(req.params.page) || 1;
    const pageSize = parseInt(req.params.pageSize) || 10;
    try {
        const result = await blogAuthorService.getAllBlogAuthors(page, pageSize);
        responsehanlder.success200(req, res, result);
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.get('/getBlogAuthorById/:id', openAuthMiddleware, async (req, res) => {
    try {
        const author = await blogAuthorService.getBlogAuthorById(req.params.id);
        if (!author) {
            responsehanlder.hasError404(req, 'Author not found');
        } else {
            responsehanlder.success200(req, res, author);
        }
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.get('/getBlogAuthorByPathName/:pathName', openAuthMiddleware, async (req, res) => {
    try {
        const author = await blogAuthorService.getBlogAuthorByPathName(req.params.pathName);
        if (!author) {
            responsehanlder.hasError404(res, 'Author not found');
        } else {
            responsehanlder.success200(req, res, author);
        }
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

router.get('/getAllAuthorNames', openAuthMiddleware, async (req, res) => {
    try {
        const authors = await blogAuthorService.getAllAuthorNames();
        if (!authors || !authors.length) {
            responsehanlder.hasError404(res, 'No authors found');
        } else {
            responsehanlder.success200(req, res, authors);
        }
    } catch (err) {
        responsehanlder.hasError500(res, err.message);
    }
});

module.exports = router;