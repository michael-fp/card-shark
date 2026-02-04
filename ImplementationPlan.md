# CardShark - Sports Card Collection Tracker

> A modern, Instagram-inspired web application for tracking your sports card collection with AI-powered card recognition.

## Overview

**App Name:** CardShark  
**Tech Stack:** React + Tailwind CSS, Node.js/Express, PostgreSQL, Railway  
**Authentication:** Google OAuth (restricted to specific emails)  
**Card Matching:** Google Cloud Vision (OCR) + eBay Browse API  
**Image Storage:** Railway Volume Storage  

---

## User Review Required

> [!IMPORTANT]
> **Cost Safeguards Built In:**
> - Google Vision: Hard limit of 900 API calls/month (under 1,000 free tier)
> - Railway Storage: Automatic warning at 800MB (under 1GB free tier)
> - eBay API: Always free (no limits needed)

> [!WARNING]
> **Google OAuth Restriction:**
> Only these emails can access the app:
> - `masonwoollands@gmail.com`
> - `michaelwoollands@gmail.com`

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│                    React + Tailwind (Instagram UI)                       │
├─────────────────────────────────────────────────────────────────────────┤
│  Gallery View  │  Card Modal  │  Filters  │  Stats  │  Wishlist  │ Add  │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTPS (Railway)
┌───────────────────────────────┴─────────────────────────────────────────┐
│                              BACKEND                                     │
│                         Node.js + Express                                │
├─────────────────────────────────────────────────────────────────────────┤
│  Auth        │  Cards API    │  Upload     │  Card Matcher  │  Stats    │
│  (Google)    │  (CRUD)       │  (Images)   │  (Vision+eBay) │  (Agg)    │
└──────┬───────────────┬────────────────┬─────────────────────────────────┘
       │               │                │
       ▼               ▼                ▼
┌──────────────┐ ┌───────────┐  ┌──────────────┐
│  PostgreSQL  │ │  Railway  │  │ External APIs│
│  (Railway)   │ │  Volume   │  │ Vision, eBay │
└──────────────┘ └───────────┘  └──────────────┘
```

---

## Database Schema

```sql
-- Users (Google OAuth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cards (Main collection)
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  description TEXT,
  sport VARCHAR(50) NOT NULL,
  year INTEGER,
  player_name VARCHAR(255) NOT NULL,
  team VARCHAR(255),
  grade DECIMAL(3,1) CHECK (grade >= 1 AND grade <= 10),
  value DECIMAL(10,2),
  purchase_price DECIMAL(10,2),
  is_wishlist BOOLEAN DEFAULT FALSE,
  ebay_item_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Price history (for alerts and tracking)
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  value DECIMAL(10,2) NOT NULL,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Price alerts
CREATE TABLE price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  target_price DECIMAL(10,2) NOT NULL,
  direction VARCHAR(10) CHECK (direction IN ('above', 'below')),
  is_triggered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- API usage tracking (cost safeguard)
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service VARCHAR(50) NOT NULL,
  month VARCHAR(7) NOT NULL, -- '2026-02'
  call_count INTEGER DEFAULT 0,
  UNIQUE(service, month)
);

