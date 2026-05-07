const express = require('express');
const service = require('../service/clusterConfigVariable.service');
const responsehanlder = require('../util/response-handler');
const router = express.Router();
const { decryptMiddleware } = require('../util/auth-middleware-jwt');
router.use(decryptMiddleware);
const {adminAuthMiddleware, allAuthMiddleware} = require('../util/auth-middleware-jwt');

router.post('/saveUpdateClusterVariable',async(req,res)=>{
    try{
        if(req.body){
            const savedVariable = await service.saveUpdateClusterVariable(req.body)
            responsehanlder.success200(req,res,savedVariable)
        }else{
            responsehanlder.hasError402(res)
        }        
    }catch(error)
    {
        responsehanlder.hasError500(res)
    }
});


router.get('/getClusterVariable', async (req, res) => {
    try {
        const ClusterVariables = await service.getClusterVariable();
        responsehanlder.success200(req, res, ClusterVariables);
    } catch (error) {
        console.log(error);
        responsehanlder.hasError500(res);
    }
});
router.get('/getClusterVariablesnameList', async (req, res) => {
    try {
        const ClusterVariables = await service.getClusterVariablesnameList();
        responsehanlder.success200(req, res, ClusterVariables);
    } catch (error) {
        console.log(error);
        responsehanlder.hasError500(res);
    }
})

router.post('/searchClusterVariable', async (req, res) => {
    try {
        const searchObj = req.body || {};
        const records = await service.searchClusterVariable(searchObj);
            responsehanlder.success200(req, res, records);
    } catch (error) {
        console.log(error)
        responsehanlder.hasError500(res);
    }
})

router.delete('/deleteClusterVariable/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (id) {
            const result = await service.deleteClusterVariable(id);
            responsehanlder.success200(req, res, result);
        } else {
            responsehanlder.hasError500(res, 'invalid request');
        }
    } catch (error) {
        console.log(error);
        responsehanlder.hasError500(res);
    }
})

module.exports = router;