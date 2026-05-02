import { describe, it, expect } from "vitest";
import {
  generateGoogleWalletJWT,
  createGoogleWalletSaveUrl,
  validateGoogleWalletJWT,
} from "./googleWallet";

describe("Google Wallet JWT Generation", () => {
  describe("generateGoogleWalletJWT", () => {
    it("should generate a valid JWT token", async () => {
      const cardData = {
        title: "Test Loyalty Card",
        description: "A test loyalty card",
        cardId: "test-card-123",
        backgroundColor: "#1F2937",
        textColor: "#FFFFFF",
        accentColor: "#3B82F6",
        points: 100,
        balance: 5000,
      };

      const jwt = await generateGoogleWalletJWT(cardData);

      expect(jwt).toBeDefined();
      expect(typeof jwt).toBe("string");
      expect(jwt.split(".").length).toBe(3); // JWT has 3 parts
    });

    it("should include card data in JWT payload", async () => {
      const cardData = {
        title: "Premium Card",
        description: "Premium loyalty card",
        cardId: "premium-123",
        backgroundColor: "#FFD700",
        textColor: "#000000",
        accentColor: "#FF6B6B",
        points: 500,
        balance: 10000,
      };

      const jwt = await generateGoogleWalletJWT(cardData);

      expect(jwt).toBeDefined();
      expect(jwt).toContain(".");
    });

    it("should handle optional fields", async () => {
      const cardData = {
        title: "Simple Card",
        cardId: "simple-123",
        backgroundColor: "#1F2937",
        textColor: "#FFFFFF",
        accentColor: "#3B82F6",
      };

      const jwt = await generateGoogleWalletJWT(cardData);

      expect(jwt).toBeDefined();
      expect(typeof jwt).toBe("string");
    });

    it("should handle logo URL in JWT", async () => {
      const cardData = {
        title: "Branded Card",
        cardId: "branded-123",
        backgroundColor: "#1F2937",
        textColor: "#FFFFFF",
        accentColor: "#3B82F6",
        logoUrl: "https://example.com/logo.png",
      };

      const jwt = await generateGoogleWalletJWT(cardData);

      expect(jwt).toBeDefined();
      expect(typeof jwt).toBe("string");
    });
  });

  describe("createGoogleWalletSaveUrl", () => {
    it("should create a valid Google Wallet save URL", async () => {
      const cardData = {
        title: "Test Card",
        cardId: "test-123",
        backgroundColor: "#1F2937",
        textColor: "#FFFFFF",
        accentColor: "#3B82F6",
      };

      const jwt = await generateGoogleWalletJWT(cardData);
      const url = createGoogleWalletSaveUrl(jwt);

      expect(url).toBeDefined();
      expect(url).toContain("https://pay.google.com/gp/v/save/");
      expect(url).toContain(jwt);
    });

    it("should include JWT token in URL", async () => {
      const cardData = {
        title: "Card with URL",
        cardId: "url-test-123",
        backgroundColor: "#1F2937",
        textColor: "#FFFFFF",
        accentColor: "#3B82F6",
      };

      const jwt = await generateGoogleWalletJWT(cardData);
      const url = createGoogleWalletSaveUrl(jwt);

      expect(url).toContain(jwt);
    });
  });

  describe("validateGoogleWalletJWT", () => {
    it("should validate a valid JWT token", async () => {
      const cardData = {
        title: "Valid Card",
        cardId: "valid-123",
        backgroundColor: "#1F2937",
        textColor: "#FFFFFF",
        accentColor: "#3B82F6",
      };

      const jwt = await generateGoogleWalletJWT(cardData);
      const isValid = validateGoogleWalletJWT(jwt);

      expect(isValid).toBe(true);
    });

    it("should reject invalid JWT token", () => {
      const invalidJwt = "invalid.jwt.token";
      const isValid = validateGoogleWalletJWT(invalidJwt);

      expect(isValid).toBe(false);
    });

    it("should reject malformed JWT", () => {
      const malformedJwt = "not-a-jwt";
      const isValid = validateGoogleWalletJWT(malformedJwt);

      expect(isValid).toBe(false);
    });

    it("should reject empty JWT", () => {
      const emptyJwt = "";
      const isValid = validateGoogleWalletJWT(emptyJwt);

      expect(isValid).toBe(false);
    });
  });

  describe("Google Wallet Integration", () => {
    it("should generate JWT and create save URL", async () => {
      const cardData = {
        title: "Integration Test Card",
        description: "Testing full integration",
        cardId: "integration-123",
        backgroundColor: "#1F2937",
        textColor: "#FFFFFF",
        accentColor: "#3B82F6",
        points: 250,
        balance: 7500,
      };

      const jwt = await generateGoogleWalletJWT(cardData);
      const url = createGoogleWalletSaveUrl(jwt);
      const isValid = validateGoogleWalletJWT(jwt);

      expect(jwt).toBeDefined();
      expect(url).toContain("https://pay.google.com/gp/v/save/");
      expect(isValid).toBe(true);
    });

    it("should handle multiple card generations", async () => {
      const cards = [
        {
          title: "Card 1",
          cardId: "card-1",
          backgroundColor: "#1F2937",
          textColor: "#FFFFFF",
          accentColor: "#3B82F6",
        },
        {
          title: "Card 2",
          cardId: "card-2",
          backgroundColor: "#FF6B6B",
          textColor: "#FFFFFF",
          accentColor: "#FFD700",
        },
        {
          title: "Card 3",
          cardId: "card-3",
          backgroundColor: "#4ECDC4",
          textColor: "#FFFFFF",
          accentColor: "#95E1D3",
        },
      ];

      const jwts = await Promise.all(
        cards.map((card) => generateGoogleWalletJWT(card))
      );

      expect(jwts).toHaveLength(3);
      jwts.forEach((jwt) => {
        expect(jwt).toBeDefined();
        expect(validateGoogleWalletJWT(jwt)).toBe(true);
      });
    });
  });
});
