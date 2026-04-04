import { API_BASE_URL } from '../config';

export const getAvatarUrl = (user) => {
  if (!user) return 'https://ui-avatars.com/api/?name=User&background=random';
  
  if (user.avatarUrl && user.avatarUrl.length > 1) {
    if (user.avatarUrl.startsWith('/')) {
      return `${API_BASE_URL}${user.avatarUrl}`;
    }
    return user.avatarUrl;
  }
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`;
};

export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};

export const getCoverImageUrl = (user) => {
  const coverUrl = user?.mentorProfile?.coverImageUrl;
  if (!coverUrl) return '';
  if (coverUrl.startsWith('http')) return coverUrl;
  return `${API_BASE_URL}${coverUrl}`;
};

export const getVideoIntroUrl = (user) => {
  const videoUrl = user?.mentorProfile?.videoIntroUrl;
  if (!videoUrl) return '';
  if (videoUrl.startsWith('http')) return videoUrl;
  return `${API_BASE_URL}${videoUrl}`;
};
