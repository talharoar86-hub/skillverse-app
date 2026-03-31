import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageSquare,
  Share2,
  Download,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { getImageUrl } from '../utils/avatar';

const Lightbox = ({
  images = [],
  initialIndex = 0,
  onClose,
  post = null,
  user = null,
  onLike,
  onComment,
  onShare,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!images.length) return null;

  const currentImage = images[currentIndex];
  const fullUrl = getImageUrl(currentImage);

  const isLiked = post?.likes?.includes(user?._id);

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(fullUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${currentIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(fullUrl, '_blank');
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in select-none"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center z-10 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          {post && (
            <div className="flex items-center gap-2">
              <span className="text-white/70 text-sm font-semibold truncate max-w-[200px]">
                {post.authorName}
              </span>
              {images.length > 1 && (
                <>
                  <span className="text-white/30 text-xs">·</span>
                  <span className="text-white/50 text-sm font-medium">
                    {currentIndex + 1} / {images.length}
                  </span>
                </>
              )}
            </div>
          )}
          {!post && images.length > 1 && (
            <span className="text-white/60 text-sm font-medium">
              {currentIndex + 1} / {images.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-all pointer-events-auto active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-2 sm:left-4 p-2.5 sm:p-3 bg-black/40 hover:bg-black/60 text-white/80 hover:text-white rounded-full transition-all z-10 active:scale-90 backdrop-blur-sm"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 sm:right-4 p-2.5 sm:p-3 bg-black/40 hover:bg-black/60 text-white/80 hover:text-white rounded-full transition-all z-10 active:scale-90 backdrop-blur-sm"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </>
      )}

      {/* Main Image */}
      <div
        className="relative w-full h-full flex items-center justify-center p-4 sm:p-16"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={fullUrl}
          alt={`Image ${currentIndex + 1}`}
          className="rounded-lg shadow-2xl object-contain max-w-full max-h-full"
        />
      </div>

      {/* Bottom Action Bar */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="flex justify-center gap-1.5 mb-3 pointer-events-auto">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  'w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 transition-all overflow-hidden shrink-0',
                  currentIndex === i
                    ? 'border-white shadow-lg scale-105'
                    : 'border-transparent opacity-40 hover:opacity-80'
                )}
              >
                <img
                  src={getImageUrl(img)}
                  className="w-full h-full object-cover"
                  alt=""
                />
              </button>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 pb-4 sm:pb-6 pointer-events-auto">
          {onLike && (
            <button
              onClick={onLike}
              className={cn(
                'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all active:scale-95 backdrop-blur-md',
                isLiked
                  ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              )}
            >
              <Heart className={cn('w-4 h-4 sm:w-5 sm:h-5', isLiked && 'fill-current')} />
              <span className="hidden sm:inline">{isLiked ? 'Liked' : 'Like'}</span>
            </button>
          )}
          {onComment && (
            <button
              onClick={onComment}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all active:scale-95 backdrop-blur-md"
            >
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Comment</span>
            </button>
          )}
          {onShare && (
            <button
              onClick={onShare}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all active:scale-95 backdrop-blur-md"
            >
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all active:scale-95 backdrop-blur-md"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Lightbox;
