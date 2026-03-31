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
