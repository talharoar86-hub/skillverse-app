# Learning Tab - Professional Improvement Plan

> **Version:** 1.0  
> **Date:** 2026-04-01  
> **Status:** Ready for Implementation  
> **Priority:** Critical — Production Readiness

---

## Executive Summary

This document provides **tab-by-tab improvement plans** covering Frontend, Backend, and Database layers. Each improvement is categorized by severity (CRITICAL / HIGH / MEDIUM / LOW) with specific file references, implementation details, and estimated effort.

**Current State:** MVP (6/10)  
**Target State:** Production-Ready Platform (9/10)  
**Timeline:** 12 weeks across 4 phases

---

## Phase 1: Critical Fixes (Week 1-2)

These MUST be done before any production deployment.

### Global — Applied to ALL Tabs

#### Backend

| # | Issue | File | Action |
|---|-------|------|--------|
| G-B1 | No rate limiting | `backend/server.js` | Add `express-rate-limit` middleware |
| G-B2 | No input validation | All routes | Add `express-validator` or `zod` |
| G-B3 | No error handling middleware | `backend/server.js` | Add centralized error handler |
| G-B4 | `seedAchievements()` on every request | `backend/routes/achievementRoutes.js` | Move to `backend/server.js` startup |
| G-B5 | No API versioning | `backend/server.js` | Prefix all routes with `/api/v1/` |

#### Frontend

| # | Issue | File | Action |
|---|-------|------|--------|
| G-F1 | No error boundaries | `frontend/src/learn/LearnLayout.jsx` | Wrap each tab in `<ErrorBoundary>` |
| G-F2 | No loading skeletons for tab switches | `frontend/src/learn/LearnLayout.jsx` | Add Suspense + skeleton fallback |
| G-F3 | LearningContext causes full re-renders | `frontend/src/context/LearningContext.jsx` | Split into separate contexts or migrate to Zustand |

#### Database

| # | Issue | File | Action |
|---|-------|------|--------|
| G-D1 | `lessons.completedBy` unbounded array | `backend/models/Learning.js` | Remove field entirely |
| G-D2 | No connection pool config | `backend/config/db.js` | Add `maxPoolSize`, `minPoolSize` |
| G-D3 | No compound index on Course for common queries | `backend/models/Learning.js` | Add `{ status: 1, category: 1, rating: -1 }` |

---

## Tab 1: Explore Courses

### Frontend Improvements

| # | Issue | Severity | File | Implementation |
|---|-------|----------|------|----------------|
| EC-F1 | No infinite scroll | LOW | `frontend/src/learn/ExploreCourses.jsx` | Replace "Load More" button with `IntersectionObserver`. Create `useInfiniteScroll` hook that triggers `handleLoadMore` when sentinel element enters viewport |
| EC-F2 | Search suggestions not keyboard navigable | MEDIUM | `frontend/src/learn/ExploreCourses.jsx` (SearchBar) | Add `onKeyDown` handler for ArrowUp/ArrowDown/Enter. Track `highlightedIndex` state. Add `aria-activedescendant` |
| EC-F3 | Filter panel not mobile responsive | MEDIUM | `frontend/src/learn/ExploreCourses.jsx` (FilterPanel) | Convert to bottom sheet drawer on `<768px`. Add backdrop overlay. Use `framer-motion` for slide-up animation |
| EC-F4 | No lazy image loading | MEDIUM | `frontend/src/learn/ExploreCourses.jsx` (CourseCard) | Add `loading="lazy"` to thumbnail `<img>`. Use `IntersectionObserver` for background-image cards |
| EC-F5 | Course cards re-render on any context change | HIGH | `frontend/src/learn/ExploreCourses.jsx` | Memoize `CourseCard` with `React.memo`. Pass only required props, not full context |
| EC-F6 | No skeleton for "Load More" | LOW | `frontend/src/learn/ExploreCourses.jsx` | Show 4 skeleton cards during append loading |
| EC-F7 | Compare drawer not accessible | LOW | `frontend/src/learn/CompareDrawer.jsx` | Add `role="dialog"`, `aria-label`, focus trap, Escape key handler |
| EC-F8 | No course preview modal | MEDIUM | New `frontend/src/learn/CoursePreviewModal.jsx` | Modal with video preview, syllabus, mentor info. Triggered on thumbnail hover (desktop) or tap (mobile) |

```javascript
// EC-F5: Memoized CourseCard example
const CourseCard = React.memo(({ course, index, isWishlisted, onToggleWishlist, isCompared, onToggleCompare }) => {
  // ... existing code
}, (prevProps, nextProps) => {
  return prevProps.course._id === nextProps.course._id &&
         prevProps.isWishlisted === nextProps.isWishlisted &&
         prevProps.isCompared === nextProps.isCompared;
});
```

### Backend Improvements

