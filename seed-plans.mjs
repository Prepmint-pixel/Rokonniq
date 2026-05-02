import mysql from "mysql2/promise";

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

try {
  // Clear existing plans
  await connection.execute("DELETE FROM subscriptionPlans");

  // Insert subscription plans
  const plans = [
    [
      "free",
      "Free",
      "Perfect for getting started",
      0,
      "monthly",
      null,
      1,
      100,
      0,
      0,
      0,
      0,
    ],
    [
      "pro",
      "Pro",
      "For professionals & small teams",
      2999,
      "monthly",
      "price_1TSi1JBATw35oVyzr1Jf8eiN",
      5,
      1000,
      1,
      1,
      1,
      0,
    ],
    [
      "enterprise",
      "Enterprise",
      "For large teams & organizations",
      9999,
      "monthly",
      "price_1TSi2pBATw35oVyzpwZXdBOk",
      999,
      999999,
      1,
      1,
      1,
      1,
    ],
  ];

  for (const plan of plans) {
    await connection.execute(
      `INSERT INTO subscriptionPlans (name, displayName, description, price, billingPeriod, stripePriceId, maxCards, maxContacts, hasAnalytics, hasWorkflows, hasEmailCampaigns, hasTeamMembers) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      plan
    );
  }

  console.log("✅ Subscription plans seeded successfully!");
  process.exit(0);
} catch (error) {
  console.error("❌ Error seeding plans:", error);
  process.exit(1);
}
