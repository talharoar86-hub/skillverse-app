import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';

// Auth Components
import Login from './auth/Login';
import Signup from './auth/Signup';
import ForgotPassword from './auth/ForgotPassword';
import OAuthCallback from './auth/OAuthCallback';
import OnboardingFlow from './onboarding/OnboardingFlow';

// Main App Tabs
import HomeFeed from './feed/HomeFeed';
import ProfilePage from './profile/ProfilePage';
import ProfileLayout from './profile/ProfileLayout';
import ProfileFollowersPage from './profile/ProfileFollowersPage';
import ProfileFollowingPage from './profile/ProfileFollowingPage';
import ProfilePendingPage from './profile/ProfilePendingPage';
import PublicProfileLayout from './profile/PublicProfileLayout';
import PublicProfilePage from './profile/PublicProfilePage';
import Notifications from './pages/Notifications';
import PostDetail from './pages/PostDetail';

// Learn Dashboard
import LearnLayout from './learn/LearnLayout';
import ExploreCourses from './learn/ExploreCourses';
import MentorsPage from './learn/MentorsPage';
import MyLearning from './learn/MyLearning';
import BecomeMentor from './learn/BecomeMentor';

// Mentor Dashboard
import MentorDashboardLayout from './mentor/MentorDashboardLayout';
import MentorOverview from './mentor/MentorOverview';
import MentorProfile from './mentor/MentorProfile';
import MentorCourses from './mentor/MentorCourses';
import MentorSchedule from './mentor/MentorSchedule';
import MentorReviews from './mentor/MentorReviews';
import MentorNotifications from './mentor/MentorNotifications';

// Message Dashboard
import MessageLayout from './messages/MessageLayout';
import ConversationList from './messages/ConversationList';
import ChatView from './messages/ChatView';
import FilteredConversationList from './messages/FilteredConversationList';

// Simple guard for public routes (e.g. login/signup)
const PublicRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) {
    if(!user.onboardingComplete) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
};

// Guard for onboarding
const OnboardingRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.onboardingComplete) return <Navigate to="/" replace />;
  return children;
};

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            
            {/* Onboarding */}
            <Route path="/onboarding" element={<OnboardingRoute><OnboardingFlow /></OnboardingRoute>} />
            
            {/* Protected Main App Routes inside Layout */}
            <Route path="/" element={<Layout />}>
              <Route index element={<HomeFeed />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="post/:id" element={<PostDetail />} />
              <Route path="settings" element={<div className="p-8"><h1 className="text-3xl font-bold">Settings (Coming Soon)</h1><p className="text-slate-500 mt-2">Adjust your preferences here.</p></div>} />
            </Route>

            {/* Dedicated Message Dashboard Layout */}
            <Route path="/messages" element={<MessageLayout />}>
              <Route index element={<ConversationList />} />
              <Route path=":conversationId" element={<ChatView />} />
              <Route path="mentors" element={<FilteredConversationList roleFilter="Mentor" />} />
              <Route path="learners" element={<FilteredConversationList roleFilter="Learner" />} />
              <Route path="exchangers" element={<FilteredConversationList roleFilter="Exchanger" />} />
            </Route>

            {/* Dedicated Learn Dashboard Layout */}
            <Route path="/learn" element={<LearnLayout />}>
              <Route index element={<Navigate to="/learn/explore" replace />} />
              <Route path="explore" element={<ExploreCourses />} />
              <Route path="mentors" element={<MentorsPage />} />
              <Route path="my-learning" element={<MyLearning />} />
              <Route path="become-mentor" element={<BecomeMentor />} />
            </Route>

            {/* Dedicated Mentor Dashboard Layout */}
            <Route path="/mentor-dashboard" element={<MentorDashboardLayout />}>
              <Route index element={<Navigate to="/mentor-dashboard/overview" replace />} />
              <Route path="overview" element={<MentorOverview />} />
              <Route path="profile" element={<MentorProfile />} />
              <Route path="courses" element={<MentorCourses />} />
              <Route path="schedule" element={<MentorSchedule />} />
              <Route path="reviews" element={<MentorReviews />} />
              <Route path="notifications" element={<MentorNotifications />} />
            </Route>

            {/* Dedicated Profile Dashboard Layout */}
            <Route path="/profile" element={<ProfileLayout />}>
              <Route index element={<Navigate to="/profile/overview" replace />} />
              <Route path="overview" element={<ProfilePage />} />
              <Route path="posts" element={<ProfilePage />} />
              <Route path="saved" element={<ProfilePage />} />
              <Route path="interested" element={<ProfilePage />} />
              <Route path="not-interested" element={<ProfilePage />} />
              <Route path="learning" element={<ProfilePage />} />
              <Route path="mentor-activity" element={<ProfilePage />} />
              <Route path="exchange-activity" element={<ProfilePage />} />
              <Route path="reposts" element={<ProfilePage />} />
              <Route path="followers" element={<ProfileFollowersPage />} />
              <Route path="following" element={<ProfileFollowingPage />} />
              <Route path="pending" element={<ProfilePendingPage />} />
            </Route>

            {/* Public Profile View */}
            <Route path="/user/:userId" element={<PublicProfileLayout />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<PublicProfilePage />} />
              <Route path="posts" element={<PublicProfilePage />} />
              <Route path="skills" element={<PublicProfilePage />} />
              <Route path="mentor" element={<PublicProfilePage />} />
              <Route path="exchange" element={<PublicProfilePage />} />
              <Route path="followers" element={<PublicProfilePage />} />
              <Route path="following" element={<PublicProfilePage />} />
            </Route>
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        </NotificationProvider>
      </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
