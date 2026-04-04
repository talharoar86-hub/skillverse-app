# Learning Tab - Complete Analysis & Scalability Plan

## Table of Contents
1. [Explore Courses](#1-explore-courses)
2. [My Learning](#2-my-learning)
3. [Learning Paths](#3-learning-paths)
4. [Mentors](#4-mentors)
5. [Mentor Dashboard](#5-mentor-dashboard)
6. [Achievements](#6-achievements)
7. [Leaderboard](#7-leaderboard)
8. [Scalability Assessment](#8-scalability-assessment)
9. [Improvement Plan](#9-improvement-plan)

---

## 1. Explore Courses

### Flow
```
User enters /learn/explore
  → LearningContext.fetchCourses() fires
  → GET /api/courses?type=&search=&sort=&category=&level=&minRating=&page=1&limit=12
  → Backend builds MongoDB query with text search, filters, sort
  → Returns paginated courses + total count
  → Frontend renders grid/list of CourseCards
  
User interactions:
  - Search: debounced (350ms) → GET /api/courses/search/suggestions → autocomplete dropdown
  - Filters: category/level/rating chips → re-fetch courses
  - Tabs: All/Free/Premium → type filter
  - Sort: newest/popular/rating/price → re-fetch
  - Wishlist: optimistic toggle → POST /api/wishlist
  - Compare: local state, max 4 courses → CompareDrawer
  - Enroll: POST /api/enrollment/:courseId → navigate to detail
  - Load More: pagination (page++) → APPEND_COURSES
```

### Strengths
- **Debounced search with autocomplete** - good UX, reduces API calls
- **Client-side caching** via LearningContext with 5-min TTL
- **AbortController** for cancelling stale requests
- **Optimistic wishlist** updates with rollback on error
- **Course comparison** feature (unique, max 4)
- **URL sync** - filters/search persist in URL params
- **Skeleton loaders** during initial load
- **Grid/List view toggle**
- **Proper pagination** with "Load More" pattern
- **Text index** on Course model (title, description, tags, category with weights)

### Things to Improve
| Issue | Severity | Fix |
|-------|----------|-----|
| **No server-side caching** (Redis) for popular queries | HIGH | Add Redis cache for course listings, categories |
| **`countDocuments` runs on every page** | MEDIUM | Cache total count or use estimatedDocumentCount |
| **Search suggestions use regex** instead of text index | MEDIUM | Use `$text` search or Atlas Search for autocomplete |
| **No infinite scroll** - manual "Load More" button | LOW | Implement IntersectionObserver for auto-load |
| **Lessons array embedded in Course** - grows unbounded | HIGH | Move lessons to separate collection for scalability |
| **`completedBy` array in lessons** grows with every user | CRITICAL | Move to Enrollment model (already have completedLessons) |
| **No recommendation engine** | HIGH | Add collaborative/content-based filtering |
| **No course difficulty rating** from users | LOW | Add user-voted difficulty alongside mentor-set level |
| **Price only supports USD** | MEDIUM | Add currency support or use cents (integer) |
| **No course preview video** | MEDIUM | Add `previewVideoUrl` field |
| **Filter panel has no mobile responsive** behavior | LOW | Convert to bottom sheet on mobile |

---

## 2. My Learning

### Flow
```
User enters /learn/my-learning
  → LearningContext.fetchEnrollments('all', true)
  → GET /api/enrollment/my-courses?filter=all&page=1&limit=10
  → Also fetches: /api/enrollment/stats, /api/learning-goals
  → Stats poll every 60 seconds (setInterval)
  
Tabs: All | Bookmarked | In Progress | Completed
  → Each tab changes the `filter` query param
  
User interactions:
  - Click course card → navigate to /learn/course/:id
  - Load More → APPEND_ENROLLMENTS
  - Refresh → re-fetch all data
  - Weekly Goals → shows progress bars
  - Calendar → shows activity log heatmap
```

### Strengths
- **Stats dashboard** with 5 metrics (enrolled, in-progress, completed, hours, streak)
- **Sub-tabs** for filtering (All/Bookmarked/In Progress/Completed)
- **Progress bars** on each course card showing completion percentage
- **Weekly goals tracking** with hours and lessons targets
- **Learning calendar** heatmap for activity visualization
- **Streak tracking** with longest streak display
- **Auto-refresh** stats every 60 seconds
- **Proper empty states** with CTAs

### Things to Improve
| Issue | Severity | Fix |
|-------|----------|-----|
| **Stats endpoint loads ALL enrollments** into memory | CRITICAL | Use MongoDB aggregation pipeline instead of JS filtering |
| **60s polling for stats** is wasteful | MEDIUM | Use WebSocket push or longer interval (5min) |
| **No resume/continue watching** from where user left off | HIGH | Use `lastAccessedLesson` to deep-link to specific lesson |
| **No offline support** | MEDIUM | Add PWA service worker for cached courses |
| **No sorting** of enrolled courses (only by enrolledAt) | LOW | Add sort by: recently accessed, progress, alphabetical |
| **No search** within enrolled courses | MEDIUM | Add search bar for enrolled courses |
| **No course completion certificate** | HIGH | Generate PDF certificates on completion |
| **`learningGoal` fetched separately** via raw api call | LOW | Integrate into LearningContext |
| **No notification** when streak is about to break | MEDIUM | Add push/notification for streak reminders |
| **Calendar only shows past activity** | LOW | Add scheduled study sessions to calendar |

---

## 3. Learning Paths

### Flow
```
User enters /learn/paths
  → GET /api/learning-paths?status=published
  → Returns all published paths with creator + course details
  → Frontend does CLIENT-SIDE search filtering
  
User clicks a path:
  → navigate /learn/paths/:id (route exists but no detail page component found)
```

### Strengths
- **Structured course sequences** - good for guided learning
- **Course ordering** with `order` and `required` fields
- **Level and category** classification
- **Enrolled count** tracking

### Things to Improve
| Issue | Severity | Fix |
|-------|----------|-----|
| **No detail page** for learning paths (route `/learn/paths/:id` has no component) | CRITICAL | Create LearningPathDetail.jsx |
| **Client-side search** instead of server-side | HIGH | Add `search` query param to API (partially done in backend but frontend does local filter) |
| **No pagination** on frontend | MEDIUM | Add "Load More" like courses |
| **No path enrollment** mechanism | HIGH | Add "Start Path" button + path enrollment tracking |
| **No progress tracking** within a path | HIGH | Show completed/total courses in path |
| **No path recommendations** | MEDIUM | Suggest paths based on user skills/goals |
| **No mentor path creation UI** | HIGH | Add path builder in Mentor Dashboard |
| **All paths fetched at once** (no lazy loading) | MEDIUM | Backend supports pagination but frontend ignores it |
| **No estimated duration** shown | LOW | Calculate from lesson durations |
| **No prerequisite paths** | MEDIUM | Add `prerequisites` field for path chaining |

---

## 4. Mentors

### Flow
```
User enters /learn/mentors
  → GET /api/mentorship/mentors (via mentorshipService.getMentors())
  → Returns list of approved mentors
  → Renders MentorCard components

User clicks "Connect":
  → Opens RequestMentorshipModal
  → POST /api/mentorship/request
  → Sends mentorship request with skill + message
```

### Strengths
- **Clean mentor card design** with avatar, skills, rating
- **Mentorship request modal** with skill selection and message
- **Mentor application page** (BecomeMentor.jsx)
- **Proper loading/error/empty states**

### Things to Improve
| Issue | Severity | Fix |
|-------|----------|-----|
| **No search/filter** on mentors page | HIGH | Add search by name/skill, filter by availability/rating/price |
| **No pagination** - loads ALL mentors at once | HIGH | Add server-side pagination |
| **No mentor profile view page** | HIGH | Create MentorProfileDetail.jsx with reviews, courses, schedule |
| **No mentor availability calendar** visible to learners | MEDIUM | Show mentor's available time slots |
| **No mentor reviews/ratings** visible | HIGH | Show review summary on mentor cards |
| **No sorting** (by rating, price, experience) | MEDIUM | Add sort options |
| **No mentor comparison** | LOW | Like course comparison, allow mentor comparison |
| **Skill-based matching** not implemented | HIGH | Match mentors to user's learning goals |
| **No real-time availability** indicator | MEDIUM | Show online/offline status (isOnline field exists but unused in UI) |

---

## 5. Mentor Dashboard

### Flow
```
Mentor enters /mentor-dashboard
  → Redirects to /mentor-dashboard/overview
  → Parallel fetches:
    - GET /api/mentor/dashboard/stats
    - GET /api/mentor/dashboard/upcoming-sessions
    - GET /api/mentorship/incoming-requests
  
Sub-pages:
  - Overview: stats cards, quick actions, upcoming sessions, pending requests
  - Profile: edit mentor profile (headline, bio, skills, pricing)
  - Courses: CRUD course management
  - Schedule: weekly time slot management
  - Reviews: view student reviews
  - Notifications: mentor-specific notifications
```

### Strengths
- **Clean dashboard layout** with sidebar navigation
- **Parallel data fetching** with Promise.all
- **Quick action buttons** for common tasks
- **Stat cards** with icons and colors
- **Upcoming sessions** and **pending requests** widgets
- **Separate layout** from learner view

### Things to Improve
| Issue | Severity | Fix |
|-------|----------|-----|
| **No earnings/revenue tracking** | HIGH | `totalEarnings` is hardcoded to 0 |
| **No analytics charts** | HIGH | Add graphs for: student growth, session trends, revenue |
| **No course analytics** (views, enrollment rate, completion rate) | HIGH | Add per-course analytics |
| **No student progress visibility** | MEDIUM | Show how students are progressing through mentor's courses |
| **No bulk actions** for requests | LOW | Accept/reject multiple requests |
| **No session notes** after mentorship sessions | MEDIUM | Add post-session notes feature |
| **No mentor rating/response** to reviews | MEDIUM | Allow mentors to reply to reviews |
| **No content calendar** for planned courses | LOW | Course creation scheduling |
| **No mentor verification** workflow | HIGH | Replace auto-approve with proper review process |
| **Schedule management** is basic | MEDIUM | Add recurring slots, timezone support, buffer time |
| **No export** of student data | LOW | CSV export of students, sessions |

---

## 6. Achievements

### Flow
```
User enters /learn/achievements
  → GET /api/achievements
  → Backend seeds default achievements if none exist
  → Returns achievements with user progress merged
  
User clicks "Check Progress":
  → POST /api/achievements/check
  → Backend gathers: enrollments, reviews, notes, streak
  → Compares against each achievement's criteria
  → Awards new unlocks, updates progress
  → Returns newUnlocks + stats
```

### Strengths
- **9 predefined achievements** across 4 categories
- **Progress tracking** with visual progress bars
- **Category filtering** (completion, streak, social, milestone)
- **XP reward system** defined
- **Summary banner** showing unlocked/total with progress bar
- **Auto-seeding** of default achievements

### Things to Improve
| Issue | Severity | Fix |
|-------|----------|-----|
| **Manual "Check Progress"** button required | CRITICAL | Auto-check on relevant actions (enroll, complete, streak update) |
| **No real-time unlock notifications** | HIGH | Show toast/modal when achievement is unlocked |
| **No achievement showcase** on profile | MEDIUM | Allow users to display badges on profile |
| **Only 9 achievements** | MEDIUM | Add more: social (mentoring, referrals), seasonal, special |
| **No XP system** actually implemented | HIGH | XP values defined but no XP tracking/display |
| **No achievement sharing** to social feed | MEDIUM | Auto-post achievement unlocks to feed |
| **`seedAchievements()` called on every request** | HIGH | Move to startup/separate migration script |
| **No leaderboard integration** with XP | MEDIUM | Add XP-based leaderboard metric |
| **No rare/legendary achievements** | LOW | Add difficulty tiers (bronze/silver/gold/platinum) |
| **No achievement progress notifications** (e.g., "2 more courses to unlock!") | MEDIUM | Milestone notifications at 50%, 75%, 90% |

---

## 7. Leaderboard

### Flow
```
User enters /learn/leaderboard
  → GET /api/leaderboard?metric=hours&period=all-time&limit=20
  
  If metric=streak:
    → LearningGoal.find().sort({streakDays: -1}).limit(20)
    
  If metric=hours or courses:
    → Enrollment.aggregate([
        { $match: dateFilter },
        { $group: by user },
        { $sort: by metric },
        { $limit: 20 },
        { $lookup: users }
      ])

UI: podium (top 3) + list (rest), current user rank banner
Filters: metric (hours/courses/streak) + period (all-time/monthly/weekly)
```

### Strengths
- **3 metric types** (hours, courses, streak)
- **3 time periods** (all-time, monthly, weekly)
- **Visual podium** for top 3 with gradient bars
- **Current user rank** highlighted banner
- **MongoDB aggregation** for efficient ranking
- **Current user highlighted** in list with "(You)" label

### Things to Improve
| Issue | Severity | Fix |
|-------|----------|-----|
| **Leaderboard recalculated on every request** | CRITICAL | Pre-compute and cache results (Redis + cron job) |
| **Hours calculation is approximate** (`lessons * 0.5`) | HIGH | Track actual time spent (add `timeSpent` to Enrollment) |
| **No pagination** beyond top 20 | MEDIUM | Allow viewing ranks 21-100+ |
| **No user's position if outside top 20** | HIGH | Always show current user's rank even if not in top |
| **No friends-only leaderboard** | MEDIUM | Filter by following/followers |
| **No department/team leaderboard** | LOW | Group-based leaderboards |
| **No weekly reset notifications** | MEDIUM | Notify users when weekly leaderboard resets |
| **No rewards for top ranks** | HIGH | Tie leaderboard position to badges/perks |
| **No animated transitions** when rank changes | LOW | Smooth rank change animations |
| **Date filter on streak** doesn't apply (always all-time) | MEDIUM | Add date-based streak tracking |
| **No `prevRank` tracking** | LOW | Show rank change indicators (up/down arrows) |

---

## 8. Scalability Assessment

### Frontend Scalability

| Aspect | Current | Rating | Issues |
|--------|---------|--------|--------|
| **State Management** | React Context + useReducer | 6/10 | Single context for all learning state = re-renders on any change. At scale with 100K+ users, this becomes a bottleneck |
| **Code Splitting** | None | 3/10 | All learning tabs loaded eagerly. Need React.lazy + Suspense |
| **Caching** | 5-min TTL in context | 5/10 | No persistent cache (localStorage/IndexedDB). Cache lost on refresh |
| **Bundle Size** | Lucide icons (all imported) | 5/10 | Should use tree-shaking friendly imports or icon subsetting |
| **Virtualization** | None | 3/10 | Long lists (courses, mentors, leaderboard) render all items. Need react-window for 1000+ items |
| **Error Boundaries** | None | 4/10 | No error boundaries around tab content. One crash = full page broken |
| **Performance Monitoring** | None | 2/10 | No Web Vitals tracking, no performance budgets |
| **Image Optimization** | Basic | 4/10 | No lazy loading of images, no srcset for responsive images |

### Backend Scalability

| Aspect | Current | Rating | Issues |
|--------|---------|--------|--------|
| **API Design** | REST with Express | 7/10 | Clean routes but no versioning, no rate limiting, no request validation |
| **Database Queries** | Mixed Mongoose + Aggregation | 6/10 | Stats endpoint loads all enrollments into JS memory. Leaderboard aggregation is good but not cached |
| **Authentication** | JWT + Passport | 7/10 | Stateless JWT is good for scaling. No refresh token rotation |
| **Real-time** | Socket.io | 6/10 | Good for notifications but no horizontal scaling config (Redis adapter) |
| **File Storage** | URL strings | 4/10 | No actual file upload system. Thumbnails assumed to be external URLs |
| **Background Jobs** | None | 2/10 | Achievement checking, leaderboard computation, email sending should be async |
| **Rate Limiting** | None | 3/10 | No protection against API abuse |
| **API Documentation** | None | 3/10 | No Swagger/OpenAPI spec |
| **Logging** | console.error | 3/10 | No structured logging (Winston/Pino) |
| **Health Checks** | None | 2/10 | No /health endpoint for load balancer |

### Database Scalability

| Aspect | Current | Rating | Issues |
|--------|---------|--------|--------|
| **Indexing** | Good basics | 7/10 | Text index on Course, compound indexes on Enrollment. Missing some |
| **Schema Design** | Mixed embedding/referencing | 5/10 | Lessons embedded in Course (bad for growth). `completedBy` array in lessons is a anti-pattern |
| **Data Growth** | Unbounded arrays | 3/10 | `lessons.completedBy` grows with every user. `enrollment.completedLessons` is fine (per-user) |
| **Aggregation** | Used for leaderboard | 7/10 | Good use of MongoDB aggregation pipeline |
| **Connection Pooling** | Default Mongoose | 5/10 | No explicit pool configuration for production |
| **Read Replicas** | Not configured | 3/10 | No read/write separation for scale |
| **Sharding Strategy** | None | 2/10 | No sharding plan for multi-tenant scale |
| **Data Archival** | None | 2/10 | No strategy for old/completed enrollments |
| **Backup Strategy** | Unknown | 3/10 | No visible backup configuration |

### Critical Scalability Bottlenecks

```
1. CRITICAL: lessons.completedBy array in Course model
   - Each lesson has a completedBy: [ObjectId] array
   - With 10K users completing a 20-lesson course = 200K ObjectId references in ONE document
   - MongoDB document limit is 16MB
   - FIX: Remove completedBy from lessons entirely (Enrollment already tracks this)

2. CRITICAL: /api/enrollment/stats loads ALL enrollments
   - const enrollments = await Enrollment.find({ user: userId })
   - Filters in JavaScript instead of MongoDB
   - With 100 enrollments = fine, with 10K = OOM
   - FIX: Use aggregation pipeline

3. HIGH: Leaderboard computed on every request
   - Full aggregation scan of Enrollment collection
   - With 1M enrollments = 10+ second query
   - FIX: Pre-compute every N minutes, cache in Redis

4. HIGH: No WebSocket scaling
   - Socket.io in-memory = single server only
   - FIX: Add @socket.io/redis-adapter for multi-server

5. MEDIUM: Course search uses text index + regex mixed
   - Suggestions endpoint uses regex (O(n) scan)
   - Main search uses $text (good)
   - FIX: Use Atlas Search or Elasticsearch for autocomplete
```

---

## 9. Improvement Plan

### Phase 1: Critical Fixes (Week 1-2)

| # | Task | Impact | Files |
|---|------|--------|-------|
| 1 | Remove `completedBy` from Course.lessons schema | CRITICAL | `backend/models/Learning.js` |
| 2 | Fix `/api/enrollment/stats` to use aggregation | CRITICAL | `backend/routes/enrollmentRoutes.js` |
| 3 | Move `seedAchievements()` to startup script | HIGH | `backend/routes/achievementRoutes.js`, `backend/server.js` |
| 4 | Add `LearningPathDetail.jsx` page | HIGH | `frontend/src/learn/LearningPathDetail.jsx` |
| 5 | Add error boundaries around each tab | HIGH | `frontend/src/learn/LearnLayout.jsx` |
| 6 | Add rate limiting to all API routes | HIGH | `backend/server.js` |

### Phase 2: Performance & UX (Week 3-4)

| # | Task | Impact | Files |
|---|------|--------|-------|
| 7 | Redis cache for leaderboard (pre-compute every 5min) | HIGH | `backend/routes/leaderboardRoutes.js`, new `backend/services/cacheService.js` |
| 8 | Redis cache for course categories | MEDIUM | `backend/routes/courseRoutes.js` |
| 9 | Code split learning tabs with React.lazy | MEDIUM | `frontend/src/App.jsx` |
| 10 | Add virtualized lists for courses/mentors | MEDIUM | `frontend/src/learn/ExploreCourses.jsx`, `MentorsPage.jsx` |
| 11 | Add search + sort + filter to Mentors page | HIGH | `frontend/src/learn/MentorsPage.jsx`, `backend/routes/mentorshipRoutes.js` |
| 12 | Auto-achievement check on progress updates | HIGH | `backend/routes/enrollmentRoutes.js`, `backend/routes/achievementRoutes.js` |
| 13 | Actual time tracking (replace 0.5h estimate) | HIGH | `backend/models/Enrollment.js`, `backend/routes/enrollmentRoutes.js` |

### Phase 3: Features (Week 5-8)

| # | Task | Impact | Files |
|---|------|--------|-------|
| 14 | Mentor profile detail page | HIGH | New `frontend/src/learn/MentorProfileDetail.jsx` |
| 15 | Course recommendation engine | HIGH | New `backend/services/recommendationService.js` |
| 16 | Learning path enrollment + progress tracking | HIGH | `backend/models/LearningPath.js`, new frontend components |
| 17 | Achievement unlock notifications (toast + feed post) | MEDIUM | `frontend/src/context/NotificationContext.jsx` |
| 18 | XP system implementation | MEDIUM | New `backend/models/XPLog.js`, leaderboard metric |
| 19 | Mentor dashboard analytics charts | HIGH | `frontend/src/mentor/MentorOverview.jsx` |
| 20 | Certificate generation on course completion | HIGH | New `backend/services/certificateService.js` |

### Phase 4: Scale (Week 9-12)

| # | Task | Impact | Files |
|---|------|--------|-------|
| 21 | Background job queue (Bull/BullMQ) | HIGH | New `backend/jobs/`, Redis setup |
| 22 | WebSocket Redis adapter for horizontal scaling | HIGH | `backend/server.js` |
| 23 | Structured logging (Winston/Pino) | MEDIUM | `backend/server.js`, all routes |
| 24 | API documentation (Swagger) | MEDIUM | New `backend/docs/swagger.js` |
| 25 | MongoDB read replica configuration | MEDIUM | `backend/config/db.js` |
| 26 | Image upload system (S3/Cloudinary) | MEDIUM | New `backend/services/uploadService.js` |
| 27 | PWA offline support for enrolled courses | MEDIUM | `frontend/vite.config.js`, service worker |
| 28 | Load testing + performance benchmarks | HIGH | New `tests/load/` |

### Database Schema Fixes

```javascript
// BEFORE (BROKEN at scale):
lessons: [{
  title: String,
  completedBy: [{ type: ObjectId, ref: 'User' }]  // ← GROWS UNBOUNDED
}]

// AFTER (SCALABLE):
lessons: [{
  title: String,
  description: String,
  duration: String,
  videoUrl: String,
  content: String,
  order: Number
  // completedBy REMOVED - tracked in Enrollment.completedLessons
}]

// NEW: Add time tracking to Enrollment
EnrollmentSchema.add({
  timeSpentSeconds: { type: Number, default: 0 },  // Actual time tracking
  lastActiveAt: { type: Date, default: Date.now }   // For activity tracking
});

// NEW: XP Log for gamification
const XPLogSchema = new mongoose.Schema({
  user: { type: ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },  // 'course_completed', 'achievement_unlocked', etc.
  createdAt: { type: Date, default: Date.now }
});
XPLogSchema.index({ user: 1, createdAt: -1 });
```

### API Caching Strategy

```
Redis Cache Layers:
  ├── courses:list:{hash}         → TTL: 5 min   (paginated course listings)
  ├── courses:categories          → TTL: 30 min  (category list)
  ├── leaderboard:{metric}:{period} → TTL: 5 min (pre-computed leaderboard)
  ├── mentors:list                → TTL: 10 min  (mentor listings)
  ├── achievements:definitions    → TTL: 1 hour  (achievement definitions)
  └── user:stats:{userId}         → TTL: 1 min   (user learning stats)
```

### Architecture Diagram (Target State)

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │Explore│ │MyLearn│ │Paths │ │Mentors│ │Dash  │        │
│  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘         │
│     │        │        │        │        │               │
│  ┌──┴────────┴────────┴────────┴────────┴──┐            │
│  │     React Query + Zustand (Replace)     │            │
│  │     Error Boundaries + Code Splitting   │            │
│  └──────────────────┬──────────────────────┘            │
└─────────────────────┼───────────────────────────────────┘
                      │ HTTPS + WS
┌─────────────────────┼───────────────────────────────────┐
│              BACKEND (Express + Node)                    │
│  ┌──────────────────┴──────────────────────┐            │
│  │         API Gateway / Rate Limiter       │            │
│  ├──────────────────────────────────────────┤            │
│  │  REST Controllers + Validation (Zod)     │            │
│  ├──────────────────────────────────────────┤            │
│  │  Services: Cache | Jobs | Notifications  │            │
│  ├──────────┬───────────┬───────────────────┤            │
│  │  Redis   │  Bull MQ  │   Socket.io       │            │
│  │  Cache   │  Jobs     │   + Redis Adapter │            │
│  └──────────┴─────┬─────┴───────────────────┘            │
└───────────────────┼─────────────────────────────────────┘
                    │
┌───────────────────┼─────────────────────────────────────┐
│              DATABASE (MongoDB)                          │
│  ┌────────────────┴──────────────────────┐              │
│  │  Primary (Writes) → Replica (Reads)   │              │
│  ├───────────────────────────────────────┤              │
│  │  Collections:                         │              │
│  │  ├── Courses (no embedded completers) │              │
│  │  ├── Enrollments (with time tracking) │              │
│  │  ├── LearningPaths (+ enrollment)     │              │
│  │  ├── Achievements + UserAchievements  │              │
│  │  ├── MentorshipRequests               │              │
│  │  ├── Schedules                        │              │
│  │  ├── XPLogs (new)                     │              │
│  │  └── Users (+ mentorProfile)          │              │
│  └───────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

---

## Summary Scorecard

| Tab | Flow | Strengths | Critical Issues | Scalability |
|-----|------|-----------|-----------------|-------------|
| **Explore Courses** | 8/10 | Search, filters, compare, wishlist | No recommendations, unbounded arrays | 6/10 |
| **My Learning** | 7/10 | Stats, goals, calendar, tabs | Stats loads all data, polling waste | 5/10 |
| **Learning Paths** | 4/10 | Good schema design | No detail page, no enrollment, client-side search | 4/10 |
| **Mentors** | 5/10 | Clean cards, request modal | No search/filter/pagination/detail page | 4/10 |
| **Mentor Dashboard** | 6/10 | Layout, parallel fetch, quick actions | No analytics, no earnings, auto-approve | 5/10 |
| **Achievements** | 6/10 | Categories, progress bars, seeding | Manual check, no notifications, seed on every request | 5/10 |
| **Leaderboard** | 6/10 | Podium, aggregation, metrics | Computed on every request, approximate hours | 4/10 |

**Overall Platform Readiness: MVP Stage (6/10)**
- Solid foundation with good UI/UX patterns
- Needs critical scalability fixes before production scale
- Missing key features (recommendations, certificates, analytics)
- Database schema has one critical anti-pattern (completedBy array)
