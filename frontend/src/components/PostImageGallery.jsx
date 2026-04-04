import React, { useState, useCallback } from 'react';
import { getImageUrl } from '../utils/avatar';
import { cn } from '../utils/cn';
import { AlertTriangle } from 'lucide-react';

const PostImageGallery = ({ imageUrls, imageUrl, onImageClick }) => {
  const [loadedImages, setLoadedImages] = useState({});
  const [failedImages, setFailedImages] = useState({});
  const imgs = imageUrls && imageUrls.length > 0 ? imageUrls : imageUrl ? [imageUrl] : [];
  const count = imgs.length;

  const handleImageLoad = useCallback((index) => {
    setLoadedImages((prev) => ({ ...prev, [index]: true }));
  }, []);

  const handleImageError = useCallback((index) => {
    setFailedImages((prev) => ({ ...prev, [index]: true }));
    setLoadedImages((prev) => ({ ...prev, [index]: true }));
  }, []);

  if (count === 0) return null;

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onImageClick(index);
    }
  };

  const renderImage = (url, index) => {
    const hasFailed = failedImages[index];
    const isLoaded = loadedImages[index];

    if (hasFailed) {
      return (
        <div className="absolute inset-0 w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
          <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8" />
        </div>
      );
    }

    return (
      <>
        <div className={cn(
          "absolute inset-0 w-full h-full transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}>
          <img
            src={getImageUrl(url)}
            alt={`Post image ${index + 1}`}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            loading="lazy"
            onLoad={() => handleImageLoad(index)}
            onError={() => handleImageError(index)}
          />
        </div>
        {!isLoaded && !hasFailed && (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-100">
            <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        )}
      </>
    );
  };

  if (count === 1) {
    return (
      <div
        className="w-full relative overflow-hidden rounded-xl sm:rounded-2xl bg-slate-50 cursor-pointer group"
        style={{ aspectRatio: '16/9' }}
        onClick={() => onImageClick(0)}
        onKeyDown={(e) => handleKeyDown(e, 0)}
        role="button"
        tabIndex={0}
        aria-label={`View image 1 of ${count}`}
      >
        {renderImage(imgs[0], 0)}
      </div>
    );
  }

  if (count === 2) {
    return ( 
      <div 
        className="w-full relative overflow-hidden rounded-xl sm:rounded-2xl bg-slate-50 cursor-pointer group"
        style={{ aspectRatio: '2/1' }}
        role="group"
        aria-label={`Image gallery with ${count} images`}
      >
        <div className="absolute inset-0 grid grid-cols-2 gap-[2px] sm:gap-[3px]">
          {imgs.map((url, i) => (
            <div 
              key={i} 
              className="relative overflow-hidden group"
              onClick={(e) => { e.stopPropagation(); onImageClick(i); }}
              onKeyDown={(e) => handleKeyDown(e, i)}
              role="button"
              tabIndex={0}
              aria-label={`View image ${i + 1} of ${count}`}
            >
              {renderImage(url, i)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (count === 3) {
    return ( 
      <div 
        className="w-full relative overflow-hidden rounded-xl sm:rounded-2xl bg-slate-50 cursor-pointer group"
        style={{ aspectRatio: '3/2' }}
        role="group"
        aria-label={`Image gallery with ${count} images`}
      >
        <div className="absolute inset-0 grid grid-cols-3 gap-[2px] sm:gap-[3px]">
          {imgs.map((url, i) => (
            <div 
              key={i} 
              className="relative overflow-hidden group"
              onClick={(e) => { e.stopPropagation(); onImageClick(i); }}
              onKeyDown={(e) => handleKeyDown(e, i)}
              role="button"
              tabIndex={0}
              aria-label={`View image ${i + 1} of ${count}`}
            >
              {renderImage(url, i)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const remaining = count - 3;
  return ( 
    <div 
      className="w-full relative overflow-hidden rounded-xl sm:rounded-2xl bg-slate-50 cursor-pointer group"
      style={{ aspectRatio: '3/2' }}
      role="group"
      aria-label={`Image gallery with ${count} images`}
    >
      <div className="absolute inset-0 grid grid-cols-3 gap-[2px] sm:gap-[3px]">
        <div 
          className="relative overflow-hidden group"
          onClick={(e) => { e.stopPropagation(); onImageClick(0); }}
          onKeyDown={(e) => handleKeyDown(e, 0)}
          role="button"
          tabIndex={0}
          aria-label={`View image 1 of ${count}`}
        >
          {renderImage(imgs[0], 0)}
        </div>
        <div 
          className="relative overflow-hidden group"
          onClick={(e) => { e.stopPropagation(); onImageClick(1); }}
          onKeyDown={(e) => handleKeyDown(e, 1)}
          role="button"
          tabIndex={0}
          aria-label={`View image 2 of ${count}`}
        >
          {renderImage(imgs[1], 1)}
        </div>
        <div 
          className="relative overflow-hidden group"
          onClick={(e) => { e.stopPropagation(); onImageClick(2); }}
          onKeyDown={(e) => handleKeyDown(e, 2)}
          role="button"
          tabIndex={0}
          aria-label={`View image ${count} - ${remaining} more`}
        >
          {renderImage(imgs[2], 2)}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/60 transition-colors duration-300">
            <div className="flex flex-col items-center justify-center">
              <span className="text-white text-2xl sm:text-3xl md:text-4xl font-bold leading-none">+{remaining}</span>
              <span className="text-white/80 text-[10px] sm:text-xs font-medium mt-0.5">more</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostImageGallery;
