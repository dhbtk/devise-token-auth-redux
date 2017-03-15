import {tokenRefreshSuccess, tokenDeleteSuccess, resetUser} from './actions';
import 'whatwg-fetch'

export const authSettings: any = { settings: {
    apiUrl: '',
    loginRoute: '/login',
    signInPath: '/auth/sign_in',
    validateTokenPath: '/auth/validate_token',
    signOutPath: '/auth/sign_out',
    pushNotice(notice) {},
    pushError(error) {},
    store: {}
} };

export function configureAuthentication(settings: any): any {
    authSettings.settings = Object.assign(authSettings.settings, settings);
}

export function requireAuth(nextState: any, replace: any): any {
    const { token } = authSettings.settings.store.getState();
    if (!token.validated) {
        replace({
            pathname: authSettings.settings.loginRoute,
            state: { nextPathname: nextState.location.pathname }
        });
    }
}

export function addAuthorizationHeader(headers: any = {}, token: any): any {
    return Object.assign(headers, { 'access-token': token.token, uid: token.uid, client: token.client });
}

export function updateTokenFromHeaders(headers: any): any {
    const [uid, token, client] = [headers.get('uid'), headers.get('access-token'), headers.get('client')];
    const tokenData = { uid, token, client, validated: true };
    if (tokenData.token === null) {
        console.log('Mesmo token');
    } else {
        localStorage.setItem("uid", uid);
        localStorage.setItem("token", token);
        localStorage.setItem("client", client);
        authSettings.settings.store.dispatch(tokenRefreshSuccess(tokenData));
    }
}

export function authFetch(url: any, origOpts: any = {}): any {
    return new Promise((resolve, reject) => {
        const { token } = authSettings.settings.store.getState();
        if (token.validated) {
            const opts = Object.assign(origOpts, { headers: addAuthorizationHeader(origOpts.headers, token) });
            window.fetch(url, opts).then(result => {
                if (result.ok) {
                    updateTokenFromHeaders(result.headers);
                    resolve(result);
                } else if (result.status == 500) {
                    reject(result);
                    authSettings.settings.store.dispatch(authSettings.settings.pushError("Ocorreu um erro interno no servidor. Por favor, entre em contato."));
                    result.json().then(json => console.error("HTTP 500: ", json));
                } else if(result.status == 401) {
                    reject(result);
                    authSettings.settings.store.dispatch(tokenDeleteSuccess());
                    authSettings.settings.store.dispatch(resetUser());
                    authSettings.settings.store.dispatch(authSettings.settings.pushError("Por favor, faça login novamente."));
                }
            }).catch(error => {
                console.error(error);
                reject(error);
            });
        } else {
            reject("not logged in");
        }
    });
}
