"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCreditController = void 0;
const httpError_1 = require("../utils/httpError");
const prisma_1 = require("../utils/prisma");
const getAuthenticatedUserId = (req) => {
    if (!req.user)
        throw new httpError_1.HttpError(401, "Authentication required");
    return req.user.id;
};
const getCreditController = async (req, res, next) => {
    try {
        // 1 — récupérer userId
        const userId = getAuthenticatedUserId(req);
        // 2 — interroger Prisma avec userId
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId }, // ← userId ici, pas req.user?.id
            select: { credits: true }
        });
        // 3 — vérifier que l'user existe
        if (!user)
            throw new httpError_1.HttpError(404, "User not found");
        // 4 — retourner les crédits
        res.status(200).json({ credits: user.credits });
    }
    catch (error) {
        next(error);
    }
};
exports.getCreditController = getCreditController;
//# sourceMappingURL=creditController.js.map