const initialState: any = {
    token: {
        uid: localStorage.getItem("uid"),
        client: localStorage.getItem("client"),
        token: localStorage.getItem("token"),
        validated: false
    },
    user: {},
};

import * as types from './actionTypes';

export function user(state: any = initialState.user, action: any): any {
    switch(action.type) {
        case types.RESET_USER:
            return {};
        case types.LOAD_USER_FAILED:
            return null;
        case types.LOAD_USER_SUCCESS:
            return action.user;
        default:
            return state;
    }
}

export function token(state: any = initialState.token, action: any): any {
    switch(action.type) {
        case types.TOKEN_REFRESH_SUCCESS:
            return action.token;
        case types.TOKEN_DELETE_SUCCESS:
            return { uid: null, token: null, client: null, validated: false };
        default:
            return state;
    }
}
