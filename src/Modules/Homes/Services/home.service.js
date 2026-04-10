import Home from "../../../DB/Models/home.model.js";

export const createHomeService = async (req, res) => {

    const { name, location } = req.body;

    // check duplicate location 
    const isExist = await Home.findOne({
        location,
        ownerId: req.loggedInUser.user._id
    });

    if (isExist) {
        return res.status(409).json({ message: "Home already exists" });
    }

    const home = await Home.create({
        name,
        location,
        ownerId: req.loggedInUser.user._id
    });

    return res.status(201).json({
        message: "Home created successfully",
        home
    });
};

export const getHomesService = async (req, res) => {

    const homes = await Home.find({
        ownerId: req.loggedInUser.user._id
    }).sort({ createdAt: -1 });

    return res.status(200).json({
        message: "Homes fetched successfully",
        homes
    });
}

export const getHomeService = async (req, res) => {

    const { location } = req.params;

    const home = await Home.findOne({
        location,
        ownerId: req.loggedInUser.user._id
    });

    if (!home) {
        return res.status(404).json({ message: "Home not found" });
    }

    return res.status(200).json({
        message: "Home fetched successfully",
        home
    });
}

export const deleteHomeService = async (req, res) => {

    const { location } = req.params;

    const home = await Home.findOneAndDelete({
        location,
        ownerId: req.loggedInUser.user._id
    });

    if (!home) {
        return res.status(404).json({ message: "Home not found" });
    }

    return res.status(200).json({
        message: "Home deleted successfully"
    });
}

export const updateHomeService = async (req, res) => {

    const { location } = req.params;
    const { newOwnerId } = req.body;

    const home = await Home.findOneAndUpdate(
        {
            location,
            ownerId: req.loggedInUser.user._id
        },
        {
            ownerId: newOwnerId
        },
        {
            new: true
        }
    );

    if (!home) {
        return res.status(404).json({ message: "Home not found" });
    }

    return res.status(200).json({
        message: "Home updated successfully",
        home
    });

};