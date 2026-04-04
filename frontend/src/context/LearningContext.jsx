import { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import { courseService, enrollmentService } from '../services/api';

const LearningContext = createContext(null);

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const initialState = {
  courses: { data: null, total: 0, page: 1, totalPages: 0, hasMore: true, loading: false, error: null, fetchedAt: null },
  enrollments: { data: [], total: 0, page: 1, totalPages: 0, hasMore: true, loading: false, error: null, fetchedAt: null },
  stats: { data: null, loading: false, error: null, fetchedAt: null },
  categories: { data: [], loading: false, fetchedAt: null },
  wishlist: { data: [], loading: false },
  filters: { type: 'all', search: '', category: '', level: '', minRating: '', sort: 'newest' },
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_COURSES':
      return { ...state, courses: { ...state.courses, ...action.payload, fetchedAt: Date.now() } };
    case 'APPEND_COURSES':
      return {
        ...state,
        courses: {
          ...state.courses,
          data: [...(state.courses.data || []), ...action.payload.courses],
          page: action.payload.page,
          hasMore: action.payload.hasMore,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
          loading: false,
          fetchedAt: Date.now()
        }
      };
    case 'SET_ENROLLMENTS':
      return { ...state, enrollments: { ...state.enrollments, ...action.payload, fetchedAt: Date.now() } };
    case 'APPEND_ENROLLMENTS':
      return {
        ...state,
        enrollments: {
          ...state.enrollments,
          data: [...state.enrollments.data, ...action.payload.enrollments],
          page: action.payload.page,
          hasMore: action.payload.hasMore,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
          loading: false,
          fetchedAt: Date.now()
        }
      };
    case 'SET_STATS':
      return { ...state, stats: { ...state.stats, ...action.payload, fetchedAt: Date.now() } };
    case 'SET_CATEGORIES':
      return { ...state, categories: { data: action.payload, loading: false, fetchedAt: Date.now() } };
    case 'SET_WISHLIST':
      return { ...state, wishlist: { data: action.payload, loading: false } };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'UPDATE_ENROLLMENT':
      return {
        ...state,
        enrollments: {
          ...state.enrollments,
          data: state.enrollments.data.map(e =>
            e._id === action.payload._id ? { ...e, ...action.payload } : e
          )
        }
      };
    default:
      return state;
  }
}

export function LearningProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const abortRef = useRef(null);

  const isCacheValid = (fetchedAt) => fetchedAt && (Date.now() - fetchedAt < CACHE_TTL);

  const fetchCourses = useCallback(async (filters = {}, reset = true) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const mergedFilters = { ...state.filters, ...filters };
    if (reset) {
      dispatch({ type: 'SET_COURSES', payload: { loading: true, error: null, data: null } });
    } else {
      dispatch({ type: 'SET_COURSES', payload: { loading: true, error: null } });
    }
    dispatch({ type: 'SET_FILTERS', payload: filters });

    try {
      const params = {
        type: mergedFilters.type !== 'all' ? mergedFilters.type : undefined,
        search: mergedFilters.search || undefined,
        category: mergedFilters.category || undefined,
        level: mergedFilters.level || undefined,
        minRating: mergedFilters.minRating || undefined,
        sort: mergedFilters.sort,
        page: reset ? 1 : state.courses.page + 1,
        limit: 12
      };
      const data = await courseService.getCoursesPaginated(params);
      if (reset) {
        dispatch({ type: 'SET_COURSES', payload: { data: data.courses, ...data, loading: false } });
      } else {
        dispatch({ type: 'APPEND_COURSES', payload: data });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        dispatch({ type: 'SET_COURSES', payload: { loading: false, error: 'Failed to load courses' } });
      }
    }
  }, [state.filters, state.courses.page]);

  const fetchEnrollments = useCallback(async (filter = 'all', reset = true) => {
    const params = { filter, page: reset ? 1 : state.enrollments.page + 1, limit: 10 };
    if (reset) {
      dispatch({ type: 'SET_ENROLLMENTS', payload: { loading: true, error: null } });
    }
    try {
      const data = await enrollmentService.getMyCoursesPaginated(params);
      if (reset) {
        dispatch({ type: 'SET_ENROLLMENTS', payload: { data: data.enrollments, ...data, loading: false } });
      } else {
        dispatch({ type: 'APPEND_ENROLLMENTS', payload: data });
      }
    } catch {
      dispatch({ type: 'SET_ENROLLMENTS', payload: { loading: false, error: 'Failed to load enrollments' } });
    }
  }, [state.enrollments.page]);

  const fetchStats = useCallback(async () => {
    if (isCacheValid(state.stats.fetchedAt)) return;
    dispatch({ type: 'SET_STATS', payload: { loading: true, error: null } });
    try {
      const data = await enrollmentService.getStats();
      dispatch({ type: 'SET_STATS', payload: { data, loading: false } });
    } catch {
      dispatch({ type: 'SET_STATS', payload: { loading: false, error: 'Failed to load stats' } });
    }
  }, [state.stats.fetchedAt]);

  const fetchCategories = useCallback(async () => {
    if (isCacheValid(state.categories.fetchedAt)) return;
    try {
      const data = await courseService.getCategories();
      dispatch({ type: 'SET_CATEGORIES', payload: data });
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, [state.categories.fetchedAt]);

  const fetchWishlist = useCallback(async () => {
    try {
      const data = await enrollmentService.getWishlist();
      dispatch({ type: 'SET_WISHLIST', payload: data.courses || [] });
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    }
  }, []);

  const toggleWishlist = useCallback(async (courseId) => {
    const isInWishlist = state.wishlist.data.some(c => c._id === courseId);
    // Optimistic update
    if (isInWishlist) {
      dispatch({ type: 'SET_WISHLIST', payload: state.wishlist.data.filter(c => c._id !== courseId) });
    }
    try {
      const data = isInWishlist
        ? await enrollmentService.removeFromWishlist(courseId)
        : await enrollmentService.addToWishlist(courseId);
      dispatch({ type: 'SET_WISHLIST', payload: data.courses || [] });
    } catch {
      // Revert on error
      if (isInWishlist) {
        fetchWishlist();
      }
    }
  }, [state.wishlist.data, fetchWishlist]);

  const enrollInCourse = useCallback(async (courseId) => {
    const result = await enrollmentService.enroll(courseId);
    // Invalidate caches
    dispatch({ type: 'SET_ENROLLMENTS', payload: { fetchedAt: null } });
    dispatch({ type: 'SET_STATS', payload: { fetchedAt: null } });
    return result;
  }, []);

  const updateProgress = useCallback(async (enrollmentId, lessonIndex) => {
    const result = await enrollmentService.updateProgress(enrollmentId, lessonIndex);
    dispatch({ type: 'UPDATE_ENROLLMENT', payload: result });
    dispatch({ type: 'SET_STATS', payload: { fetchedAt: null } });
    return result;
  }, []);

  const value = {
    ...state,
    fetchCourses,
    fetchEnrollments,
    fetchStats,
    fetchCategories,
    fetchWishlist,
    toggleWishlist,
    enrollInCourse,
    updateProgress,
    dispatch,
  };

  return (
    <LearningContext.Provider value={value}>
      {children}
    </LearningContext.Provider>
  );
}

export function useLearning() {
  const ctx = useContext(LearningContext);
  if (!ctx) throw new Error('useLearning must be used within LearningProvider');
  return ctx;
}
