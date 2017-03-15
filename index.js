"use strict";
exports.__esModule = true;
var actions_1 = require("./actions");
require("whatwg-fetch");
if (typeof Object.assign != 'function') {
    (function () {
        Object.assign = function (target) {
            'use strict';
            if (target === undefined || target === null) {
                throw new TypeError('Cannot convert undefined or null to object');
            }
            var output = Object(target);
            for (var index = 1; index < arguments.length; index++) {
                var source = arguments[index];
                if (source !== undefined && source !== null) {
                    for (var nextKey in source) {
                        if (source.hasOwnProperty(nextKey)) {
                            output[nextKey] = source[nextKey];
                        }
                    }
                }
            }
            return output;
        };
    })();
}
exports.authSettings = { settings: {
        apiUrl: '',
        loginRoute: '/login',
        signInPath: '/auth/sign_in',
        validateTokenPath: '/auth/validate_token',
        signOutPath: '/auth/sign_out',
        pushNotice: function (notice) { },
        pushError: function (error) { },
        store: {}
    } };
function configureAuthentication(settings) {
    exports.authSettings.settings = Object.assign(exports.authSettings.settings, settings);
}
exports.configureAuthentication = configureAuthentication;
function requireAuth(nextState, replace) {
    var token = exports.authSettings.settings.store.getState().token;
    if (!token.validated) {
        replace({
            pathname: exports.authSettings.settings.loginRoute,
            state: { nextPathname: nextState.location.pathname }
        });
    }
}
exports.requireAuth = requireAuth;
function addAuthorizationHeader(headers, token) {
    if (headers === void 0) { headers = {}; }
    return Object.assign(headers, { 'access-token': token.token, uid: token.uid, client: token.client });
}
exports.addAuthorizationHeader = addAuthorizationHeader;
function updateTokenFromHeaders(headers) {
    var _a = [headers.get('uid'), headers.get('access-token'), headers.get('client')], uid = _a[0], token = _a[1], client = _a[2];
    var tokenData = { uid: uid, token: token, client: client, validated: true };
    if (tokenData.token === null) {
        console.log('Mesmo token');
    }
    else {
        localStorage.setItem("uid", uid);
        localStorage.setItem("token", token);
        localStorage.setItem("client", client);
        exports.authSettings.settings.store.dispatch(actions_1.tokenRefreshSuccess(tokenData));
    }
}
exports.updateTokenFromHeaders = updateTokenFromHeaders;
function authFetch(url, origOpts) {
    if (origOpts === void 0) { origOpts = {}; }
    return new Promise(function (resolve, reject) {
        var token = exports.authSettings.settings.store.getState().token;
        if (token.validated) {
            var opts = Object.assign(origOpts, { headers: addAuthorizationHeader(origOpts.headers, token) });
            window.fetch(url, opts).then(function (result) {
                if (result.ok) {
                    updateTokenFromHeaders(result.headers);
                    resolve(result);
                }
                else if (result.status == 500) {
                    reject(result);
                    exports.authSettings.settings.store.dispatch(exports.authSettings.settings.pushError("Ocorreu um erro interno no servidor. Por favor, entre em contato."));
                    result.json().then(function (json) { return console.error("HTTP 500: ", json); });
                }
                else if (result.status == 401) {
                    reject(result);
                    exports.authSettings.settings.store.dispatch(actions_1.tokenDeleteSuccess());
                    exports.authSettings.settings.store.dispatch(actions_1.resetUser());
                    exports.authSettings.settings.store.dispatch(exports.authSettings.settings.pushError("Por favor, faça login novamente."));
                }
            })["catch"](function (error) {
                console.error(error);
                reject(error);
            });
        }
        else {
            reject("not logged in");
        }
    });
}
exports.authFetch = authFetch;
