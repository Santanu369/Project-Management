import userModel from "../model/user.model.js";
import {ApiResponse} from "../utils/api-response.js"
import {ApiError} from "../utils/api-error.js"
import {asyncHandler} from "../utils/async-handler.js"
import {emailVerificationMailGenContent, forgotPasswordMailGenContent, send_mail} from "../utils/mail.js"
import jwt from 'jsonwebtoken';
import crypto from "node:crypto";
import bcrypt from 'bcrypt';


// generate access and refresh token
const generateAccessAndRrefreshToken = async (userID) => {
    try {
        const user = await userModel.findById(userID);
        const accessToken = await user.genAccessToken();
        const refreshToken = await user.genRefreshToken();
        user.refreshToken = refreshToken;

        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
        
    } catch (error) {
        // throw new ApiError(500, "Something went wrong while generating access and refresh token")
        console.log("TOKEN GENERATION ERROR:", error);
        throw error;
    }
}

// user register
const register = asyncHandler(async (req, res) => {
    const {username, password, email, role} = req.body

    const userExisted = await userModel.findOne({
        $or: [{username}, {email}]
    })

    // user exist
    if(userExisted) {
        throw new ApiError(409, "User already exists");
    }

    const user = await userModel.create({
        username,
        email,
        password,
        emailVerified: false
    })

    const {unHashedToken, hashedToken, tokenExp} = await user.genTemporaryToken()

    user.emailVerificationToken = unHashedToken 
    user.emailVerificationExp = tokenExp

    await user.save({ validateBeforeSave: false });

    console.log(`${req.protocol}://${req.get("host")}/api/v1/verify-email/${unHashedToken}`);

    await send_mail({
        email: user.email,
        subject: "Please Verify your email",
        mailGenContent: emailVerificationMailGenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/verify-email/${unHashedToken}`
        )
    })

    const createdUser = await userModel.findById(user._id).select(
        "-refreshToken -forgotPasswordToken -emailVerificationToken -emailVerificationExp -emailVerified"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user")
    }

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                {user: createdUser}
            )
        )
})

//user login
const login = asyncHandler(async (req, res) => {
    const {email, password} = req.body;

    if (!email) {
        throw new ApiError(400, "email required");
    }

    const userfound = await userModel.findOne({ email });

    if (!userfound) {
        throw new ApiError(400, "User doesn't exist");
    }

    const password_valid = await userfound.isPasswordCorrect(password);

    if (!password_valid) {
        throw new ApiError(400, "Invalid password");
    }

    const {accessToken, refreshToken} = await generateAccessAndRrefreshToken(userfound._id);

    const loggedInUser = userModel.findById(userfound._id).select(
        "-refreshToken -forgotPasswordToken -emailVerificationToken -emailVerificationExp -emailVerified"
    );

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200,
                {
                    user: "loggedIn user",
                    accessToken,
                    refreshToken
                },
                "User loggedIn successfully"
            )
        );


})

const logout = asyncHandler(async (req, res) => {

    await userModel.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: ""
            }
        },
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    console.log("--req.user-- = ", req?.user)
    return res.status(200)
        .json(
            new ApiResponse(200, 
                req.user,
                "User fetched successfully"
            )
        )
})

const verifyEmail = asyncHandler(async (req, res) => {
    const {verificationToken} = req.params;

    if (!verificationToken) {
        throw new ApiError(400, "Email verification token missing");
    }

    const user = await userModel.findOne({
        emailVerificationToken: verificationToken,
        emailVerificationExp: {$gt: Date.now()}

    });

    if(!user) {
        throw new ApiError(400, "Token is expired");
    }

    user.emailVerificationToken = undefined;
    user.emailVerificationExp = undefined;

    user.emailVerified = true;

    await user.save({validateBeforeSave: false});

    return res.status(200)
        .json(new ApiResponse(200, {emailVerified: true}, "Email verified"))

})

const resend_email_verification = asyncHandler(async (req, res) => {

    const user = req.user;

    const {unHashedToken, hashedToken, tokenExp} = await user.genTemporaryToken();

    user.emailVerificationToken = unHashedToken;
    user.emailVerificationExp = tokenExp;

    await user.save({validateBeforeSave: false});

    console.log(`${req.protocol}://${req.get("host")}/api/v1/verify-email/${unHashedToken}`);

    await send_mail({
        email: user.email,
        subject: "Please Verify your email",
        mailGenContent: emailVerificationMailGenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/verify-email/${unHashedToken}`
        )
    });

    return res.status(200)
        .json(new ApiResponse(200, {}, "Email sent"))


})

const forgot_password = asyncHandler(async (req, res) => {
    const {email} = req.body;

    const user = await userModel.findOne({email})

    if (!user) {
        throw new ApiError(400, {}, "Invalid Password");
    }

    const {unHashedToken, hashedToken, tokenExp} = await user.genTemporaryToken();

    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExp = tokenExp;

    await user.save({validateBeforeSave: false});

    await send_mail({
        email: user.email,
        subject: "Reset your password",
        mailGenContent: forgotPasswordMailGenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/reset-password/${unHashedToken}`
        )
    })

    console.log(`${req.protocol}://${req.get("host")}/api/v1/reset-password/${unHashedToken}`);

    return res.status(200)
        .json(new ApiResponse(200, {}, "Your reset password url is sent to your email id"));

})

const reset_password = asyncHandler(async (req, res) => {
    const {token} = req.params;
    const {newPassword} = req.body;

    const hashed_token = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

    const user = await userModel.findOne({
        forgotPasswordToken: hashed_token,
        forgotPasswordExp: {$gt: Date.now()}
    });

    if (!user) {
        throw new ApiError(400, "Token expired");
    }

    user.password = newPassword;

    await user.save({validateBeforeSave: false});

    return res.status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));

})

const changePassword = asyncHandler(async (req, res) => {
    const {email, oldPassword, newPassword} = req.body;

    const user = await userModel.findOne({email});

    if(!user) {
        throw new ApiError(400, "User not found");
    }

    if (!user.isPasswordCorrect(oldPassword)) {
        throw new ApiError(400, "Invalid Password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res.status(200)
        .json(new ApiResponse(
            200,
            {},
            "Password changed successfully"
        ))


})


export {
    register, 
    login, 
    logout, 
    getCurrentUser, 
    verifyEmail, 
    generateAccessAndRrefreshToken, 
    resend_email_verification, 
    forgot_password, 
    reset_password,
    changePassword};