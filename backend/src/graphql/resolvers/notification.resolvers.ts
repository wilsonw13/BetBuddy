import { GraphQLError } from "graphql";
import { prisma } from "@/config/prisma";
import { Context } from "@types";

export const notificationResolvers = {
  Query: {
    myNotifications: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const notifications = await prisma.notification.findMany({
        where: {
          userId: context.user.userId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profileImage: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return notifications;
    },

    unreadNotificationCount: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const count = await prisma.notification.count({
        where: {
          userId: context.user.userId,
          isRead: false,
        },
      });

      return count;
    },
  },

  Mutation: {
    markNotificationAsRead: async (_: any, { notificationId }: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        throw new GraphQLError("Notification not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      if (notification.userId !== context.user.userId) {
        throw new GraphQLError("Unauthorized", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      return {
        success: true,
        message: "Notification marked as read",
      };
    },

    markAllNotificationsAsRead: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      await prisma.notification.updateMany({
        where: {
          userId: context.user.userId,
          isRead: false,
        },
        data: { isRead: true },
      });

      return {
        success: true,
        message: "All notifications marked as read",
      };
    },

    deleteNotification: async (_: any, { notificationId }: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        throw new GraphQLError("Notification not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      if (notification.userId !== context.user.userId) {
        throw new GraphQLError("Unauthorized", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }

      await prisma.notification.delete({
        where: { id: notificationId },
      });

      return {
        success: true,
        message: "Notification deleted",
      };
    },
  },
};
