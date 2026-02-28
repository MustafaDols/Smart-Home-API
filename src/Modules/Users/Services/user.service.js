import { compareSync, hashSync } from "bcrypt";
import User from "../../../DB/Models/user.model.js";
import { assymetricEncryption } from "../../../Utils/encryption.utils.js";
import { v4 as uuidv4 } from "uuid"
import { generateToken } from "../../../Utils/tokens.utils.js";
import { providerEnum } from "../../../Common/enums/user.enum.js";
import { customAlphabet } from "nanoid"
import { emitter } from "../../../Utils/send-email.utils.js"

const uniqueString = customAlphabet('1234567890abcdef', 5)

export const signUpService = async (req, res) => {

    const { firstname, lastname, email, password, age, gender, phoneNumber } = req.body

    const isUserExist = await User.findOne({ email, provider: providerEnum.LOCAL })

    if (isUserExist) {
        return res.status(409).json({ message: "User already exists" });
    }

    //Encrypt phone number
    const encryptedPhoneNumber = assymetricEncryption(phoneNumber)

    //Hash password
    const hashedPassword = hashSync(password, +process.env.SALT_ROUNDS)

    const otp = uniqueString()

    const user = await User.create({
        firstname,
        lastname,
        email,
        password: hashedPassword,
        age,
        gender,
        phoneNumber: encryptedPhoneNumber,
        otps: { confirmation: hashSync(otp, +process.env.SALT_ROUNDS) }
    })

    emitter.emit('sendEmail', {
        to: email,
        subject: "Confirmation email",
        content: ` Your confirmation otp is ${otp} `,
        attachments: [
            {
                filename: "confirmation.png",
                path: "confirmation.png"
            }
        ]
    })
    return res.status(201).json({ message: "User created successfully", user })
}

export const signinService = async (req, res) => {

    const { email, password } = req.body
    const user = await User.findOne({ email, provider: providerEnum.LOCAL })

    if (!user) {
        return res.status(404).json({ message: "Invalid email or password " });
    }

    const isPasswordMatch = compareSync(password, user.password)

    if (!isPasswordMatch) {
        return res.status(404).json({ message: "Invalid email or password " });
    }

    const accesstoken = generateToken(
        { _id: user._id, email: user.email },
        process.env.JWT_ACCESS_SECRET,
        {
            // issuer: 'https://localhost:3000',
            // audience: 'https://localhost:4000',
            expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
            jwtid: uuidv4()
        }
    )
    const refreshtoken = generateToken(
        { _id: user._id, email: user.email },
        process.env.JWT_REFRESH_SECRET,
        {
            // issuer: 'https://localhost:3000',
            // audience: 'https://localhost:4000',
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
            jwtid: uuidv4()
        }

    )
    return res.status(200).json({ message: "User signed in successfully", accesstoken, refreshtoken })
}


export const listUsersService = async (req, res) => {
}


export const LogoutService = async (req, res) => {
}


export const RefreshTokenService = async (req, res) => {
}


export const updatePasswordService = async (req, res) => {
}



export const forgotPasswordService = async (req, res) => {
}



export const authServiceWithGemail = async (req, res) => {
}



export const deleteExpiredTokensService = async (req, res) => {
}





