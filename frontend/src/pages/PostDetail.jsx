import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { postService } from '../services/api';
import PostCard from '../components/PostCard';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shouldAutoReply = searchParams.get('reply') === 'true';
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      try {
        const data = await postService.getPostById(id);
        setPost(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError(err.response?.data?.message || 'Could not load the post. It may have been deleted.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchPost();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Fetching post details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Oops! Post not found</h2>
          <p className="text-slate-500 mb-8">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            Go to Home Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors group"
        >
          <div className="p-2 bg-white rounded-full shadow-sm border border-slate-100 group-hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span>Back</span>
        </button>
        <h1 className="text-sm font-black text-slate-400 uppercase tracking-widest">Post View</h1>
      </div>

      {post && <PostCard post={post} autoOpenComments={shouldAutoReply} />}
      
      <div className="mt-8 pt-8 border-t border-slate-100 text-center">
        <p className="text-slate-400 text-sm font-medium">
          Viewing this post in focus mode. 
          <button 
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:underline ml-1"
          >
            Explore more on SkillVerse
          </button>
        </p>
      </div>
    </div>
  );
};

export default PostDetail;
