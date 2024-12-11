import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, confirmPassword, name } = req.body

        if (password !== confirmPassword) {
            res.status(400).json({ error: 'Passwords do not match' })
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name
            }
        })

        res.status(201).json({ message: 'User created successfully' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error creating user' })
    }
}

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body

        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' })
            return;
        }

        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword) {
            res.status(401).json({ error: 'Invalid credentials' })
            return;
        }

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        )

        res.status(200).json({ token })

    } catch (error) {
        res.status(500).json({ error: 'Error logging in' })
    }
}

export const user = async (req: Request & { userId?: string }, res: Response): Promise<any> => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(req.userId!) },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                updatedAt: true
            }
        })

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        res.status(200).json(user)
    } catch (error) {
        res.status(500).json({ error: 'Error fetching user data' })
    }
}
