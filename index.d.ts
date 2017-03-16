import 'whatwg-fetch';
export declare const authSettings: any;
export declare function configureAuthentication(settings: any): any;
export declare function requireAuth(nextState: any, replace: any): any;
export declare function addAuthorizationHeader(headers: any, token: any): any;
export declare function updateTokenFromHeaders(headers: any): any;
export declare function authFetch(url: any, origOpts?: any): any;
