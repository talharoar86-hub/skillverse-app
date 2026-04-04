import api from './axiosClient';

/**
 * REAL API SERVICES
 * This file acts as the boundary between the frontend and the real backend server.
 * Every function returns a Promise from Axios.
 */

// --- Post Services ---

export const postService = {
  async getAllPosts(page = 1, params = {}) {
    const { data } = await api.get('/posts', { params: { page, ...params } });
    return data;
  },

  async getPostsByFilter(filters = {}) {
    const { data } = await api.get('/posts', { params: filters });
    return data;
  },

  async getPostById(postId) {
    const { data } = await api.get(`/posts/${postId}`);
    return data;
  },

  async createPost(postData) {
    const { data } = await api.post('/posts', postData);
    return data;
  },

  async uploadImage(formData) {
    const { data } = await api.post('/posts/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  async updatePost(postId, updates) {
    const { data } = await api.put(`/posts/${postId}`, updates);
    return data;
  },

  async likePost(postId) {
    const { data } = await api.put(`/posts/${postId}/like`);
    return data;
  },

  async deletePost(postId) {
    const { data } = await api.delete(`/posts/${postId}`);
    return data;
  },

  async savePost(postId) {
    const { data } = await api.put(`/posts/${postId}/save`);
    return data;
  },

  async sharePost(postId, content = '') {
    const { data } = await api.put(`/posts/${postId}/share`, { content });
    return data;
  },

  async sharePostLink(postId) {
    const { data } = await api.put(`/posts/${postId}/share-count`);
    return data;
  },

  async addComment(postId, content) {
    const { data } = await api.post(`/posts/${postId}/comment`, { content });
    return data;
  },

  async markCommentHelpful(postId, commentId) {
    const { data } = await api.put(`/posts/${postId}/comments/${commentId}/helpful`);
    return data;
  },

  async getSavedPosts(page = 1, limit = 10) {
    const { data } = await api.get('/posts/saved', { params: { page, limit } });
    return data; // Returns { posts, total }
  },

  async getInterestedPosts(page = 1, limit = 10) {
    const { data } = await api.get('/posts/interested', { params: { page, limit } });
    return data; // Returns { posts, total }
  },

  async getReposts(page = 1, limit = 10) {
    const { data } = await api.get('/posts/reposts', { params: { page, limit } });
    return data; // Returns { posts, total }
  },

  async getUserPosts(userId, page = 1, limit = 10) {
    const { data } = await api.get(`/posts/user/${userId}`, { params: { page, limit } });
    return data; // Returns { posts, total }
  },

  async interestedPost(postId) {
    const { data } = await api.put(`/posts/${postId}/interested`);
    return data;
  },

  async notInterestedPost(postId) {
    const { data } = await api.put(`/posts/${postId}/not-interested`);
    return data;
  },

  async getNotInterestedPosts(page = 1, limit = 10) {
    const { data } = await api.get('/posts/not-interested', { params: { page, limit } });
    return data; // Returns { posts, total }
  },

  async getProfileStats() {
    const { data } = await api.get('/posts/profile-stats');
    return data;
  },

  async votePoll(postId, optionIndexes, remove = false) {
    const { data } = await api.put(`/posts/${postId}/vote`, { optionIndexes, remove });
    return data;
  }
};

// --- Profile / User Services ---

export const profileService = {
  async getAllUsers(page = 1, limit = 10) {
    const { data } = await api.get('/user/users', { params: { page, limit } });
    return data;
  },

  async getProfile() {
    const { data } = await api.get(`/auth/me`);
    return data;
  },

  async createProfile(profileData) {
     // In the real backend, user data is updated, not a separate profile entry
     const { data } = await api.put(`/user/profile`, profileData);
     return data;
  },
  
  async updateProfile(userId, updates) {
    const { data } = await api.put(`/user/profile`, updates);
    return data;
  },

  async uploadAvatar(formData) {
    const { data } = await api.post('/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  async getDiscovery(goal) {
    const { data } = await api.get(`/user/discovery/${goal}`);
    return data;
  },

  async getSidebarStats() {
    const { data } = await api.get('/user/sidebar/mentor-stats');
    return data;
  },

  async getMenteeRequests() {
    const { data } = await api.get('/user/sidebar/mentee-requests');
    return data;
  },

  async getSkillMatches() {
    const { data } = await api.get('/user/sidebar/matches');
    return data;
  },

  async getPublicProfile(userId) {
    const { data } = await api.get(`/user/${userId}`);
    return data;
  },

  async getPublicProfileStats(userId) {
    const { data } = await api.get(`/user/${userId}/stats`);
    return data;
  }
};

// --- Course Services ---

export const courseService = {
  async getCourses(type) {
    const params = type && type !== 'all' ? { type } : {};
    const { data } = await api.get('/courses', { params });
    // Handle both paginated and array responses
    return Array.isArray(data) ? data : (data.courses || []);
  },

  async getCoursesPaginated(params) {
    const { data } = await api.get('/courses', { params });
    return data; // Returns { courses, total, page, totalPages, hasMore }
  },

  async getCategories() {
    const { data } = await api.get('/courses/categories');
    return data;
  },

  async getSearchSuggestions(query) {
    const { data } = await api.get('/courses/search/suggestions', { params: { q: query } });
    return data;
  },

  async getMyCourses() {
    const { data } = await api.get('/courses/my-courses');
    return data;
  },

  async getMentor(mentorId) {
    const { data } = await api.get(`/courses/mentor/${mentorId}`);
    return data;
  },

  async getCourseById(courseId) {
    const { data } = await api.get(`/courses/${courseId}`);
    return data;
  },

  async createCourse(courseData) {
    const { data } = await api.post('/courses', courseData);
    return data;
  },

  async updateCourse(courseId, updates) {
    const { data } = await api.put(`/courses/${courseId}`, updates);
    return data;
  },

  async deleteCourse(courseId) {
    const { data } = await api.delete(`/courses/${courseId}`);
    return data;
  },

  async publishCourse(courseId) {
    const { data } = await api.put(`/courses/${courseId}/publish`);
    return data;
  },

  async unpublishCourse(courseId) {
    const { data } = await api.put(`/courses/${courseId}/draft`);
    return data;
  },

  async addLesson(courseId, lessonData) {
    const { data } = await api.post(`/courses/${courseId}/lessons`, lessonData);
    return data;
  },

  async updateLesson(courseId, lessonId, updates) {
    const { data } = await api.put(`/courses/${courseId}/lessons/${lessonId}`, updates);
    return data;
  },

  async deleteLesson(courseId, lessonId) {
    const { data } = await api.delete(`/courses/${courseId}/lessons/${lessonId}`);
    return data;
  },

  async uploadThumbnail(formData) {
    const { data } = await api.post('/courses/upload-thumbnail', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  async uploadLessonVideo(formData) {
    const { data } = await api.post('/courses/upload-lesson-video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  async deleteLessonVideo(publicId) {
    const { data } = await api.delete('/courses/delete-lesson-video', { data: { publicId } });
    return data;
  },

  async duplicateCourse(courseId) {
    const { data } = await api.post(`/courses/${courseId}/duplicate`);
    return data;
  },

  async reorderLessons(courseId, lessonOrder) {
    const { data } = await api.put(`/courses/${courseId}/lessons/reorder`, { lessonOrder });
    return data;
  }
};

// --- Follow Services ---

export const followService = {
  async sendFollow(userId) {
    const { data } = await api.post(`/follow/${userId}`);
    return data;
  },

  async acceptFollow(followId) {
    const { data } = await api.put(`/follow/${followId}/accept`);
    return data;
  },

  async rejectFollow(followId) {
    const { data } = await api.put(`/follow/${followId}/reject`);
    return data;
  },

  async getStatus(userId) {
    const { data } = await api.get(`/follow/status/${userId}`);
    return data;
  },

  async getFollowers() {
    const { data } = await api.get('/follow/followers');
    return data;
  },

  async getFollowing() {
    const { data } = await api.get('/follow/following');
    return data;
  },

  async getPending() {
    const { data } = await api.get('/follow/pending');
    return data;
  },

  async unfollow(userId) {
    const { data } = await api.delete(`/follow/${userId}`);
    return data;
  },

  async getUserFollowers(userId) {
    const { data } = await api.get(`/follow/user/${userId}/followers`);
    return data;
  },

  async getUserFollowing(userId) {
    const { data } = await api.get(`/follow/user/${userId}/following`);
    return data;
  }
};

// --- Message Services ---

export const messageService = {
  async getConversations() {
    const { data } = await api.get('/messages/conversations');
    return data;
  },

  async getMentorFilteredConversations(type = 'all') {
    const { data } = await api.get('/messages/conversations/mentor-filtered', { params: { type } });
    return data;
  },

  async createConversation(userId) {
    const { data } = await api.post('/messages/conversations', { userId });
    return data;
  },

  async getMessages(conversationId, cursor) {
    const params = cursor ? { cursor } : {};
    const { data } = await api.get(`/messages/conversations/${conversationId}`, { params });
    return data;
  },

  async sendMessage(conversationId, content) {
    const { data } = await api.post(`/messages/conversations/${conversationId}`, { content });
    return data;
  },

  async markRead(conversationId) {
    const { data } = await api.put(`/messages/conversations/${conversationId}/read`);
    return data;
  },

  async getUnreadCount() {
    const { data } = await api.get('/messages/unread-count');
    return data;
  }
};

// --- Notification Services ---

export const notificationService = {
  async getNotifications(params = {}) {
    const { data } = await api.get('/notifications', { params });
    return data;
  },

  async getUnreadCount(type) {
    const { data } = await api.get('/notifications/unread-count', { params: type ? { type } : {} });
    return data;
  },

  async markRead(notificationId) {
    const { data } = await api.put(`/notifications/${notificationId}/read`);
    return data;
  },

  async markAllRead() {
    const { data } = await api.put('/notifications/mark-all-read');
    return data;
  },

  async deleteNotification(notificationId) {
    const { data } = await api.delete(`/notifications/${notificationId}`);
    return data;
  }
};

// --- Mentor Services ---

export const mentorService = {
  async apply(applicationData) {
    const { data } = await api.post('/mentor/apply', applicationData);
    return data;
  },

  async getStatus() {
    const { data } = await api.get('/mentor/status');
    return data;
  },

  async getProfile() {
    const { data } = await api.get('/mentor/profile');
    return data;
  },

  async updateProfile(updates) {
    const { data } = await api.put('/mentor/profile', updates);
    return data;
  },

  async getDashboardStats() {
    const { data } = await api.get('/mentor/dashboard/stats');
    return data;
  },

  async getPublicStats(mentorId) {
    const { data } = await api.get(`/mentor/public-stats/${mentorId}`);
    return data;
  },

  async getStudents() {
    const { data } = await api.get('/mentor/dashboard/students');
    return data;
  },

  async getUpcomingSessions() {
    const { data } = await api.get('/mentor/dashboard/upcoming-sessions');
    return data;
  },

  async getAnalytics(period = '30d') {
    const { data } = await api.get('/mentor/dashboard/analytics', { params: { period } });
    return data;
  },

  async getEarnings(params = {}) {
    const { data } = await api.get('/mentor/earnings', { params });
    return data;
  },

  async getCourseReviews(params = {}) {
    const { data } = await api.get('/mentor/course-reviews', { params });
    return data;
  },

  async replyToReview(reviewId, text) {
    const { data } = await api.post(`/mentor/course-reviews/${reviewId}/reply`, { text });
    return data;
  },

  async getSettings() {
    const { data } = await api.get('/mentor/settings');
    return data;
  },

  async updateSettings(settings) {
    const { data } = await api.put('/mentor/settings', settings);
    return data;
  },

  async uploadProfileImage(formData) {
    const { data } = await api.post('/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  async uploadCoverImage(formData) {
    const { data } = await api.post('/mentor/upload-cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  async uploadVideoIntro(formData, onProgress) {
    const { data } = await api.post('/mentor/upload-video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      }
    });
    return data;
  },

  async deleteVideoIntro() {
    const { data } = await api.delete('/mentor/video-intro');
    return data;
  },

  async getProfileViews(period = '30d') {
    const { data } = await api.get('/mentor/profile-views', { params: { period } });
    return data;
  }
};

// --- Mentorship Services ---

export const mentorshipService = {
  async sendRequest(mentorId, skill, message) {
    const { data } = await api.post('/mentorship/request', { mentorId, skill, message });
    return data;
  },

  async acceptRequest(requestId) {
    const { data } = await api.put(`/mentorship/${requestId}/accept`);
    return data;
  },

  async rejectRequest(requestId) {
    const { data } = await api.put(`/mentorship/${requestId}/reject`);
    return data;
  },

  async getRequests() {
    const { data } = await api.get('/mentorship/requests');
    return data;
  },

  async getStats() {
    const { data } = await api.get('/mentorship/stats');
    return data;
  },

  async getMentors() {
    const { data } = await api.get('/mentorship/mentors');
    return data;
  },

  async getMentorStatus(mentorId) {
    const { data } = await api.get(`/mentorship/mentors/${mentorId}/status`);
    return data;
  },

  async getMentorStats() {
    const { data } = await api.get('/mentorship/mentor-stats');
    return data;
  },

  async getIncomingRequests() {
    const { data } = await api.get('/mentorship/requests/incoming');
    return data;
  },

  async getOutgoingRequests() {
    const { data } = await api.get('/mentorship/requests/outgoing');
    return data;
  }
};

// --- Schedule Services ---

export const scheduleService = {
  async getSchedule(mentorId) {
    const { data } = await api.get(`/schedule/${mentorId}`);
    return data;
  },
  async updateSchedule(schedules, timezone, blockedDates, templates, calendarSync) {
    const { data } = await api.put('/schedule', { schedules, timezone, blockedDates, templates, calendarSync });
    return data;
  },
  async bookSlot(bookingData) {
    const { data } = await api.post('/schedule/book', bookingData);
    return data;
  },
  async cancelBooking(slotId) {
    const { data } = await api.put(`/schedule/${slotId}/cancel`);
    return data;
  },
  async blockDates(mentorId, blockedDates) {
    const { data } = await api.put(`/schedule/${mentorId}/block-dates`, { blockedDates });
    return data;
  },
  async saveTemplate(mentorId, template) {
    const { data } = await api.post(`/schedule/${mentorId}/template`, template);
    return data;
  },
  async getTemplates(mentorId) {
    const { data } = await api.get(`/schedule/${mentorId}/templates`);
    return data;
  },
  async deleteTemplate(mentorId, templateId) {
    const { data } = await api.delete(`/schedule/${mentorId}/template/${templateId}`);
    return data;
  },
  async applyTemplate(mentorId, templateId, days) {
    const { data } = await api.post(`/schedule/${mentorId}/apply-template`, { templateId, days });
    return data;
  },
  async copyDaySlots(mentorId, fromDay, toDays) {
    const { data } = await api.post(`/schedule/${mentorId}/copy-slots`, { fromDay, toDays });
    return data;
  },
  async connectCalendar(mentorId, provider, accessToken, refreshToken) {
    const { data } = await api.post(`/schedule/${mentorId}/connect-calendar`, { provider, accessToken, refreshToken });
    return data;
  },
  async disconnectCalendar(mentorId, provider) {
    const { data } = await api.delete(`/schedule/${mentorId}/disconnect-calendar`, { params: { provider } });
    return data;
  },
  async syncCalendar(mentorId) {
    const { data } = await api.post(`/schedule/${mentorId}/sync-calendar`);
    return data;
  }
};

// --- Review Services ---

export const reviewService = {
  async submitReview(mentorId, reviewData) {
    const { data } = await api.post(`/reviews/${mentorId}`, reviewData);
    return data;
  },
  async getReviews(mentorId, page = 1) {
    const { data } = await api.get(`/reviews/${mentorId}`, { params: { page } });
    return data;
  },
  async getStats(mentorId) {
    const { data } = await api.get(`/reviews/stats/${mentorId}`);
    return data;
  },
  async replyToReview(reviewId, text) {
    const { data } = await api.post(`/reviews/${reviewId}/reply`, { text });
    return data;
  }
};


// --- Exchange Services ---

export const exchangeService = {
  async getActivity(page = 1, limit = 20) {
    const { data } = await api.get('/exchange/activity', { params: { page, limit } });
    return data;
  },

  async sendRequest(responderId, offeredSkill, requestedSkill, message) {
    const { data } = await api.post('/exchange/request', { responderId, offeredSkill, requestedSkill, message });
    return data;
  },

  async acceptRequest(activityId) {
    const { data } = await api.put(`/exchange/${activityId}/accept`);
    return data;
  },

  async rejectRequest(activityId) {
    const { data } = await api.put(`/exchange/${activityId}/reject`);
    return data;
  },

  async getStats() {
    const { data } = await api.get('/exchange/stats');
    return data;
  },

  async getIncomingRequests() {
    const { data } = await api.get('/exchange/requests/incoming');
    return data;
  },

  async getOutgoingRequests() {
    const { data } = await api.get('/exchange/requests/outgoing');
    return data;
  },

  async getMatches() {
    const { data } = await api.get('/exchange/matches');
    return data;
  }
};

// --- Feed Services ---

export const feedService = {
  async getSuggestions(goal = 'Learn') {
    const { data } = await api.get('/feed/suggestions', { params: { goal } });
    return data;
  }
};

// --- Search Services ---

export const searchService = {
  async search(query, type = 'all', page = 1) {
    let useFallback = false;
    
    try {
      await api.get('/search', { params: { q: query, type, page } });
    } catch (err) {
      if (err.response?.status === 404) {
        console.log('Search endpoint not found, using fallback');
        useFallback = true;
      }
    }
    
    if (useFallback) {
      try {
        const [usersRes, postsRes, coursesRes, categoriesRes] = await Promise.allSettled([
          profileService.getAllUsers(page, 20),
          postService.getAllPosts(page),
          courseService.getCourses(),
          courseService.getCategories(),
        ]);
        
        let users = [], posts = [], courses = [], categories = [];
        
        if (usersRes.status === 'fulfilled') {
          const val = usersRes.value;
          users = Array.isArray(val) ? val : (val.users || []);
        }
        
        if (postsRes.status === 'fulfilled') {
          posts = Array.isArray(postsRes.value) ? postsRes.value : [];
        }
        
        const isCourse = (item) => {
          if (!item || !item._id) return false;
          if (item._id.toString().includes('lesson')) return false;
          if (item.thumbnail) return true;
          if (item.description && !item.videoUrl) return true;
          if (item.duration && item.content && !item.order) return true;
          if (item.videoUrl && item.order) return false;
          return true;
        };
        
        if (coursesRes.status === 'fulfilled') {
          const val = coursesRes.value;
          if (Array.isArray(val)) {
            courses = val.filter(isCourse);
          } else if (val && val.courses && Array.isArray(val.courses)) {
            courses = val.courses.filter(isCourse);
          }
        }
        
        if (categoriesRes.status === 'fulfilled') {
          const val = categoriesRes.value;
          categories = Array.isArray(val) ? val : (val.categories || []);
        }
        
        const qLower = query.toLowerCase();
        
        const filterAndSort = (items, searchFields) => {
          if (!Array.isArray(items)) return [];
          const matched = items.filter(item => {
            if (!item) return false;
            return searchFields.some(field => {
              const val = item[field];
              return val && val.toString().toLowerCase().includes(qLower);
            });
          });
          return matched.slice(0, 10);
        };
        
        return {
          users: filterAndSort(users, ['name', 'skills']),
          posts: filterAndSort(posts, ['content', 'tags']),
          courses: filterAndSort(courses, ['title', 'category']),
          categories: filterAndSort(categories, ['name'])
        };
      } catch (fallbackErr) {
        console.log('Fallback search failed:', fallbackErr);
        return { users: [], posts: [], courses: [], categories: [] };
      }
    }
    
    return { users: [], posts: [], courses: [], categories: [] };
  },

  async getSuggestions(query) {
    if (!query || query.length < 2) return [];
    
    try {
      await api.get('/search/suggestions', { params: { q: query } });
    } catch {
      console.log('Suggestions endpoint not found, using fallback');
    }
    
    try {
      const [usersRes, coursesRes, categoriesRes] = await Promise.allSettled([
        profileService.getAllUsers(1, 50),
        courseService.getCourses(),
        courseService.getCategories(),
      ]);
      
      const suggestions = new Set();
      const qLower = query.toLowerCase();
      
      let users = [], courses = [], categories = [];
      
      if (usersRes.status === 'fulfilled') {
        const val = usersRes.value;
        users = Array.isArray(val) ? val : (val.users || []);
      }
      
      const isCourse = (item) => {
        if (!item || !item._id) return false;
        if (item._id.toString().includes('lesson')) return false;
        if (item.thumbnail) return true;
        if (item.description && !item.videoUrl) return true;
        if (item.duration && item.content && !item.order) return true;
        if (item.videoUrl && item.order) return false;
        return true;
      };
      
      if (coursesRes.status === 'fulfilled') {
        const val = coursesRes.value;
        if (Array.isArray(val)) {
          courses = val.filter(isCourse);
        } else if (val && val.courses && Array.isArray(val.courses)) {
          courses = val.courses.filter(isCourse);
        }
      }
      
      if (categoriesRes.status === 'fulfilled') {
        const val = categoriesRes.value;
        categories = Array.isArray(val) ? val : (val.categories || []);
      }
      
      const addIfMatch = (text) => {
        if (text && text.toLowerCase().includes(qLower)) {
          suggestions.add(text);
        }
      };
      
      users.forEach(u => {
        addIfMatch(u.name);
        u.skills?.forEach(addIfMatch);
      });
      
      courses.forEach(c => {
        addIfMatch(c.title);
        addIfMatch(c.category);
      });
      
      categories.forEach(c => {
        addIfMatch(c.name);
      });
      
      return Array.from(suggestions).slice(0, 4);
    } catch {
      return [];
    }
  },

  async getRecentSearches() {
    return [];
  },

  async clearRecentSearches() {
    return { success: true };
  },

  async saveSearch(query) {
    return { success: true };
  },

async getUserPosts(userId, page = 1) {
    const { data } = await api.get(`/posts/user/${userId}`, { params: { page } });
    return data;
  }
};

// --- Enrollment Services ---

export const enrollmentService = {
  async enroll(courseId) {
    const { data } = await api.post(`/enrollment/${courseId}`);
    return data;
  },
  async getMyCourses(filter) {
    const params = filter && filter !== 'all' ? { filter } : {};
    const { data } = await api.get('/enrollment/my-courses', { params });
    // Handle both paginated and array responses
    return Array.isArray(data) ? data : (data.enrollments || []);
  },
  async getMyCoursesPaginated(params) {
    const { data } = await api.get('/enrollment/my-courses', { params });
    return data; // Returns { enrollments, total, page, totalPages, hasMore }
  },
  async updateProgress(enrollmentId, lessonIndex) {
    const { data } = await api.put(`/enrollment/${enrollmentId}/progress`, { lessonIndex });
    return data;
  },
  async toggleBookmark(enrollmentId, lessonIndex) {
    const { data } = await api.put(`/enrollment/${enrollmentId}/bookmark`, { lessonIndex });
    return data;
  },
  async updateAccess(enrollmentId, lessonIndex) {
    const { data } = await api.put(`/enrollment/${enrollmentId}/access`, { lessonIndex });
    return data;
  },
  async getStats() {
    const { data } = await api.get('/enrollment/stats');
    return data;
  },
  async getEnrollmentByCourse(courseId) {
    const { data } = await api.get(`/enrollment/course/${courseId}`);
    return data;
  },
  async updateTime(enrollmentId, seconds) {
    const { data } = await api.put(`/enrollment/${enrollmentId}/time`, { seconds });
    return data;
  },
  async getActivity(month, year) {
    const { data } = await api.get('/enrollment/activity', { params: { month, year } });
    return data;
  },
  async getWishlist() {
    const { data } = await api.get('/wishlist');
    return data;
  },
  async addToWishlist(courseId) {
    const { data } = await api.post(`/wishlist/${courseId}`);
    return data;
  },
  async removeFromWishlist(courseId) {
    const { data } = await api.delete(`/wishlist/${courseId}`);
    return data;
  }
};

// --- Course Review Services ---

export const courseReviewService = {
  async submitReview(courseId, reviewData) {
    const { data } = await api.post(`/course-reviews/${courseId}`, reviewData);
    return data;
  },
  async getReviews(courseId, params = {}) {
    const { data } = await api.get(`/course-reviews/${courseId}`, { params });
    return data; // Returns { reviews, total, page, pages, userHasReviewed }
  },
  async updateReview(reviewId, updates) {
    const { data } = await api.put(`/course-reviews/${reviewId}`, updates);
    return data;
  },
  async deleteReview(reviewId) {
    const { data } = await api.delete(`/course-reviews/${reviewId}`);
    return data;
  },
  async replyToReview(reviewId, text) {
    const { data } = await api.post(`/mentor/course-reviews/${reviewId}/reply`, { text });
    return data;
  },
  async getMentorCourseReviews(params = {}) {
    const { data } = await api.get('/mentor/course-reviews', { params });
    return data;
  }
};
