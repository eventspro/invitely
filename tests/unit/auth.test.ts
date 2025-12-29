import { describe, it, expect, beforeEach } from 'vitest';
import { hashPassword, comparePassword, generateToken, verifyToken, generateSecureToken } from '../../server/middleware/auth';

describe('Authentication Utilities', () => {
  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123!';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'testPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should verify correct password', async () => {
      const password = 'testPassword123!';
      const hash = await hashPassword(password);
      const isValid = await comparePassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123!';
      const wrongPassword = 'wrongPassword456!';
      const hash = await hashPassword(password);
      const isValid = await comparePassword(wrongPassword, hash);
      
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token Generation and Verification', () => {
    it('should generate a valid JWT token', () => {
      const userId = 'test-user-id';
      const email = 'test@example.com';
      const token = generateToken(userId, email);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include user data in token payload', () => {
      const userId = 'test-user-id';
      const email = 'test@example.com';
      const token = generateToken(userId, email);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(userId);
      expect(decoded.email).toBe(email);
    });

    it('should include additional payload in token', () => {
      const userId = 'test-user-id';
      const email = 'test@example.com';
      const additionalData = { role: 'admin', templateId: '123' };
      const token = generateToken(userId, email, additionalData);
      const decoded = verifyToken(token);
      
      expect(decoded.role).toBe('admin');
      expect(decoded.templateId).toBe('123');
    });

    it('should reject invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = verifyToken(invalidToken);
      
      expect(decoded).toBeNull();
    });

    it('should reject tampered token', () => {
      const userId = 'test-user-id';
      const email = 'test@example.com';
      const token = generateToken(userId, email);
      const tamperedToken = token.slice(0, -10) + 'tampered';
      const decoded = verifyToken(tamperedToken);
      
      expect(decoded).toBeNull();
    });
  });

  describe('Secure Token Generation', () => {
    it('should generate a secure random token', () => {
      const token = generateSecureToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(20);
    });

    it('should generate unique tokens', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      const token3 = generateSecureToken();
      
      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });
  });
});
