import { beforeAll, afterAll, beforeEach } from 'vitest';
import { config } from 'dotenv';
import { db } from '../server/db';
import { templates, rsvps, guestPhotos } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Load test environment variables
config({ path: '.env' });

// Test database setup
beforeAll(async () => {
  console.log('🧪 Setting up test environment...');
  
  // Verify database connection
  try {
    await db.select().from(templates).limit(1);
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    // Don't throw in test environment
  }
});

beforeEach(async () => {
  // Clean up test data before each test
  console.log('🧹 Cleaning up test data...');
});

afterAll(async () => {
  console.log('🏁 Test cleanup completed');
});

// Test utilities
export const testUtils = {
  // Create a test template
  createTestTemplate: async (templateKey = 'pro', slug = 'test-template') => {
    const testConfig = {
      couple: {
        groomName: 'Test Groom',
        brideName: 'Test Bride',
        combinedNames: 'Test Groom & Test Bride'
      },
      wedding: {
        date: '2025-12-31T16:00:00',
        displayDate: 'December 31st, 2025',
        month: 'December',
        day: '31st'
      },
      hero: {
        invitation: 'You are invited to our test wedding',
        welcomeMessage: 'Test welcome message',
        musicButton: 'Play Music',
        playIcon: '▶️',
        pauseIcon: '⏸️'
      }
    };

    const [template] = await db.insert(templates).values({
      name: `Test Template - ${slug}`,
      slug,
      templateKey,
      config: testConfig,
      maintenance: false
    }).returning();

    return template;
  },

  // Clean up test template
  cleanupTestTemplate: async (templateId: string) => {
    await db.delete(rsvps).where(eq(rsvps.templateId, templateId));
    await db.delete(guestPhotos).where(eq(guestPhotos.templateId, templateId));
    await db.delete(templates).where(eq(templates.id, templateId));
  },

  // Create test RSVP
  createTestRSVP: (templateId: string) => ({
    templateId,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@test.com',
    guestEmail: 'john.doe@test.com',
    guestCount: '2',
    guestNames: 'John Doe, Jane Doe',
    attendance: 'attending' as const,
    attending: true,
    guests: 2
  })
};
