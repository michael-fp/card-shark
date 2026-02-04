-- Add is_favorite column to cards table
-- Favorites are separate from wishlist - favorites are cards you already own that you love
ALTER TABLE cards ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;
