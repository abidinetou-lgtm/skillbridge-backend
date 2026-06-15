import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/httpError";
import { NotificationType } from "@prisma/client";

export const createNotificationService = async (
    userID : string,
    type : NotificationType,
    message : string,
) => {
    const notification = await prisma.notification.create({
        data: {
            userId: userID,
            message: message,
            type: type,
        }
    });
    return notification;
};

export const getNotificationsService = async (userID : string) => {
    const notifications = await prisma.notification.findMany({
        where: {
            userId: userID,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return notifications;
};

export const markNotificationAsReadService = async (notificationID : string, userID : string) => {
    const notification = await prisma.notification.update({
        where: {
            id: notificationID,
            userId: userID,
        },
        data: {
            read: true,
        }
    });
    return notification;
};