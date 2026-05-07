const responsehanlder = require('./response-handler');
const passport = require('passport');
const SECRET_KEY = process.env.API_SECTET_KEY;
const CryptoJS = require('crypto-js');
const { saveAuditLog } = require('./firebasedb-util');

const userAuthMiddleware = (req, res, next) => {
  passport.authenticate('jwt', {
    session: false
  }, (err, user) => {
    if (user && (user.type === 'User' || user.type === 'Admin')) {
      prepareAuditInfo(req, user);
      const status = checkOldAndNewToken(req, res, user);
      if (status) {
        req.loginId = user.loginId;
        if (req.body) {
          req.body.updatedBy = user.apiUserInfo,
            req.body.updateByType = user.type
        }
        next();
      } else {
        responsehanlder.hasError401(res, 'Your seesion has expired, Authentication failed...');
      }
    } else {
      responsehanlder.hasError401(res, 'Your seesion has expired, Authentication failed...');
    }
  })(req, res, next)

}

const kitchenAuthMiddleware = (req, res, next) => {
  passport.authenticate('jwt', {
    session: false
  }, (err, user) => {
    if (user && (user.type === 'Kitchen' || user.type === 'Admin')) {
      prepareAuditInfo(req, user);
      const status = checkOldAndNewToken(req, res, user);
      if (status) {
        if (req.body) {
          req.body.updatedBy = user.apiUserInfo,
            req.body.updateByType = user.type
        }
        next();
      } else {
        responsehanlder.hasError401(res, 'Your seesion has expired, Authentication failed...');
      }
    } else {
      responsehanlder.hasError401(res, 'Your seesion has expired, Authentication failed...');
    }
  })(req, res, next)
}

const adminAuthMiddleware = (req, res, next) => {
  passport.authenticate('jwt', {
    session: false
  }, (err, user) => {
    if (user && user.type === 'Admin') {
      prepareAuditInfo(req, user);
      const status = checkOldAndNewToken(req, res, user);
      if (status) {
        if (req.body) {
          req.body.updatedBy = user.apiUserInfo,
            req.body.updateByType = user.type
        }
        next();
      } else {
        responsehanlder.hasError401(res, 'Your seesion has expired, Authentication failed...');
      }
    } else {
      responsehanlder.hasError401(res, 'Your seesion has expired, Authentication failed...');
    }
  })(req, res, next)
}

const allAuthMiddleware = (req, res, next) => {
  passport.authenticate('jwt', {
    session: false
  }, (err, user) => {
    if (user && (user.type === 'Admin' || user.type === 'DDAdmin' || user.type === 'User' || user.type === 'Kitchen')) {
      prepareAuditInfo(req, user);
      const status = checkOldAndNewToken(req, res, user);
      if (status) {
        if (req.body) {
          req.body.updatedBy = user.apiUserInfo,
            req.body.updateByType = user.type
        }
        next();
      } else {
        responsehanlder.hasError401(res, 'Your seesion has expired, Authentication failed...');
      }
    } else {
      responsehanlder.hasError401(res, 'Your seesion has expired, Authentication failed...');
    }
  })(req, res, next)
}

const logoutMiddleware = (req, res, next) => {
  passport.authenticate('jwt', {
    session: false
  }, (err, user) => {
    if (user) {
      req.id = user.id;
      next();
    } else {
      responsehanlder.hasError401(res, 'Your seesion has expired, Authentication failed...');
    }
  })(req, res, next)

}

const commonAuthMiddleware = (req, res, next) => {
  if (req.headers['x-api-key'] === process.env.THINKOWL_CALLBACK_TOKEN) {
    // If x-api-key matches, skip JWT authentication
    return next();
  }
  passport.authenticate('jwt', {
    session: false
  }, (err, user) => {
    if (user && (user.type === 'Admin' || user.type === 'User' || user.type === 'Kitchen')) {
      prepareAuditInfo(req, user);
      const status = checkOldAndNewToken(req, res, user);
      if (status) {
        if (req.body) {
          req.body.updatedBy = user.apiUserInfo,
          req.body.updateByType = user.type
          
        }else{
        console.log('no body')
        }

        next();
      } else {
        responsehanlder.hasError401(res, 'Your seesion has expired, Authentication failed...');
      }
    } else {
      responsehanlder.hasError401(res, 'Your seesion has expired, Authentication failed...');
    }
  })(req, res, next)
}

const checkOldAndNewToken = (req, res, user) => {
  const status = true;
  if (user.type === 'Admin' || user.type === 'User') {
    const token = req.headers['authorization'];
    if (token !== `Bearer ${user.oldToken}`) {
      status = false
    }
  }
  return status;
}

const decryptMiddleware = (req, res, next) => {
  if (req.headers['session-token']) {
    if (req.body && req.body.data_key) {
      const token = req.headers['authorization'];
      const key = token ? token + token : SECRET_KEY;
      const session_x = req.headers['session_x'];
      const finalKey = session_x ? key + session_x : SECRET_KEY;
      const encryptedResponse = CryptoJS.AES.decrypt(req.body.data_key, finalKey).toString(CryptoJS.enc.Utf8);
      req.body = JSON.parse(encryptedResponse);
      next();
    } else {
      next();
    }
  } else {
    next();
  }

}

const encryptMiddleware = (req, data) => {
  if (req.headers['session-token']) {
    const token = req.headers['authorization'];
    const key = token ? token + token : SECRET_KEY;
    const session_x = req.headers['session_x'];
    const finalKey = session_x ? key + session_x : SECRET_KEY;
    const dataStrigyfy = JSON.stringify(data)
    return { data_key: CryptoJS.AES.encrypt(dataStrigyfy, finalKey).toString() };
  } else {
    return data;
  }
}

const prepareAuditInfo = (req, user) => {
  const urlInfo = req.headers.host + req.originalUrl;
  const urlMethod = req.method;
  const payload = req.body;
  const ipInfo = req.ip;
  const userInfo = { type: user.type, loginId: user.apiUserInfo };
  saveAuditLog(urlInfo, urlMethod, payload, ipInfo, userInfo);
}

const openAuthMiddleware = (req, res, next) => {
  // console.log('openAuthMiddleware req',req);
  prepareAuditInfo(req, { type: 'NA', apiUserInfo: 'NA' });
  next();
}

module.exports = {
  userAuthMiddleware,
  kitchenAuthMiddleware,
  adminAuthMiddleware,
  allAuthMiddleware,
  logoutMiddleware,
  commonAuthMiddleware,
  decryptMiddleware,
  encryptMiddleware,
  openAuthMiddleware
}