| # | Issue | Severity | File | Implementation |
|---|-------|----------|------|----------------|
| EC-B1 | Search suggestions use regex (O(n) scan) | HIGH | `backend/routes/courseRoutes.js` `/search/suggestions` | Replace regex with MongoDB Atlas Search `autocomplete` operator, or add compound text index and use `$text` with `$project` + `$limit` |
| EC-B2 | `countDocuments` on every paginated request | MEDIUM | `backend/routes/courseRoutes.js` `GET /` | Cache total count in Redis with 5-min TTL. Invalidate on course create/delete |
| EC-B3 | No Redis cache for course listings | HIGH | `backend/routes/courseRoutes.js` `GET /` | Add Redis cache layer. Cache key: `courses:${hash_of_query_params}`. TTL: 5 min |
| EC-B4 | No recommendation endpoint | HIGH | New `backend/routes/courseRoutes.js` `/recommended` | Content-based filtering: match user skills + learning goals against course tags/category. Collaborative: find courses completed by users with similar enrollments |
| EC-B5 | Categories aggregation runs every time | MEDIUM | `backend/routes/courseRoutes.js` `/categories` | Cache in Redis with 30-min TTL. Invalidate when new course is published |

```javascript
// EC-B3: Redis cache middleware example
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);
const crypto = require('crypto');

const cacheMiddleware = (prefix, ttl) => async (req, res, next) => {
  const key = `${prefix}:${crypto.createHash('md5').update(JSON.stringify(req.query)).digest('hex')}`;
  const cached = await redis.get(key);
  if (cached) return res.json(JSON.parse(cached));
  
  res._originalJson = res.json;
  res.json = (data) => {
    redis.setex(key, ttl, JSON.stringify(data));
    res._originalJson(data);
  };
  next();
};

// Usage
router.get('/', protect, cacheMiddleware('courses', 300), async (req, res) => { ... });
```

### Database Improvements

| # | Issue | Severity | File | Implementation |
|---|-------|----------|------|----------------|
| EC-D1 | Remove `completedBy` from lessons | CRITICAL | `backend/models/Learning.js` | Delete line 37. Run migration: `db.courses.updateMany({}, { $unset: { "lessons.$[].completedBy": "" } })` |
| EC-D2 | Add compound index for common filter queries | HIGH | `backend/models/Learning.js` | `CourseSchema.index({ status: 1, category: 1, level: 1, rating: -1 })` |
| EC-D3 | Add index for price filtering | MEDIUM | `backend/models/Learning.js` | `CourseSchema.index({ status: 1, price: 1 })` |
| EC-D4 | Add `previewVideoUrl` field | LOW | `backend/models/Learning.js` | `{ previewVideoUrl: String }` to schema |
| EC-D5 | Store price in cents (integer) | MEDIUM | `backend/models/Learning.js` | Add `priceInCents: Number`. Migrate: multiply existing `price` by 100. Update frontend to divide by 100 for display |

---

## Tab 2: My Learning

### Frontend Improvements

| # | Issue | Severity | File | Implementation |
|---|-------|----------|------|----------------|
| ML-F1 | No "Continue" deep-link to last lesson | HIGH | `frontend/src/learn/MyLearning.jsx` | Change "Continue" button to navigate to `/learn/course/${courseId}?lesson=${enrollment.lastAccessedLesson}` |
| ML-F2 | 60s polling wastes bandwidth | MEDIUM | `frontend/src/learn/MyLearning.jsx` | Remove `setInterval(fetchStats, 60000)`. Replace with WebSocket listener or 5-min interval |
| ML-F3 | No search within enrolled courses | MEDIUM | `frontend/src/learn/MyLearning.jsx` | Add search bar above tabs. Filter `enrollmentData` client-side by `course.title` |
| ML-F4 | No sorting options | LOW | `frontend/src/learn/MyLearning.jsx` | Add sort dropdown: Recently Accessed, Progress (high/low), Alphabetical, Enrollment Date |
| ML-F5 | `learningGoal` not in LearningContext | LOW | `frontend/src/context/LearningContext.jsx` | Add `learningGoal` to context state. Create `fetchLearningGoal` action |
| ML-F6 | Stats cards not clickable | LOW | `frontend/src/learn/MyLearning.jsx` | Make "In Progress" card clickable → filter to in-progress tab. Same for completed |
| ML-F7 | No streak-break warning notification | MEDIUM | `frontend/src/learn/MyLearning.jsx` | Show warning banner when `streakDays > 0` and user hasn't logged activity today |
| ML-F8 | No certificate download on completion | HIGH | `frontend/src/learn/MyLearning.jsx` | Add "Download Certificate" button on completed courses. Call `GET /api/certificates/:enrollmentId` |

### Backend Improvements

