const LoginCredentialUser = require('../model/loginCredentialUser.model');
const LoginCredentialKitchen = require('../model/loginCredentialKitchen.model');
const LoginCredentialAdmin = require('../model/loginCredentialAdmin.model');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const bcrypt = require('bcryptjs');

initialize = () => {
    console.log('initialize pasport config');
    passport.use('jwt', new JWTStrategy({
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET
    }, (jwtPayload, cb) => {
        if (jwtPayload.type === 'User') {
            LoginCredentialUser.findById(jwtPayload._id)
                .then(user => {
                    if (user.token) {
                        return cb(null, {
                            type: 'User', loginId: jwtPayload._id,
                            apiUserInfo: user.phoneNo, oldToken: user.token
                        });
                    } else {
                        return cb(null, false, { message: 'Session Logged Out' });
                    }
                })
                .catch(err => {
                    return cb(err);
                });
        } else if (jwtPayload.type === 'Kitchen') {
            LoginCredentialKitchen.findById(jwtPayload._id)
                .then(kitchen => {
                    if (kitchen.token) {
                        return cb(null, {
                            type: 'Kitchen', id: jwtPayload._id,
                            apiUserInfo: kitchen.kitchenId, oldToken: kitchen.token
                        });
                    } else {
                        return cb(null, false, { message: 'Session Logged Out' });
                    }
                })
                .catch(err => {
                    return cb(err);
                });
        } else if (jwtPayload.type === 'DDAdmin') {
            return cb(null, { type: 'DDAdmin', id: jwtPayload._id });
        } else {
            LoginCredentialAdmin.findById(jwtPayload._id)
                .then(admin => {
                    // return cb(null, {...admin, type: 'Admin'});
                    if (admin.token) {
                        return cb(null, {
                            type: 'Admin', id: jwtPayload._id,
                            apiUserInfo: admin.adminId, oldToken: admin.token
                        });
                    } else {
                        return cb(null, false, { message: 'Session Logged Out' });
                    }
                })
                .catch(err => {
                    return cb(err);
                });
        }
    }
    ));
    const verifyPassword = async (password, userpassword) => {
        return await bcrypt.compare(password, userpassword)
    }
    const userStrategy = new LocalStrategy({
        usernameField: 'phoneNo',
        passwordField: 'password',
        passReqToCallback: true
    }, (req, phoneNo, password, done) => {
        console.log('userStrategy inside')
        LoginCredentialUser.findOne({
            phoneNo: phoneNo
        }, async (err, user) => {
            if (err) return done(err);
            if (!user) return done(null, false);
            try {
                if (await verifyPassword(password, user.password)) {
                    done(null, user);
                } else {
                    return done(null, false, { message: 'Password incorrect' });
                }
            } catch (e) {
                done(e);
            }
        });
    });
    const kitchenStrategy = new LocalStrategy({
        usernameField: 'kitchenId',
        passwordField: 'password',
        passReqToCallback: true
    }, (req, kitchenId, password, done) => {
        console.log('kitchenStrategy inside')
        LoginCredentialKitchen.findOne({ kitchenId },
            async (err, kitchen) => {
                if (err) return done(err);
                if (!kitchen) return done(null, false);
                try {
                    if (await verifyPassword(password, kitchen.password)) {
                        done(null, kitchen);
                    } else {
                        return done(null, false, kitchen);
                    }
                } catch (e) {
                    done(e);
                }
            });
    });
    const adminStrategy = new LocalStrategy({
        usernameField: 'adminId',
        passwordField: 'password',
        passReqToCallback: true
    }, (req, adminId, password, done) => {
        LoginCredentialAdmin.findOne({ adminId },
            async (err, admin) => {
                if (err) return done(err);
                if (!admin) return done(null, false);
                try {
                    if (await verifyPassword(password, admin.password)) {
                        done(null, admin);
                    } else {
                        return done(null, false, admin);
                    }
                } catch (e) {
                    done(e);
                }
            });
    });

    passport.use('local.user', userStrategy);
    passport.use('local.kitchen', kitchenStrategy);
    passport.use('local.admin', adminStrategy);
};

module.exports = {
    initialize
};
