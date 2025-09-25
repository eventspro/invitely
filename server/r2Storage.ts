// Cloudflare R2 Storage Service
// Provides persistent image storage for production using Cloudflare R2

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

export class CloudflareR2Storage {
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    const accessKey = process.env.CLOUDFLARE_R2_ACCESS_KEY;
    const secretKey = process.env.CLOUDFLARE_R2_SECRET_KEY;
    this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || '';
    this.publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || '';

    if (!accountId || !accessKey || !secretKey || !this.bucketName || !this.publicUrl) {
      console.warn('⚠️ Cloudflare R2 configuration missing. Image uploads will use local storage only.');
      return;
    }

    // Initialize S3 client for R2 (R2 is S3-compatible)
    this.s3Client = new S3Client({
      region: 'auto', // R2 uses 'auto' region
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });

    console.log('✅ Cloudflare R2 storage initialized');
  }

  /**
   * Upload an image to R2 storage
   */
  async uploadImage(
    templateId: string, 
    file: Buffer, 
    originalFilename: string, 
    mimetype: string,
    category: string = 'gallery'
  ): Promise<{ url: string; filename: string }> {
    if (!this.s3Client) {
      throw new Error('R2 storage not initialized');
    }

    // Generate unique filename
    const ext = originalFilename.split('.').pop() || 'jpg';
    const uniqueFilename = `${templateId}-${category}-${Date.now()}-${randomUUID()}.${ext}`;
    const key = `templates/${templateId}/${category}/${uniqueFilename}`;

    try {
      // Upload to R2
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: mimetype,
        Metadata: {
          templateId,
          category,
          originalFilename,
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      // Return public URL
      const publicUrl = `${this.publicUrl}/${key}`;
      
      console.log(`📸 Image uploaded to R2: ${uniqueFilename}`);
      return {
        url: publicUrl,
        filename: uniqueFilename,
      };
    } catch (error) {
      console.error('❌ R2 upload error:', error);
      throw new Error(`Failed to upload image to R2: ${error}`);
    }
  }

  /**
   * Delete an image from R2 storage
   */
  async deleteImage(templateId: string, filename: string, category: string = 'gallery'): Promise<void> {
    if (!this.s3Client) {
      throw new Error('R2 storage not initialized');
    }

    const key = `templates/${templateId}/${category}/${filename}`;

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      console.log(`🗑️ Image deleted from R2: ${filename}`);
    } catch (error) {
      console.error('❌ R2 delete error:', error);
      throw new Error(`Failed to delete image from R2: ${error}`);
    }
  }

  /**
   * Generate a presigned URL for direct upload (for client-side uploads)
   */
  async getPresignedUploadUrl(
    templateId: string, 
    filename: string, 
    mimetype: string,
    category: string = 'gallery'
  ): Promise<{ url: string; fields: any }> {
    if (!this.s3Client) {
      throw new Error('R2 storage not initialized');
    }

    const key = `templates/${templateId}/${category}/${filename}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: mimetype,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, { 
        expiresIn: 3600 // 1 hour
      });

      return {
        url: presignedUrl,
        fields: {
          key,
          'Content-Type': mimetype,
        },
      };
    } catch (error) {
      console.error('❌ R2 presigned URL error:', error);
      throw new Error(`Failed to generate presigned URL: ${error}`);
    }
  }

  /**
   * Check if R2 is properly configured
   */
  isConfigured(): boolean {
    return !!this.s3Client;
  }

  /**
   * Get public URL for an image
   */
  getPublicUrl(templateId: string, filename: string, category: string = 'gallery'): string {
    const key = `templates/${templateId}/${category}/${filename}`;
    return `${this.publicUrl}/${key}`;
  }
}

// Singleton instance
export const r2Storage = new CloudflareR2Storage();