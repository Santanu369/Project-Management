import {body, validationResult} from 'express-validator'
import { ApiError } from './api-error.js'
import { ApiResponse } from './api-response.js'

const registrationValidationArr = () => {
    return [
        body('email')
            .trim()
            .isEmail()
            .withMessage("Enter a valid Email"),
        body("username")
            .trim()
            .isLowercase()
            .withMessage("Username should be lowercase")
            .isLength({min: 3})
            .withMessage("Username shoulb be atleast 3 charecters long"),
        body("password")
            .trim()
            .isLength({min: 5})
            .withMessage("Username shoulb be atleast 5 charecters long")
    ]
}

const loginValidationArr = () => {
    return [
        body('email')
            .trim()
            .isEmail()
            .withMessage("Enter a valid Email"),
        body("password")
            .trim()
            .isLength({min: 5})
            .withMessage("Username shoulb be atleast 5 charecters long")
    ]
}

const validationMiddleware = (req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        const extractedErrors = [];
        result.array().map((err) => {
            extractedErrors.push({
                [err.path]: err.msg
            })
        })
        throw new ApiError(400, "Invalid input", extractedErrors)
    }
    return next();
}

export {registrationValidationArr, loginValidationArr, validationMiddleware}