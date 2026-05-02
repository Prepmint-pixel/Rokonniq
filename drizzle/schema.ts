import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, smallint, unique } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Analytics events table for tracking card interactions
 */
export const analyticsEvents = mysqlTable("analyticsEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cardId: varchar("cardId", { length: 64 }).notNull(),
  eventType: mysqlEnum("eventType", [
    "wallet_add_apple",
    "wallet_add_google",
    "qr_scan",
    "card_view",
    "card_share",
    "vcard_download",
    "qr_download",
  ]).notNull(),
  platform: varchar("platform", { length: 32 }),
  userAgent: text("userAgent"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  referrer: text("referrer"),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

/**
 * Card statistics table for aggregated analytics
 */
export const cardStats = mysqlTable("cardStats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cardId: varchar("cardId", { length: 64 }).notNull(),
  walletAddCount: int("walletAddCount").default(0).notNull(),
  walletAddAppleCount: int("walletAddAppleCount").default(0).notNull(),
  walletAddGoogleCount: int("walletAddGoogleCount").default(0).notNull(),
  qrScanCount: int("qrScanCount").default(0).notNull(),
  cardViewCount: int("cardViewCount").default(0).notNull(),
  cardShareCount: int("cardShareCount").default(0).notNull(),
  vcardDownloadCount: int("vcardDownloadCount").default(0).notNull(),
  qrDownloadCount: int("qrDownloadCount").default(0).notNull(),
  lastWalletAddAt: timestamp("lastWalletAddAt"),
  lastQrScanAt: timestamp("lastQrScanAt"),
  lastCardViewAt: timestamp("lastCardViewAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CardStat = typeof cardStats.$inferSelect;
export type InsertCardStat = typeof cardStats.$inferInsert;

/**
 * CRM Contacts table - prospects met and shared contact cards with
 */
export const crmContacts = mysqlTable("crmContacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  company: varchar("company", { length: 255 }),
  title: varchar("title", { length: 255 }),
  notes: text("notes"),
  source: varchar("source", { length: 100 }), // e.g., "contact_card_share", "manual_entry"
  status: mysqlEnum("status", ["prospect", "lead", "customer", "archived"]).default("prospect").notNull(),
  lastContactedAt: timestamp("lastContactedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CrmContact = typeof crmContacts.$inferSelect;
export type InsertCrmContact = typeof crmContacts.$inferInsert;

/**
 * Follow-ups table - scheduled follow-up emails
 */
export const followUps = mysqlTable("followUps", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contactId: int("contactId").notNull(),
  templateId: int("templateId"),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  scheduledFor: timestamp("scheduledFor").notNull(),
  sentAt: timestamp("sentAt"),
  status: mysqlEnum("status", ["scheduled", "sent", "failed", "cancelled"]).default("scheduled").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FollowUp = typeof followUps.$inferSelect;
export type InsertFollowUp = typeof followUps.$inferInsert;

/**
 * Email templates table - reusable follow-up email templates
 */
export const emailTemplates = mysqlTable("emailTemplates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  variables: text("variables"), // JSON array of variable names like ["name", "company"]
  isDefault: int("isDefault").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

/**
 * Lead pipeline table - track lead status and conversion
 */
export const leadPipeline = mysqlTable("leadPipeline", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contactId: int("contactId").notNull(),
  stage: mysqlEnum("stage", ["initial_contact", "interested", "qualified", "proposal", "negotiation", "won", "lost"]).default("initial_contact").notNull(),
  value: int("value"), // potential deal value in cents
  probability: int("probability").default(0), // 0-100
  notes: text("notes"),
  lastUpdatedAt: timestamp("lastUpdatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LeadPipeline = typeof leadPipeline.$inferSelect;
export type InsertLeadPipeline = typeof leadPipeline.$inferInsert;

/**
 * Activity log table - track all interactions with contacts
 */
export const activityLog = mysqlTable("activityLog", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contactId: int("contactId").notNull(),
  activityType: mysqlEnum("activityType", ["email_sent", "email_opened", "call", "meeting", "note_added", "status_changed", "follow_up_scheduled"]).notNull(),
  description: text("description"),
  metadata: text("metadata"), // JSON for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = typeof activityLog.$inferInsert;

/**
 * Gmail credentials table - store user's Gmail OAuth tokens
 */
export const gmailCredentials = mysqlTable("gmailCredentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  isConnected: int("isConnected").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GmailCredential = typeof gmailCredentials.$inferSelect;
export type InsertGmailCredential = typeof gmailCredentials.$inferInsert;

// TODO: Add your tables here
/**
 * Email delivery log table - track status of sent emails
 */
export const emailDeliveryLog = mysqlTable("emailDeliveryLog", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  followUpId: int("followUpId").notNull(),
  contactId: int("contactId").notNull(),
  gmailMessageId: varchar("gmailMessageId", { length: 255 }),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  subject: text("subject").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed", "bounced", "opened", "clicked"]).default("pending").notNull(),
  attemptCount: int("attemptCount").default(0).notNull(),
  maxAttempts: int("maxAttempts").default(3).notNull(),
  lastAttemptAt: timestamp("lastAttemptAt"),
  nextRetryAt: timestamp("nextRetryAt"),
  errorMessage: text("errorMessage"),
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  metadata: text("metadata"), // JSON for tracking data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailDeliveryLog = typeof emailDeliveryLog.$inferSelect;
export type InsertEmailDeliveryLog = typeof emailDeliveryLog.$inferInsert;

/**
 * Email delivery queue table - manage pending emails to send
 */
export const emailDeliveryQueue = mysqlTable("emailDeliveryQueue", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  deliveryLogId: int("deliveryLogId").notNull(),
  scheduledFor: timestamp("scheduledFor").notNull(),
  priority: int("priority").default(0).notNull(), // Higher number = higher priority
  isProcessing: int("isProcessing").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailDeliveryQueue = typeof emailDeliveryQueue.$inferSelect;
export type InsertEmailDeliveryQueue = typeof emailDeliveryQueue.$inferInsert;

/**
 * Email engagement tracking table - track opens, clicks, etc.
 */
export const emailEngagement = mysqlTable("emailEngagement", {
  id: int("id").autoincrement().primaryKey(),
  deliveryLogId: int("deliveryLogId").notNull(),
  userId: int("userId").notNull(),
  eventType: mysqlEnum("eventType", ["opened", "clicked", "replied", "forwarded", "marked_spam"]).notNull(),
  linkUrl: varchar("linkUrl", { length: 2048 }),
  userAgent: text("userAgent"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type EmailEngagement = typeof emailEngagement.$inferSelect;
export type InsertEmailEngagement = typeof emailEngagement.$inferInsert;

/**
 * Workflows table - automated follow-up sequences
 */
export const workflows = mysqlTable("workflows", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  trigger: mysqlEnum("trigger", [
    "contact_added",
    "contact_status_changed",
    "email_opened",
    "email_clicked",
    "qr_scanned",
    "manual",
  ]).notNull(),
  triggerConfig: text("triggerConfig"), // JSON config for trigger conditions
  isActive: int("isActive").default(1).notNull(),
  nodeData: text("nodeData"), // JSON serialized React Flow nodes
  edgeData: text("edgeData"), // JSON serialized React Flow edges
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;

/**
 * Workflow steps table - individual steps in a workflow
 */
export const workflowSteps = mysqlTable("workflowSteps", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull(),
  nodeId: varchar("nodeId", { length: 64 }).notNull(), // React Flow node ID
  stepType: mysqlEnum("stepType", [
    "delay",
    "send_email",
    "update_status",
    "add_tag",
    "condition",
    "webhook",
  ]).notNull(),
  config: text("config"), // JSON config specific to step type
  order: int("order").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WorkflowStep = typeof workflowSteps.$inferSelect;
export type InsertWorkflowStep = typeof workflowSteps.$inferInsert;

/**
 * Workflow conditions table - conditional branches in workflows
 */
export const workflowConditions = mysqlTable("workflowConditions", {
  id: int("id").autoincrement().primaryKey(),
  workflowStepId: int("workflowStepId").notNull(),
  conditionType: mysqlEnum("conditionType", [
    "email_opened",
    "email_clicked",
    "engagement_score",
    "contact_status",
    "time_elapsed",
    "custom_field",
  ]).notNull(),
  operator: varchar("operator", { length: 32 }).notNull(), // e.g., "equals", "greater_than", "contains"
  value: text("value"), // JSON value to compare against
  nextStepIdIfTrue: int("nextStepIdIfTrue"),
  nextStepIdIfFalse: int("nextStepIdIfFalse"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WorkflowCondition = typeof workflowConditions.$inferSelect;
export type InsertWorkflowCondition = typeof workflowConditions.$inferInsert;

/**
 * Workflow executions table - track workflow runs for contacts
 */
export const workflowExecutions = mysqlTable("workflowExecutions", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull(),
  contactId: int("contactId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", [
    "started",
    "in_progress",
    "completed",
    "paused",
    "failed",
  ]).default("started").notNull(),
  currentStepId: int("currentStepId"),
  executionData: text("executionData"), // JSON tracking step results
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  failureReason: text("failureReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type InsertWorkflowExecution = typeof workflowExecutions.$inferInsert;

/**
 * Workflow execution steps table - track individual step executions
 */
export const workflowExecutionSteps = mysqlTable("workflowExecutionSteps", {
  id: int("id").autoincrement().primaryKey(),
  executionId: int("executionId").notNull(),
  stepId: int("stepId").notNull(),
  status: mysqlEnum("status", [
    "pending",
    "executing",
    "completed",
    "failed",
    "skipped",
  ]).default("pending").notNull(),
  result: text("result"), // JSON result data
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WorkflowExecutionStep = typeof workflowExecutionSteps.$inferSelect;
export type InsertWorkflowExecutionStep = typeof workflowExecutionSteps.$inferInsert;

/**
 * Digital Cards table - stores user contact cards
 */
export const digitalCards = mysqlTable(
  "digitalCards",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    cardId: varchar("cardId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }),
  company: varchar("company", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  linkedin: text("linkedin"),
  website: text("website"),
  bio: text("bio"),
  profileImage: text("profileImage"),
  cardStyle: text("cardStyle"), // JSON string
  socialLinks: text("socialLinks"), // JSON string
  isPrimary: smallint("isPrimary").default(0).notNull(),
    cardType: varchar("cardType", { length: 50 }).default("professional").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [{
    userCardIdUnique: unique().on(table.userId, table.cardId),
  }]
);

export type DigitalCard = typeof digitalCards.$inferSelect;
export type InsertDigitalCard = typeof digitalCards.$inferInsert;

/**
 * Subscription plans table
 */
export const subscriptionPlans = mysqlTable("subscriptionPlans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull(), // "free", "pro", "enterprise"
  displayName: varchar("displayName", { length: 128 }).notNull(), // "Free", "Pro", "Enterprise"
  description: text("description"),
  price: int("price").notNull(), // Price in cents (e.g., 999 = $9.99)
  billingPeriod: mysqlEnum("billingPeriod", ["monthly", "yearly"]).notNull(),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  maxCards: int("maxCards").notNull().default(1), // Number of cards allowed
  maxContacts: int("maxContacts").notNull().default(100), // CRM contacts limit
  hasAnalytics: smallint("hasAnalytics").default(0).notNull(),
  hasWorkflows: smallint("hasWorkflows").default(0).notNull(),
  hasEmailCampaigns: smallint("hasEmailCampaigns").default(0).notNull(),
  hasTeamMembers: smallint("hasTeamMembers").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

/**
 * User subscriptions table
 */
export const userSubscriptions = mysqlTable("userSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  planId: int("planId").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  status: mysqlEnum("status", ["active", "canceled", "past_due", "trialing"]).notNull().default("active"),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  canceledAt: timestamp("canceledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;

/**
 * Stripe events log for webhook processing
 */
export const stripeEvents = mysqlTable("stripeEvents", {
  id: int("id").autoincrement().primaryKey(),
  stripeEventId: varchar("stripeEventId", { length: 255 }).notNull().unique(),
  type: varchar("type", { length: 128 }).notNull(), // "customer.subscription.created", etc.
  data: text("data"), // JSON data from Stripe event
  processed: smallint("processed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StripeEvent = typeof stripeEvents.$inferSelect;
export type InsertStripeEvent = typeof stripeEvents.$inferInsert;

/**
 * Billing history table for tracking invoices and payments
 */
export const billingHistory = mysqlTable("billingHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subscriptionId: int("subscriptionId"),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 255 }).unique(),
  amount: int("amount").notNull(), // Amount in cents
  currency: varchar("currency", { length: 3 }).default("usd").notNull(),
  status: mysqlEnum("status", ["draft", "open", "paid", "void", "uncollectible"]).notNull(),
  description: text("description"),
  invoiceUrl: text("invoiceUrl"), // URL to the invoice PDF
  pdfUrl: text("pdfUrl"), // Direct PDF URL
  periodStart: timestamp("periodStart"),
  periodEnd: timestamp("periodEnd"),
  dueDate: timestamp("dueDate"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BillingHistory = typeof billingHistory.$inferSelect;
export type InsertBillingHistory = typeof billingHistory.$inferInsert;

/**
 * Payment methods table for storing user payment methods
 */
export const paymentMethods = mysqlTable("paymentMethods", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  stripePaymentMethodId: varchar("stripePaymentMethodId", { length: 255 }).notNull().unique(),
  cardBrand: varchar("cardBrand", { length: 32 }).notNull(), // visa, mastercard, amex, discover
  cardLast4: varchar("cardLast4", { length: 4 }).notNull(),
  cardExpMonth: int("cardExpMonth").notNull(),
  cardExpYear: int("cardExpYear").notNull(),
  cardHolderName: varchar("cardHolderName", { length: 255 }),
  isDefault: smallint("isDefault").default(0).notNull(), // 0 = false, 1 = true
  billingAddress: text("billingAddress"), // JSON string with address details
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = typeof paymentMethods.$inferInsert;


/**
 * Captured Contacts table - stores leads collected from card visitors
 */
export const capturedContacts = mysqlTable("capturedContacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  cardId: varchar("cardId", { length: 64 }).notNull(),
  firstName: varchar("firstName", { length: 255 }).notNull(),
  lastName: varchar("lastName", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  company: varchar("company", { length: 255 }),
  position: varchar("position", { length: 255 }),
  notes: text("notes"),
  source: varchar("source", { length: 50 }).default("card_form").notNull(), // "card_form", "import", etc.
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CapturedContact = typeof capturedContacts.$inferSelect;
export type InsertCapturedContact = typeof capturedContacts.$inferInsert;

/**
 * Wallet Cards table - stores Apple/Google Wallet pass data
 */
export const walletCards = mysqlTable("walletCards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  cardId: varchar("cardId", { length: 64 }).notNull(),
  walletCardId: varchar("walletCardId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  logoUrl: text("logoUrl"),
  backgroundColor: varchar("backgroundColor", { length: 7 }).default("#000000").notNull(), // Hex color
  foregroundColor: varchar("foregroundColor", { length: 7 }).default("#FFFFFF").notNull(),
  labelColor: varchar("labelColor", { length: 7 }).default("#CCCCCC").notNull(),
  organizationName: varchar("organizationName", { length: 255 }),
  serialNumber: varchar("serialNumber", { length: 255 }).notNull(),
  passTypeIdentifier: varchar("passTypeIdentifier", { length: 255 }), // com.apple.wallet.pass type
  teamIdentifier: varchar("teamIdentifier", { length: 255 }),
  qrCodeUrl: text("qrCodeUrl"),
  barcodeUrl: text("barcodeUrl"),
  barcodeFormat: varchar("barcodeFormat", { length: 20 }).default("QR").notNull(), // QR, PDF417, Aztec, Code128
  barcodeValue: text("barcodeValue"),
  relevantDate: timestamp("relevantDate"),
  expirationDate: timestamp("expirationDate"),
  voided: smallint("voided").default(0).notNull(),
  passData: text("passData"), // JSON string with full pass data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WalletCard = typeof walletCards.$inferSelect;
export type InsertWalletCard = typeof walletCards.$inferInsert;
