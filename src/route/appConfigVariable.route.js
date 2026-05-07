const express = require('express');
const service = require('../service/appConfigVariable.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const { adminAuthMiddleware, allAuthMiddleware } = require('../util/auth-middleware-jwt');

router.post('/saveVariable', adminAuthMiddleware, async (req, res) => {
    try {
        if (req.body) {
            const savedVariable = await service.saveVariable(req.body)
            responsehanlder.success200(req, res, savedVariable)
        } else {
            responsehanlder.hasError402(res)
        }
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});
router.get('/getAllVariables', adminAuthMiddleware, async (req, res) => {
    try {
        const getAllVariable = await service.getAllVariables();
        responsehanlder.success200(req, res, getAllVariable)
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});
router.post('/getVariables', async (req, res) => {
    try {
        const variableNames = req.body.variableNames;
        if (variableNames) {
            const getAllVariable = await service.getVariables(variableNames);
            responsehanlder.success200(req, res, getAllVariable);
        } else {
            responsehanlder.hasError402(res)
        }
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});
router.post('/updateVariable', adminAuthMiddleware, async (req, res) => {
    try {
        const variable = req.body;
        if (variable) {
            const getAllVariable = await service.updateVariable(variable);
            responsehanlder.success200(req, res, getAllVariable);
        } else {
            responsehanlder.hasError402(res)
        }
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});
router.delete('/deleteVariable/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const getAllVariable = await service.deleteVariable(id);
            responsehanlder.success200(req, res, getAllVariable);
        } else {
            responsehanlder.hasError402(res)
        }
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});
router.get('/getOneVariable/:variableName', allAuthMiddleware, async (req, res) => {
    try {
        const variableName = req.params.variableName;
        if (variableName) {
            const variable = await service.getOneVariable(variableName);
            responsehanlder.success200(req, res, variable);
        } else {
            responsehanlder.hasError402(res)
        }
    } catch (error) {
        responsehanlder.hasError500(res)
    }
});
module.exports = router;