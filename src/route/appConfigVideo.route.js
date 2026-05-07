const express = require('express');
const service = require('../service/appConfigVideo.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { adminAuthMiddleware, kitchenAuthMiddleware } = require('../util/auth-middleware-jwt');
var upload = require('../util/video-handler');

router.post('/saveConfigVideo', adminAuthMiddleware, upload.single('video'), async (req, res) => {
    try {
        console.log('req.file.filename',req.file.filename)
        if (req.body && req.file && req.file.filename) {
            const videoSaved = await service.saveConfigVideo(req.body, req.file.filename);
            responsehanlder.success200(req, res, videoSaved);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        console.log('Error at appConfigVideo.route saveConfigVideo ==> ',error);
        responsehanlder.hasError500(res)
    }
});

router.get('/getAllConfigVideos', adminAuthMiddleware, async (req, res) => {
    try {
        const configVideos = await service.getAllConfigVideos();
        responsehanlder.success200(req, res, configVideos);
    } catch (error) {
        // console.log('Error at appConfigVideo.route getAllConfigVideos ==> ',error);
        responsehanlder.hasError500(res)
    }
});

router.post('/getConfigVideos', adminAuthMiddleware, async (req, res) => {
    try {
        let videoNames;
        if (req.body && req.body.videoNames) {
            videoNames = req.body.videoNames;
        }
        if (videoNames) {
            const configVideos = await service.getConfigVideos(videoNames);
            responsehanlder.success200(req, res, configVideos);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log('Error at appConfigVideo.route getConfigVideos ==> ',error);
        responsehanlder.hasError500(res)
    }
});


router.post('/updateConfigVideo/:id', adminAuthMiddleware, upload.single('video'), async (req, res) => {
    try {
        let filename;
        if (req.file && req.file.filename) {
            filename = req.file.filename;
        }
        const id = req.params.id;
        if (id) {
            const updatebanner = await service.updateConfigVideo(id, req.body, filename);
            responsehanlder.success200(req, res, updatebanner)
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log('Error at Banner.route updateConfigVideo ==> ',error);
        responsehanlder.hasError500(res)
    }
});
router.get('/getOneConfigVideo/:videoName', kitchenAuthMiddleware, async (req, res) => {
    try {
        const videoName = req.params.videoName;
        if (videoName) {
            const configVideo = await service.getOneConfigVideo(videoName);
            if (configVideo && configVideo.videoUrl) {
                responsehanlder.success200(req, res, configVideo);
            } else {
                responsehanlder.success200(req, res, { videoName });
            }

        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        // console.log('Error at appConfigVideo.route getOneConfigVideo ==> ',error);
        responsehanlder.hasError500(res)
    }
});


module.exports = router;