| # | Issue | Severity | File | Implementation |
|---|-------|----------|------|----------------|
| ML-B1 | Stats endpoint loads ALL enrollments into JS | CRITICAL | `backend/routes/enrollmentRoutes.js` `/stats` | Replace with aggregation pipeline |
| ML-B2 | No actual time tracking | HIGH | `backend/routes/enrollmentRoutes.js` | Add `PUT /:id/time` endpoint. Accept `{ seconds }` body. Increment `enrollment.timeSpentSeconds` |
| ML-B3 | No certificate generation | HIGH | New `backend/routes/certificateRoutes.js` | `GET /:enrollmentId` → Generate PDF with user name, course title, completion date, mentor name. Use `PDFKit` or `puppeteer` |
| ML-B4 | No streak reminder notification | MEDIUM | `backend/jobs/streakReminderJob.js` | Cron job at 8 PM user timezone. Check if user has activity today. Send push notification if streak > 0 |
| ML-B5 | No activity endpoint for calendar | MEDIUM | `backend/routes/learningGoalRoutes.js` | Add `GET /activity?month=4&year=2026` → return daily activity counts |

```javascript
// ML-B1: Aggregation pipeline for stats
router.get('/stats', protect, async (req, res) => {
  const stats = await Enrollment.aggregate([
    { $match: { user: req.user._id } },
    {
      $group: {
        _id: null,
        enrolled: { $sum: 1 },
        completed: { $sum: { $cond: [{ $gte: ['$progress', 100] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $and: [{ $gt: ['$progress', 0] }, { $lt: ['$progress', 100] }] }, 1, 0] } },
        bookmarked: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$bookmarkedLessons', []] } }, 0] }, 1, 0] } },
        totalLessons: { $sum: { $size: { $ifNull: ['$completedLessons', []] } } },
        totalSeconds: { $sum: { $ifNull: ['$timeSpentSeconds', 0] } }
      }
    },
    {
      $project: {
        _id: 0,
        enrolled: 1,
        completed: 1,
        inProgress: 1,
        bookmarked: 1,
        hours: { $round: [{ $divide: ['$totalSeconds', 3600] }, 1] }
      }
    }
  ]);
  res.json(stats[0] || { enrolled: 0, completed: 0, inProgress: 0, bookmarked: 0, hours: 0 });
});
```

### Database Improvements

| # | Issue | Severity | File | Implementation |
|---|-------|----------|------|----------------|
| ML-D1 | Add `timeSpentSeconds` field | HIGH | `backend/models/Enrollment.js` | `{ timeSpentSeconds: { type: Number, default: 0 } }` |
| ML-D2 | Add `lastActiveAt` field | HIGH | `backend/models/Enrollment.js` | `{ lastActiveAt: { type: Date, default: Date.now } }` |
| ML-D3 | Add index for activity queries | MEDIUM | `backend/models/Enrollment.js` | `EnrollmentSchema.index({ user: 1, lastActiveAt: -1 })` |
| ML-D4 | Add `certificateUrl` field | MEDIUM | `backend/models/Enrollment.js` | `{ certificateUrl: String, certificateIssuedAt: Date }` |
| ML-D5 | Add `lastAccessedLesson` index | LOW | `backend/models/Enrollment.js` | `EnrollmentSchema.index({ user: 1, lastAccessedLesson: 1 })` |

---

## Tab 3: Learning Paths

### Frontend Improvements

| # | Issue | Severity | File | Implementation |
|---|-------|----------|------|----------------|
| LP-F1 | No detail page exists | CRITICAL | New `frontend/src/learn/LearningPathDetail.jsx` | Create full detail page: path info, course list with progress, enroll button, estimated duration |
| LP-F2 | Client-side search only | HIGH | `frontend/src/learn/LearningPaths.jsx` | Use backend search param. Add debounced search input that calls `GET /api/learning-paths?search=` |
| LP-F3 | No pagination | MEDIUM | `frontend/src/learn/LearningPaths.jsx` | Add "Load More" or infinite scroll like ExploreCourses |
| LP-F4 | No path enrollment UI | HIGH | `frontend/src/learn/LearningPathDetail.jsx` | Add "Start Learning Path" button. Track enrollment. Show progress bar |
| LP-F5 | No progress visualization | HIGH | `frontend/src/learn/LearningPathDetail.jsx` | Show step-by-step course list with checkmarks for completed, progress for in-progress, lock for unavailable |
| LP-F6 | No estimated duration shown | LOW | `frontend/src/learn/LearningPaths.jsx` | Calculate from sum of lesson durations. Display "X hours" on card |
| LP-F7 | No empty state differentiation | LOW | `frontend/src/learn/LearningPaths.jsx` | Different messages for "no paths exist" vs "no search results" |

```javascript
// LP-F1: LearningPathDetail.jsx structure
const LearningPathDetail = () => {
  // State
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  // Fetch path with course progress
  useEffect(() => {
    api.get(`/learning-paths/${pathId}`).then(setPath).finally(() => setLoading(false));
  }, [pathId]);

  // Enroll in path
  const handleEnroll = async () => {
    setEnrolling(true);
    await api.post(`/learning-paths/${pathId}/enroll`);
    // Refresh path data
  };

  // Render: hero section, course steps (1→2→3→...), progress bar, creator info
};
```

### Backend Improvements

