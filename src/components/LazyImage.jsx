import React, { useEffect, useRef, memo } from 'react';

const LazyImage = memo(({ src, alt, placeholder, className }) => {
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          imgRef.current.src = src;
          imgRef.current.classList.add('loaded');
          observer.unobserve(imgRef.current);
        }
      },
      { rootMargin: '100px' }
    );

    if (imgRef.current) observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={placeholder}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
});

export default LazyImage;
