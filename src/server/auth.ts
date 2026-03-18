import { Response } from 'express';

export const SESSION_COOKIE_NAME = 'session_id';

export const setSafeCookie = (res: Response, userId: string) => {
    res.cookie(SESSION_COOKIE_NAME, userId, {
        httpOnly: true,     
        secure: false,     
        maxAge: 10 * 60 * 1000,
        sameSite: 'lax'
    });
};

export const clearSafeCookie = (res: Response) => {
    res.clearCookie(SESSION_COOKIE_NAME);
};