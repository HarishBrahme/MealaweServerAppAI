
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { getDBconn } = require('../config/dbConfig');
const { remoteDocumentDb } = getDBconn();

const serverLogSchema = new Schema({
    type: String,
    logMsg: String,
    logObj: Object,
    timestamp: Date
});
const auditLogSchema = new Schema({
    ipInfo: String,
    urlInfo: String,
    urlMethod: String,
    userInfo: Object,
    payload: Object,
    timestamp: Date
});
serverLogSchema.index({ timestamp: 1 });
auditLogSchema.index({ timestamp: 1 });
let auditTableName;
let serverLogTableName;

if (process.env.PRODUCTION === 'true') {
    auditTableName = 'mealaweProductionAuditLogs';
    serverLogTableName = 'mealaweProductionServerLogs';
} else if (process.env.STAGING === 'true') {
    auditTableName = 'mealaweStagingAuditLogs';
    serverLogTableName = 'mealaweStagingServerLogs';
} else {
    auditTableName = 'mealaweLocalAuditLogs';
    serverLogTableName = 'mealaweLocalServerLogs';
}
let AuditLogTable;
let ServerLogTable;

if (remoteDocumentDb) {
    try {
        console.log('####creating documentDB table')
        AuditLogTable = remoteDocumentDb.model(auditTableName, auditLogSchema);
        ServerLogTable = remoteDocumentDb.model(serverLogTableName, serverLogSchema);
    } catch (error) {
        console.log('Error while creating table', error);
    }
}


const serverLog = (logMsg = '', logObj = {}, msgType = 'INFO') => {
    try {
        if (ServerLogTable) {
            console.log('serverLog#### logMsg', logMsg);
            const serverLogTable = new ServerLogTable();
            serverLogTable.type = msgType;
            serverLogTable.logMsg = logMsg;
            serverLogTable.logObj = logObj;
            serverLogTable.timestamp = (new Date()).getTime();
            serverLogTable.save();
        }
    } catch (error) {
        console.log('Error while serverLog', error);
    }
}

const getTimeBasedLogs = async (from, to) => {
    if (ServerLogTable) {
        const logsArr = await ServerLogTable.find({ timestamp: { $lte: to, $gte: from } })
        return logsArr;
    } else {
        return [];
    }

}

const getLineBasedLogs = async (limit) => {
    if (ServerLogTable) {
        console.log('getLineBasedLogs#### limit', limit);
        const logsArr = await ServerLogTable.find({}).sort({ _id: -1 }).limit(limit * 1).exec();
        return logsArr;
    } else {
        return [];
    }

}

const getTextBasedLogs = async (searchObj, page) => {
    if (ServerLogTable) {
        const limit = 50;
        const condition = {};
        if (searchObj.logMsg) {
            const regexText = new RegExp(searchObj.logMsg, 'i');
            condition.logMsg = regexText;
        }
        return await ServerLogTable.find(condition).sort({ timestamp: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
    } else {
        return [];
    }
}


const saveAuditLog = (urlInfo = '', urlMethod = '', payload = {}, ipInfo = '', userInfo = {}) => {
    try {
        if (AuditLogTable) {
            const auditLogTable = new AuditLogTable();
            auditLogTable.ipInfo = ipInfo;
            auditLogTable.urlInfo = urlInfo;
            auditLogTable.urlMethod = urlMethod;
            auditLogTable.userInfo = userInfo;
            auditLogTable.payload = payload;
            auditLogTable.timestamp = (new Date()).getTime();
            auditLogTable.save();
        }

    } catch (error) {
        console.log('Error while saveAuditLog', error);
    }
}

const getTimeBasedAuditLogs = async (from, to) => {
    if (AuditLogTable) {
        const logsArr = await AuditLogTable.find({ timestamp: { $lte: to, $gte: from } })
        return logsArr;
    } else {
        return [];
    }

}

const getLineBasedAuditLogs = async (limit) => {
    if (AuditLogTable) {
        const logsArr = await AuditLogTable.find({}).sort({ _id: -1 }).limit(limit * 1).exec();
        return logsArr;
    } else {
        return [];
    }

}

const getTextBasedAuditLogs = async (searchObj) => {
    if (AuditLogTable) {
        const limit = 50;
        const condition = {};
        if (searchObj.urlInfo) {
            const regexText = new RegExp(searchObj.urlInfo, 'i');
            condition.urlInfo = regexText;
        }
        return await AuditLogTable.find(condition).sort({ timestamp: -1 }).skip((page - 1) * limit).limit(limit * 1).exec();
    } else {
        return [];
    }
}

const getAuditLogs = async (params = {}) => {
    try {
        if (!AuditLogTable) return [];
        if (params.limit !== undefined && params.limit !== null) {
            const limit = parseInt(params.limit);
            if (isNaN(limit)) return [];
            return await getLineBasedAuditLogs(limit);
        }

        if (params.hour !== undefined && params.hour !== null) {
            const hour = parseInt(params.hour);
            if (!isNaN(hour)) {
                const to = (new Date()).getTime();
                const from = to - 1000 * 60 * 60 * hour;
                return await getTimeBasedAuditLogs(from, to);
            }
        }
        if (params.from && params.to) {
            const from = parseInt(params.from);
            const to = parseInt(params.to);
            if (!isNaN(from) && !isNaN(to)) {
                return await getTimeBasedAuditLogs(from, to);
            }
        }

        if (params.page !== undefined && params.page !== null) {
            const page = parseInt(params.page);
            const searchObj = params.searchObj || {};
            if (isNaN(page)) return [];
            return await getTextBasedAuditLogs(searchObj, page);
        }
        return [];
    } catch (err) {
        console.log('getAuditLogs error', err);
        return [];
    }
}

const getServerLogs = async (params = {}) => {
    try {
        if (!ServerLogTable) return [];
        if (params.limit !== undefined && params.limit !== null) {
            const limit = parseInt(params.limit);
            if (isNaN(limit)) return [];
            return await getLineBasedLogs(limit);
        }
        if (params.hour !== undefined && params.hour !== null) {
            const hour = parseInt(params.hour);
            if (!isNaN(hour)) {
                const to = (new Date()).getTime();
                const from = to - 1000 * 60 * 60 * hour;
                return await getTimeBasedLogs(from, to);
            }
        }
        if (params.from && params.to) {
            const from = parseInt(params.from);
            const to = parseInt(params.to);
            if (!isNaN(from) && !isNaN(to)) {
                return await getTimeBasedLogs(from, to);
            }
        }
        if (params.page !== undefined && params.page !== null) {
            const page = parseInt(params.page);
            const searchObj = params.searchObj || {};
            if (isNaN(page)) return [];
            return await getTextBasedLogs(searchObj, page);
        }
        return [];
    } catch (err) {
        console.log('getServerLogs error', err);
        return [];
    }
}

module.exports = {
    serverLog,
    getTimeBasedLogs,
    getLineBasedLogs,
    saveAuditLog,
    getTimeBasedAuditLogs,
    getLineBasedAuditLogs,
    getTextBasedLogs,
    getTextBasedAuditLogs,
    getAuditLogs,
    getServerLogs
}
