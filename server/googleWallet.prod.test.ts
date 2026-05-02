import { describe, it, expect } from "vitest";
import { generateGoogleWalletJWT, validateGoogleWalletJWT, createGoogleWalletSaveUrl } from "./googleWallet";
import jwt from "jsonwebtoken";

describe("Google Wallet Production Credentials", () => {
  it("should generate JWT with production credentials from environment", async () => {
    const cardData = {
      title: "Test Loyalty Card",
      description: "Production credential test",
      cardId: "test-prod-123",
      backgroundColor: "#1F2937",
      textColor: "#FFFFFF",
      accentColor: "#3B82F6",
      points: 100,
      balance: 50,
    };

    const token = await generateGoogleWalletJWT(cardData);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);
  });

  it("should use RS256 algorithm when production credentials are available", async () => {
    const cardData = {
      title: "Test Card",
      cardId: "test-rs256",
      backgroundColor: "#000000",
      textColor: "#FFFFFF",
    };

    const token = await generateGoogleWalletJWT(cardData);
    const decoded = jwt.decode(token, { complete: true });
    expect(decoded?.header.alg).toBe("RS256");
  });

  it("should create valid Google Wallet save URL from JWT", async () => {
    const cardData = {
      title: "Test Card",
      cardId: "test-url",
    };

    const token = await generateGoogleWalletJWT(cardData);
    const url = createGoogleWalletSaveUrl(token);
    
    expect(url).toContain("https://pay.google.com/gp/v/save/");
    expect(url).toContain(token);
  });

  it("should validate JWT with production credentials", async () => {
    const cardData = {
      title: "Test Card",
      cardId: "test-validate",
    };

    const token = await generateGoogleWalletJWT(cardData);
    const isValid = validateGoogleWalletJWT(token);
    
    expect(isValid).toBe(true);
  });

  it("should include correct issuer in JWT payload", async () => {
    const cardData = {
      title: "Test Card",
      cardId: "test-issuer",
    };

    const token = await generateGoogleWalletJWT(cardData);
    const decoded = jwt.decode(token) as any;
    
    expect(decoded.iss).toBe("google-wallet-service@western-lambda-460900-r2.iam.gserviceaccount.com");
  });

  it("should handle card data with custom colors and points", async () => {
    const cardData = {
      title: "Premium Card",
      description: "VIP Loyalty Card",
      cardId: "premium-123",
      backgroundColor: "#FF6B6B",
      textColor: "#FFFFFF",
      accentColor: "#FFA500",
      points: 500,
      balance: 250,
      logoUrl: "https://example.com/logo.png",
    };

    const token = await generateGoogleWalletJWT(cardData);
    const decoded = jwt.decode(token) as any;
    
    expect(decoded.payload.genericObjects).toBeDefined();
    expect(decoded.payload.genericObjects.length).toBeGreaterThan(0);
    expect(decoded.payload.genericObjects[0].genericClass.cardTitle.defaultValue.value).toBe("Premium Card");
  });
});
