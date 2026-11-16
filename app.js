import express from 'express'
import cookieParser from 'cookie-parser'

const app = express()

import cors from 'cors'

// cors config
app.use(cors({
	origin: "*",
	credentials: true,
	methods: ['GET', 'POST', 'POST'],
	allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(cookieParser());

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({limit: "16kb"}))
app.use(express.static("public"))

// routes
import {router} from './src/routes/healthCheck-route.js';
import { authRouter } from './src/routes/auth-router.js';

app.use('/api/v1/healthcheck', router)
app.use('/api/v1/auth', authRouter)


app.get('/', (req, res) => {
  res.send('Hello World!')
})

export default app