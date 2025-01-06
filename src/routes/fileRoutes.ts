import { Router } from 'express';
import { uploadFile, listFiles, deleteFile, getFile, listFilesByClass } from '../controllers/fileController';
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

router.post('/upload', authenticateToken, upload.single('file'), (req, res, next) => uploadFile(req, res, next));
router.get('/', authenticateToken, listFiles);
router.get('/class/:classId', authenticateToken, listFilesByClass);
router.get('/:userId/:filename', authenticateToken, getFile);
router.delete('/:filename', authenticateToken, (req, res, next) => deleteFile(req, res, next));

export default router;