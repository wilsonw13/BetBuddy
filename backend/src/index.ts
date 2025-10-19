import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs } from "@/graphql/schema";
import { resolvers } from "@/graphql/resolvers";
import { tokenService } from "@/services/token.service";
import { disconnectPrisma } from "@/config/prisma";
import { NODE_ENV, HOST, PORT } from "@/config/env";
import { seedDatabase } from "@/config/seedDatabase";
import { Context } from "@types";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (error) => {
    // Log error for debugging
    console.error("GraphQL Error:", error);

    // Return formatted error to client
    return {
      message: error.message,
      extensions: {
        code: error.extensions?.code || "INTERNAL_SERVER_ERROR",
      },
    };
  },
  introspection: NODE_ENV !== "production", // Enable GraphQL Playground in dev
});

const main = async () => {
  // seed mock data
  // await seedDatabase(false);

  const { url } = await startStandaloneServer(server, {
    listen: { host: HOST, port: PORT },
    context: async ({ req }): Promise<Context> => {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization || "";

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);

        try {
          // Verify access token
          const payload = tokenService.verifyAccessToken(token);

          return {
            user: {
              userId: payload.userId,
              email: payload.email,
            },
          };
        } catch (error) {
          // Invalid token, continue without user context
          console.log("Invalid token:", error);
        }
      }

      return {};
    },
  });
  console.log(`GraphQL Server ready at ${url}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`GraphQL Playground: ${url}`);
};

main();

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing server");
  await disconnectPrisma();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT signal received: closing server");
  await disconnectPrisma();
  process.exit(0);
});
