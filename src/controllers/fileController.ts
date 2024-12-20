import { Request, Response } from 'express'
import prisma from '../config/db'

export const uploadFile = async (req: Request & { userId?: string, file?: Express.Multer.File }, res: Response) => {
    try {
        if (!req.file || !req.userId) {
            res.status(400).json({ error: 'No file uploaded or user not authenticated' })
            return
        }

        const file = await prisma.file.create({
            data: {
                filename: req.file.originalname,
                path: req.file.path,
                mimetype: req.file.mimetype,
                size: req.file.size,
                userId: parseInt(req.userId)
            }
        })

        res.status(201).json(file)
    } catch (error) {
        res.status(500).json({ error: 'Error uploading file' })
    }
}

export const listFiles = async (req: Request & { userId?: string }, res: Response) => {
    try {
        const files = await prisma.file.findMany({
            where: {
                userId: parseInt(req.userId!)
            }
        })

        res.status(200).json(files)
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching files' })
    }
}

export const deleteFile = async (req: Request & { userId?: string }, res: Response) => {
    try {
        const file = await prisma.file.findFirst({
            where: {
                filename: req.params.filename,
                userId: parseInt(req.userId!)
            }
        })

        if (!file) {
            res.status(404).json({ error: 'File not found' })
            return
        }

        await prisma.file.delete({
            where: {
                id: file.id
            }
        })

        res.status(200).json({ message: 'File deleted successfully' })
    } catch (error) {
        res.status(500).json({ error: 'Error deleting file' })
    }
}

export const getFile = async (req: Request, res: Response) => {
    try {
        const { userId, filename } = req.params;

        const file = await prisma.file.findFirst({
            where: {
                filename: filename,
                userId: parseInt(userId)
            }
        });

        if (!file) {
            res.status(404).json({ error: 'File not found' });
            return;
        }

        res.sendFile(file.path, { root: './' });
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving file' });
    }
};
