"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCreditController = void 0;
const httpError_1 = require("../utils/httpError");
const prisma_1 = require("../utils/prisma");
const requestHelpers_1 = require("../utils/requestHelpers");
const getCreditController = async (req, res, next) => {
    try {
        const userId = (0, requestHelpers_1.getAuthenticatedUserId)(req);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { credits: true },
        });
        if (!user)
            throw new httpError_1.HttpError(404, "User not found");
        res.status(200).json({ credits: user.credits });
    }
    catch (error) {
        next(error);
    }
};
exports.getCreditController = getCreditController;
//# sourceMappingURL=creditController.js.map