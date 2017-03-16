"use strict";
const actions_1 = require("./actions");
require("whatwg-fetch");
const objectAssign = require("object-assign");
exports.authSettings = {
    settings: {
        apiUrl: '',
        loginRoute: '/login',
        signInPath: '/auth/sign_in',
        validateTokenPath: '/auth/validate_token',
        signOutPath: '/auth/sign_out',
        pushNotice(notice) {
        },
        pushError(error) {
        },
        store: {}
    }
};
function configureAuthentication(settings) {
    exports.authSettings.settings = objectAssign(exports.authSettings.settings, settings);
}
exports.configureAuthentication = configureAuthentication;
function requireAuth(nextState, replace) {
    const { token } = exports.authSettings.settings.store.getState();
    if (!token.validated) {
        replace({
            pathname: exports.authSettings.settings.loginRoute,
            state: { nextPathname: nextState.location.pathname }
        });
    }
}
exports.requireAuth = requireAuth;
function addAuthorizationHeader(headers = {}, token) {
    return objectAssign(headers, { 'access-token': token.token, uid: token.uid, client: token.client });
}
exports.addAuthorizationHeader = addAuthorizationHeader;
function updateTokenFromHeaders(headers) {
    const [uid, token, client] = [headers.get('uid'), headers.get('access-token'), headers.get('client')];
    const tokenData = { uid, token, client, validated: true };
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
function authFetch(url, origOpts = {}) {
    return new Promise((resolve, reject) => {
        const { token } = exports.authSettings.settings.store.getState();
        if (token.validated) {
            const opts = objectAssign(origOpts, { headers: addAuthorizationHeader(origOpts.headers, token) });
            fetch(url, opts).then(result => {
                if (result.ok) {
                    updateTokenFromHeaders(result.headers);
                    resolve(result);
                }
                else if (result.status == 500) {
                    reject(result);
                    exports.authSettings.settings.store.dispatch(exports.authSettings.settings.pushError("Ocorreu um erro interno no servidor. Por favor, entre em contato."));
                    result.json().then(json => console.error("HTTP 500: ", json));
                }
                else if (result.status == 401) {
                    reject(result);
                    exports.authSettings.settings.store.dispatch(actions_1.tokenDeleteSuccess());
                    exports.authSettings.settings.store.dispatch(actions_1.resetUser());
                    exports.authSettings.settings.store.dispatch(exports.authSettings.settings.pushError("Por favor, faça login novamente."));
                }
            }).catch(error => {
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
