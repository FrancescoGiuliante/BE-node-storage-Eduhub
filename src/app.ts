import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import fileRoutes from './routes/fileRoutes';
import cors from 'cors';
import { authenticateToken } from './middleware/auth';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { User } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';

dotenv.config();

const BACKEND_SERVICE_URL = process.env.BACKEND_SERVICE_URL || 'http://localhost:8080';

const app = express();

app.use(cors({
    origin: "*"
}));

app.use(
    '/api',
    authenticateToken,
    createProxyMiddleware<Request, Response>({
        target: BACKEND_SERVICE_URL,
        changeOrigin: true,
        logger: console,
        pathRewrite: {
            '^/api': '',
        },
        on: {
            proxyReq: (proxyReq, req: Request & { user?: Partial<User> }) => {
                if (req.user) {
                    proxyReq.setHeader('X-User', JSON.stringify(req.user));
                }
            },
        }
    }),
);

app.use(express.json());
app.use('/auth', authRoutes);
app.use('/files', fileRoutes);

app.use((req: Request, response: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()}: ${req.method} ${req.url}`);
    next();
});

app.use((req, res, next) => {
    const error = new CustomError('Resource not found.', 404);
    next(error);
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);

    if (err instanceof CustomError) {
        res.status(err.statusCode).send({ error: err.message });
    } else {
        res.status(500).send({ error: err.message });
    }
});

export class CustomError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.name = 'CustomError';
        this.statusCode = statusCode;
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
