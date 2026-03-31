import api from './axiosClient';

/**
 * REAL API SERVICES
 * This file acts as the boundary between the frontend and the real backend server.
 * Every function returns a Promise from Axios.
 */

// --- Post Services ---

export const postService = {
  async getAllPosts(page = 1) {
    const { data } = await api.get('/posts', { params: { page } });
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
  async getCourses() {
    const { data } = await api.get('/courses');
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

  async updateProgress(courseId, lessonIndex) {
    const { data } = await api.put(`/courses/${courseId}/progress`, { lessonIndex });
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
  async getNotifications() {
    const { data } = await api.get('/notifications');
    return data;
  },

  async getUnreadCount() {
    const { data } = await api.get('/notifications/unread-count');
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

  async getStudents() {
    const { data } = await api.get('/mentor/dashboard/students');
    return data;
  },

  async getUpcomingSessions() {
    const { data } = await api.get('/mentor/dashboard/upcoming-sessions');
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
  async updateSchedule(schedules, timezone) {
    const { data } = await api.put('/schedule', { schedules, timezone });
    return data;
  },
  async bookSlot(bookingData) {
    const { data } = await api.post('/schedule/book', bookingData);
    return data;
  },
  async cancelBooking(slotId) {
    const { data } = await api.put(`/schedule/${slotId}/cancel`);
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

// --- Enrollment Services ---

export const enrollmentService = {
  async enroll(courseId) {
    const { data } = await api.post(`/enrollment/${courseId}`);
    return data;
  },
  async getMyCourses() {
    const { data } = await api.get('/enrollment/my-courses');
    return data;
  },
  async updateProgress(enrollmentId, lessonIndex) {
    const { data } = await api.put(`/enrollment/${enrollmentId}/progress`, { lessonIndex });
    return data;
  },
  async getStats() {
    const { data } = await api.get('/enrollment/stats');
    return data;
  }
};
