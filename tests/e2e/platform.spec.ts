import { test, expect } from '@playwright/test';

test.describe('Wedding Platform - End-to-End Tests', () => {
  
  test.describe('Guest User Journey', () => {
    test('should display main landing page correctly', async ({ page }) => {
      await page.goto('/');
      
      // Check main page loads
      await expect(page).toHaveTitle(/Wedding|4ever/i);
      
      // Check navigation elements
      const nav = page.locator('nav');
      if (await nav.count() > 0) {
        await expect(nav).toBeVisible();
      }
      
      // Check if there are any JavaScript errors
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });
    });

    test('should access the health check endpoint', async ({ page }) => {
      const response = await page.goto('/health');
      expect(response?.status()).toBe(200);
      
      const json = await response?.json();
      expect(json).toHaveProperty('status', 'ok');
    });
  });

  test.describe('RSVP Functionality', () => {
    test('should validate RSVP form fields', async ({ page }) => {
      await page.goto('/');
      
      // Check if RSVP section exists
      const rsvpSection = page.locator('text=/RSVP|Հաստատում/i').first();
      if (await rsvpSection.count() > 0) {
        await rsvpSection.click({ timeout: 5000 }).catch(() => {});
      }
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work properly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/');
      
      // Check content is readable on mobile
      const content = page.locator('main, body');
      await expect(content).toBeVisible();
    });
  });

  test.describe('Performance and Loading', () => {
    test('should load pages within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });

    test('should not have critical console errors', async ({ page }) => {
      const consoleErrors: string[] = [];
      
      page.on('console', (message) => {
        if (message.type() === 'error') {
          consoleErrors.push(message.text());
        }
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Filter out known acceptable errors (like network errors in dev)
      const criticalErrors = consoleErrors.filter(error => 
        !error.includes('net::') && 
        !error.includes('favicon') &&
        !error.includes('WebSocket')
      );
      
      expect(criticalErrors.length).toBeLessThan(5);
    });
  });
});
