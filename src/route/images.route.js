const express = require('express');
const router = express.Router();
const service = require('../service/images.service');
const path = require('path');
const upload = require('../util/image-handler');
const { kitchenAuthMiddleware, allAuthMiddleware } = require('../util/auth-middleware-jwt');
const responsehanlder = require('../util/response-handler');

router.get('/images/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        if (filename && filename !== 'undefined' && filename !== 'null') {
            res.set('Cache-Control', 'max-age=3153600');
            service.readS3Image(req, res, 0)
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }

    } catch (error) {
        console.log('image route ', error);
        res.status(500).send({ error });
    }
});

router.get('/public/images/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        if (filename && filename !== 'undefined' && filename !== 'null') {
            const filepath = path.join(__dirname, '../../public/images/' + filename);
            res.sendFile(filepath);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        res.status(500).send({ error });
    }
});

router.post('/images/createImage', kitchenAuthMiddleware, upload.single('image'), async (req, res) => {
    try {
        responsehanlder.success200(req, res, { imageUrl: req.file.filename });
    } catch (error) {
        res.status(500).send({ error });
    }
});
router.post('/images/deleteMultiImages', kitchenAuthMiddleware, async (req, res) => {
    try {
        const imageUrlList = req.body.imageUrlList;
        if (imageUrlList) {
            const result = await service.deleteMultiImages(imageUrlList);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        res.status(500).send({ error });
    }
});

module.exports = router;