| # | Issue | Severity | File | Implementation |
|---|-------|----------|------|----------------|
| LP-B1 | No path enrollment endpoint | HIGH | `backend/routes/learningPathRoutes.js` | Add `POST /:id/enroll` — create `PathEnrollment` record |
| LP-B2 | No path progress endpoint | HIGH | `backend/routes/learningPathRoutes.js` | Add `GET /:id/progress` — calculate from course enrollments |
| LP-B3 | No search on backend (frontend ignores it) | MEDIUM | `backend/routes/learningPathRoutes.js` | Already supports `search` param — ensure frontend uses it |
| LP-B4 | No path recommendation | MEDIUM | New `backend/routes/learningPathRoutes.js` `/recommended` | Match user skills against path tags/category |
| LP-B5 | No prerequisite validation | MEDIUM | `backend/routes/learningPathRoutes.js` | Add `prerequisites: [{ type: ObjectId, ref: 'LearningPath' }]`. Validate before enrollment |

### Database Improvements

| # | Issue | Severity | File | Implementation |
|---|-------|----------|------|----------------|
| LP-D1 | No PathEnrollment model | HIGH | New `backend/models/PathEnrollment.js` | `{ user, path, completedCourses: [ObjectId], progress: Number, enrolledAt, completedAt }` |
| LP-D2 | Add `prerequisites` to LearningPath | MEDIUM | `backend/models/LearningPath.js` | `{ prerequisites: [{ type: ObjectId, ref: 'LearningPath' }] }` |
| LP-D3 | Add `estimatedDurationMinutes` computed field | LOW | `backend/models/LearningPath.js` | `{ estimatedDurationMinutes: Number }`. Calculate on save from lesson durations |
| LP-D4 | Add text search index | MEDIUM | `backend/models/LearningPath.js` | `LearningPathSchema.index({ title: 'text', description: 'text', tags: 'text' })` |
| LP-D5 | Add index for status + category queries | MEDIUM | `backend/models/LearningPath.js` | Already has `{ status: 1, category: 1 }` — good |

---

## Tab 4: Mentors

### Frontend Improvements

| # | Issue | Severity | File | Implementation |
|---|-------|----------|------|----------------|
| MT-F1 | No search or filter | HIGH | `frontend/src/learn/MentorsPage.jsx` | Add search bar (name/skill), filter chips (skill, availability, price range), sort dropdown (rating, price, experience) |
| MT-F2 | No pagination | HIGH | `frontend/src/learn/MentorsPage.jsx` | Add server-side pagination with "Load More" |
| MT-F3 | No mentor profile detail page | HIGH | New `frontend/src/learn/MentorProfileDetail.jsx` | Full page: bio, skills, reviews, courses, schedule, availability calendar, "Connect" CTA |
| MT-F4 | No reviews visible on cards | HIGH | `frontend/src/learn/MentorCard.jsx` | Add review count + average rating display below mentor name |
| MT-F5 | No real-time availability indicator | MEDIUM | `frontend/src/learn/MentorCard.jsx` | Show green dot for `isOnline: true`. Use Socket.io to update in real-time |
| MT-F6 | No skill-based matching | HIGH | `frontend/src/learn/MentorsPage.jsx` | Add "Recommended for You" section at top based on user's `skills` and `learningGoals` |
| MT-F7 | No sorting | MEDIUM | `frontend/src/learn/MentorsPage.jsx` | Add sort: Rating (high→low), Price (low→high), Experience, Most Students |

### Backend Improvements

| # | Issue | Severity | File | Implementation |
|---|-------|----------|------|----------------|
| MT-B1 | No paginated mentors endpoint | HIGH | `backend/routes/mentorshipRoutes.js` | Add `GET /mentors?page=&limit=&search=&skill=&sort=&minRating=` |
| MT-B2 | No mentor profile detail endpoint | HIGH | `backend/routes/mentorRoutes.js` | Add `GET /profile/:id` — return mentor info + courses + reviews + schedule |
| MT-B3 | No mentor search by skill | HIGH | `backend/routes/mentorshipRoutes.js` | Add `$match` on `mentorProfile.skills.name` in aggregation |
| MT-B4 | No skill-based matching | HIGH | New `backend/services/mentorMatchingService.js` | Match user skills/learningGoals against mentor skills. Return ranked list |
| MT-B5 | Track mentor profile views | LOW | `backend/routes/mentorRoutes.js` | Increment `MentorProfileView` on `GET /profile/:id` |

### Database Improvements

| # | Issue | Severity | File | Implementation |
|---|-------|----------|------|----------------|
| MT-D1 | Add index on `mentorStatus` + `isMentor` | HIGH | `backend/models/User.js` | `UserSchema.index({ isMentor: 1, mentorStatus: 1 })` |
| MT-D2 | Add index on `mentorProfile.skills.name` | HIGH | `backend/models/User.js` | `UserSchema.index({ 'mentorProfile.skills.name': 1 })` |
| MT-D3 | Add `mentorProfile.rating` index for sorting | MEDIUM | `backend/models/User.js` | `UserSchema.index({ isMentor: 1, 'mentorProfile.rating': -1 })` |
| MT-D4 | Add `mentorProfile.pricing` index for filtering | LOW | `backend/models/User.js` | `UserSchema.index({ isMentor: 1, 'mentorProfile.pricing': 1 })` |
| MT-D5 | Create MentorReview model if not exists | HIGH | Check `backend/models/CourseReview.js` | Reuse or create dedicated mentor review model with `{ mentor, reviewer, rating, comment }` |

