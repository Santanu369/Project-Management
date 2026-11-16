import { Router } from "express";
import { healthCheckFunction } from "../controllers/healthCheck.js";

const router = Router()

router.get('/', healthCheckFunction)

export {router};