# Professional Explore Courses & My Learning - Implementation Plan

## Overview
Transform the current basic Explore Courses and My Learning features into a world-class, Udemy/Coursera-style learning platform with full LMS capabilities.

**User Choices:**
- Scope: Core Infrastructure First
- Explore UX: Udemy/Coursera Style (category mega-menu, autocomplete search, filter chips, wishlists)
- My Learning UX: Full LMS Dashboard (learning paths, goals, calendar, notes, badges, leaderboard, reminders)

---

## Current State Summary

### Explore Courses Flow
`ExploreCourses.jsx` → `courseService.getCourses()` → `GET /api/courses` → returns ALL published courses → client-side search filter → `CourseCard` grid → click → `CourseDetail.jsx` → enroll → `POST /api/enrollment/:courseId`

### My Learning Flow
`MyLearning.jsx` → `enrollmentService.getMyCourses(filter)` → `GET /api/enrollment/my-courses` → enrolled courses with progress → click → `CourseDetail.jsx` (player mode) → mark lessons complete → `PUT /api/enrollment/:id/progress`

### Critical Issues Found
1. **No pagination** - loads ALL courses/enrollments at once
2. **Client-side search only** - no server-side filtering/sorting
3. **No reviews/ratings** - model exists but API routes never created
4. **No payment system** - premium courses enrollable for free
5. **Duplicate legacy code** - `learningRoutes.js`, `LearnTab.jsx`, unused backend services
6. **No caching/state management** - refetches on every navigation, polling every 30s
7. **No certificates, quizzes, discussions, learning paths**

---

## Phase 1: Core Infrastructure & Cleanup (Foundation)

### 1.1 Remove Legacy/Dead Code
**Files to delete:**
- `backend/routes/learningRoutes.js` - duplicate of `courseRoutes.js`, both mounted at `/api/courses`
- `backend/controllers/learningController.js` - legacy controller
- `backend/services/courseService.js` (backend) - barely used, routes query DB directly
- `backend/services/enrollmentService.js` (backend) - never used by any route
- `frontend/src/learn/LearnTab.jsx` - 573-line legacy monolithic component

**Action items:**
- Remove `learningRoutes` mount from `backend/routes/index.js`
- Remove legacy `PUT /api/courses/:id/progress` endpoint (duplicate of enrollment-based progress)
- Update any imports/references that point to deleted files

### 1.2 Server-Side Pagination
**Backend changes:**
- `GET /api/courses` - accept `?page=1&limit=12&sort=newest|popular|rating|price_low|price_high`
- Return `{ courses: [], total: number, page: number, totalPages: number, hasMore: boolean }`
- `GET /api/enrollment/my-courses` - accept `?page=1&limit=10`
- Return same paginated structure

**Frontend changes:**
- `ExploreCourses.jsx` - implement infinite scroll with "Load More" or pagination controls
- `MyLearning.jsx` - implement pagination
- Add skeleton loading placeholders during fetch

### 1.3 Server-Side Search & Filtering
**Backend changes:**
- Create MongoDB text index on `Course`: `{ title: 'text', description: 'text', tags: 'text', category: 'text' }`
- `GET /api/courses` query params: `?search=react&category=Web+Development&level=Beginner&price=free|paid&minRating=4`
- Build dynamic MongoDB query from all params
- Support multiple categories/levels (comma-separated)

**Frontend changes:**
- Debounced search input (300ms) that triggers API call instead of client-side filter
- Remove current client-side `filteredCourses` logic
- Filter chips that add query params and refetch

### 1.4 Global State Management & Caching
**Approach:** React Context + custom hooks (no extra dependencies)

**Create:** `frontend/src/context/LearningContext.jsx`
- Course catalog cache with TTL (5 min)
- My Learning enrollments cache
- Learning stats cache
- Optimistic updates for enrollment, progress, bookmarks
- Cache invalidation on mutations

**Create:** `frontend/src/hooks/useCourses.js` - custom hook wrapping LearningContext
**Create:** `frontend/src/hooks/useEnrollments.js` - custom hook for enrollment data

**Refactor:**
- `ExploreCourses.jsx` → use `useCourses()` hook
- `MyLearning.jsx` → use `useEnrollments()` hook
- `CourseDetail.jsx` → use both hooks
- Remove direct `courseService`/`enrollmentService` calls from components

