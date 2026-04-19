


export const autraizationMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        const { role } = req.loggedInUser.user
        if (allowedRoles.includes(role)) {
            return next();
        }
        return res.status(401).json({ message: "Unauthorized" });
    }
}

export default autraizationMiddleware