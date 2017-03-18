"use strict";

var types = require("./actionTypes");
var index_1 = require("./index");
require("whatwg-fetch");
function login(email, password) {
    return function (dispatch) {
        dispatch(resetUser());
        window.fetch(index_1.authSettings.settings.apiUrl + index_1.authSettings.settings.signInPath, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email, password: password })
        }).then(function (result) {
            if (result.ok) {
                var _ref = [result.headers.get('uid'), result.headers.get('access-token'), result.headers.get('client')],
                    uid = _ref[0],
                    token = _ref[1],
                    client = _ref[2];

                localStorage.setItem("uid", uid);
                localStorage.setItem("token", token);
                localStorage.setItem("client", client);
                var tokenData = { uid: uid, token: token, client: client, validated: true };
                dispatch(tokenRefreshSuccess(tokenData));
                result.json().then(function (response) {
                    dispatch(loadUserSuccess(response.data));
                    dispatch(index_1.authSettings.settings.pushNotice("Login efetuado com sucesso."));
                }).catch(function (error) {
                    return dispatch(loadUserFailed());
                });
            } else {
                dispatch(tokenDeleteSuccess());
                dispatch(loadUserFailed());
                dispatch(index_1.authSettings.settings.pushError("Email ou senha incorretos. Por favor, corrija e tente novamente."));
            }
        }).catch(function (error) {
            dispatch(tokenDeleteSuccess());
            dispatch(loadUserFailed());
        });
    };
}
exports.login = login;
function validateToken(token) {
    return function (dispatch) {
        window.fetch(index_1.authSettings.settings.apiUrl + index_1.authSettings.settings.validateTokenPath, { headers: index_1.addAuthorizationHeader({}, token) }).then(function (result) {
            index_1.updateTokenFromHeaders(result.headers);
            if (result.ok) {
                result.json().then(function (result) {
                    return dispatch(loadUserSuccess(result.data));
                });
            } else {
                console.log(result);
                dispatch(tokenDeleteSuccess());
                dispatch(loadUserFailed());
                dispatch(index_1.authSettings.settings.pushError("Por favor, faça login novamente."));
            }
        }).catch(function (error) {
            console.log(error);
            dispatch(tokenDeleteSuccess());
            dispatch(loadUserFailed());
            dispatch(index_1.authSettings.settings.pushError("Por favor, faça login novamente."));
        });
    };
}
exports.validateToken = validateToken;
function logout() {
    return function (dispatch) {
        var after = function after() {
            localStorage.removeItem("uid");
            localStorage.removeItem("token");
            localStorage.removeItem("client");
            dispatch(tokenDeleteSuccess());
            dispatch(resetUser());
            dispatch(index_1.authSettings.settings.pushNotice("Logout efetuado com sucesso."));
        };
        index_1.authFetch(index_1.authSettings.settings.apiUrl + index_1.authSettings.settings.signOutPath, { method: 'DELETE' }).then(after).catch(after);
    };
}
exports.logout = logout;
function tokenDeleteSuccess() {
    return { type: types.TOKEN_DELETE_SUCCESS };
}
exports.tokenDeleteSuccess = tokenDeleteSuccess;
function tokenRefreshSuccess(token) {
    return { type: types.TOKEN_REFRESH_SUCCESS, token: token };
}
exports.tokenRefreshSuccess = tokenRefreshSuccess;
function resetUser() {
    return { type: types.RESET_USER };
}
exports.resetUser = resetUser;
function loadUserSuccess(user) {
    return { type: types.LOAD_USER_SUCCESS, user: user };
}
exports.loadUserSuccess = loadUserSuccess;
function loadUserFailed() {
    return { type: types.LOAD_USER_FAILED };
}
exports.loadUserFailed = loadUserFailed;