### 1.5 Reviews & Ratings System
**Backend:**
- Create `backend/routes/reviewRoutes.js`:
  - `POST /api/reviews/:courseId` - submit review (stars + text)
  - `GET /api/reviews/:courseId` - get course reviews (paginated)
  - `PUT /api/reviews/:id` - update own review
  - `DELETE /api/reviews/:id` - delete own review
- On review create/update: recalculate `Course.rating` (avg) and `Course.totalReviews`
- Validate: user must be enrolled, one review per user per course

**Frontend:**
- Add review section to `CourseDetail.jsx` (star rating + text input + review list)
- Display aggregate rating on `CourseCard` with real data
- Sort reviews by: newest, highest, lowest

---

## Phase 2: Udemy/Coursera-Style Explore Courses

### 2.1 Category Mega Menu
**Backend:**
- `GET /api/courses/categories` - returns distinct categories with course counts

**Frontend:**
- Create `frontend/src/learn/CategoryMegaMenu.jsx`
  - Hover-triggered dropdown from sidebar/nav
  - Grouped categories with course count badges
  - Popular courses preview per category
- Create `frontend/src/learn/CategoryPage.jsx` - dedicated page per category
- Add route: `/learn/explore/:category`

### 2.2 Search with Autocomplete
**Backend:**
- `GET /api/courses/search/suggestions?q=react` - returns top 10 matching titles + categories
- MongoDB text index prefix matching

**Frontend:**
- Create `frontend/src/learn/SearchBar.jsx`
  - Debounced input (200ms)
  - Dropdown suggestions: courses, categories, mentors
  - Recent searches (localStorage)
  - Trending searches section
  - Keyboard navigation (arrow keys + enter)

### 2.3 Filter Chips & Advanced Filtering
**Frontend:**
- Create `frontend/src/learn/FilterChips.jsx` - removable filter chips below search bar
- Create `frontend/src/learn/FilterPanel.jsx` (sidebar on desktop, bottom sheet on mobile)
  - Category checkboxes with counts
  - Level radio buttons
  - Price range slider
  - Rating filter (4+ stars, 3+ stars, etc.)
  - Duration filter (< 1hr, 1-3hrs, 3+hrs, 10+hrs)
  - Clear all filters button
- Grid/List view toggle
- Sort dropdown: Relevance, Newest, Most Popular, Highest Rated, Price Low-High, Price High-Low
- URL query param sync (shareable filtered URLs)

### 2.4 Course Cards Enhancement
**Update CourseCard:**
- Add to Wishlist button (heart icon, top-right)
- Course duration (total estimated time from lessons)
- Student count display
- Hover preview card (expanded info on hover, like Udemy)

### 2.5 Wishlist System
**Backend:**
- Create `backend/models/Wishlist.js`: `{ user: ObjectId, courses: [ObjectId] }`
- Create `backend/routes/wishlistRoutes.js`:
  - `GET /api/wishlist` - get user's wishlist
  - `POST /api/wishlist/:courseId` - add to wishlist
  - `DELETE /api/wishlist/:courseId` - remove from wishlist

**Frontend:**
- Add wishlist toggle to CourseCard and CourseDetail
- Create `frontend/src/learn/WishlistPage.jsx` or tab in My Learning
- Heart icon animation on toggle

### 2.6 Course Comparison
**Frontend:**
- Create `frontend/src/learn/CompareDrawer.jsx` - floating bottom drawer (max 3-4 courses)
- Create `frontend/src/learn/CourseComparison.jsx` - side-by-side view
  - Compare: price, level, duration, rating, lesson count, instructor, topics
- Add "Add to Compare" on CourseCard
- Store compare selection in sessionStorage

---

## Phase 3: Full LMS My Learning Dashboard

### 3.1 Enhanced Dashboard Overview
**Update `MyLearning.jsx`:**
- Top stats row: Enrolled, In Progress, Completed, Hours Learned, Current Streak
- Weekly goal progress bar (configurable: courses/week, hours/week)
- Continue Learning carousel (horizontal scroll, last accessed courses)
- Recently completed section
- Recommended next courses based on enrollment history

