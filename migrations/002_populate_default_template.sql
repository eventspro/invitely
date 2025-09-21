-- Create the default template with the existing wedding configuration
INSERT INTO templates (
    id,
    name,
    description,
    template_type,
    slug,
    config,
    is_active,
    created_at,
    updated_at
) VALUES (
    'default-harut-tatev',
    'Harut & Tatev Wedding',
    'The original wedding site template',
    'Pro',
    'harut-tatev',
    '{
        "coupleInfo": {
            "bride": {
                "name": "Tatev",
                "fullName": "Tatev Hakobyan"
            },
            "groom": {
                "name": "Harut",
                "fullName": "Harut Hakobyan"
            }
        },
        "sections": {
            "hero": { "enabled": true },
            "countdown": { "enabled": true },
            "calendar": { "enabled": true },
            "locations": { "enabled": true },
            "timeline": { "enabled": true },
            "rsvp": { "enabled": true },
            "photos": { "enabled": true }
        },
        "theme": {
            "colors": {
                "primary": "var(--soft-gold)",
                "secondary": "var(--sage-green)", 
                "accent": "var(--charcoal)",
                "background": "var(--cream)"
            },
            "fonts": {
                "heading": "Playfair Display, serif",
                "body": "Inter, sans-serif"
            }
        }
    }',
    true,
    NOW(),
    NOW()
);

-- Update the existing RSVPs table to reference the default template
UPDATE rsvps SET template_id = 'default-harut-tatev' WHERE template_id IS NULL;
