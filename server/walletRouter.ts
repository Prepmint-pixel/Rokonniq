import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import {
  generateAppleWalletPass,
  generateGoogleWalletJWT,
  generateVCard,
  type ContactData,
} from "./walletGeneration";

/**
 * Wallet integration router for Apple Wallet and Google Wallet
 */
export const walletRouter = router({
  /**
   * Generate Apple Wallet pass (.pkpass file)
   */
  generateApplePass: publicProcedure
    .input(
      z.object({
        contactData: z.object({
          name: z.string(),
          title: z.string(),
          email: z.string(),
          phone: z.string(),
          linkedin: z.string(),
          profileImage: z.string().optional(),
          website: z.string().optional(),
          bio: z.string().optional(),
          socialLinks: z
            .array(
              z.object({
                id: z.string(),
                platform: z.string(),
                url: z.string(),
              })
            )
            .optional(),
          cardStyle: z
            .object({
              headerColor: z.string(),
              buttonStyle: z.string(),
              frameStyle: z.string(),
              accentColor: z.string(),
            })
            .optional(),
        }),
        cardId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const passBuffer = await generateAppleWalletPass(
          input.contactData as ContactData,
          input.cardId
        );

        return {
          success: true,
          buffer: passBuffer.toString("base64"),
          filename: `${input.contactData.name.replace(/\s+/g, "_")}_contact.pkpass`,
        };
      } catch (error) {
        console.error("Error generating Apple Wallet pass:", error);
        return {
          success: false,
          error: "Failed to generate Apple Wallet pass",
        };
      }
    }),

  /**
   * Generate Google Wallet JWT for adding to Google Wallet
   */
  generateGooglePass: publicProcedure
    .input(
      z.object({
        contactData: z.object({
          name: z.string(),
          title: z.string(),
          email: z.string(),
          phone: z.string(),
          linkedin: z.string(),
          profileImage: z.string().optional(),
          website: z.string().optional(),
          bio: z.string().optional(),
          socialLinks: z
            .array(
              z.object({
                id: z.string(),
                platform: z.string(),
                url: z.string(),
              })
            )
            .optional(),
          cardStyle: z
            .object({
              headerColor: z.string(),
              buttonStyle: z.string(),
              frameStyle: z.string(),
              accentColor: z.string(),
            })
            .optional(),
        }),
        cardId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const jwt = await generateGoogleWalletJWT(
          input.contactData as ContactData,
          input.cardId
        );

        return {
          success: true,
          jwt,
          addToGoogleWalletUrl: `https://pay.google.com/gp/v/save/${jwt}`,
        };
      } catch (error) {
        console.error("Error generating Google Wallet JWT:", error);
        return {
          success: false,
          error: "Failed to generate Google Wallet JWT",
        };
      }
    }),

  /**
   * Generate vCard data for wallet integration
   */
  generateVCard: publicProcedure
    .input(
      z.object({
        contactData: z.object({
          name: z.string(),
          title: z.string(),
          email: z.string(),
          phone: z.string(),
          linkedin: z.string(),
          profileImage: z.string().optional(),
          website: z.string().optional(),
          bio: z.string().optional(),
          socialLinks: z
            .array(
              z.object({
                id: z.string(),
                platform: z.string(),
                url: z.string(),
              })
            )
            .optional(),
          cardStyle: z
            .object({
              headerColor: z.string(),
              buttonStyle: z.string(),
              frameStyle: z.string(),
              accentColor: z.string(),
            })
            .optional(),
        }),
      })
    )
    .query(({ input }) => {
      const vCardData = generateVCard(input.contactData as ContactData);
      return {
        success: true,
        vCardData,
        dataUrl: `data:text/vcard;charset=utf-8,${encodeURIComponent(vCardData)}`,
      };
    }),
});
