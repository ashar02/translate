import {RequestHandler} from 'express';
import * as httpErrors from 'http-errors';
import * as dotenv from 'dotenv';

dotenv.config();
const allowedDomainsString = process.env.ALLOWED_DOMAINS || 'https://localhost:3001';
const allowedDomains = allowedDomainsString.split(',');

const verifyAppCheckToken = async (appCheckToken: string, appCheckOrigin: string) => {
  try {
    if (!appCheckToken || appCheckToken.trim() === '') {
      throw new Error('Invalid App Check token');
    }
    if (!appCheckOrigin || !allowedDomains.includes(appCheckOrigin)) {
      throw new Error('Invalid App Check origin');
    }
  } catch (error) {
    throw new Error('Error verifying App Check token or origin');
  }
};

export const appCheckVerification: RequestHandler = async (req, res, next) => {
  const appCheckToken = req.header('X-Appcheck-Token');
  const appCheckOrigin = req.header('Origin');

  if (!appCheckToken || !appCheckOrigin) {
    throw new httpErrors.Unauthorized('Missing App Check token or origin');
  }

  try {
    await verifyAppCheckToken(appCheckToken, appCheckOrigin);
    return next();
  } catch (err) {
    throw new httpErrors.Unauthorized('Invalid App Check token or origin');
  }
};
