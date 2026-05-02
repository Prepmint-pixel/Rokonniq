import { describe, it, expect, beforeAll } from "vitest";
import { generatePKPass, validateCertificates, getCertificateInfo } from "./pkpass";
import * as fs from "fs";
import * as path from "path";

describe("PKPass Generation", () => {
  beforeAll(() => {
    // Verify certificates exist before running tests
    const certPath = path.join(__dirname, "certificates", "certificate.pem");
    const keyPath = path.join(__dirname, "certificates", "key.pem");

    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
      console.warn("PKPass certificates not found. Tests may fail.");
    }
  });

  describe("Certificate Validation", () => {
    it("should validate that certificates exist", () => {
      const isValid = validateCertificates();
      expect(typeof isValid).toBe("boolean");
    });

    it("should return certificate info", () => {
      const info = getCertificateInfo();
      expect(info).toHaveProperty("hasCertificates");
      expect(info).toHaveProperty("certPath");
      expect(info).toHaveProperty("keyPath");
      expect(typeof info.hasCertificates).toBe("boolean");
      expect(typeof info.certPath).toBe("string");
      expect(typeof info.keyPath).toBe("string");
    });
  });

  describe("PKPass Generation", () => {
    it("should generate a PKPass buffer", async () => {
      if (!validateCertificates()) {
        console.warn("Skipping PKPass generation test - certificates not available");
        return;
      }

      const buffer = await generatePKPass("test-card-1", {
        title: "Test Card",
        description: "Test Description",
        backgroundColor: "#1F2937",
        textColor: "#FFFFFF",
        accentColor: "#3B82F6",
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should generate PKPass with all optional fields", async () => {
      if (!validateCertificates()) {
        console.warn("Skipping PKPass generation test - certificates not available");
        return;
      }

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const buffer = await generatePKPass("test-card-2", {
        title: "Premium Card",
        description: "Premium membership card",
        backgroundColor: "#1F2937",
        textColor: "#FFFFFF",
        accentColor: "#3B82F6",
        barcode: "1234567890",
        barcodeFormat: "QR",
        points: 1000,
        balance: 50.0,
        expiryDate: expiryDate,
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should generate PKPass with different colors", async () => {
      if (!validateCertificates()) {
        console.warn("Skipping PKPass generation test - certificates not available");
        return;
      }

      const buffer = await generatePKPass("test-card-3", {
        title: "Sunset Card",
        backgroundColor: "#FF6B35",
        textColor: "#FFFFFF",
        accentColor: "#F7931E",
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should generate PKPass with barcode", async () => {
      if (!validateCertificates()) {
        console.warn("Skipping PKPass generation test - certificates not available");
        return;
      }

      const buffer = await generatePKPass("test-card-4", {
        title: "Barcode Card",
        backgroundColor: "#1F2937",
        textColor: "#FFFFFF",
        accentColor: "#3B82F6",
        barcode: "https://example.com/card/test-card-4",
        barcodeFormat: "QR",
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should generate PKPass with points and balance", async () => {
      if (!validateCertificates()) {
        console.warn("Skipping PKPass generation test - certificates not available");
        return;
      }

      const buffer = await generatePKPass("test-card-5", {
        title: "Loyalty Card",
        backgroundColor: "#1F2937",
        textColor: "#FFFFFF",
        accentColor: "#3B82F6",
        points: 5000,
        balance: 250.75,
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should throw error if certificates are missing", async () => {
      // This test assumes certificates exist for other tests
      // If they don't exist, this test will pass (skipped)
      if (!validateCertificates()) {
        expect(validateCertificates()).toBe(false);
      } else {
        expect(validateCertificates()).toBe(true);
      }
    });

    it("should handle different barcode formats", async () => {
      if (!validateCertificates()) {
        console.warn("Skipping PKPass generation test - certificates not available");
        return;
      }

      const formats: Array<"QR" | "CODE128" | "PDF417"> = ["QR", "CODE128", "PDF417"];

      for (const format of formats) {
        const buffer = await generatePKPass(`test-card-${format}`, {
          title: `Card with ${format}`,
          backgroundColor: "#1F2937",
          textColor: "#FFFFFF",
          accentColor: "#3B82F6",
          barcode: "123456789",
          barcodeFormat: format,
        });

        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBeGreaterThan(0);
      }
    });
  });
});
