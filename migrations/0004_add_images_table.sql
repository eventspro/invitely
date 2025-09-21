-- Add images table for enhanced image management
CREATE TABLE IF NOT EXISTS "images" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" varchar NOT NULL,
	"url" text NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'gallery',
	"size" text,
	"mime_type" text,
	"order" text DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Add foreign key constraint
DO $$ BEGIN
 ALTER TABLE "images" ADD CONSTRAINT "images_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS "idx_images_template_id" ON "images"("template_id");
CREATE INDEX IF NOT EXISTS "idx_images_category" ON "images"("category");
CREATE INDEX IF NOT EXISTS "idx_images_order" ON "images"("order");