### 3.2 Learning Paths
**Backend:**
- Create `backend/models/LearningPath.js`:
  ```
  { title, description, thumbnail, creator (mentorId),
    courses: [{ course: ObjectId, order: Number, required: Boolean }],
    category, level, estimatedDuration, tags }
  ```
- Create `backend/routes/learningPathRoutes.js`:
  - CRUD for learning paths (mentor-only create)
  - `GET /api/learning-paths` - browse paths
  - `GET /api/learning-paths/:id` - path detail with progress
  - `POST /api/learning-paths/:id/enroll` - enroll in path

**Frontend:**
- Create `frontend/src/learn/LearningPaths.jsx` - browse paths
- Create `frontend/src/learn/LearningPathDetail.jsx` - path detail with ordered courses
- Add "Paths" tab to LearnSidebar
- Progress visualization: course-by-course completion within path

### 3.3 Weekly Goals & Streaks
**Backend:**
- Create `backend/models/LearningGoal.js`:
  ```
  { user, weeklyHoursTarget, weeklyCoursesTarget,
    currentWeekHours, currentWeekCourses, streakDays,
    lastActiveDate, goalHistory: [{ week, hours, courses }] }
  ```
- Create `backend/routes/learningGoalRoutes.js`:
  - `PUT /api/learning-goals` - set goals
  - `GET /api/learning-goals` - get goals + current progress
- Update streak on user activity (login, lesson complete)

**Frontend:**
- Create `frontend/src/learn/LearningGoals.jsx` - goal setting widget
- Streak counter with fire animation
- Weekly progress rings/charts
- Goal completion celebration animation

### 3.4 Calendar View
**Frontend:**
- Create `frontend/src/learn/LearningCalendar.jsx`
  - Monthly calendar showing days with learning activity
  - Color-coded intensity (GitHub contribution graph style)
  - Click day to see what was studied
- Use `date-fns` for date logic (already available via other deps)

### 3.5 Notes Per Lesson
**Backend:**
- Create `backend/models/LessonNote.js`:
  ```
  { user, course, lessonIndex, content (text), createdAt, updatedAt }
  ```
- Create `backend/routes/lessonNoteRoutes.js`:
  - `POST /api/notes` - create note
  - `GET /api/notes?course=X&lesson=Y` - get notes
  - `PUT /api/notes/:id` - update note
  - `DELETE /api/notes/:id` - delete note

**Frontend:**
- Add notes panel to `CourseDetail.jsx` player mode
  - Collapsible side panel
  - Plain text (Phase 1), markdown later
  - Timestamp-linked notes (mark at current video time)

### 3.6 Achievement Badges
**Backend:**
- Create `backend/models/Achievement.js`:
  ```
  { name, description, icon, criteriaType, criteriaThreshold, category }
  ```
- Create `backend/models/UserAchievement.js`:
  ```
  { user, achievement, unlockedAt, progress }
  ```
- Create `achievementService.js` - check + award badges after key actions
- Predefined achievements:
  - First Course Enrolled, First Course Completed
  - 5/10/25 Courses Completed
  - 7/30/100 Day Streak
  - 10/50/100 Hours Learned
  - First Review, First Note

**Frontend:**
- Create `frontend/src/learn/Achievements.jsx` - achievement showcase
- Create `frontend/src/components/AchievementBadge.jsx` - badge component
- Toast notification on badge unlock

### 3.7 Leaderboard
**Backend:**
- `GET /api/leaderboard?period=weekly|monthly|all-time&metric=hours|courses|streak`
- Aggregate pipeline: group by user, sum progress, sort
- Cache results in-memory with 5 min TTL

**Frontend:**
- Create `frontend/src/learn/Leaderboard.jsx`
  - Tabs: This Week, This Month, All Time
  - Top 3 podium display
  - Current user highlighted

### 3.8 Study Reminders
**Backend:**
- Create `backend/models/StudyReminder.js`:
  ```
  { user, enabled, days: [0-6], time: "18:00", timezone }
  ```
- Create reminder notification via existing Notification system

**Frontend:**
- Reminder settings in user profile/preferences
- Toggle enable/disable, day selector + time picker
- Browser push notification permission request

---

## Phase 4: Professional Polish & Performance

