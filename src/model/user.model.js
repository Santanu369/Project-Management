import mongoose, {Schema} from "mongoose";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import crypto, { hash } from 'crypto';

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },
        fullName: {
            type: String,
            trim: true
        },
        avatar: {
            type: {
                url: String,
                localPath: String
            },
            default: {
                url: `https://placehold.co/200x200`,
                localPath: ""
            }
        },

        refreshToken: {
            type: String,
            trim: true
        },

        forgotPasswordToken: {
            type: String,
            trim: true
        },

        emailVerificationToken: {
            type: String,
            trim: true
        },

        emailVerificationExp: {
            type: Number,
        },

        emailVerified: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

userSchema.pre("save", async function hashPass(next) {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.genAccessToken = async function () {
    return jwt.sign(
        {_id: this._id,
            email: this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: process.env.ACCESS_TOKEN_EXP}
    )
}

userSchema.methods.genRefreshToken = async function () {
    return jwt.sign(
        {_id: this._id,
            email: this.email
        },
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn: process.env.REFRESH_TOKEN_EXP}
    )
}

userSchema.methods.genTemporaryToken = async function () {
    const unHashedToken = crypto.randomBytes(20).toString("hex")

    const hashedToken = crypto.createHash('sha256')
    .update(unHashedToken)
    .digest('hex');

    const tokenExp = Date.now() + (20*60*1000) // 20 mins

    return {unHashedToken, hashedToken, tokenExp}
}

const userModel = mongoose.model("Users", userSchema);

export default userModel;