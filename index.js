"use strict";

var actions_1 = require("./actions");
require("whatwg-fetch");
var objectAssign = require("object-assign");
exports.authSettings = {
    settings: {
        apiUrl: '',
        loginRoute: '/login',
        signInPath: '/auth/sign_in',
        validateTokenPath: '/auth/validate_token',
        signOutPath: '/auth/sign_out',
        pushNotice: function pushNotice(notice) {},
        pushError: function pushError(error) {},

        store: {}
    }
};
function configureAuthentication(settings) {
    exports.authSettings.settings = objectAssign(exports.authSettings.settings, settings);
}
exports.configureAuthentication = configureAuthentication;
function requireAuth(nextState, replace) {
    var _exports$authSettings = exports.authSettings.settings.store.getState(),
        token = _exports$authSettings.token;

    if (!token.validated) {
        replace({
            pathname: exports.authSettings.settings.loginRoute,
            state: { nextPathname: nextState.location.pathname }
        });
    }
}
exports.requireAuth = requireAuth;
function addAuthorizationHeader() {
    var headers = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var token = arguments[1];

    return objectAssign(headers, { 'access-token': token.token, uid: token.uid, client: token.client });
}
exports.addAuthorizationHeader = addAuthorizationHeader;
function updateTokenFromHeaders(headers) {
    var _ref = [headers.get('uid'), headers.get('access-token'), headers.get('client')],
        uid = _ref[0],
        token = _ref[1],
        client = _ref[2];

    var tokenData = { uid: uid, token: token, client: client, validated: true };
    if (tokenData.token === null) {
        console.log('Mesmo token');
    } else {
        localStorage.setItem("uid", uid);
        localStorage.setItem("token", token);
        localStorage.setItem("client", client);
        exports.authSettings.settings.store.dispatch(actions_1.tokenRefreshSuccess(tokenData));
    }
}
exports.updateTokenFromHeaders = updateTokenFromHeaders;
function authFetch(url) {
    var origOpts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    return new Promise(function (resolve, reject) {
        var _exports$authSettings2 = exports.authSettings.settings.store.getState(),
            token = _exports$authSettings2.token;

        if (token.validated) {
            var opts = objectAssign(origOpts, { headers: addAuthorizationHeader(origOpts.headers, token) });
            fetch(url, opts).then(function (result) {
                if (result.ok) {
                    updateTokenFromHeaders(result.headers);
                    resolve(result);
                } else if (result.status == 500) {
                    reject(result);
                    exports.authSettings.settings.store.dispatch(exports.authSettings.settings.pushError("Ocorreu um erro interno no servidor. Por favor, entre em contato."));
                    result.json().then(function (json) {
                        return console.error("HTTP 500: ", json);
                    });
                } else if (result.status == 401) {
                    reject(result);
                    exports.authSettings.settings.store.dispatch(actions_1.tokenDeleteSuccess());
                    exports.authSettings.settings.store.dispatch(actions_1.resetUser());
                    exports.authSettings.settings.store.dispatch(exports.authSettings.settings.pushError("Por favor, faça login novamente."));
                }
            }).catch(function (error) {
                console.error(error);
                reject(error);
            });
        } else {
            reject("not logged in");
        }
    });
}
exports.authFetch = authFetch;