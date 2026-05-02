import { describe, it, expect } from "vitest";
import {
  getPKPassIcons,
  validateIconFiles,
  getIconFileInfo,
} from "./pkpassIcons";

describe("PKPass Icon Management", () => {
  describe("Icon Files", () => {
    it("should validate icon files exist", () => {
      const exist = validateIconFiles();
      expect(typeof exist).toBe("boolean");
    });

    it("should get icon file info", () => {
      const info = getIconFileInfo();
      expect(info).toHaveProperty("exist");
      expect(info).toHaveProperty("sizes");
      expect(typeof info.exist).toBe("boolean");
      expect(typeof info.sizes).toBe("object");
    });
  });

  describe("Icon Loading", () => {
    it("should load local PNG icons", async () => {
      const icons = await getPKPassIcons();

      expect(icons).toHaveProperty("icon");
      expect(icons).toHaveProperty("icon@2x");
      expect(icons).toHaveProperty("icon@3x");
    });

    it("should return icon buffers", async () => {
      const icons = await getPKPassIcons();

      expect(icons.icon).toBeInstanceOf(Buffer);
      expect(icons["icon@2x"]).toBeInstanceOf(Buffer);
      expect(icons["icon@3x"]).toBeInstanceOf(Buffer);
    });

    it("should have non-empty icon buffers", async () => {
      const icons = await getPKPassIcons();

      expect(icons.icon.length).toBeGreaterThan(0);
      expect(icons["icon@2x"].length).toBeGreaterThan(0);
      expect(icons["icon@3x"].length).toBeGreaterThan(0);
    });

    it("should load same icons on subsequent calls", async () => {
      // First call loads icons
      const icons1 = await getPKPassIcons();

      // Second call should load same icons
      const icons2 = await getPKPassIcons();

      // Both should have the same content
      expect(icons1.icon.toString()).toBe(icons2.icon.toString());
      expect(icons1["icon@2x"].toString()).toBe(icons2["icon@2x"].toString());
      expect(icons1["icon@3x"].toString()).toBe(icons2["icon@3x"].toString());
    });

    it("should have icon files available", () => {
      const info = getIconFileInfo();
      expect(info.exist).toBe(true);
      expect(Object.keys(info.sizes).length).toBeGreaterThan(0);
    });
  });

  describe("Icon Buffer Properties", () => {
    it("should have PNG file signatures", async () => {
      const icons = await getPKPassIcons();

      // PNG files start with: 89 50 4E 47
      const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

      expect(icons.icon.slice(0, 4)).toEqual(pngSignature);
      expect(icons["icon@2x"].slice(0, 4)).toEqual(pngSignature);
      expect(icons["icon@3x"].slice(0, 4)).toEqual(pngSignature);
    });

    it("should have reasonable icon sizes", async () => {
      const icons = await getPKPassIcons();

      // PNG icons should be at least 1KB
      expect(icons.icon.length).toBeGreaterThan(1024);
      expect(icons["icon@2x"].length).toBeGreaterThan(1024);
      expect(icons["icon@3x"].length).toBeGreaterThan(1024);

      // But not too large (less than 10MB)
      expect(icons.icon.length).toBeLessThan(10 * 1024 * 1024);
      expect(icons["icon@2x"].length).toBeLessThan(10 * 1024 * 1024);
      expect(icons["icon@3x"].length).toBeLessThan(10 * 1024 * 1024);
    });
  });
});
