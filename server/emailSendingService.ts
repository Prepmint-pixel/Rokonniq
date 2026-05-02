import { substituteVariables, buildContactData } from "./templateVariables";
import { sendGmailEmail } from "./gmailIntegration";
import { getGmailCredentials } from "./gmailDb";
import { logAnalyticsEvent } from "./analyticsDb";

/**
 * Send personalized email to a contact with variable substitution
 */
export async function sendPersonalizedEmail(
  userId: number,
  contactId: number,
  contactData: Record<string, any>,
  templateSubject: string,
  templateBody: string,
  engagementData?: Record<string, any>
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
  subject: string;
  body: string;
}> {
  try {
    // Build complete contact data with engagement metrics
    const fullContactData = buildContactData(contactData, engagementData);

    // Substitute variables in subject and body
    const personalizedSubject = substituteVariables(templateSubject, fullContactData);
    const personalizedBody = substituteVariables(templateBody, fullContactData);

    // Get Gmail credentials
    const gmailCreds = await getGmailCredentials(userId);
    if (!gmailCreds) {
      return {
        success: false,
        error: "Gmail credentials not found",
        subject: personalizedSubject,
        body: personalizedBody,
      };
    }

    // Send email via Gmail
    const result = await sendGmailEmail(
      process.env.GMAIL_CLIENT_ID || "",
      process.env.GMAIL_CLIENT_SECRET || "",
      gmailCreds.email,
      gmailCreds.accessToken,
      gmailCreds.refreshToken,
      contactData.email,
      personalizedSubject,
      personalizedBody
    );

    if (result.success) {
      // Email sent successfully

      return {
        success: true,
        messageId: result.messageId,
        subject: personalizedSubject,
        body: personalizedBody,
      };
    } else {
      return {
        success: false,
        error: result.error,
        subject: personalizedSubject,
        body: personalizedBody,
      };
    }
  } catch (error) {
    console.error("Failed to send personalized email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      subject: templateSubject,
      body: templateBody,
    };
  }
}

/**
 * Send bulk personalized emails to multiple contacts
 */
export async function sendBulkPersonalizedEmails(
  userId: number,
  contacts: Array<{
    id: number;
    data: Record<string, any>;
    engagement?: Record<string, any>;
  }>,
  templateSubject: string,
  templateBody: string,
  delays: number[] = [0] // Delays in milliseconds between sends
): Promise<{
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    contactId: number;
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}> {
  const results: Array<{
    contactId: number;
    success: boolean;
    messageId?: string;
    error?: string;
  }> = [];

  let successful = 0;
  let failed = 0;

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];

    // Apply delay if specified
    if (delays[i] && delays[i] > 0) {
      await new Promise((resolve) => setTimeout(resolve, delays[i]));
    }

    const result = await sendPersonalizedEmail(
      userId,
      contact.id,
      contact.data,
      templateSubject,
      templateBody,
      contact.engagement
    );

    if (result.success) {
      successful++;
      results.push({
        contactId: contact.id,
        success: true,
        messageId: result.messageId,
      });
    } else {
      failed++;
      results.push({
        contactId: contact.id,
        success: false,
        error: result.error,
      });
    }
  }

  return {
    total: contacts.length,
    successful,
    failed,
    results,
  };
}

/**
 * Send email with retry logic
 */
export async function sendEmailWithRetry(
  userId: number,
  contactId: number,
  contactData: Record<string, any>,
  templateSubject: string,
  templateBody: string,
  maxRetries: number = 3,
  engagementData?: Record<string, any>
): Promise<{
  success: boolean;
  messageId?: string;
  attempts: number;
  error?: string;
}> {
  let lastError: string | undefined;
  let attempts = 0;

  for (let i = 0; i < maxRetries; i++) {
    attempts++;

    try {
      const result = await sendPersonalizedEmail(
        userId,
        contactId,
        contactData,
        templateSubject,
        templateBody,
        engagementData
      );

      if (result.success) {
        return {
          success: true,
          messageId: result.messageId,
          attempts,
        };
      } else {
        lastError = result.error;

        // Wait before retry (exponential backoff)
        if (i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unknown error";

      // Wait before retry
      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  return {
    success: false,
    attempts,
    error: lastError,
  };
}
