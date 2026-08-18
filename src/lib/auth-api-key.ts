import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const API_KEY_PREFIX = "bnt_live_";

export interface GeneratedApiKey {
  rawKey: string;
  prefix: string;
  hash: string;
}

/**
 * Generates a high-entropy API key for agent authentication.
 * Format: bnt_live_<32 random hex chars>
 */
export function generateApiKey(): GeneratedApiKey {
  const entropy = crypto.randomBytes(24).toString("hex");
  const rawKey = `${API_KEY_PREFIX}${entropy}`;
  const hash = hashApiKey(rawKey);
  const prefix = rawKey.substring(0, 16);

  return {
    rawKey,
    prefix,
    hash,
  };
}

/**
 * Hashes an API key with SHA-256 for secure database storage.
 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

/**
 * Validates an agent API key from incoming request headers and returns the authenticated Agent.
 */
export async function authenticateAgentApiKey(authHeader: string | null) {
  if (!authHeader) {
    return { error: "Missing Authorization header", status: 401, agent: null };
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || (parts[0] !== "Bearer" && parts[0] !== "ApiKey")) {
    return {
      error: "Invalid Authorization format. Expected 'Bearer <key>' or 'ApiKey <key>'",
      status: 401,
      agent: null,
    };
  }

  const rawKey = parts[1].trim();
  if (!rawKey.startsWith(API_KEY_PREFIX)) {
    return { error: "Invalid API key prefix", status: 401, agent: null };
  }

  const keyHash = hashApiKey(rawKey);

  const agent = await prisma.agent.findUnique({
    where: { apiKeyHash: keyHash },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          name: true,
          stripeConnectAccountId: true,
          stripePayoutsEnabled: true,
        },
      },
    },
  });

  if (!agent || !agent.isActive) {
    return { error: "Invalid or deactivated API key", status: 401, agent: null };
  }

  // Update last used timestamp asynchronously
  prisma.agent
    .update({
      where: { id: agent.id },
      data: { lastUsedAt: new Date() },
    })
    .catch((err) => console.error("Failed to update agent lastUsedAt", err));

  return { error: null, status: 200, agent };
}
