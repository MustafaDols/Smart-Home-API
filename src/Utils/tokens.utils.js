import jwt from "jsonwebtoken";

//Generate token
export const generateToken = (payload, secret, options) => {
    return jwt.sign(payload, secret, options);
}

//Verify token
export const verifyToken = (token, secret) => {
    return jwt.verify(token, secret);
}