import { Router } from "express";
import {register, login, logout, getCurrentUser, verifyEmail, resend_email_verification, forgot_password, reset_password, changePassword} from "../controllers/auth-controller.js"
import {registrationValidationArr, loginValidationArr, validationMiddleware} from "../utils/validator.js"
import {verifyJWT} from "../middlewares/auth-middleware.js"

const authRouter = Router()

authRouter.route("/register").post(registrationValidationArr(), validationMiddleware, register)
authRouter.route("/login").post(loginValidationArr(), validationMiddleware, login)
authRouter.route("/logout").post(verifyJWT, logout)
authRouter.route("/current-user").get(verifyJWT, getCurrentUser)
authRouter.route("/verify-email/:verificationToken").get(verifyEmail)
authRouter.route("/resend-verification-email").get(verifyJWT, resend_email_verification)
authRouter.route("/forgot-password").post(validationMiddleware, forgot_password)
authRouter.route("/reset-password/:token").post(reset_password)
authRouter.route("/change-password").post(verifyJWT, changePassword);

export {authRouter};