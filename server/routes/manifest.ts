import express from 'express';
import { db } from '../db.js';
import { templates } from '@shared/schema';
import { eq } from 'drizzle-orm';
import type { WeddingConfig } from '../../client/src/templates/types';

export function registerManifestRoutes(app: express.Application) {
  // Dynamic manifest.json generation based on template
  app.get('/api/manifest/:templateIdOrSlug', async (req, res) => {
    try {
      const identifier = req.params.templateIdOrSlug;
      
      // Try to find template by ID or slug
      const template = await db.query.templates.findFirst({
        where: (templates, { or }) => or(
          eq(templates.id, identifier),
          eq(templates.slug, identifier)
        ),
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      const config = template.config as WeddingConfig;
      const photoSharing = config.photoSharing || {
        pageTitle: config.couple?.combinedNames || 'Wedding Photos',
        pageSubtitle: 'Wedding Photos 📸',
        welcomeCard: {
          title: config.couple?.combinedNames || 'Wedding',
          subtitle: 'Wedding Photos 📸',
          description: 'Share your beautiful memories from our special day',
          nameLabel: 'Your Name',
          namePlaceholder: 'Enter your name',
          submitButton: 'Start Sharing Photos',
        },
      };

      // Generate dynamic manifest
      const manifest = {
        name: `${photoSharing.pageTitle} - ${photoSharing.pageSubtitle}`,
        short_name: photoSharing.pageSubtitle || 'Wedding Photos',
        description: photoSharing.welcomeCard.description || `Share your beautiful memories from ${config.couple?.groomName} & ${config.couple?.brideName}'s wedding day`,
        start_url: `/photos?template=${template.id}`,
        display: 'standalone',
        background_color: config.theme?.colors?.background || '#F8F6F1',
        theme_color: config.theme?.colors?.primary || '#DAA520',
        orientation: 'portrait',
        scope: '/',
        lang: 'hy',
        categories: ['photo', 'social'],
        icons: [
          {
            src: '/favicon.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/favicon.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        screenshots: [
          {
            src: '/favicon.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
          },
          {
            src: '/favicon.png',
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow',
          },
        ],
      };

      res.setHeader('Content-Type', 'application/manifest+json');
      res.json(manifest);
    } catch (error) {
      console.error('Error generating manifest:', error);
      res.status(500).json({ error: 'Failed to generate manifest' });
    }
  });
}
