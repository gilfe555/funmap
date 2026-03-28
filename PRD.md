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

### Next Phase: Groups

The next development phase adds social groups and a forward-looking "Future" map mode. Users can join interest-based groups (public or private), schedule events, RSVP, and see upcoming fun on the map before it happens.

An interactive design prototype for this phase is available here:
👉 **[View Groups Phase Prototype](https://htmlpreview.github.io/?https://github.com/gilfe555/funmap/blob/develop/prototype.html)**

---

### Screens Overview

| Screen | Description |
|--------|-------------|
| **Map – Now Mode** | Existing live heatmap. Gains a Now / Future pill toggle at the top. Tab bar adds Groups + Alerts tabs. |
| **Map – Future Mode** | Switches map to show upcoming event blobs (same heat levels, same intensity colors). Each blob shows time and RSVP count. Group filter chips let user focus on specific groups. Scrollable events strip at the bottom. Fun toggle is hidden in Future mode. |
| **Discover Groups** | List of "My Groups" + public groups to join. Search bar at top. Group cards show name, type (Public / Private badge), description, member count, and star rating. FAB (+) to create a new group. |
| **Create Group** | Type toggle: Public or Private. Fields: name, description. Private groups reveal an invite search. Submit creates the group and opens its detail screen. |
| **Group Detail – Events tab** | Group header: name, rating, member count, Public/Private badge. Action buttons: Invite, Leave. Events tab lists upcoming events with time-box, title, group tag, description, location, initiator, RSVP count. RSVP button per event. Fun Meter widget (rate the group 1–5 stars). FAB (+) to create a new event. |
| **Group Detail – Members tab** | Same header as Events tab. Member list with avatar, name, join date, and role (admin / member). |
| **Create Event** | Fields: event name, date/time, location (search), description, group (dropdown). Submit saves event and returns to Group Detail. |
| **Event Detail** | Full event view: title, group, date/time, location, description, initiator, attendee count. RSVP button. Map thumbnail showing event location. |
| **Invite Users** | Search users by name or email. User rows with avatar and Invite button (toggles to ✓ Invited). |
| **Notifications / Alerts** | Feed of alerts: new events in joined groups, RSVPs, invites received. Unread badge on Alerts tab. |

---

### Tab Bar (Groups Phase)

| Tab | Icon | Notes |
|-----|------|-------|
| Map | 🗺️ | Default tab. Now/Future toggle lives here. |
| Groups | 👥 | Opens Discover Groups. |
| Alerts | 🔔 | Notification feed. Shows unread badge count. |

Settings moves to a gear icon accessible from within the Map or Groups screens (not a dedicated tab).

---

### Key Behaviors

- **Now vs Future:** Toggling to Future hides the Fun toggle (you can't mark yourself as having fun in the future). The map shows upcoming event blobs instead of live ones.
- **Future blob intensity:** Matches live heatmap levels — based on RSVP count (L1: 1–2, L2: 3–5, L3: 6+). Each blob shows a time label and attendee count.
- **Group filter chips (Future mode):** Filter future blobs by group. "All Groups" selected by default.
- **Public vs Private groups:** Public groups are discoverable and joinable by anyone. Private groups are invite-only and not listed publicly.
- **Fun Meter:** Each group has a star rating (1–5). Users rate from the Group Detail screen. Average rating shown on group cards.
- **RSVP:** Tapping "Going?" on an event marks the user as attending. RSVP count updates immediately and affects blob intensity on the Future map.
- **Invites:** Group admins can invite users from the Group Detail or Create Group screens. Invitees receive an alert.

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