---

## Tab 5: Mentor Dashboard

### Frontend Improvements

| # | Issue | Severity | File | Implementation |
|---|-------|----------|------|----------------|
| MD-F1 | No analytics charts | HIGH | `frontend/src/mentor/MentorOverview.jsx` | Add charts using `recharts`: Student Growth (line), Session Distribution (pie), Revenue Trend (bar), Course Completion Rate (progress) |
| MD-F2 | No earnings display | HIGH | `frontend/src/mentor/MentorOverview.jsx` | Add earnings stat card. Show monthly/total earnings. Add earnings chart |
| MD-F3 | No course analytics | HIGH | `frontend/src/mentor/MentorCourses.jsx` | Add per-course stats: views, enrollments, completion rate, avg rating |
| MD-F4 | No student progress visibility | MEDIUM | New `frontend/src/mentor/MentorStudents.jsx` | List of students with progress bars for each enrolled course |
| MD-F5 | No review reply functionality | MEDIUM | `frontend/src/mentor/MentorReviews.jsx` | Add "Reply" button on each review. POST reply text |
| MD-F6 | No bulk request actions | LOW | `frontend/src/mentor/MentorNotifications.jsx` | Add checkboxes + "Accept Selected" / "Reject Selected" buttons |
| MD-F7 | Schedule lacks timezone support | MEDIUM | `frontend/src/mentor/MentorSchedule.jsx` | Add timezone selector. Store slots in UTC, display in mentor's timezone |
| MD-F8 | No CSV export | LOW | `frontend/src/mentor/MentorStudents.jsx` | Add "Export CSV" button. Generate client-side from student data |

```javascript
// MD-F1: Analytics charts example
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AnalyticsSection = ({ stats }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Student Growth */}
    <div className="bg-white rounded-2xl border p-6">
      <h3 className="font-bold text-sm mb-4">Student Growth</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={stats.studentGrowth}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="students" stroke="#6366f1" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
    {/* Course Completion Rate */}
    <div className="bg-white rounded-2xl border p-6">
      <h3 className="font-bold text-sm mb-4">Course Completion</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={stats.completionRate} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
            {stats.completionRate.map((_, i) => <Cell key={i} fill={['#6366f1', '#e2e8f0'][i]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </div>
);
```

### Backend Improvements

| # | Issue | Severity | File | Implementation |
|---|-------|----------|------|----------------|
| MD-B1 | `totalEarnings` hardcoded to 0 | HIGH | `backend/routes/mentorRoutes.js` `/dashboard/stats` | Add `Earning` model. Track per transaction. Sum in stats |
| MD-B2 | No analytics endpoint | HIGH | New `backend/routes/mentorAnalyticsRoutes.js` | `GET /analytics` → student growth over time, enrollment trends, completion rates, revenue |
| MD-B3 | No course-specific analytics | HIGH | `backend/routes/mentorRoutes.js` | `GET /dashboard/courses/:courseId/stats` → views, enrollments, completion rate, avg rating |
| MD-B4 | No review reply endpoint | MEDIUM | `backend/routes/courseReviewRoutes.js` | Add `POST /:id/reply` — store `mentorReply: { text, date }` on review |
| MD-B5 | No mentor verification workflow | HIGH | `backend/routes/mentorRoutes.js` `/apply` | Change auto-approve to `pending`. Add admin approval endpoint. Add email notification |
| MD-B6 | No student list with progress | MEDIUM | `backend/routes/mentorRoutes.js` | Enhance `/dashboard/students` to include per-course progress percentage |
| MD-B7 | No CSV export endpoint | LOW | `backend/routes/mentorRoutes.js` | Add `GET /dashboard/students/export` → return CSV stream |

### Database Improvements

| # | Issue | Severity | File | Implementation |
|---|-------|----------|------|----------------|
| MD-D1 | No Earning model | HIGH | New `backend/models/Earning.js` | `{ mentor, amount, source: 'course'|'mentorship', reference: ObjectId, createdAt }` |
| MD-D2 | Add `mentorReply` to CourseReview | MEDIUM | `backend/models/CourseReview.js` | `{ mentorReply: { text: String, repliedAt: Date } }` |
| MD-D3 | Add index on `CourseReview` for mentor queries | MEDIUM | `backend/models/CourseReview.js` | `CourseReviewSchema.index({ mentorId: 1, createdAt: -1 })` |
| MD-D4 | Add `views` counter to Course | MEDIUM | `backend/models/Learning.js` | `{ views: { type: Number, default: 0 } }`. Increment on `GET /:id` |
| MD-D5 | Add `mentorStatus` index for admin queries | LOW | `backend/models/User.js` | Already has `{ mentorStatus: 1 }` — good |

