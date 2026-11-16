import { ApiError } from "../utils/api-error.js";
import userModel from "../model/user.model.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/async-handler.js";

const verifyJWT = asyncHandler( async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "Unothorized request");
    }

    const decodedResult = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    const user = await userModel.findById(decodedResult?._id)
        .select("-refreshToken -forgotPasswordToken -emailVerificationToken -emailVerificationExp -emailVerified");

    if (!user) {
        throw new ApiError(401, "Invalid token");
    }

    req.user = user;
    next();

    
})

export {verifyJWT};