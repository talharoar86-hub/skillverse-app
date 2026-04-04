import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search, X, Users, BookOpen, FileText, Image, User, MessageSquare, Loader2 } from 'lucide-react';
import { searchService } from '../services/api';
import { getAvatarUrl } from '../utils/avatar';
import { useAuth } from '../auth/AuthContext';

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  const [results, setResults] = useState({ posts: [], users: [], courses: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(query);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchSuggestions = useCallback(async (input) => {
    if (!input || input.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const data = await searchService.getSuggestions(input);
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, fetchSuggestions]);

  const fetchResults = useCallback(async () => {
    if (!query.trim()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await searchService.search(query, type, page);
      setResults(data);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  }, [query, type, page]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput, type: 'all', page: '1' });
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchInput(suggestion);
    setShowSuggestions(false);
    setSearchParams({ q: suggestion, type: 'all', page: '1' });
  };

  const handleTypeChange = (newType) => {
    setSearchParams({ q: query, type: newType, page: '1' });
  };

  const typeTabs = [
    { id: 'all', label: 'All', icon: Search },
    { id: 'posts', label: 'Posts', icon: FileText },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'courses', label: 'Courses', icon: BookOpen },
  ];

  const filteredResults = () => {
    switch (type) {
      case 'posts': return { posts: results.posts, count: results.posts?.length || 0 };
      case 'users': return { users: results.users, count: results.users?.length || 0 };
      case 'courses': return { courses: results.courses, count: results.courses?.length || 0 };
      default:
        return {
          count: (results.posts?.length || 0) + (results.users?.length || 0) + (results.courses?.length || 0)
        };
    }
  };

  const currentResults = filteredResults();

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Search Header */}
      <div className="mb-6 relative">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search skills, mentors, posts..."
            className="w-full bg-white border border-slate-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50/50 focus:outline-none rounded-2xl py-3 pl-12 pr-12 text-sm font-medium text-slate-800 placeholder-slate-400 transition-all"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </form>
        
        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4 text-slate-400" />
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Type Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {typeTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTypeChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                type === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Results Summary */}
      {!loading && query && (
        <p className="text-sm text-slate-500 mb-4">
          {currentResults.count} result{currentResults.count !== 1 ? 's' : ''} for "{query}"
        </p>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Results Content */}
      {!loading && query && (
        <div className="space-y-4">
          {/* Posts */}
          {type === 'all' || type === 'posts' ? (
            results.posts?.length > 0 ? (
              results.posts.map(post => (
                <Link
                  key={post._id}
                  to={`/post/${post._id}`}
                  className="block bg-white rounded-2xl border border-slate-100 p-4 hover:border-indigo-200 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={getAvatarUrl(post.author)}
                      alt={post.author?.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-800">{post.author?.name}</p>
                      <p className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleDateString()}</p>
                    </div>
                    {post.type && (
                      <span className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                        post.type === 'Question' ? 'bg-orange-100 text-orange-600' :
                        post.type === 'Guide' ? 'bg-violet-100 text-violet-600' :
                        'bg-emerald-100 text-emerald-600'
                      }`}>
                        {post.type}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1 line-clamp-2">{post.content}</h3>
                  {post.tags?.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {post.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))
            ) : type === 'posts' ? (
              <div className="text-center py-12 text-slate-400">No posts found</div>
            ) : null
          ) : null}

          {/* Users */}
          {type === 'all' || type === 'users' ? (
            results.users?.length > 0 ? (
              results.users.map(u => (
                <Link
                  key={u._id}
                  to={`/user/${u._id}/overview`}
                  className="flex items-center gap-4 bg-white rounded-2xl border border-slate-100 p-4 hover:border-indigo-200 hover:shadow-lg transition-all"
                >
                  <img
                    src={getAvatarUrl(u)}
                    alt={u.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-100"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800">{u.name}</h3>
                    <p className="text-sm text-slate-500">{u.experienceLevel || 'Skill Enthusiast'}</p>
                    {u.skills?.length > 0 && (
                      <p className="text-xs text-slate-400 mt-1">Skills: {u.skills.slice(0, 3).join(', ')}</p>
                    )}
                  </div>
                  {u.goal && (
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                      u.goal === 'Mentor' ? 'bg-indigo-100 text-indigo-600' :
                      u.goal === 'Learn' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {u.goal}
                    </span>
                  )}
                </Link>
              ))
            ) : type === 'users' ? (
              <div className="text-center py-12 text-slate-400">No users found</div>
            ) : null
          ) : null}

          {/* Courses */}
          {type === 'all' || type === 'courses' ? (
            results.courses?.length > 0 ? (
              results.courses.map(course => (
                <Link
                  key={course._id}
                  to={`/learn/course/${course._id}`}
                  className="flex gap-4 bg-white rounded-2xl border border-slate-100 p-4 hover:border-indigo-200 hover:shadow-lg transition-all"
                >
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-slate-300" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800">{course.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{course.category}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span>{course.duration || '0h'}</span>
                      <span>{course.lessons || 0} lessons</span>
                      {course.rating && <span className="text-yellow-500">★ {course.rating}</span>}
                    </div>
                  </div>
                </Link>
              ))
            ) : type === 'courses' ? (
              <div className="text-center py-12 text-slate-400">No courses found</div>
            ) : null
          ) : null}

          {/* Empty State */}
          {currentResults.count === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="font-bold text-slate-800 mb-2">No results found</h3>
              <p className="text-sm text-slate-500">Try different keywords or browse categories</p>
            </div>
          )}
        </div>
      )}

      {/* No Query State */}
      {!loading && !query && (
        <div className="text-center py-20">
          <Search className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="font-bold text-slate-800 mb-2">Search SkillVerse</h3>
          <p className="text-sm text-slate-500">Find mentors, posts, courses, and more</p>
        </div>
      )}
    </div>
  );
};

export default SearchResults;