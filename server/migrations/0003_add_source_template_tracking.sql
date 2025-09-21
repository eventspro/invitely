-- Add sourceTemplateId field to track cloned templates
ALTER TABLE templates ADD COLUMN source_template_id VARCHAR REFERENCES templates(id);

-- Add index for better performance
CREATE INDEX idx_templates_source_template_id ON templates(source_template_id);

-- Add isMain field to identify main templates vs clones
ALTER TABLE templates ADD COLUMN is_main BOOLEAN DEFAULT false;

-- Update existing templates to be marked as main templates
UPDATE templates SET is_main = true WHERE source_template_id IS NULL;
