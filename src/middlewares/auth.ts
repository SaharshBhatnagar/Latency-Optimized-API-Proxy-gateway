import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
    user?: string | object,
}

const PUBLIC_ROUTES = [
    '/api/auth/login',
    '/api/auth/register'
];

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    
    if (PUBLIC_ROUTES.some(route => req.originalUrl.startsWith(route))) {
        return next();
    }
    
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized access' });
        return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        res.status(401).json({ error: 'Unauthorized access'});
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

        req.user = decoded;
        next();
    }

    catch (err) {
        res.status(403).json({ error: 'Invalid token' });
    }

}