-- Migration: Add image_data column for database-based image storage
-- This solves the ephemeral filesystem issue on Railway

-- Add image_data column to store base64-encoded image
ALTER TABLE cards ADD COLUMN IF NOT EXISTS image_data TEXT;

-- Add index for faster lookups by image_path
CREATE INDEX IF NOT EXISTS idx_cards_image_path ON cards(image_path);