---

## Tab 6: Achievements

### Frontend Improvements

| # | Issue | Severity | File | Implementation |
|---|-------|----------|------|----------------|
| AC-F1 | Manual "Check Progress" button is bad UX | CRITICAL | `frontend/src/learn/Achievements.jsx` | Remove button. Auto-check on mount. Listen for WebSocket `achievement:unlock` events |
| AC-F2 | No unlock animation/notification | HIGH | New `frontend/src/components/AchievementUnlockToast.jsx` | Show confetti + badge animation toast when achievement unlocks. Use `react-hot-toast` custom component |
| AC-F3 | No XP display | HIGH | `frontend/src/learn/Achievements.jsx` | Add XP total in summary banner. Show "+50 XP" animation on unlock |
| AC-F4 | No achievement showcase on profile | MEDIUM | `frontend/src/components/ProfilePage.jsx` | Add "Achievements" section showing unlocked badges (max 6 featured) |
| AC-F5 | Only 9 achievements visible | MEDIUM | `frontend/src/learn/Achievements.jsx` | Add rarity tiers with different border colors (Bronze/Silver/Gold/Platinum) |
| AC-F6 | No progress milestone notifications | MEDIUM | `frontend/src/learn/Achievements.jsx` | Show "2 more courses to unlock Course Master!" inline on progress bars |
| AC-F7 | No sharing to social feed | MEDIUM | `frontend/src/learn/Achievements.jsx` | Add "Share" button on unlocked achievements → create post with badge image |

### Backend Improvements

| # | Issue | Severity | File | Implementation |
|---|-------|----------|------|----------------|
| AC-B1 | Auto-trigger achievement check | CRITICAL | `backend/routes/enrollmentRoutes.js` | After progress update, call achievement check service asynchronously |
| AC-B2 | Move seeding to startup | HIGH | `backend/server.js` | Call `seedAchievements()` once in `server.js` after DB connection |
| AC-B3 | Implement XP tracking | HIGH | New `backend/models/XPLog.js` | Log XP on: course complete, achievement unlock, streak, review, note |
| AC-B4 | Add XP endpoint | HIGH | New `backend/routes/xpRoutes.js` | `GET /xp` → total XP + recent transactions + level |
| AC-B5 | Add more achievement types | MEDIUM | `backend/routes/achievementRoutes.js` | Add: mentoring (accept 5 mentees), social (comment 20 times), referral (invite 3 friends) |
| AC-B6 | Add achievement progress notifications | MEDIUM | New `backend/jobs/achievementProgressJob.js` | Check at 50%, 75%, 90% progress. Send notification |
| AC-B7 | Emit WebSocket event on unlock | HIGH | `backend/routes/achievementRoutes.js` | After `newUnlocks.push()`, emit `io.to(userId).emit('achievement:unlock', achievement)` |

### Database Improvements

| # | Issue | Severity | File | Implementation |
|---|-------|----------|------|----------------|
| AC-D1 | Create XPLog model | HIGH | New `backend/models/XPLog.js` | `{ user, amount, reason, metadata: {}, createdAt }`. Index: `{ user: 1, createdAt: -1 }` |
| AC-D2 | Add `totalXP` to User model | HIGH | `backend/models/User.js` | `{ totalXP: { type: Number, default: 0 } }`. Increment on XP events |
| AC-D3 | Add `level` computed field | MEDIUM | `backend/models/User.js` | Virtual or stored: `Math.floor(totalXP / 1000) + 1` |
| AC-D4 | Add `rarity` to Achievement | MEDIUM | `backend/models/Achievement.js` | `{ rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' } }` |
| AC-D5 | Add index for user achievements lookup | MEDIUM | `backend/models/UserAchievement.js` | Already has `{ user: 1, achievement: 1 }` — good. Add `{ user: 1, unlockedAt: -1 }` for "recently unlocked" |

---

## Tab 7: Leaderboard

### Frontend Improvements

| # | Issue | Severity | File | Implementation |
|---|-------|----------|------|----------------|
| LB-F1 | No user rank if outside top 20 | HIGH | `frontend/src/learn/Leaderboard.jsx` | After fetching leaderboard, if user not in list, fetch `GET /api/leaderboard/my-rank?metric=&period=`. Show in separate card |
| LB-F2 | No pagination beyond top 20 | MEDIUM | `frontend/src/learn/Leaderboard.jsx` | Add "View Full Leaderboard" → modal or separate page with virtual scrolling |
| LB-F3 | No rank change indicators | LOW | `frontend/src/learn/Leaderboard.jsx` | Add up/down arrows showing rank change from previous period |
| LB-F4 | No friends-only leaderboard | MEDIUM | `frontend/src/learn/Leaderboard.jsx` | Add tab: "Global" vs "Friends". Fetch friends leaderboard separately |
| LB-F5 | No animated rank transitions | LOW | `frontend/src/learn/Leaderboard.jsx` | Use `framer-motion` AnimatePresence for list reordering |
| LB-F6 | Podium doesn't handle < 3 entries | MEDIUM | `frontend/src/learn/Leaderboard.jsx` | Add conditional: if `leaderboard.length < 3`, show flat list instead of podium |
| LB-F7 | No rewards display | HIGH | `frontend/src/learn/Leaderboard.jsx` | Show "Top 3 this month get: Gold Badge + 500 XP" banner |