-- Storage usage tracking
CREATE TABLE storage_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_bytes BIGINT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);
```

---

## Implementation Phases

### Phase 1: Project Setup & Infrastructure
- [ ] Clone GitHub repository `git@github.com:michael-fp/card-shark.git`
- [ ] Initialize React app with Vite
- [ ] Configure Tailwind CSS with custom Instagram-inspired theme
- [ ] Set up project folder structure
- [ ] Create Express.js backend scaffold
- [ ] Configure PostgreSQL connection for Railway
- [ ] Set up Railway volume storage configuration
- [ ] Create database migration scripts
- [ ] Add environment variable templates (.env.example)
- [ ] Configure ESLint and Prettier

---

### Phase 2: Authentication
- [ ] Set up Google OAuth 2.0 credentials
- [ ] Implement Google Sign-In button component
- [ ] Create auth middleware for protected routes
- [ ] Implement email whitelist check (masonwoollands@gmail.com, michaelwoollands@gmail.com)
- [ ] Create JWT token generation and validation
- [ ] Add session persistence (local storage + refresh tokens)
- [ ] Create login page with CardShark branding
- [ ] Implement logout functionality
- [ ] Add auth context provider for React

---

### Phase 3: Core UI Components (Instagram-Inspired)
- [ ] Design and implement global CSS variables (Instagram color palette)
- [ ] Create responsive navigation header with logo
- [ ] Build bottom navigation bar (mobile)
- [ ] Implement card grid component (3-column like Instagram Explore)
- [ ] Create card thumbnail component with hover effects
- [ ] Build card detail modal (Instagram post style)
- [ ] Implement image carousel for modal
- [ ] Create filter bar component with dropdowns
- [ ] Build search input with autocomplete
- [ ] Implement loading skeletons for cards
- [ ] Create empty state components
- [ ] Add toast notification system
- [ ] Implement pull-to-refresh on mobile

---

### Phase 4: Card Management (CRUD)
- [ ] Create POST /api/cards endpoint
- [ ] Create GET /api/cards endpoint with filtering
- [ ] Create GET /api/cards/:id endpoint
- [ ] Create PUT /api/cards/:id endpoint
- [ ] Create DELETE /api/cards/:id endpoint
- [ ] Implement image upload to Railway volume
- [ ] Add image compression before storage
- [ ] Implement storage usage tracking (800MB warning)
- [ ] Create card form component (add/edit)
- [ ] Add form validation with error messages
- [ ] Implement optimistic UI updates
- [ ] Add card deletion confirmation modal

---

### Phase 5: Card Matching System
- [ ] Set up Google Cloud Vision API client
- [ ] Implement OCR text extraction from card images
- [ ] Create text parsing logic (extract player, year, team)
- [ ] Set up eBay Browse API client
- [ ] Implement eBay search by extracted text
- [ ] Create match confidence scoring algorithm
- [ ] Build API usage counter (Google Vision limit: 900/month)
- [ ] Add "usage limit reached" fallback to manual entry
- [ ] Create match results preview UI
- [ ] Implement "Accept Match" / "Edit & Save" flow
- [ ] Add duplicate detection with confirmation dialog

---

### Phase 6: Gallery & Filtering
- [ ] Implement infinite scroll for card gallery
- [ ] Create filter state management
- [ ] Build sport filter dropdown
- [ ] Build year range filter
- [ ] Build grade filter (min/max slider)
- [ ] Build team filter with search
- [ ] Build player name search
- [ ] Build value range filter
- [ ] Implement sort options (date, value, player name)
- [ ] Add filter badge count indicator
- [ ] Create "Clear All Filters" button
- [ ] Persist filter state in URL params

---

### Phase 7: Portfolio & Stats Dashboard
- [ ] Create GET /api/stats endpoint
- [ ] Calculate total collection value
- [ ] Calculate value change over time
- [ ] Build portfolio value card component
- [ ] Create value trend chart (line graph)
- [ ] Build sport distribution pie chart
- [ ] Build grade distribution bar chart
- [ ] Create top 10 most valuable cards list
- [ ] Add year breakdown visualization
- [ ] Create team breakdown visualization
- [ ] Implement stats refresh on data change

---

### Phase 8: Price Tracking & Alerts
- [ ] Create price history recording (daily cron job placeholder)
- [ ] Create POST /api/alerts endpoint
- [ ] Create GET /api/alerts endpoint
- [ ] Create DELETE /api/alerts endpoint
- [ ] Build price alert creation modal
- [ ] Implement alert trigger checking logic
- [ ] Create notifications UI for triggered alerts
- [ ] Add price history chart in card modal
- [ ] Display current market value vs purchase price

---

### Phase 9: Wishlist Feature
- [ ] Add is_wishlist column handling in API
- [ ] Create wishlist toggle button on cards
- [ ] Build dedicated wishlist view/tab
- [ ] Implement wishlist filter in gallery
- [ ] Add "Move to Collection" action
- [ ] Create wishlist empty state

---

### Phase 10: Mobile Optimization
- [ ] Test and refine responsive breakpoints
- [ ] Optimize touch interactions for card selection
- [ ] Implement swipe gestures for modal navigation
- [ ] Add haptic feedback for key actions
- [ ] Optimize image loading for mobile (lazy loading)
- [ ] Test camera upload flow on iOS/Android
- [ ] Ensure bottom nav doesn't overlap content
- [ ] Test keyboard handling in forms

---

### Phase 11: Railway Deployment
- [ ] Create Railway project
- [ ] Configure PostgreSQL addon
- [ ] Set up Railway volume for images
- [ ] Configure environment variables in Railway
- [ ] Set up build commands
- [ ] Configure custom domain (optional)
- [ ] Test production deployment
- [ ] Set up health check endpoint
- [ ] Verify Google OAuth works with production URL

---

### Phase 12: Final Polish & Testing
- [ ] Conduct full user flow testing
- [ ] Fix any UI bugs discovered
- [ ] Optimize database queries
- [ ] Add proper error handling throughout
- [ ] Implement rate limiting
- [ ] Add CORS configuration
- [ ] Create README.md with setup instructions
- [ ] Final mobile testing on real devices
- [ ] Performance audit (Lighthouse)

---

## Proposed Changes

### Frontend (`/client`)

#### [NEW] [vite.config.ts](file:///client/vite.config.ts)
Vite configuration with React plugin, Tailwind, and proxy for development.

#### [NEW] [tailwind.config.js](file:///client/tailwind.config.js)
Custom Instagram-inspired theme with CardShark brand colors.

#### [NEW] [src/App.tsx](file:///client/src/App.tsx)
Main app component with routing and auth context.

#### [NEW] [src/components/](file:///client/src/components/)
- `Header.tsx` - Navigation header with logo and user menu
- `BottomNav.tsx` - Mobile bottom navigation
- `CardGrid.tsx` - Instagram-style masonry grid
- `CardThumbnail.tsx` - Individual card in grid
- `CardModal.tsx` - Full card detail view (Instagram post style)
- `FilterBar.tsx` - Filter controls
- `AddCardModal.tsx` - Card upload and form
- `StatsCard.tsx` - Portfolio stat widgets
- `Toast.tsx` - Notification system

#### [NEW] [src/pages/](file:///client/src/pages/)
- `Login.tsx` - Google OAuth login page
- `Gallery.tsx` - Main collection view
- `Stats.tsx` - Portfolio dashboard
- `Wishlist.tsx` - Wishlist view

---

### Backend (`/server`)

#### [NEW] [server/index.js](file:///server/index.js)
Express server entry point with middleware setup.

#### [NEW] [server/routes/](file:///server/routes/)
- `auth.js` - Google OAuth routes
- `cards.js` - Card CRUD endpoints
- `stats.js` - Aggregation endpoints
- `alerts.js` - Price alert endpoints
- `upload.js` - Image upload handling

#### [NEW] [server/services/](file:///server/services/)
- `vision.js` - Google Cloud Vision integration
- `ebay.js` - eBay API integration
- `matcher.js` - Card matching orchestration
- `storage.js` - Railway volume management

#### [NEW] [server/middleware/](file:///server/middleware/)
- `auth.js` - JWT verification + email whitelist
- `usage.js` - API usage tracking + limits

#### [NEW] [server/db/](file:///server/db/)
- `migrations/` - SQL migration files
- `index.js` - PostgreSQL connection pool

---

## Verification Plan

### Automated Tests
```bash
# Run backend tests
npm run test:server

