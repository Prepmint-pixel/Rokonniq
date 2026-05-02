import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { createGmailOAuth2Client, getGmailAuthUrl, getGmailTokens } from "./gmailIntegration";
import { saveGmailCredentials, getGmailCredentials, disconnectGmail } from "./gmailDb";
import { TRPCError } from "@trpc/server";

export const gmailRouter = router({
  /**
   * Get Gmail connection status
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const credentials = await getGmailCredentials(ctx.user.id);
    
    return {
      isConnected: credentials !== null && credentials.isConnected === 1,
      email: credentials?.email || null,
      connectedAt: credentials?.createdAt || null,
    };
  }),

  /**
   * Get Gmail authorization URL
   */
  getAuthUrl: protectedProcedure
    .input(
      z.object({
        redirectUrl: z.string().url(),
      })
    )
    .query(({ input }) => {
      const clientId = process.env.GMAIL_CLIENT_ID;
      const clientSecret = process.env.GMAIL_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gmail OAuth credentials not configured",
        });
      }

      const oauth2Client = createGmailOAuth2Client(
        clientId,
        clientSecret,
        input.redirectUrl
      );

      const authUrl = getGmailAuthUrl(oauth2Client);

      return { authUrl };
    }),

  /**
   * Connect Gmail account with authorization code
   */
  connect: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        redirectUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const clientId = process.env.GMAIL_CLIENT_ID;
      const clientSecret = process.env.GMAIL_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gmail OAuth credentials not configured",
        });
      }

      try {
        const oauth2Client = createGmailOAuth2Client(
          clientId,
          clientSecret,
          input.redirectUrl
        );

        const { accessToken, refreshToken } = await getGmailTokens(
          oauth2Client,
          input.code
        );

        // Get user email from Gmail
        const gmail = new (require("googleapis").gmail_v1.Gmail)({
          auth: oauth2Client,
        });

        const profile = await gmail.users.getProfile({ userId: "me" });
        const userEmail = profile.data.emailAddress;

        // Save credentials
        await saveGmailCredentials(
          ctx.user.id,
          userEmail || "",
          accessToken,
          refreshToken
        );

        return {
          success: true,
          email: userEmail,
        };
      } catch (error) {
        console.error("Gmail connection error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to connect Gmail",
        });
      }
    }),

  /**
   * Disconnect Gmail account
   */
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    await disconnectGmail(ctx.user.id);

    return {
      success: true,
      message: "Gmail account disconnected",
    };
  }),
});
