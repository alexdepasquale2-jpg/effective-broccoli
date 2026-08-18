import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Create Poster User
  const posterPasswordHash = await bcrypt.hash("poster123!", 10);
  const poster = await prisma.user.upsert({
    where: { email: "poster@example.com" },
    update: {},
    create: {
      name: "Acme Corp (Poster)",
      email: "poster@example.com",
      passwordHash: posterPasswordHash,
      role: "POSTER",
      stripeCustomerId: "cus_sample_poster_123",
    },
  });

  // 2. Create Agent Operator User
  const operatorPasswordHash = await bcrypt.hash("operator123!", 10);
  const operator = await prisma.user.upsert({
    where: { email: "operator@example.com" },
    update: {},
    create: {
      name: "Autonomous Dev Lab (Operator)",
      email: "operator@example.com",
      passwordHash: operatorPasswordHash,
      role: "AGENT_OPERATOR",
      stripeConnectAccountId: "acct_sample_operator_456",
      stripeConnectDetailsSubmitted: true,
      stripePayoutsEnabled: true,
    },
  });

  // 3. Create Sample Agent with API Key
  const sampleRawKey = "bnt_live_sample_developer_key_001";
  const apiKeyHash = crypto.createHash("sha256").update(sampleRawKey).digest("hex");
  const agent = await prisma.agent.upsert({
    where: { apiKeyHash },
    update: {},
    create: {
      ownerId: operator.id,
      name: "AutoFixer-v1",
      description: "Autonomous agent specializing in Node.js / TypeScript unit test repairs",
      apiKeyHash,
      apiKeyPrefix: sampleRawKey.substring(0, 16),
      taskTypesSupported: JSON.stringify(["CODE_FIX"]),
      isActive: true,
    },
  });

  // 4. Create Sample Open Bounty
  const bounty = await prisma.bounty.create({
    data: {
      posterId: poster.id,
      title: "Fix failing JWT expiry check in auth router",
      description:
        "The JWT expiry unit test fails when token clock skew is within 5 seconds. Make the test suite pass without breaking regression tests.",
      taskType: "CODE_FIX",
      amountCents: 5000, // $50.00
      currency: "usd",
      status: "OPEN",
      deadlineAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      escrowPaymentIntentId: "pi_mock_escrow_123",
      escrowCapturedAt: new Date(),
      verificationConfig: JSON.stringify({
        repoUrl: "https://github.com/acme-corp/auth-service",
        baseBranch: "main",
        failingTestCommand: "pnpm test:auth",
        testFilePaths: ["tests/auth.test.ts"],
      }),
      ledgerEntries: {
        create: {
          userId: poster.id,
          type: "ESCROW_DEPOSIT",
          amountCents: 5000,
          currency: "usd",
          status: "SETTLED",
          description: "Escrow funded for bounty: Fix failing JWT expiry check in auth router",
          referenceId: "pi_mock_escrow_123",
        },
      },
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log({
    poster: poster.email,
    operator: operator.email,
    agent: agent.name,
    sampleApiKey: sampleRawKey,
    sampleBountyId: bounty.id,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
