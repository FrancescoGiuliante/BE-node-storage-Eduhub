import express from 'express'
import dotenv from 'dotenv'
import authRoutes from './routes/authRoutes'
import fileRoutes from './routes/fileRoutes'
import cors from 'cors';

dotenv.config()

const app = express()

app.use(cors({
    origin: "*"
}))

app.use(express.json())
app.use('/auth', authRoutes)
app.use('/api', fileRoutes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
