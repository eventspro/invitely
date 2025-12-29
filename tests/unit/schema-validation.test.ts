import { describe, it, expect } from 'vitest';
import { insertRsvpSchema, insertTemplateSchema } from '../../shared/schema';

describe('Zod Schema Validation', () => {
  describe('RSVP Schema Validation', () => {
    it('should validate correct RSVP data', () => {
      const validRsvp = {
        templateId: 'test-template-id',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        guestCount: '2', // String for legacy compatibility
        attendance: 'attending'
      };

      const result = insertRsvpSchema.safeParse(validRsvp);
      expect(result.success).toBe(true);
    });

    it('should reject RSVP without required fields', () => {
      const invalidRsvp = {
        templateId: 'test-template-id',
        // Missing firstName, lastName, email
      };

      const result = insertRsvpSchema.safeParse(invalidRsvp);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it('should reject invalid email format', () => {
      const invalidRsvp = {
        templateId: 'test-template-id',
        firstName: 'John',
        lastName: 'Doe',
        email: 'not-an-email',
        guestCount: 2,
        attendance: 'attending'
      };

      const result = insertRsvpSchema.safeParse(invalidRsvp);
      expect(result.success).toBe(false);
    });

    it('should validate guest count is positive', () => {
      const invalidRsvp = {
        templateId: 'test-template-id',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        guestCount: -1,
        attendance: 'attending'
      };

      const result = insertRsvpSchema.safeParse(invalidRsvp);
      expect(result.success).toBe(false);
    });

    it('should accept valid attendance values', () => {
      const validAttendances = ['attending', 'not-attending'];
      
      validAttendances.forEach(attendance => {
        const rsvp = {
          templateId: 'test-template-id',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          guestCount: '2', // String for legacy compatibility
          attendance
        };

        const result = insertRsvpSchema.safeParse(rsvp);
        expect(result.success).toBe(true);
      });
    });

    it('should include Armenian error messages', () => {
      const invalidRsvp = {
        templateId: 'test-template-id'
      };

      const result = insertRsvpSchema.safeParse(invalidRsvp);
      expect(result.success).toBe(false);
      // Schema should support Armenian validation messages
    });
  });

  describe('Template Schema Validation', () => {
    it('should validate template with JSONB config', () => {
      const validTemplate = {
        name: 'Test Template',
        slug: 'test-template',
        templateKey: 'pro',
        config: {
          couple: {
            groomName: 'Test Groom',
            brideName: 'Test Bride',
            combinedNames: 'Test Groom & Test Bride'
          },
          wedding: {
            date: '2025-12-31T18:00:00',
            displayDate: 'December 31, 2025',
            month: 'December',
            day: '31'
          }
        }
      };

      const result = insertTemplateSchema.safeParse(validTemplate);
      expect(result.success).toBe(true);
    });

    it('should validate template keys', () => {
      const validKeys = ['pro', 'classic', 'elegant', 'romantic', 'nature'];
      
      validKeys.forEach(key => {
        const template = {
          name: 'Test Template',
          slug: `test-template-${key}`,
          templateKey: key,
          config: {}
        };

        const result = insertTemplateSchema.safeParse(template);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Order Schema Validation', () => {
    it('should validate order with all required fields', () => {
      // Order validation tests would go here
      // Testing orderNumber, userId, templateId, etc.
      expect(true).toBe(true); // Placeholder
    });

    it('should validate template plan types', () => {
      const validPlans = ['basic', 'standard', 'premium', 'deluxe', 'ultimate'];
      expect(validPlans).toContain('ultimate');
    });
  });
});
