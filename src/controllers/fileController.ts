import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import path from 'path';

export const uploadFile = async (req: Request & { userId?: number, file?: Express.Multer.File }, res: Response, next: NextFunction): Promise<void> => {
    try {

        if (!req.file || !req.body.userId || !req.body.classId) {
            res.status(400).json({ error: 'No file uploaded, user not authenticated, or classId not provided' });
            return; 
        }

        const file = await prisma.file.create({
            data: {
                filename: req.file.originalname,
                path: req.file.path,
                mimetype: req.file.mimetype,
                size: req.file.size,
                userId: parseInt(req.body.userId),
                courseClassID: parseInt(req.body.classId),
            }
        });

        res.status(201).json(file);
    } catch (error) {
        console.error('Error uploading file:', error);
        next(error);
    }
};

export const listFiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const files = await prisma.file.findMany({
            include: {
                user: true
            }
        });

        if (!files || files.length === 0) {
            res.status(404).json({ error: 'No files found' });
            return;
        }

        res.status(200).json(files);
    } catch (error) {
        console.error('Error fetching files:', error);
        next(error);
    }
};

export const deleteFile = async (req: Request & { userId?: number }, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { filename } = req.params;
        const userId = req.userId;

        const file = await prisma.file.findFirst({
            where: {
                filename: filename,
                userId: userId
            }
        });

        if (!file) {
            res.status(404).json({ error: 'File not found' });
            return;
        }

        await prisma.file.delete({
            where: {
                id: file.id
            }
        });

        res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error);
        next(error);
    }
};

export const getFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

        res.sendFile(path.resolve(file.path));
    } catch (error) {
        console.error('Error retrieving file:', error);
        next(error);
    }
};

export const listFilesByClass = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { classId } = req.params;

        const files = await prisma.file.findMany({
            where: {
                courseClassID: parseInt(classId)
            },
            include: {
                user: true
            }
        });

        if (!files || files.length === 0) {
            res.status(404).json({ error: 'No files found' });
            return;
        }

        res.status(200).json(files);
    } catch (error) {
        console.error('Error fetching files:', error);
        next(error);
    }
};
