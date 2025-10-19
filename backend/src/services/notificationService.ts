import { prisma } from "../index";

export interface CreateNotificationInput {
  userId: string;
  type: "friend_request" | "group_invite" | "bet_invite";
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: any;
}

export async function createNotification(input: CreateNotificationInput) {
  return await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      actionUrl: input.actionUrl,
      metadata: input.metadata,
    },
  });
}

export async function createNotificationForMultipleUsers(
  userIds: string[],
  input: Omit<CreateNotificationInput, "userId">
) {
  return await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type: input.type,
      title: input.title,
      message: input.message,
      actionUrl: input.actionUrl,
      metadata: input.metadata,
    })),
  });
}
