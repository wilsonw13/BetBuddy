import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import dotenv from "dotenv";
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolvers";
import { tokenService } from "./services/tokenService";
import { disconnectPrisma } from "./config/prisma";

dotenv.config();

const PORT = parseInt(process.env.PORT || "3000");

interface Context {
  user?: {
    userId: string;
    email: string;
  };
}

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
  introspection: process.env.NODE_ENV !== "production", // Enable GraphQL Playground in dev
});

// Start server with context
startStandaloneServer(server, {
  listen: { port: PORT },
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
}).then(({ url }) => {
  console.log(`🚀 GraphQL Server ready at ${url}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🎮 GraphQL Playground: ${url}`);
});

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

export default server;
