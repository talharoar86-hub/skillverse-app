import React, { useEffect, useState, useRef, useCallback } from 'react';
import { BookOpen, Bell } from 'lucide-react';
import { postService } from '../services/api';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import SmartFeedSuggestions from '../components/SmartFeedSuggestions';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../auth/AuthContext';

const HomeFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [newPostsAvailable, setNewPostsAvailable] = useState(0);
  const socket = useSocket();

  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);
  const fetchingRef = useRef(false);

  // --- Scroll-reveal animation observer ---
  useEffect(() => {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    const cards = document.querySelectorAll('.scroll-reveal:not(.revealed)');
    cards.forEach((card) => revealObserver.observe(card));

    return () => revealObserver.disconnect();
  }, [posts]);

  // --- Infinite scroll observer ---
  const fetchPosts = useCallback(async () => {
    if (fetchingRef.current || !hasMore) return;
    fetchingRef.current = true;
    setLoadingPosts(true);
    try {
      const data = await postService.getAllPosts(page);

      if (data.length < 10) setHasMore(false);
      else setHasMore(true);

      if (page === 1) {
        setPosts(data);
      } else {
        setPosts(prev => [...prev, ...data]);
      }
    } catch (err) {
      console.error('Failed to fetch posts', err);
    } finally {
      setLoadingPosts(false);
      fetchingRef.current = false;
    }
  }, [page, hasMore]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // IntersectionObserver for infinite scroll sentinel
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingPosts && hasMore) {
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

  // --- Socket listeners ---
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

  return (
    <div className="w-full flex flex-col gap-6 relative">

      {/* New Activity Toast */}
      {newPostsAvailable > 0 && (
        <div className="flex justify-center sticky top-4 z-[60] pointer-events-none mb-4">
          <button
            onClick={() => {
              setPage(1);
              setNewPostsAvailable(0);
              setHasMore(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="pointer-events-auto bg-indigo-600 text-white px-5 py-2.5 rounded-full shadow-2xl font-bold text-sm flex items-center gap-2 animate-bounce hover:bg-indigo-700 transition-all active:scale-95 ring-4 ring-indigo-50"
          >
            <Bell className="w-4 h-4" />
            {newPostsAvailable} new activity
          </button>
        </div>
      )}

      {/* Post Creator Area */}
      <div className="scroll-reveal revealed">
        <CreatePost
          onPostCreated={(newPost) => setPosts(prev => [newPost, ...prev])}
        />
      </div>

      {/* Feed Stream */}
      <div className="space-y-6">
        {Array.isArray(posts) && posts.length > 0 ? (
          posts.map((post, index) => (
            <React.Fragment key={post._id}>
              <div className="scroll-reveal">
                <PostCard
                  post={post}
                  onUpdate={(upd) => setPosts(prev => prev.map(p => p._id === upd._id ? upd : p))}
                />
              </div>
              {/* Inject SmartFeedSuggestions on mobile after every 3rd post, max 2 times */}
              {index === 2 && (
                <div className="lg:hidden scroll-reveal">
                  <SmartFeedSuggestions index={0} goal={user?.goal || 'Learn'} />
                </div>
              )}
              {index === 5 && (
                <div className="lg:hidden scroll-reveal">
                  <SmartFeedSuggestions index={1} goal={user?.goal || 'Learn'} />
                </div>
              )}
            </React.Fragment>
          ))
        ) : !loadingPosts && (
          <div className="bg-white rounded-2xl border border-slate-100 p-20 text-center scroll-reveal revealed">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <BookOpen className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">No posts yet</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              Be the first to share a skill or an update with the SkillVerse community!
            </p>
          </div>
        )}
      </div>

      {/* Infinite Scroll Sentinel */}
      <div ref={loadMoreRef} className="h-1" aria-hidden="true" />

      {/* Loading Spinner */}
      {loadingPosts && (
        <div className="flex justify-center py-10 scale-75">
          <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      )}

      {/* End of Feed */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-[0.2em]">You're all caught up</p>
        </div>
      )}
    </div>
  );
};

export default HomeFeed;
