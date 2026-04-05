import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../public/uploads/avatars')
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        const userId = req.authenticatedUser?._id || 'unknown'
        const ext = path.extname(file.originalname).toLowerCase()
        cb(null, `${userId}_${Date.now()}${ext}`)
    },
})

const fileFilter = (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'), false)
    }
}

export const uploadAvatar = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
}).single('avatar')
