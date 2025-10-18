import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addUsernames() {
  try {
    // Get all users without usernames
    const users = await prisma.user.findMany({
      where: {
        username: null,
      },
    });

    console.log(`Found ${users.length} users without usernames`);

    // Update each user with a username based on their email
    for (const user of users) {
      const username = user.email.split("@")[0] + Math.floor(Math.random() * 1000);
      await prisma.user.update({
        where: { id: user.id },
        data: { username },
      });
      console.log(`Updated user ${user.email} with username: ${username}`);
    }

    console.log("All users updated with usernames!");
  } catch (error) {
    console.error("Error adding usernames:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addUsernames();
