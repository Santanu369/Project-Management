import { Router } from "express";
import {register, login, logout, getCurrentUser, verifyEmail, resend_email_verification} from "../controllers/auth-controller.js"
import {registrationValidationArr, loginValidationArr, validationMiddleware} from "../utils/validator.js"
import {verifyJWT} from "../middlewares/auth-middleware.js"

const authRouter = Router()

authRouter.route("/register").post(registrationValidationArr(), validationMiddleware, register)
authRouter.route("/login").post(loginValidationArr(), validationMiddleware, login)
authRouter.route("/logout").post(verifyJWT, logout)
authRouter.route("/current_user").get(verifyJWT, getCurrentUser)
authRouter.route("/verify-email/:verificationToken").get(verifyEmail)
authRouter.route("/resend-verification-email").get(verifyJWT, resend_email_verification)

export {authRouter};