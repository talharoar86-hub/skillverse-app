import React, { useEffect, useState, useRef, useCallback } from 'react';
import { BookOpen, Bell, Flame, MessageCircle, FileText, Sparkles, Filter, X, ArrowUpDown, TrendingUp, Clock, Check, BarChart } from 'lucide-react';
import { postService } from '../services/api';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import SmartFeedSuggestions from '../components/SmartFeedSuggestions';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../auth/AuthContext';
import { cn } from '../utils/cn';

const HomeFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [newPostsAvailable, setNewPostsAvailable] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [error, setError] = useState(null);
  const socket = useSocket();

  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);
  const fetchingRef = useRef(false);
  const isInitialMount = useRef(true);

  const filters = [
    { id: 'all', label: 'All', icon: Sparkles },
    { id: 'following', label: 'Following', icon: Flame },
    { id: 'Poll', label: 'Polls', icon: BarChart },
    { id: 'Question', label: 'Questions', icon: MessageCircle },
    { id: 'Guide', label: 'Guides', icon: BookOpen },
    { id: 'Update', label: 'Updates', icon: FileText },
  ];

  const sortOptions = [
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'top', label: 'Top', icon: TrendingUp },
  ];

  const fetchPosts = useCallback(async (pageNum = page, filter = activeFilter, sort = sortBy) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoadingPosts(true);
    setError(null);
    try {
      const params = { page: pageNum };
      
      if (filter === 'following') {
        params.following = true;
      } else if (filter !== 'all') {
        params.type = filter;
      }

      if (sort === 'top') {
        params.sort = 'likes';
      } else {
        params.sort = 'createdAt';
      }

      console.log('Fetching posts with params:', params);
      const data = await postService.getAllPosts(pageNum, params);
      console.log('Posts fetched:', data);

      if (data.length < 10) setHasMore(false);
      else setHasMore(true);

      if (pageNum === 1) {
        setPosts(data);
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p._id));
          const newPosts = data.filter(p => !existingIds.has(p._id));
          return [...prev, ...newPosts];
        });
      }
    } catch (err) {
      console.error('Failed to fetch posts', err);
      setError(err.message || 'Failed to fetch posts');
    } finally {
      setLoadingPosts(false);
      fetchingRef.current = false;
    }
  }, [page, activeFilter, sortBy]);

  // Initial fetch on mount
  useEffect(() => {
    fetchPosts(1, activeFilter, sortBy);
    isInitialMount.current = false;
  }, []);

  // Reset and fetch when filter/sort changes
  useEffect(() => {
    if (isInitialMount.current) return;
    setPage(1);
    setHasMore(true);
    setPosts([]);
    fetchingRef.current = false;
    fetchPosts(1, activeFilter, sortBy);
  }, [activeFilter, sortBy]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingPosts && hasMore && !fetchingRef.current) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loadingPosts, hasMore]);

  useEffect(() => {
    if (page > 1 && !fetchingRef.current) {
      fetchPosts(page, activeFilter, sortBy);
    }
  }, [page]);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_post', (post) => {
      if (post.userId !== user?._id) {
        setNewPostsAvailable(prev => prev + 1);
      }
    });

    socket.on('post_deleted', (postId) => {
      setPosts(prev => prev.filter(p => p._id !== postId));
    });

    return () => {
      socket.off('new_post');
      socket.off('post_deleted');
    };
  }, [socket, user?._id]);

  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
    setFilterOpen(false);
  };

  const handleSortChange = (sortId) => {
    setSortBy(sortId);
    setFilterOpen(false);
  };

  const currentFilterLabel = filters.find(f => f.id === activeFilter)?.label || 'All';
  const currentSortLabel = sortOptions.find(s => s.id === sortBy)?.label || 'Recent';

  return (
    <div className="w-full flex flex-col gap-4 sm:gap-6 relative">

      {/* Error Message */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center">
          <p className="text-rose-600 font-medium">{error}</p>
          <button 
            onClick={() => fetchPosts(1, activeFilter, sortBy)}
            className="mt-2 text-sm font-bold text-rose-500 hover:text-rose-600"
          >
            Try Again
          </button>
        </div>
      )}

      {/* New Activity Toast */}
      {newPostsAvailable > 0 && (
        <div className="flex justify-center mb-4 animate-bounce">
          <button 
            onClick={() => {
              setNewPostsAvailable(0);
              fetchPosts(1, activeFilter, sortBy);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition"
          >
            <ArrowUpDown className="w-4 h-4" />
            View {newPostsAvailable} new post{newPostsAvailable > 1 ? 's' : ''}
          </button>
        </div>
      )}

      <div>
        <CreatePost
          onPostCreated={(newPost) => setPosts(prev => prev.some(p => p._id === newPost._id) ? prev : [newPost, ...prev])}
        />
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-sm font-bold text-slate-600 hover:text-indigo-600 transition-all"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
          </button>
          
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1 pb-1">
            {filters.map(filter => {
              const Icon = filter.icon;
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => handleFilterChange(filter.id)}
                  className={cn(
                    "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all",
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleSortChange(sortBy === 'recent' ? 'top' : 'recent')}
              className={cn(
                "flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all",
                sortBy === 'recent'
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-amber-50 text-amber-600 border border-amber-200'
              )}
              title={`Sorted by ${currentSortLabel}`}
            >
              {sortBy === 'recent' ? (
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
              <span className="hidden sm:inline">{currentSortLabel}</span>
            </button>
          </div>
        </div>

        {filterOpen && (
          <div className="mt-3 pt-3 border-t border-slate-100 animate-fade-in">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Filter:</span>
              {filters.map(filter => {
                const Icon = filter.icon;
                const isActive = activeFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    onClick={() => handleFilterChange(filter.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                      isActive
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-slate-500 hover:bg-slate-100'
                    )}
                  >
                    {isActive && <Check className="w-3 h-3" />}
                    <Icon className="w-3.5 h-3.5" />
                    {filter.label}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Sort:</span>
              {sortOptions.map(option => {
                const Icon = option.icon;
                const isActive = sortBy === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSortChange(option.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                      isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'text-slate-500 hover:bg-slate-100'
                    )}
                  >
                    {isActive && <Check className="w-3 h-3" />}
                    <Icon className="w-3.5 h-3.5" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeFilter !== 'all' && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
              Filter: {currentFilterLabel}
            </span>
            <span className="text-xs font-bold text-slate-400">
              Sort: {currentSortLabel}
            </span>
            <button
              onClick={() => { setActiveFilter('all'); setSortBy('recent'); }}
              className="ml-auto text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4 sm:space-y-6" style={{ visibility: 'visible' }}>
        {Array.isArray(posts) && posts.length > 0 ? (
          posts.map((post, index) => (
            <React.Fragment key={post._id}>
              <div style={{ visibility: 'visible', opacity: 1 }}>
                <PostCard
                  post={post}
                  onUpdate={(upd) => setPosts(prev => prev.map(p => p._id === upd._id ? upd : p))}
                />
              </div>
              {index === 2 && (
                <div className="lg:hidden">
                  <SmartFeedSuggestions index={0} goal={user?.goal || 'Learn'} />
                </div>
              )}
              {index === 5 && (
                <div className="lg:hidden">
                  <SmartFeedSuggestions index={1} goal={user?.goal || 'Learn'} />
                </div>
              )}
            </React.Fragment>
          ))
        ) : !loadingPosts && (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 sm:p-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <BookOpen className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">No posts found</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              {activeFilter !== 'all' 
                ? `No ${currentFilterLabel.toLowerCase()} posts yet. Try a different filter.`
                : 'Be the first to share a skill or an update with the SkillVerse community!'
              }
            </p>
          </div>
        )}
      </div>

      <div ref={loadMoreRef} className="h-1" aria-hidden="true" />

      {loadingPosts && (
        <div className="flex justify-center py-10 scale-75">
          <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-[0.2em]">You're all caught up</p>
        </div>
      )}
    </div>
  );
};

export default HomeFeed;
