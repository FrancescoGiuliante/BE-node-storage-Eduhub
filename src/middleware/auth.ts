import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface JwtPayload {
    userId: string
}

export const authenticateToken = (req: Request & { userId?: string }, res: Response, next: NextFunction): any => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        return res.status(401).json({ error: 'Access token required' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
        req.userId = decoded.userId
        next()
    } catch (error) {
        return res.status(403).json({ error: 'Invalid token' })
    }
}
