import React from 'react';
import { getImageUrl } from '../utils/avatar';

const PostImageGallery = ({ imageUrls, imageUrl, onImageClick }) => {
  const imgs = imageUrls && imageUrls.length > 0 ? imageUrls : imageUrl ? [imageUrl] : [];
  const count = imgs.length;

  if (count === 0) return null;

  if (count === 1) {
    return (
      <div
        className="w-full max-h-[450px] overflow-hidden bg-slate-100 cursor-pointer group"
        onClick={() => onImageClick(0)}
      >
        <img
          src={getImageUrl(imgs[0])}
          alt="Post content"
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
        />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-[3px] max-h-[350px] sm:max-h-[400px] overflow-hidden">
        {imgs.map((url, i) => (
          <div key={i} className="aspect-[4/3] overflow-hidden cursor-pointer group" onClick={() => onImageClick(i)}>
            <img
              src={getImageUrl(url)}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
              alt=""
              loading="lazy"
            />
          </div>
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="grid grid-cols-2 gap-[3px] max-h-[400px] sm:max-h-[450px] overflow-hidden">
        <div className="row-span-2 overflow-hidden cursor-pointer group" onClick={() => onImageClick(0)}>
          <img
            src={getImageUrl(imgs[0])}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            alt=""
            loading="lazy"
          />
        </div>
        <div className="overflow-hidden cursor-pointer group" onClick={() => onImageClick(1)}>
          <img
            src={getImageUrl(imgs[1])}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            alt=""
            loading="lazy"
          />
        </div>
        <div className="overflow-hidden cursor-pointer group" onClick={() => onImageClick(2)}>
          <img
            src={getImageUrl(imgs[2])}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            alt=""
            loading="lazy"
          />
        </div>
      </div>
    );
  }

  // 4 or more images: show first 3, overlay on 3rd
  const remaining = count - 3;
  return (
    <div className="grid grid-cols-2 gap-[3px] max-h-[400px] sm:max-h-[450px] overflow-hidden">
      <div className="row-span-2 overflow-hidden cursor-pointer group" onClick={() => onImageClick(0)}>
        <img
          src={getImageUrl(imgs[0])}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          alt=""
          loading="lazy"
        />
      </div>
      <div className="overflow-hidden cursor-pointer group" onClick={() => onImageClick(1)}>
        <img
          src={getImageUrl(imgs[1])}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          alt=""
          loading="lazy"
        />
      </div>
      <div className="relative overflow-hidden cursor-pointer group" onClick={() => onImageClick(2)}>
        <img
          src={getImageUrl(imgs[2])}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          alt=""
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center group-hover:bg-black/60 transition-colors duration-300">
          <span className="text-white text-2xl sm:text-3xl font-bold tracking-tight">+{remaining}</span>
        </div>
      </div>
    </div>
  );
};

export default PostImageGallery;
