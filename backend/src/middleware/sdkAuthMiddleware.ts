import { Request, Response, NextFunction } from 'express';
import { ApiTokenModel } from '../models/ApiToken';

export interface SdkRequest extends Request {
  sdkUser?: { userId: string };
}

export async function ensureSdkAuth(req: SdkRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // Also allow query param ?token=... for ease of use in some cases, or sticking to header?
    // Header is standard.
    res.status(401).json({ success: false, message: 'Missing Authorization header' });
    return;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
     res.status(401).json({ success: false, message: 'Invalid Authorization format. Expected: Bearer <token>' });
     return;
  }
  
  const token = parts[1];
  try {
    const valid = await ApiTokenModel.validate(token);
    if (!valid) {
      res.status(401).json({ success: false, message: 'Invalid API Token' });
      return;
    }
    req.sdkUser = { userId: valid.userId };
    next();
  } catch (err) {
    console.error('SDK Auth Error', err);
    res.status(500).json({ success: false, message: 'Internal server error during auth' });
  }
}
