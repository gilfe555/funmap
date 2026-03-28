# FunMap — Product Requirements Document (PRD)

**Version:** 1.0  
**Last Updated:** March 2026  
**Status:** Planning Complete — Ready for Implementation

---

## 1. Product Overview

### High-Level Description
**FunMap** is a **map-based social network**. Users share real-time "fun" status at their location, and the app visualizes these inputs as a live heatmap. The primary use case is discovery: groups and tourists open the map to find hotspots and decide where to go.

**Future directions:** The platform could expand beyond "fun" to support other real-time social information layers—e.g., traffic, safety, crowd density, events—turning the map into a multi-signal social intelligence layer.

### Vision
**FunMap** (working title) encourages people to spend more time outdoors and away from screens by maximizing fun and real-life social interactions through a community-driven experience-sharing platform.

### Core Value Proposition
Groups of friends or tourists open the app to see a **live heatmap** of where people are having fun right now. They use it to decide where to go—whether exploring a new city or choosing a bar in their neighborhood.

---

## 2. MVP Scope

### Primary User
- Groups of friends or tourists deciding what to do or where to go.
- They open the map and look for **hotspots** (areas with high "fun" activity).

### Core Features
| Feature | Description |
|--------|-------------|
| **Binary Fun Toggle** | Pill-shaped toggle, sliding white dot. Gray (off) → Neon green (#39FF14) on. "Fun" label always visible, centered. |
| **Real-time Heatmap** | Inputs are visualized on an interactive map as "heat blobs" with varying intensity (L1/L2/L3). |
| **Account Required** | Email/Password login. No guest mode. |
| **Global from Day One** | No geographic restriction at launch. |
| **Place Search** | Google Places autocomplete search bar at top of map. Same feel as Google Maps search. |
| **Center on Location** | White circle FAB (bottom right, above toggle). Tapping animates the map back to the user's current GPS position. |
| **Tab Navigation** | Map tab (🗺️) and Settings tab (⚙️). Tab bar visible. Groups tab reserved for next iteration. |
| **Settings Screen** | Sign out button. Placeholder sections for Notifications and Preferences (grayed out, "Coming soon"). |

### Key Behaviors
- **One active fun spot per user** — Toggling on at a new location implicitly turns off the previous one.
- **Auto-off after 8 hours** — Server-side `expires_at` enforces this; client timer syncs UI.
- **Empty map:** Show "Be the first, lead the fun" as gentle gray centered text when 0 clusters visible in the current view.

### MVP Design Spec
| Element | Spec |
|---------|------|
| **Fun Toggle** | Pill 140×56px, sliding white dot 44px, DOT_OFF=6px from left, DOT_ON=90px from left. Animated spring (dot) + timing (color). |
| **Search Bar** | Fixed top of map, Google Places autocomplete, rounded card with shadow. Moves map to selected place. |
| **Location Button** | White circle FAB 48px, bottom right corner, above the fun toggle. Centers map on user GPS. |
| **Tab Bar** | Map (🗺️) + Settings (⚙️). Standard React Native tab bar. |
| **Empty State** | "Be the first, lead the fun" — gray, small, centered text. Only shown when 0 clusters in viewport. |

### Technical Requirements (MVP)
- Binary input UI (pill toggle with sliding dot, neon green on, gray off).
- Real-time data aggregation backend (Supabase Realtime + postgres_changes).
- Google Maps via `react-native-maps` (PROVIDER_GOOGLE, requires native EAS build).
- Google Places API for search autocomplete.
- Privacy controls (opt-in visibility; MVP is hotspot-only, no friends graph).

### MVP KPIs
- Daily Active Users (DAU)
- Average daily time spent on the app
- Number of fun-status updates per day
- Unique locations marked as "fun"

### MVP Definition of Done
- Fun-state input works on all supported devices.
- Fun Map updates in real-time with at least 90% of updates visible within 2s.
- Data is stored and processed securely.
- Tests cover 90%+ of MVP code.

---

## 3. Product Roadmap (Post-MVP)

### Quick Reference: All Screens by Iteration

| Iteration | Screens |
|-----------|---------|
| **1** | Map (Current/Future), Groups Discovery, Group Detail, Create Group, Schedule Event, Future Map |
| **2** | Map (Public/My Groups filter), Create Private Group, My Groups |
| **3** | Map (unchanged), Settings (permissions), In-app toasts |
| **4** | Statistics (main), Venue Detail (time chart) |
| **5** | Submit Request, Requests List |

---

### Iteration 1: Groups & Future Fun

**Overview:** Users join interest-based groups (e.g., Beach Frisbee, Live Music), schedule events, and view both current fun and future fun on the map.

**Pages/Screens:**

| Screen | Purpose |
|--------|---------|
| **Map (Current/Future)** | Main map with toggle: "Current" (live heatmap) vs "Future" (event pins). Bottom panel shows upcoming events. |
| **Groups Discovery** | Browse/search groups by interest. Cards show group name, icon, member count. Join or create. |
| **Group Detail** | View group info, members, upcoming events. Schedule new event. |
| **Create Group** | Name, icon, description. Invite users (optional). |
| **Schedule Event** | Pick date, time, location. Add to group. |
| **Future Map** | Map with event pins (clock icon, time label). Tap pin for event details. |

**User Flow:**

1. User opens Map → sees Current toggle (default). Taps "Future" → map shows event pins.
2. User taps "Groups" in nav → Discover Groups → joins "Beach Frisbee" (or creates new).
3. User opens Group → "Schedule Event" → "Bograshov Beach, 8 AM tomorrow" → event appears on Future Map.
4. User taps event pin → sees details, RSVP.

**Design Mockups:**

| Mockup | File | Description |
|--------|------|--------------|
| Map with Current/Future toggle | `designs/funmap_iter1_map_toggle.png` | Map + toggle + upcoming events panel |
| Groups Discovery | `designs/funmap_iter1_groups_discovery.png` | Groups grid, search, create button |
| Future Map View | `designs/funmap_iter1_future_map.png` | Event pins with time labels |

---

### Iteration 2: Private Groups

**Overview:** Users create private groups by selecting specific people (not interests). These groups share current fun only—no event scheduling. Map can filter to show public vs. private-group fun.

**Pages/Screens:**

| Screen | Purpose |
|--------|---------|
| **Map (with filter)** | Toggle: "Public" (city-wide heatmap) vs "My Groups" (only fun from user's private groups). |
| **Create Private Group** | Name, select members from contacts/friends. No interests or events. |
| **My Groups** | List of groups user belongs to. Tap to view members, leave group. |

**User Flow:**

1. User opens Map → sees "Public" (default). Taps "My Groups" → map shows only fun from Close Friends, Weekend Crew, etc.
2. User taps "Create Group" → "Close Friends" → selects Alex, Mia, Sam → Create.
3. Group members see each other's fun on the map when "My Groups" filter is on.

**Design Mockups:**

| Mockup | File | Description |
|--------|------|--------------|
| Map with Public/My Groups filter | `designs/funmap_iter2_map_filter.png` | Filter pill + map legend |
| Create Private Group | `designs/funmap_iter2_private_group.png` | Create form + member selection |

---

### Iteration 3: Automatic Fun Status

**Overview:** Fun status updates automatically when the user leaves a fun area or arrives at a scheduled event. Requires background location permission.

**Pages/Screens:**

| Screen | Purpose |
|--------|---------|
| **Map (unchanged)** | Same as before. Notifications appear as toasts/banners. |
| **Settings** | Permission toggle for "Background location" (auto fun status). |
| **Notifications (in-app)** | Toast: "You left the area. Fun turned off." / "You arrived at Beach Frisbee! Fun turned on." |

**User Flow:**

1. User has Fun ON at Downtown Bar. User walks away → app detects exit → toast "You left the area. Fun turned off."
2. User has RSVP'd to "Beach Frisbee 8 AM". User arrives at location + time → toast "You arrived at Beach Frisbee! Fun turned on."
3. User can always manually override (toggle off/on).

**Design Mockups:**

| Mockup | File | Description |
|--------|------|--------------|
| Auto-off notification | `designs/funmap_iter3_auto_off.png` | Toast: left area, fun turned off |
| Auto-on notification | `designs/funmap_iter3_auto_on.png` | Toast: arrived at event, fun turned on |

---

### Iteration 4: Statistics Tab

**Overview:** Users see a Statistics tab with hottest spots over time, peak hours, and leaderboards (most fun users/groups).

**Pages/Screens:**

| Screen | Purpose |
|--------|---------|
| **Statistics (main)** | Tab: Map | Stats. Stats shows: Hottest Spots This Week (list), Top Contributors (leaderboard). |
| **Venue Detail (time chart)** | Tap a venue → see "Fun activity by hour" chart (peak hours). |

**User Flow:**

1. User taps "Stats" in nav → sees "Hottest Spots This Week" (Downtown Bar 847 hrs, City Park 612 hrs, etc.) and "Top Contributors" (@alex_fun 42 spots, etc.).
2. User taps "Downtown Bar" → sees chart: peak at 9 PM.

**Design Mockups:**

| Mockup | File | Description |
|--------|------|--------------|
| Statistics tab | `designs/funmap_iter4_statistics.png` | Hottest spots + leaderboards |
| Hottest spots over time | `designs/funmap_iter4_hotspots_time.png` | Chart: fun by hour for a venue |

---

### Iteration 5: Feature Request System

**Overview:** Users submit feature requests in-app. All requests are saved, clustered, and prioritized for admins. Users can view and vote on clustered requests.

**Pages/Screens:**

| Screen | Purpose |
|--------|---------|
| **Submit Request** | Form: describe idea, category (New Feature / Bug / Improvement). Submit. |
| **Requests List** | View clustered requests (e.g., "Dark mode" 23 votes, "Export my data" 18 votes). Vote on requests. Status: Under review / Planned. |

**User Flow:**

1. User taps "Suggest a Feature" (in Profile or Settings) → writes "I want dark mode" → Submit.
2. User taps "Feature Requests" → sees list of clustered ideas with vote counts → taps "Dark mode" → upvotes.
3. Admins: review clustered backlog, prioritize, map to roadmap.

**Design Mockups:**

| Mockup | File | Description |
|--------|------|--------------|
| Submit feature request | `designs/funmap_iter5_submit_request.png` | Form to submit idea |
| Requests list (voting) | `designs/funmap_iter5_requests_list.png` | Clustered requests + vote counts |

---

## 4. Design Specification

### Visual Theme: "Clean Utility"
- **Base Map:** Light mode (white/light gray). Minimalist, similar to Apple Maps or Google Maps.
- **Typography:** Clean sans-serif (e.g., SF Pro, Roboto).
- **Vibe:** Professional, trustworthy, legible in daylight.

### The "Fun" Toggle
- **Type:** Pill-shaped toggle switch.
- **Placement:** Bottom right or bottom center (floating).
- **States:**
  - **ON (Having Fun):** Bright Green (#00FF00 / #39FF14). White knob. Label "Fun" in white.
  - **OFF (Not Fun):** Gray background. White knob. No label.

### Heatmap Visualization
- **Representation:** Circular "heat blobs" (not pins).
- **Intensity Levels:**
  - **Level 1 (Low):** Pale, semi-transparent green.
  - **Level 2 (Medium):** Solid lime green.
  - **Level 3 (High):** Intense dark green.
- **Peak Indicators:** Fire icon (🔥) floating above high-intensity clusters.

### Design Rationale (Summary)
- **Heatmap over pins:** Better privacy, conveys "vibe" rather than exact location, helps cold start.
- **Toggle placement:** Thumb-zone friendly; follows FAB patterns used by Google Maps and Uber.
- **Green for Fun:** Universal traffic-light metaphor; high visibility in sun and dark venues.

### Agreed Design Mockups
The following mockups reflect the final design direction (Clean Utility theme):

| Mockup | Description |
|--------|--------------|
| **Main Map + Toggle** | Full map view with pill-shaped "Fun" toggle (Green when ON, Gray when OFF). Light map, heat blobs, fire icons for peak spots. |
| **Heatmap Levels** | Three intensity levels: pale green (low), lime green (medium), dark green with fire icon (high). |

*Reference files: `designs/funmap_mockup_clean_toggle_refined.png`, `designs/funmap_mockup_clean_utility_levels.png`*

### Alternative: Dark Mode
A dark-mode variant is available for all screens: dark background, muted map, neon green accents. Suits nightlife and low-light use.

| Mockup | File |
|--------|------|
| MVP Map | `designs/funmap_dark_mvp_map.png` |
| Iter 1 Map Toggle | `designs/funmap_dark_iter1_map_toggle.png` |
| Iter 2 Map Filter | `designs/funmap_dark_iter2_map_filter.png` |
| Iter 4 Statistics | `designs/funmap_dark_iter4_statistics.png` |
| Iter 5 Feature Requests | `designs/funmap_dark_iter5_submit.png` |

---

## 5. Technical Architecture

### Stack
| Layer | Technology | Rationale |
|-------|------------|------------|
| **Frontend** | React Native (Expo) | Single codebase for Android (and iOS later); strong map support. |
| **Backend / DB** | Supabase (PostgreSQL + Realtime) | Auth, DB, and real-time subscriptions out of the box; no custom server. |
| **Map** | Google Maps (react-native-maps) | Standard for Android. |
| **Deployment** | EAS Build (Expo) for APK; Supabase Cloud for backend | Managed, minimal ops. |

### Data Model (MVP)
- **Table:** `fun_signals`
- **Fields:** `user_id`, `location` (PostGIS point), `status` (boolean), `updated_at`
- **Row Level Security:** Enforced via Supabase policies.

### Implementation Phases
1. **Project Initialization** — Expo + Supabase + react-native-maps + folder structure.
2. **Authentication** — Login, Sign Up, Supabase Auth, session persistence.
3. **Map & Location** — Full-screen map, permissions, user location, light-style map.
4. **Fun Logic** — `fun_signals` table, toggle UI, DB writes, auto-off (manual/timeout for MVP).
5. **Real-time Heatmap** — Supabase Realtime subscription, fetch by bounds, render heat blobs, intensity logic.
6. **Polish & Build** — Design system, fire icons, EAS Build for Android APK.

---

## 6. Cost Review

| Component | Cost (MVP/Dev) | Requires Card? | Paid Trigger |
|-----------|----------------|----------------|--------------|
| Supabase | $0 | No | 50K+ users or >500 MB DB |
| Expo / EAS Build | $0 | No | 30+ builds/month |
| Google Maps SDK | $0 | Yes (Google Cloud) | 10K+ map loads/month |
| GitHub | $0 | No | N/A |

**Summary:** Total cost to build and launch MVP is **$0**. The only step requiring a credit card is setting up a Google Cloud account for the Maps API key; charges only apply if usage exceeds the free tier.

---

## 7. Competitive Landscape

### Similar Products
- **Ping, Peak, MixerBox BFF, Drift, Huuli, Holler Away, Mappit, Droppy** — Social maps with status/activity sharing.
- **Snap Map** — Heatmap of Snaps; reference for heat visualization.
- **Zenly (discontinued)** — Reference for dark-mode social map UX.

### FunMap Differentiation
- **Binary "fun" signal** as the core primitive (not generic status).
- **City-wide fun heatmap** as the primary view (not just friends).
- **Roadmap** includes groups, events, and automatic fun status.

---

## 8. Appendix: Key Decisions (CTO Alignment)

| Topic | Decision |
|-------|----------|
| Primary user | Groups/tourists deciding where to go |
| Map scope | Both city hotspots and (later) friends view; MVP = hotspot only |
| Location model | Precise for venues; aggregated for areas (e.g., markets); color = count |
| Fun lifetime | Until user turns off or leaves area |
| Geography | Global from day one |
| Auth | Account required; no guest mode |
| Platform | Android first, then iOS |
| Social graph (MVP) | No friends UI; hotspot-only |
| Fun input | Binary only |
| Empty map | "Be the first to mark fun here" prompt |
| Anti-abuse | One active fun spot per user (from toggle design) |
| Leave-area | Geofence per venue when available; else fixed radius |

---

*This PRD consolidates product vision, roadmap, design, technical plan, and cost review. Share freely with collaborators.*