### Backend Improvements

| # | Issue | Severity | File | Implementation |
|---|-------|----------|------|----------------|
| LB-B1 | Leaderboard computed on every request | CRITICAL | `backend/routes/leaderboardRoutes.js` | Pre-compute every 5 minutes via cron. Store in Redis. Serve from cache |
| LB-B2 | Hours calculation is approximate | HIGH | `backend/routes/leaderboardRoutes.js` | Use `timeSpentSeconds` from Enrollment (after ML-D1). Replace `totalLessons * 0.5` |
| LB-B3 | No individual user rank endpoint | HIGH | `backend/routes/leaderboardRoutes.js` | Add `GET /my-rank?metric=&period=` → use aggregation with `$rank` window operator (MongoDB 5.0+) |
| LB-B4 | No XP-based leaderboard | MEDIUM | `backend/routes/leaderboardRoutes.js` | Add `metric=xp` option. Aggregate from `XPLog` collection |
| LB-B5 | No rank rewards automation | HIGH | New `backend/jobs/leaderboardRewardsJob.js` | Monthly cron: top 3 get achievement + XP bonus. Create `LeaderboardReward` model |
| LB-B6 | Streak leaderboard doesn't respect period filter | MEDIUM | `backend/routes/leaderboardRoutes.js` | Add date-based streak tracking in `LearningGoal` model |
| LB-B7 | No prevRank tracking | LOW | `backend/routes/leaderboardRoutes.js` | Store previous period's ranks in Redis. Calculate diff |

```javascript
// LB-B1: Pre-computed leaderboard with cron
const cron = require('node-cron');
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

async function computeLeaderboard(metric, period) {
  // ... existing aggregation logic ...
  const results = await Enrollment.aggregate(pipeline);
  await redis.setex(`leaderboard:${metric}:${period}`, 300, JSON.stringify(results));
}

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  for (const metric of ['hours', 'courses', 'streak', 'xp']) {
    for (const period of ['all-time', 'monthly', 'weekly']) {
      await computeLeaderboard(metric, period);
    }
  }
});

// Serve from cache
router.get('/', protect, async (req, res) => {
  const { metric = 'hours', period = 'all-time' } = req.query;
  const cached = await redis.get(`leaderboard:${metric}:${period}`);
  if (cached) return res.json(JSON.parse(cached));
  // Fallback to real-time computation
});
```

### Database Improvements

| # | Issue | Severity | File | Implementation |
|---|-------|----------|------|----------------|
| LB-D1 | Add `timeSpentSeconds` to Enrollment | HIGH | `backend/models/Enrollment.js` | Same as ML-D1 — shared dependency |
| LB-D2 | Create LeaderboardSnapshot model | MEDIUM | New `backend/models/LeaderboardSnapshot.js` | `{ metric, period, rankings: [{ user, score, rank }], computedAt }`. For historical data |
| LB-D3 | Add `totalXP` to User for XP leaderboard | HIGH | `backend/models/User.js` | Same as AC-D2 — shared dependency |
| LB-D4 | Add compound index for leaderboard aggregation | MEDIUM | `backend/models/Enrollment.js` | `EnrollmentSchema.index({ user: 1, progress: 1, completedLessons: 1 })` |
| LB-D5 | Add `prevRank` to LeaderboardSnapshot | LOW | `backend/models/LeaderboardSnapshot.js` | `{ prevRank: Number }` in rankings array |

---

## Implementation Dependencies Graph

```
Phase 1 (Critical)                    Phase 2 (Performance)
┌─────────────────────┐               ┌─────────────────────┐
│ G-D1: Remove        │──────────────▶│ EC-B3: Redis cache  │
│ completedBy         │               │ for courses          │
│                     │               │                     │
│ ML-B1: Stats        │──────────────▶│ ML-B2: Time         │
│ aggregation         │               │ tracking endpoint    │
│                     │               │                     │
│ LP-F1: Path detail  │──────────────▶│ LP-B1: Path         │
│ page                │               │ enrollment           │
│                     │               │                     │
│ AC-B2: Seed on      │──────────────▶│ AC-B1: Auto         │
│ startup             │               │ achievement check    │
│                     │               │                     │
│ LB-B1: Cache        │──────────────▶│ LB-B2: Real hours   │
│ leaderboard         │               │ tracking             │
└─────────────────────┘               └──────────┬──────────┘
                                                 │
                                    Phase 3 (Features) ──▶ Phase 4 (Scale)
                                    ┌─────────────┴──────────────────────┐
                                    │ AC-B3: XP system                   │
                                    │ MD-B1: Earnings tracking           │
                                    │ MT-B4: Mentor matching             │
                                    │ EC-B4: Recommendations             │
                                    │ LB-B5: Rank rewards                │
                                    └────────────────────────────────────┘
```

