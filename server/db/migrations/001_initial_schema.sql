-- CardShark Database Schema
-- Migration: 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- Users Table (Google OAuth)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Cards Table (Main collection)
-- ============================================
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  description TEXT,
  sport VARCHAR(50) NOT NULL,
  year INTEGER,
  player_name VARCHAR(255) NOT NULL,
  team VARCHAR(255),
  card_number VARCHAR(50),
  card_set VARCHAR(255),
  grade DECIMAL(3,1) CHECK (grade >= 1 AND grade <= 10),
  value DECIMAL(10,2),
  purchase_price DECIMAL(10,2),
  is_wishlist BOOLEAN DEFAULT FALSE,
  ebay_item_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Price History (for tracking and alerts)
-- ============================================
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  value DECIMAL(10,2) NOT NULL,
  source VARCHAR(50) DEFAULT 'ebay',
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Price Alerts
-- ============================================
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_price DECIMAL(10,2) NOT NULL,
  direction VARCHAR(10) CHECK (direction IN ('above', 'below')),
  is_triggered BOOLEAN DEFAULT FALSE,
  triggered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- API Usage Tracking (Cost safeguard)
-- ============================================
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service VARCHAR(50) NOT NULL,
  month VARCHAR(7) NOT NULL, -- '2026-02'
  call_count INTEGER DEFAULT 0,
  last_called TIMESTAMP DEFAULT NOW(),
  UNIQUE(service, month)
);

-- ============================================
-- Storage Usage Tracking
-- ============================================
CREATE TABLE IF NOT EXISTS storage_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_bytes BIGINT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Initialize storage tracking with single row
INSERT INTO storage_usage (current_bytes) VALUES (0)
ON CONFLICT DO NOTHING;

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_sport ON cards(sport);
CREATE INDEX IF NOT EXISTS idx_cards_player_name ON cards(player_name);
CREATE INDEX IF NOT EXISTS idx_cards_created_at ON cards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cards_is_wishlist ON cards(is_wishlist);
CREATE INDEX IF NOT EXISTS idx_price_history_card_id ON price_history(card_id);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON price_history(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_service_month ON api_usage(service, month);

-- ============================================
-- Updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to users and cards tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cards_updated_at ON cards;
CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