# Run frontend tests  
npm run test:client

# E2E tests with Playwright
npm run test:e2e
```

### Manual Verification
1. **Auth Flow:** Login with allowed Google account, verify redirect
2. **Card Upload:** Upload card photo, verify matching flow works
3. **Gallery:** Verify Instagram-style grid renders correctly
4. **Modal:** Click card, verify modal opens with full details
5. **Filters:** Apply each filter, verify results update
6. **Stats:** Check portfolio value matches sum of card values
7. **Mobile:** Test complete flow on iPhone Safari
8. **Cost Limits:** Verify warning appears at 900 Vision calls / 800MB storage

---

## Cost Safeguards Implementation

```javascript
// Before any Google Vision call
const canUseVision = await checkApiLimit('google_vision', 900);
if (!canUseVision) {
  return { fallback: 'manual_entry', reason: 'Monthly limit reached' };
}

// Before any image upload
const storageBytes = await getStorageUsage();
if (storageBytes > 800 * 1024 * 1024) { // 800MB
  console.warn('⚠️ Storage approaching 1GB limit');
  // Still allow upload but log warning
}
```

---

## Git Commit Strategy

Each phase completion will include:
1. Update this `ImplementationPlan.md` with checked items
2. Meaningful commit message referencing the phase
3. Co-Authored-By trailer for AI involvement
