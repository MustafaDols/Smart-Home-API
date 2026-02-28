import { verifyToken } from "../Utils/tokens.utils.js";
import User from "../DB/Models/user.model.js";
import BlackListedTokens from "../DB/Models/black-listed-tokens.model.js";

export const authenticationMiddleware = async (req, res, next) => {
    const { accesstoken } = req.headers;
    if (!accesstoken) {
        return res.status(400).json({ message: "Access token is required" })
    }
    //verify token
    const decodedData = verifyToken(accesstoken, process.env.JWT_ACCESS_SECRET)
    if (!decodedData) {
        return res.status(400).json({ message: "Invalid access token" })
    }
    //check if token is blacklisted
    const blackListedToken = await BlackListedTokens.findOne({ tokenId: decodedData.jti })
    if (blackListedToken) {
        return res.status(401).json({ message: "Token is blacklisted" });
    }
    console.log("Decoded Data:", decodedData);
    //get userData from DB
    const user = await User.findById(decodedData._id, '-password').lean();

    if (!user) {
        return res.status(400).json({ message: "User not found" });
    }


    req.loggedInUser = { user, token: { tokenId: decodedData.jti, expirationDate: decodedData.exp } }
    next()
}   