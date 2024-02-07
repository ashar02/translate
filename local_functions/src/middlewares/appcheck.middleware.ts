import {RequestHandler} from 'express';
import * as httpErrors from 'http-errors';

const verifyAppCheckToken = async (appCheckToken: string) => {
  try {
    if (appCheckToken && appCheckToken.trim() !== '') {
      return;
    } else {
      throw new Error('Invalid App Check token');
    }
  } catch (error) {
    throw new Error('Error verifying App Check token');
  }
};

export const appCheckVerification: RequestHandler = async (req, res, next) => {
  const appCheckToken = req.header('X-Appcheck-Token');

  if (!appCheckToken) {
    throw new httpErrors.Unauthorized('Missing App Check token');
  }

  try {
    await verifyAppCheckToken(appCheckToken);
    return next();
  } catch (err) {
    throw new httpErrors.Unauthorized('Invalid App Check token');
  }
};
