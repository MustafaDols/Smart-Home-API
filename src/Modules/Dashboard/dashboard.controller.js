import * as dashboardService from "./dashboard.service.js";

export const getDashboardSummary = async (req, res) => {
    try {
        const summary = await dashboardService.getDashboardSummary(
            req.loggedInUser.user._id
        );

        return res.status(200).json({
            message: "Dashboard summary fetched successfully",
            summary
        });
    } catch (error) {
        console.error("Dashboard summary error:", error.message);
        return res.status(500).json({
            message: "Error fetching dashboard summary",
            error: error.message
        });
    }
};
