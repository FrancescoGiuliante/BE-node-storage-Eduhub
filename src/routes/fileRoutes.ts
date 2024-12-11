import { Router } from 'express';
import { uploadFile, listFiles, deleteFile, getFile } from '../controllers/fileController';
import { authenticateToken } from '../middleware/auth';
import multer from 'multer';
import path from 'path';

const router = Router();

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post('/upload', authenticateToken, upload.single('file'), uploadFile);
router.get('/files', listFiles);
router.get('/files/:userId/:filename', getFile);
router.delete('/delete/:filename', authenticateToken, deleteFile);

export default router;