### 4.1 Loading & Transition States
- Skeleton loaders for all course cards (shimmer effect)
- Page transition animations (fade/slide)
- Optimistic UI updates (enroll, bookmark, mark complete show instantly)
- Error boundaries per route section

### 4.2 Responsive Design Audit
- Mobile: bottom navigation, full-width cards, swipe gestures
- Tablet: 2-column grid, collapsible sidebar
- Desktop: 3-4 column grid, persistent sidebar

### 4.3 Accessibility (a11y)
- ARIA labels on all interactive elements
- Keyboard navigation for lesson lists, filters, modals
- Focus trap in modals
- Screen reader announcements for progress updates
- Color contrast compliance (WCAG 2.1 AA)

### 4.4 Performance Optimization
- Image lazy loading with placeholder
- Virtualized long lists (react-window for 100+ items)
- Code splitting: lazy load CourseDetail, MyLearning, Leaderboard
- API response compression

---

## New File Structure

```
backend/
  models/
    Wishlist.js
    LearningPath.js
    LearningGoal.js
    LessonNote.js
    Achievement.js
    UserAchievement.js
    StudyReminder.js
  routes/
    reviewRoutes.js
    wishlistRoutes.js
    learningPathRoutes.js
    learningGoalRoutes.js
    lessonNoteRoutes.js
    achievementRoutes.js
    leaderboardRoutes.js
  services/
    achievementService.js
    leaderboardService.js

frontend/src/
  learn/
    SearchBar.jsx
    FilterChips.jsx
    FilterPanel.jsx
    CategoryMegaMenu.jsx
    CategoryPage.jsx
    CompareDrawer.jsx
    CourseComparison.jsx
    WishlistPage.jsx
    LearningPaths.jsx
    LearningPathDetail.jsx
    LearningGoals.jsx
    LearningCalendar.jsx
    Achievements.jsx
    Leaderboard.jsx
  hooks/
    useCourses.js
    useEnrollments.js
    useWishlist.js
    useLearningGoals.js
    useDebounce.js
  context/
    LearningContext.jsx
  components/
    AchievementBadge.jsx
    SkeletonCard.jsx
    InfiniteScroll.jsx
    StarRating.jsx
```

---

## Implementation Order

```
Phase 1 (Weeks 1-2): Foundation
├── 1.1 Remove legacy code (Day 1-2)
├── 1.2 Server-side pagination (Day 3-4)
├── 1.3 Server-side search & filtering (Day 5-7)
├── 1.4 State management & caching (Day 8-10)
└── 1.5 Reviews & ratings (Day 11-14)

Phase 2 (Weeks 3-4): Explore Courses UX
├── 2.1 Category mega menu (Day 1-3)
├── 2.2 Search autocomplete (Day 4-5)
├── 2.3 Filter chips & advanced filtering (Day 6-8)
├── 2.4 Course card enhancements (Day 9-10)
├── 2.5 Wishlist system (Day 11-13)
└── 2.6 Course comparison (Day 14)

Phase 3 (Weeks 5-8): LMS Dashboard
├── 3.1 Enhanced dashboard overview (Day 1-3)
├── 3.2 Learning paths (Day 4-7)
├── 3.3 Weekly goals & streaks (Day 8-10)
├── 3.4 Calendar view (Day 11-13)
├── 3.5 Notes per lesson (Day 14-16)
├── 3.6 Achievement badges (Day 17-20)
├── 3.7 Leaderboard (Day 21-23)
└── 3.8 Study reminders (Day 24-26)

Phase 4 (Week 9): Polish
├── 4.1 Loading states & animations (Day 1-2)
├── 4.2 Responsive design audit (Day 3-4)
├── 4.3 Accessibility (Day 5-6)
└── 4.4 Performance optimization (Day 7)
```

---

## Key Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| State management | React Context + hooks | Lightweight, no extra deps |
| Search | MongoDB text index | Already using MongoDB |
| Pagination | Offset-based with page/limit | Simple, works with current API |
| Calendar | date-fns + custom component | No heavy library needed |
| Notes | Plain text first | Keep simple, add markdown later |
| Notifications | Extend existing model | Infrastructure already exists |
| Leaderboard cache | In-memory with TTL | Redis optional later |
| File uploads | Keep URL-based | Upload system is separate project |