---

## Effort Estimation

| Phase | Tabs Affected | Backend Tasks | Frontend Tasks | DB Tasks | Est. Hours |
|-------|---------------|---------------|----------------|----------|------------|
| **Phase 1** | All | 6 | 3 | 3 | 80h |
| **Phase 2** | Explore, MyLearning, Mentors, Leaderboard | 7 | 5 | 5 | 100h |
| **Phase 3** | All (feature additions) | 10 | 8 | 6 | 140h |
| **Phase 4** | All (scale infra) | 6 | 3 | 2 | 80h |
| **Total** | — | **29** | **19** | **16** | **400h** |

---

## File Change Summary

### New Files to Create (12)

| File | Purpose |
|------|---------|
| `frontend/src/learn/LearningPathDetail.jsx` | Learning path detail page |
| `frontend/src/learn/MentorProfileDetail.jsx` | Mentor profile detail page |
| `frontend/src/components/AchievementUnlockToast.jsx` | Achievement unlock notification |
| `frontend/src/components/ErrorBoundary.jsx` | Reusable error boundary |
| `frontend/src/hooks/useInfiniteScroll.js` | Infinite scroll hook |
| `backend/models/XPLog.js` | XP transaction log |
| `backend/models/Earning.js` | Mentor earnings |
| `backend/models/PathEnrollment.js` | Learning path enrollment |
| `backend/models/LeaderboardSnapshot.js` | Pre-computed leaderboard data |
| `backend/services/cacheService.js` | Redis caching service |
| `backend/services/recommendationService.js` | Course/mentor recommendations |
| `backend/jobs/leaderboardRewardsJob.js` | Monthly leaderboard rewards |

### Existing Files to Modify (23)

| File | Changes |
|------|---------|
| `backend/models/Learning.js` | Remove `completedBy`, add `views`, `previewVideoUrl`, compound indexes |
| `backend/models/Enrollment.js` | Add `timeSpentSeconds`, `lastActiveAt`, `certificateUrl`, new indexes |
| `backend/models/User.js` | Add `totalXP`, `level`, mentor indexes |
| `backend/models/Achievement.js` | Add `rarity` field |
| `backend/models/LearningPath.js` | Add `prerequisites`, text index |
| `backend/models/CourseReview.js` | Add `mentorReply` |
| `backend/routes/courseRoutes.js` | Redis cache, fix suggestions, add recommendations |
| `backend/routes/enrollmentRoutes.js` | Stats aggregation, time tracking, auto-achievement check |
| `backend/routes/achievementRoutes.js` | Remove seed, add WebSocket emit |
| `backend/routes/leaderboardRoutes.js` | Redis cache, user rank endpoint, XP metric |
| `backend/routes/learningPathRoutes.js` | Enrollment endpoint, progress endpoint |
| `backend/routes/mentorRoutes.js` | Analytics, earnings, verification workflow |
| `backend/routes/mentorshipRoutes.js` | Paginated mentors, search, skill matching |
| `backend/server.js` | Rate limiting, seed on startup, API versioning, Redis setup |
| `frontend/src/learn/ExploreCourses.jsx` | Memoized cards, lazy images, keyboard nav |
| `frontend/src/learn/MyLearning.jsx` | Deep-link continue, search, sort, streak warning |
| `frontend/src/learn/LearningPaths.jsx` | Server-side search, pagination, duration display |
| `frontend/src/learn/MentorsPage.jsx` | Search, filter, sort, pagination, online indicator |
| `frontend/src/learn/MentorCard.jsx` | Reviews display, online indicator |
| `frontend/src/learn/Achievements.jsx` | Remove manual check, add XP, unlock animations |
| `frontend/src/learn/Leaderboard.jsx` | User rank, pagination, rewards banner |
| `frontend/src/mentor/MentorOverview.jsx` | Analytics charts, earnings card |
| `frontend/src/context/LearningContext.jsx` | Split or migrate to Zustand, add learningGoal |

---

## Done Criteria

Each tab is considered "done" when:

1. **All CRITICAL issues** resolved
2. **All HIGH issues** resolved
3. **Performance**: Page loads < 2s on 3G, API responses < 500ms (cached), < 2s (uncached)
4. **Scalability**: Handles 10K concurrent users, 1M enrollments, 100K courses
5. **Accessibility**: WCAG 2.1 AA compliant (keyboard nav, screen reader, contrast)
6. **Error handling**: No unhandled errors, all states covered (loading/error/empty/data)
7. **Mobile responsive**: Works on 320px-2560px viewport
