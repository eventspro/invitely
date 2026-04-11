-- Seed default social media links into platform_settings
INSERT INTO platform_settings (key, value, description)
VALUES (
  'social_links',
  '{"instagram": "https://www.instagram.com/weddingsites_am", "telegram": "https://t.me/weddingsites_am", "facebook": "https://www.facebook.com/weddingsites.am"}'::jsonb,
  'Social media links displayed on the homepage contact section'
)
ON CONFLICT (key) DO NOTHING;
