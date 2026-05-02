import { google } from "googleapis";
import nodemailer from "nodemailer";

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
];

export function createGmailOAuth2Client(
  clientId: string,
  clientSecret: string,
  redirectUrl: string
) {
  return new google.auth.OAuth2(clientId, clientSecret, redirectUrl);
}

export function getGmailAuthUrl(oauth2Client: any): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GMAIL_SCOPES,
    prompt: "consent",
  });
}

export async function getGmailTokens(
  oauth2Client: any,
  code: string
): Promise<{ accessToken: string; refreshToken: string | null }> {
  const { tokens } = await oauth2Client.getToken(code);
  return {
    accessToken: tokens.access_token || "",
    refreshToken: tokens.refresh_token || null,
  };
}

export async function refreshGmailToken(
  oauth2Client: any,
  refreshToken: string
): Promise<string> {
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials.access_token || "";
}

export async function sendGmailEmail(
  clientId: string,
  clientSecret: string,
  userEmail: string,
  accessToken: string,
  refreshToken: string | null,
  to: string,
  subject: string,
  html: string
) {
  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: userEmail,
        clientId,
        clientSecret,
        refreshToken: refreshToken || undefined,
        accessToken,
      },
    });

    const info = await transporter.sendMail({
      from: userEmail,
      to,
      subject,
      html,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Failed to send email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function parseEmailTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, value);
  });
  return result;
}

export function textToHtmlEmail(text: string): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto;">
          ${text
            .split("\n")
            .map((line) => `<p>${line}</p>`)
            .join("")}
        </div>
      </body>
    </html>
  `;
}
