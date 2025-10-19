import { GraphQLError } from "graphql";
import { prisma } from "@/config/prisma";
import { Context } from "@types";
import { uploadImageToStorage } from "@/services/imageUpload";

export const userResolvers = {
  Mutation: {
    async updateProfileImage(_: any, { image }: { image: string }, context: Context) {
      if (!context.user) {
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }
      // Upload image to storage (implement this function as needed)
      const imageUrl = await uploadImageToStorage(image, context.user.userId);
      // Update user profileImage in DB
      await prisma.user.update({
        where: { id: context.user.userId },
        data: { profileImage: imageUrl },
      });
      return { success: true, imageUrl };
    },
  },
};
