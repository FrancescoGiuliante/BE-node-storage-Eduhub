import express from 'express'
import dotenv from 'dotenv'
import authRoutes from './routes/authRoutes'
import fileRoutes from './routes/fileRoutes'
import cors from 'cors';
import { authenticateToken } from './middleware/auth';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { User } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';

dotenv.config()

const BACKEND_SERVICE_URL = process.env.BACKEND_SERVICE_URL || 'http://localhost:8080';

const app = express()

app.use(cors({
    origin: "*"
}))

// Configuro il proxy per inoltrare le richieste al servizio backend principale
app.use(
    '/api',
    authenticateToken,
    createProxyMiddleware<Request, Response>({
        target: BACKEND_SERVICE_URL,
        changeOrigin: true,
        logger: console,
        pathRewrite: {
            '^/api': '', // Rimuovo "/api" dalla richiesta inoltrata
        },
        on: {
            proxyReq: (proxyReq, req: Request & { user?: Partial<User> }) => {
                // Posso includere eventuali dati aggiuntivi nella richiesta al backend finale
                console.log(req.user)
                if (req.user) {
                    proxyReq.setHeader('X-User', JSON.stringify(req.user))
                }
            },
        }
    }),
)

app.use(express.json())
app.use('/auth', authRoutes)
app.use('/files', fileRoutes)

// middleware di logging
app.use((req: Request, response: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()}: ${req.method} ${req.url}`)
    next() // chiamo la next function per passare al prossimo middleware della chain
})

// Middleware per risorsa non trovata
app.use((req, res, next) => {
    const error = new CustomError('Resource not found.', 404)
    next(error)
})

// Middleware per la gestione degli errori
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack)

    if (err instanceof CustomError) {
        res.status(err.statusCode).send({ error: err.message })
    } else {
        res.status(500).send({ error: err.message })
    }
})

// Classe di errore personalizzata
export class CustomError extends Error {
    statusCode: number

    constructor(message: string, statusCode: number = 500) {
        super(message)
        this.name = 'CustomError'
        this.statusCode = statusCode
    }
}

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
