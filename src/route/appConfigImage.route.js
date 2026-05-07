const express = require('express');
const service = require('../service/appConfigImage.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { adminAuthMiddleware, kitchenAuthMiddleware } = require('../util/auth-middleware-jwt');
var upload = require('../util/image-handler');

router.post('/saveConfigImage', adminAuthMiddleware, upload.single('image'), async (req, res) => {
    try {
        console.log('req.file.filename',req.file.filename)
        if (req.body && req.file && req.file.filename) {
            const imageSaved = await service.saveConfigImage(req.body, req.file.filename);
            responsehanlder.success200(req, res, imageSaved);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        console.log('Error at appConfigImage.route saveConfigImage ==> ',error);
        responsehanlder.hasError500(res)
    }
});

router.get('/getAllConfigImages', adminAuthMiddleware, async (req, res) => {
    try {
        const configImages = await service.getAllConfigImages();
        responsehanlder.success200(req, res, configImages);
    } catch (error) {
        // console.log('Error at appConfigImage.route getAllConfigImages ==> ',error);
        responsehanlder.hasError500(res)
    }
});

router.post('/getConfigImages', adminAuthMiddleware, async (req, res) => {
    try {
        let imageNames;
        if (req.body && req.body.imageNames) {
            imageNames = req.body.imageNames;
        }
        if (imageNames) {
            const configImages = await service.getConfigImages(imageNames);
            responsehanlder.success200(req, res, configImages);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log('Error at appConfigImage.route getConfigImages ==> ',error);
        responsehanlder.hasError500(res)
    }
});


router.post('/updateConfigImage/:id', adminAuthMiddleware, upload.single('image'), async (req, res) => {
    try {
        let filename;
        if (req.file && req.file.filename) {
            filename = req.file.filename;
        }
        const id = req.params.id;
        if (id) {
            const updatebanner = await service.updateConfigImage(id, req.body, filename);
            responsehanlder.success200(req, res, updatebanner)
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log('Error at Banner.route updateConfigImage ==> ',error);
        responsehanlder.hasError500(res)
    }
});
router.get('/getOneConfigImage/:imageName', kitchenAuthMiddleware, async (req, res) => {
    try {
        const imageName = req.params.imageName;
        if (imageName) {
            const configImage = await service.getOneConfigImage(imageName);
            if (configImage && configImage.imageUrl) {
                responsehanlder.success200(req, res, configImage);
            } else {
                responsehanlder.success200(req, res, { imageName });
            }

        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log('Error at appConfigImage.route getOneConfigImage ==> ',error);
        responsehanlder.hasError500(res)
    }
});


module.exports = router;