import express from 'express';
import { db } from '../db';
import { 
  managementUsers, 
  rsvps, 
  guestPhotos, 
  userAdminPanels, 
  googleDriveIntegrations, 
  activityLogs,
  templates,
  orders 
} from '@shared/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { authenticateUser, requireAdminPanelAccess, AuthenticatedRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import archiver from 'archiver';
import ExcelJS from 'exceljs';

const router = express.Router();

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'guest-photos');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get admin panel dashboard data
router.get('/:templateId/dashboard', authenticateUser, requireAdminPanelAccess, async (req: AuthenticatedRequest, res) => {
  try {
    const { templateId } = req.params;

    // Get RSVP statistics
    const rsvpStatsResult = await db
      .select({
        totalRsvps: count(),
        attendingCount: sql<number>`COUNT(CASE WHEN ${rsvps.attending} = true THEN 1 END)`,
        notAttendingCount: sql<number>`COUNT(CASE WHEN ${rsvps.attending} = false THEN 1 END)`,
        pendingCount: sql<number>`COUNT(CASE WHEN ${rsvps.attending} IS NULL THEN 1 END)`,
      })
      .from(rsvps)
      .where(eq(rsvps.templateId, templateId));

    const rsvpStats = rsvpStatsResult[0];

    // Get recent RSVPs
    const recentRsvps = await db
      .select({
        name: rsvps.name,
        guestEmail: rsvps.guestEmail,
        attending: rsvps.attending,
        submittedAt: rsvps.submittedAt,
        specialRequests: rsvps.specialRequests,
      })
      .from(rsvps)
      .where(eq(rsvps.templateId, templateId))
      .orderBy(desc(rsvps.submittedAt))
      .limit(10);

    // Get photo statistics
    const photoStatsResult = await db
      .select({
        totalPhotos: count(),
        approvedPhotos: sql<number>`COUNT(CASE WHEN ${guestPhotos.isApproved} = true THEN 1 END)`,
        pendingPhotos: sql<number>`COUNT(CASE WHEN ${guestPhotos.isApproved} = false THEN 1 END)`,
      })
      .from(guestPhotos)
      .where(eq(guestPhotos.templateId, templateId));

    const photoStats = photoStatsResult[0];

    // Get recent photos
    const recentPhotos = await db
      .select({
        id: guestPhotos.id,
        uploaderName: guestPhotos.uploaderName,
        photoUrl: guestPhotos.photoUrl,
        isApproved: guestPhotos.isApproved,
        createdAt: guestPhotos.createdAt,
      })
      .from(guestPhotos)
      .where(eq(guestPhotos.templateId, templateId))
      .orderBy(desc(guestPhotos.createdAt))
      .limit(6);

    // Get Google Drive integration status
    const driveIntegrationResult = await db
      .select({
        id: googleDriveIntegrations.id,
        folderId: googleDriveIntegrations.folderId,
        folderName: googleDriveIntegrations.folderName,
        folderUrl: googleDriveIntegrations.folderUrl,
        isActive: googleDriveIntegrations.isActive,
        googleDriveFolderId: userAdminPanels.googleDriveFolderId,
      })
      .from(googleDriveIntegrations)
      .innerJoin(userAdminPanels, eq(googleDriveIntegrations.userAdminPanelId, userAdminPanels.id))
      .where(
        and(
          eq(userAdminPanels.userId, req.user!.id),
          eq(userAdminPanels.templateId, templateId),
          eq(googleDriveIntegrations.isActive, true)
        )
      )
      .limit(1);

    const driveIntegration = driveIntegrationResult[0] || null;

    res.json({
      rsvpStats,
      recentRsvps,
      photoStats,
      recentPhotos,
      googleDriveConnected: !!driveIntegration,
      driveIntegration
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Get all RSVPs for a template with pagination and filtering
router.get('/:templateId/rsvps', authenticateUser, requireAdminPanelAccess, async (req: AuthenticatedRequest, res) => {
  try {
    const { templateId } = req.params;
    const { page = 1, limit = 50, search = '', status = 'all' } = req.query;

    // Build where conditions
    let whereConditions = [eq(rsvps.templateId, templateId)];

    if (search) {
      whereConditions.push(
        sql`(${rsvps.name} ILIKE ${`%${search}%`} OR ${rsvps.guestEmail} ILIKE ${`%${search}%`})`
      );
    }

    if (status !== 'all') {
      if (status === 'attending') {
        whereConditions.push(eq(rsvps.attending, true));
      } else if (status === 'not_attending') {
        whereConditions.push(eq(rsvps.attending, false));
      } else if (status === 'pending') {
        whereConditions.push(sql`${rsvps.attending} IS NULL`);
      }
    }

    const offset = (Number(page) - 1) * Number(limit);

    // Get RSVPs with pagination
    const rsvpResults = await db
      .select()
      .from(rsvps)
      .where(and(...whereConditions))
      .orderBy(desc(rsvps.submittedAt))
      .limit(Number(limit))
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: count() })
      .from(rsvps)
      .where(and(...whereConditions));

    const total = countResult[0].count;

    res.json({
      rsvps: rsvpResults,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Get RSVPs error:', error);
    res.status(500).json({ error: 'Failed to get RSVPs' });
  }
});

// Export RSVPs to Excel
router.get('/:templateId/rsvps/export', authenticateUser, requireAdminPanelAccess, async (req: AuthenticatedRequest, res) => {
  try {
    const { templateId } = req.params;
    const { format = 'excel' } = req.query;

    const rsvpResults = await db
      .select({
        name: rsvps.name,
        guestEmail: rsvps.guestEmail,
        guestPhone: rsvps.guestPhone,
        attending: rsvps.attending,
        guests: rsvps.guests,
        dietaryRestrictions: rsvps.dietaryRestrictions,
        plusOneName: rsvps.plusOneName,
        specialRequests: rsvps.specialRequests,
        submittedAt: rsvps.submittedAt,
      })
      .from(rsvps)
      .where(eq(rsvps.templateId, templateId))
      .orderBy(desc(rsvps.submittedAt));

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('RSVPs');

      // Add headers
      worksheet.addRow([
        'Name', 'Email', 'Phone', 'Attending', 'Guest Count', 
        'Dietary Restrictions', 'Plus One', 'Special Requests', 'Submitted At'
      ]);

      // Add data
      rsvpResults.forEach((rsvp: any) => {
        worksheet.addRow([
          rsvp.name,
          rsvp.guestEmail,
          rsvp.guestPhone,
          rsvp.attending ? 'Yes' : rsvp.attending === false ? 'No' : 'Pending',
          rsvp.guests,
          rsvp.dietaryRestrictions,
          rsvp.plusOneName,
          rsvp.specialRequests,
          rsvp.submittedAt
        ]);
      });

      // Style headers
      worksheet.getRow(1).font = { bold: true };
      worksheet.columns.forEach(column => {
        column.width = 15;
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=rsvps-${Date.now()}.xlsx`);

      await workbook.xlsx.write(res);
      res.end();
    } else {
      // CSV format
      const csvHeader = 'Name,Email,Phone,Attending,Guest Count,Dietary Restrictions,Plus One,Special Requests,Submitted At\n';
      const csvData = rsvpResults.map((rsvp: any) => 
        `"${rsvp.name}","${rsvp.guestEmail || ''}","${rsvp.guestPhone || ''}","${rsvp.attending ? 'Yes' : rsvp.attending === false ? 'No' : 'Pending'}","${rsvp.guests}","${rsvp.dietaryRestrictions || ''}","${rsvp.plusOneName || ''}","${rsvp.specialRequests || ''}","${rsvp.submittedAt}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=rsvps-${Date.now()}.csv`);
      res.send(csvHeader + csvData);
    }
  } catch (error) {
    console.error('Export RSVPs error:', error);
    res.status(500).json({ error: 'Failed to export RSVPs' });
  }
});

// Get guest photos
router.get('/:templateId/photos', authenticateUser, requireAdminPanelAccess, async (req: AuthenticatedRequest, res) => {
  try {
    const { templateId } = req.params;
    const { page = 1, limit = 20, status = 'all' } = req.query;

    // Build where conditions
    let whereConditions = [eq(guestPhotos.templateId, templateId)];

    if (status === 'approved') {
      whereConditions.push(eq(guestPhotos.isApproved, true));
    } else if (status === 'pending') {
      whereConditions.push(eq(guestPhotos.isApproved, false));
    }

    const offset = (Number(page) - 1) * Number(limit);

    const photoResults = await db
      .select()
      .from(guestPhotos)
      .where(and(...whereConditions))
      .orderBy(desc(guestPhotos.createdAt))
      .limit(Number(limit))
      .offset(offset);

    const countResult = await db
      .select({ count: count() })
      .from(guestPhotos)
      .where(and(...whereConditions));

    const total = countResult[0].count;

    res.json({
      photos: photoResults,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ error: 'Failed to get photos' });
  }
});

// Approve/reject guest photo
router.put('/:templateId/photos/:photoId', authenticateUser, requireAdminPanelAccess, async (req: AuthenticatedRequest, res) => {
  try {
    const { templateId, photoId } = req.params;
    const { isApproved, isFeatured } = req.body;

    await db
      .update(guestPhotos)
      .set({
        isApproved,
        isFeatured: isFeatured || false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(guestPhotos.id, photoId),
          eq(guestPhotos.templateId, templateId)
        )
      );

    // Log activity
    await db
      .insert(activityLogs)
      .values({
        userId: req.user!.id,
        templateId,
        action: isApproved ? 'approve_photo' : 'reject_photo',
        entityType: 'guest_photo',
        entityId: photoId,
        details: { isApproved, isFeatured },
      });

    res.json({ message: 'Photo status updated successfully' });
  } catch (error) {
    console.error('Update photo status error:', error);
    res.status(500).json({ error: 'Failed to update photo status' });
  }
});

// Delete guest photo
router.delete('/:templateId/photos/:photoId', authenticateUser, requireAdminPanelAccess, async (req: AuthenticatedRequest, res) => {
  try {
    const { templateId, photoId } = req.params;

    // Get photo info before deletion
    const photoResult = await db
      .select({ photoUrl: guestPhotos.photoUrl })
      .from(guestPhotos)
      .where(
        and(
          eq(guestPhotos.id, photoId),
          eq(guestPhotos.templateId, templateId)
        )
      )
      .limit(1);

    if (photoResult.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const photo = photoResult[0];

    // Delete from database
    await db
      .delete(guestPhotos)
      .where(
        and(
          eq(guestPhotos.id, photoId),
          eq(guestPhotos.templateId, templateId)
        )
      );

    // Try to delete file from filesystem
    try {
      const filePath = path.join(process.cwd(), photo.photoUrl);
      await fs.unlink(filePath);
    } catch (fileError) {
      console.error('Failed to delete photo file:', fileError);
      // Don't fail the request if file deletion fails
    }

    // Log activity
    await db
      .insert(activityLogs)
      .values({
        userId: req.user!.id,
        templateId,
        action: 'delete_photo',
        entityType: 'guest_photo',
        entityId: photoId,
        details: { photoUrl: photo.photoUrl },
      });

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// Configure Google Drive integration
router.post('/:templateId/google-drive/configure', authenticateUser, requireAdminPanelAccess, async (req: AuthenticatedRequest, res) => {
  try {
    const { templateId } = req.params;
    const { folderName, accessType, specialGuestEmails } = req.body;

    if (!folderName) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    // TODO: Implement actual Google Drive API integration
    // For now, create a mock folder ID and URL
    const mockFolderId = 'gdrive_' + Date.now();
    const mockFolderUrl = `https://drive.google.com/drive/folders/${mockFolderId}`;

    // Get admin panel ID
    const adminPanelResult = await db
      .select({ id: userAdminPanels.id })
      .from(userAdminPanels)
      .where(
        and(
          eq(userAdminPanels.userId, req.user!.id),
          eq(userAdminPanels.templateId, templateId)
        )
      )
      .limit(1);

    if (adminPanelResult.length === 0) {
      return res.status(404).json({ error: 'Admin panel not found' });
    }

    const adminPanelId = adminPanelResult[0].id;

    // Check if integration already exists
    const existingIntegration = await db
      .select({ id: googleDriveIntegrations.id })
      .from(googleDriveIntegrations)
      .where(
        and(
          eq(googleDriveIntegrations.userAdminPanelId, adminPanelId),
          eq(googleDriveIntegrations.isActive, true)
        )
      )
      .limit(1);

    if (existingIntegration.length > 0) {
      // Update existing integration
      await db
        .update(googleDriveIntegrations)
        .set({
          folderName,
          folderUrl: mockFolderUrl,
          accessType,
          specialGuestEmails: JSON.stringify(specialGuestEmails || []),
          updatedAt: new Date(),
        })
        .where(eq(googleDriveIntegrations.userAdminPanelId, adminPanelId));
    } else {
      // Create new integration
      await db
        .insert(googleDriveIntegrations)
        .values({
          userAdminPanelId: adminPanelId,
          folderId: mockFolderId,
          folderName,
          folderUrl: mockFolderUrl,
          accessType,
          specialGuestEmails: JSON.stringify(specialGuestEmails || []),
        });
    }

    // Update admin panel with folder ID
    await db
      .update(userAdminPanels)
      .set({ googleDriveFolderId: mockFolderId })
      .where(eq(userAdminPanels.id, adminPanelId));

    res.json({
      message: 'Google Drive integration configured successfully',
      folderId: mockFolderId,
      folderUrl: mockFolderUrl
    });
  } catch (error) {
    console.error('Google Drive configuration error:', error);
    res.status(500).json({ error: 'Failed to configure Google Drive integration' });
  }
});

// Get activity logs
router.get('/:templateId/activity', authenticateUser, requireAdminPanelAccess, async (req: AuthenticatedRequest, res) => {
  try {
    const { templateId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const activityResult = await db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        entityType: activityLogs.entityType,
        entityId: activityLogs.entityId,
        details: activityLogs.details,
        createdAt: activityLogs.createdAt,
        firstName: managementUsers.firstName,
        lastName: managementUsers.lastName,
        email: managementUsers.email,
      })
      .from(activityLogs)
      .innerJoin(managementUsers, eq(activityLogs.userId, managementUsers.id))
      .where(eq(activityLogs.templateId, templateId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(Number(limit))
      .offset(offset);

    const countResult = await db
      .select({ count: count() })
      .from(activityLogs)
      .where(eq(activityLogs.templateId, templateId));

    const total = countResult[0].count;

    res.json({
      activities: activityResult,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ error: 'Failed to get activity logs' });
  }
});

export default router;
