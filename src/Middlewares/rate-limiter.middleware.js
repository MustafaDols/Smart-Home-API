import { rateLimit } from "express-rate-limit";


//limiter
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // limit each IP to 100 requests per windowMs 
    message: "Too many requests from this IP, please try again after 15 minutes",
    legacyHeaders: false // Disable the `X-RateLimit-*` headers
})


//auth limiter
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5, // limit each IP to 5 requests per windowMs 
    message: "Too many requests from this IP, please try again after 15 minutes",
    legacyHeaders: false // Disable the `X-RateLimit-*` headers
})