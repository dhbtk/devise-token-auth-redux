import * as types from './actionTypes';
import {authFetch, updateTokenFromHeaders, addAuthorizationHeader, authSettings} from './index';
import 'whatwg-fetch'

export function login(email: any, password: any): any {
    return function(dispatch: any) {
        dispatch(resetUser());
        window.fetch(authSettings.settings.apiUrl + authSettings.settings.signInPath, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        }).then(result => {
            if (result.ok) {
                const [uid, token, client] = [result.headers.get('uid'), result.headers.get('access-token'), result.headers.get('client')];
                localStorage.setItem("uid", uid);
                localStorage.setItem("token", token);
                localStorage.setItem("client", client);
                const tokenData = { uid, token, client, validated: true };
                dispatch(tokenRefreshSuccess(tokenData));
                result.json().then(response => {
                    dispatch(loadUserSuccess(response.data));
                    dispatch(authSettings.settings.pushNotice("Login efetuado com sucesso."));
                }).catch(error => dispatch(loadUserFailed()));
            } else {
                dispatch(tokenDeleteSuccess());
                dispatch(loadUserFailed());
                dispatch(authSettings.settings.pushError("Email ou senha incorretos. Por favor, corrija e tente novamente."));
            }
        }).catch(error => {
            dispatch(tokenDeleteSuccess());
            dispatch(loadUserFailed());
        });
    }
}

export function validateToken(token: any): any {
    return function(dispatch: any) {
        window.fetch(authSettings.settings.apiUrl + authSettings.settings.validateTokenPath, { headers: addAuthorizationHeader({}, token) }).then(result => {
            updateTokenFromHeaders(result.headers);
            if (result.ok) {
                result.json().then(result => dispatch(loadUserSuccess(result.data)));
            } else {
                console.log(result);
                dispatch(tokenDeleteSuccess());
                dispatch(loadUserFailed());
                dispatch(authSettings.settings.pushError("Por favor, faça login novamente."));
            }
        }).catch(error => {
            console.log(error);
            dispatch(tokenDeleteSuccess());
            dispatch(loadUserFailed());
            dispatch(authSettings.settings.pushError("Por favor, faça login novamente."));
        });
    }
}

export function logout(): any {
    return function(dispatch: any) {
        const after = () => {
            localStorage.removeItem("uid");
            localStorage.removeItem("token");
            localStorage.removeItem("client");
            dispatch(tokenDeleteSuccess());
            dispatch(resetUser());
            dispatch(authSettings.settings.pushNotice("Logout efetuado com sucesso."));
        };
        authFetch(authSettings.settings.apiUrl + authSettings.settings.signOutPath, { method: 'DELETE' }).then(after).catch(after);
    }
}

export function tokenDeleteSuccess(): any {
    return { type: types.TOKEN_DELETE_SUCCESS };
}

export function tokenRefreshSuccess(token: any): any {
    return { type: types.TOKEN_REFRESH_SUCCESS, token };
}

export function resetUser(): any {
    return { type: types.RESET_USER };
}

export function loadUserSuccess(user: any): any {
    return { type: types.LOAD_USER_SUCCESS, user };
}

export function loadUserFailed(): any {
    return { type: types.LOAD_USER_FAILED };
}
