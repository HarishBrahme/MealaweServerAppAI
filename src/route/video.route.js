const express = require('express');
const router = express.Router();
const service = require('../service/video.service');
const responsehanlder = require('../util/response-handler');

router.get('/videos/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        if (filename && filename !== 'undefined' && filename !== 'null') {
            service.readS3Video(req, res, 0)
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }

    } catch (error) {
        console.log('image route ', error);
        res.status(500).send({ error });
    }
});


module.exports = router;