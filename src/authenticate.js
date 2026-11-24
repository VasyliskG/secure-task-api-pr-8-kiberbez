import jwt from 'jsonwebtoken';
 
export function authenticate(req, res, next) {
  const header = req.get('authorization') ?? '';
  const match = header.match(/^Bearer\s+(\S+)$/i);
 
  if (!match) {
    return res.status(401).json({
      error: { code: 'AUTH_REQUIRED', message: 'Потрібен Bearer-токен' }
    });
  }
 
  try {
    const payload = jwt.verify(match[1], process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'secure-task-api',
      audience: 'secure-task-api-client'
    });
 
    if (typeof payload !== 'object' || typeof payload.sub !== 'string') {
      throw new Error('Invalid token subject');
    }
 
    req.auth = { userId: payload.sub };
    return next();
  } catch {
    return res.status(401).json({
      error: { code: 'INVALID_TOKEN', message: 'Токен недійсний або строк його дії минув' }
    });
  }
}
