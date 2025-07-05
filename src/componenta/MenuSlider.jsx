import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Fastfood as FastfoodIcon, Close as CloseIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import screenfull from 'screenfull';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

// Error boundary component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex justify-center items-center min-h-screen bg-red-100">
          <div className="text-center p-4 bg-white rounded-lg shadow">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">Error occurred!</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-2">{this.state.error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm sm:text-base"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Default image component
const DefaultImage = ({ className }) => (
  <div className={`${className} bg-gray-200 flex items-center justify-center`}>
    <FastfoodIcon className="text-gray-400 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
  </div>
);

// Product card component
const ProductCard = React.memo(({ product, onClick, mobile = false }) => {
  const [imgError, setImgError] = useState(false);
  
  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow cursor-pointer ${
        mobile ? 'h-full' : 'h-80'
      }`}
      onClick={onClick}
      style={{ minHeight: mobile ? 220 : 320, maxWidth: 420 }}
    >
      <div className="h-56 overflow-hidden relative">
        {imgError ? (
          <DefaultImage className="w-full h-full" />
        ) : (
          <img
            src={`https://hosilbek.pythonanywhere.com${product.photo}`}
            alt={product.title || 'Product image'}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        )}
      </div>
      <div className="p-3 sm:p-4 md:p-5 flex flex-col gap-2">
        <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-gray-900 truncate mb-1">
          {product.title || 'Untitled product'}
        </h3>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-lg sm:text-xl md:text-2xl font-bold text-[#43A047]">
            {(product.discounted_price || product.price || 0).toLocaleString('uz-UZ')} so'm
          </span>
          
        </div>
      </div>
    </div>
  );
});

// Mobile product grid
const MobileProductGrid = ({ products, onProductClick }) => {
  const itemsNeeded = products.length % 2 === 0 ? 0 : 1;
  const displayedProducts = [...products];
  
  if (itemsNeeded > 0) {
    displayedProducts.push({ id: `placeholder-${Date.now()}`, isPlaceholder: true });
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {displayedProducts.map((product) => (
        product.isPlaceholder ? (
          <div key={product.id} className="opacity-0 h-0" aria-hidden="true" />
        ) : (
          <ProductCard
            key={product.id}
            product={product}
            onClick={() => onProductClick(product)}
            mobile
          />
        )
      ))}
    </div>
  );
};

// Product modal
const ProductModal = React.memo(({ product, onClose, modalRef, onDragEnd }) => {
  const [imgError, setImgError] = useState(false);
  
  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-end sm:items-center sm:justify-center"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        ref={modalRef}
        className="bg-white w-full sm:w-[420px] rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 h-[90vh] overflow-y-auto scroll-smooth shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={onDragEnd}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 3000, damping: 30 }}
      >
        <div className="flex justify-center mb-3">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#43A047] hover:text-[#FF7043] bg-[#E8F5E9] rounded-full p-1 shadow"
        >
          <CloseIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        
        {imgError ? (
          <DefaultImage className="w-full h-48 sm:h-60 p-2 rounded-xl mb-4 sm:mb-5 shadow" />
        ) : (
          <img
            src={`https://hosilbek.pythonanywhere.com${product.photo}`}
            alt={product.title || 'Product image'}
            className="w-full h-48 sm:h-60 object-cover rounded-xl mb-4 sm:mb-5 shadow"
            onError={() => setImgError(true)}
          />
        )}
        
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#388E3C] mb-2">
          {product.title || 'Untitled product'}
        </h2>
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          <span className="text-lg sm:text-xl md:text-2xl font-bold text-[#43A047]">
            {(product.discounted_price || product.price || 0).toLocaleString('uz-UZ')} so'm
          </span>
          
        </div>
        <p className="text-sm sm:text-base md:text-lg text-[#666] mb-2">
          {product.description || 'No description available'}
        </p>
      </motion.div>
    </motion.div>
  );
});

// Main component
const ProductsList = () => {
  const [categories, setCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const modalRef = useRef(null);
  const abortControllerRef = useRef(new AbortController());
  const categoriesRef = useRef(null);

  const API_URL = 'https://hosilbek02.pythonanywhere.com/api/user/products/';

  const shuffleArray = useCallback((array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      const response = await axios.get(API_URL, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_TOKEN_HERE',
        },
        signal: abortControllerRef.current.signal,
      });

      let productsData = Array.isArray(response.data) ? response.data : [];
      productsData = shuffleArray(productsData);

      const grouped = productsData.reduce((acc, product) => {
        const category =
          product.category?.name || product.kitchen?.name || 'Uncategorized';
        if (!acc[category]) acc[category] = [];
        acc[category].push({
          ...product,
          price: product.price || 0,
          discounted_price: product.discounted_price || null,
        });
        return acc;
      }, {});

      Object.keys(grouped).forEach((category) => {
        if (grouped[category].length === 0) delete grouped[category];
      });

      setCategories(grouped);
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log('Request canceled:', err.message);
        return;
      }
      
      const errorMessage =
        err.response?.status === 401
          ? 'Access denied. API may require authentication.'
          : err.response?.data?.message || 'Failed to load products';
      setError(errorMessage);
      setCategories({});
    } finally {
      setLoading(false);
    }
  }, [shuffleArray]);

  useEffect(() => {
    fetchProducts();
    return () => {
      abortControllerRef.current.abort();
    };
  }, [fetchProducts]);

  const handleToggleFullscreen = () => {
    if (screenfull.isEnabled) {
      screenfull.toggle();
    }
  };

  const handleCloseModal = useCallback(() => setSelectedProduct(null), []);

  const handleModalDragEnd = useCallback((event, info) => {
    const dragDistance = info.offset.y;
    const dragVelocity = info.velocity.y;
    const closeThreshold = window.innerHeight * 0.3;
    const velocityThreshold = 500;
    if (dragDistance > closeThreshold || dragVelocity > velocityThreshold) {
      handleCloseModal();
    }
  }, [handleCloseModal]);

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 3000,
    slidesToShow: 4,
    slidesToScroll: 2,
    autoplay: true,
    autoplaySpeed: 10000,
    arrows: true,
    rows: 2,
    slidesPerRow: 1,
    responsive: [
      { 
        breakpoint: 1024, 
        settings: { 
          slidesToShow: 3,
          slidesToScroll: 3
        } 
      },
      { 
        breakpoint: 768, 
        settings: { 
          slidesToShow: 2,
          slidesToScroll: 2,
          rows: 2
        } 
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          rows: 2
        }
      }
    ]
  };

  const filteredCategories =
    selectedCategory === 'all'
      ? categories
      : { [selectedCategory]: categories[selectedCategory] || [] };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9]">
        <div className="bg-white shadow-md rounded-lg px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-t-2 border-[#43A047]"></div>
          <p className="text-[#388E3C] font-medium text-sm sm:text-base">
            Loading products...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] px-4">
        <div className="bg-[#ffebee] border-l-4 border-[#43A047] text-[#388E3C] p-3 sm:p-4 rounded-lg max-w-md w-full">
          <p className="text-sm sm:text-base md:text-lg mb-3">{error}</p>
          <button
            onClick={fetchProducts}
            className="mt-2 px-3 sm:px-4 py-1 sm:py-2 bg-[#43A047] text-white rounded hover:bg-[#66BB6A] font-medium flex items-center justify-center text-xs sm:text-sm md:text-base w-full"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] py-4">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6">
          {/* Header and categories */}
          <div className="mb-8 flex flex-wrap items-center gap-2 sm:gap-3">
            <FastfoodIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#43A047] drop-shadow-md" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#388E3C] tracking-tight">
              Products
            </h1>
            <span className="px-2 py-1 sm:px-3 sm:py-1 rounded-full bg-[#C8E6C9] text-[#388E3C] text-xs sm:text-sm md:text-base font-semibold shadow">
              ({Object.values(categories).flat().length})
            </span>
            <button
              onClick={handleToggleFullscreen}
              className="ml-auto px-2 py-1 sm:px-3 sm:py-1 bg-[#43A047] text-white rounded hover:bg-[#66BB6A] transition-colors text-xs sm:text-sm md:text-base"
            >
              Fullscreen
            </button>
          </div>

          {/* Category buttons with horizontal scroll */}
          <div className="mb-8">
            <div 
              ref={categoriesRef}
              className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#A5D6A7] scrollbar-track-transparent"
              style={{ scrollbarWidth: 'thin' }}
            >
              {['All', ...Object.keys(categories)].map((category) => (
                <button
                  key={category}
                  onClick={() =>
                    setSelectedCategory(category === 'All' ? 'all' : category)
                  }
                  className={`px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm md:text-base rounded-full shadow transition-all duration-200 whitespace-nowrap font-semibold flex-shrink-0 ${
                    (selectedCategory === 'all' && category === 'All') ||
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-[#43A047] to-[#66BB6A] text-white scale-105 shadow-lg'
                      : 'bg-white text-[#388E3C] border border-[#A5D6A7] hover:bg-[#E8F5E9]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Products list */}
          {Object.keys(filteredCategories).length === 0 ? (
            <div className="text-center py-12 sm:py-16 text-[#666] bg-white rounded-2xl p-4 sm:p-6 shadow-lg">
              <FastfoodIcon className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-4 text-[#A5D6A7]" />
              <p className="text-base sm:text-lg md:text-xl font-medium">No products found</p>
              <button
                onClick={() => setSelectedCategory('all')}
                className="mt-4 px-3 sm:px-4 py-1 sm:py-2 bg-[#43A047] text-white rounded hover:bg-[#66BB6A] text-xs sm:text-sm md:text-base"
              >
                Show all products
              </button>
            </div>
          ) : (
            <div className="space-y-8 sm:space-y-10">
              {Object.entries(filteredCategories).map(([category, products]) => (
                <div key={category} className="mb-8">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#388E3C] mb-4 sm:mb-5 pl-2 border-l-4 border-[#A5D6A7]">
                    {category}
                  </h2>

                  {/* Desktop slider */}
                  <div className="hidden md:block">
                    <Slider {...sliderSettings}>
                      {products.map((product) => (
                        <div key={product.id} className="px-2">
                          <ProductCard
                            product={product}
                            onClick={() => setSelectedProduct(product)}
                          />
                        </div>
                      ))}
                    </Slider>
                  </div>

                  {/* Mobile grid */}
                  <div className="md:hidden">
                    <MobileProductGrid 
                      products={products} 
                      onProductClick={setSelectedProduct} 
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Product modal */}
          {selectedProduct && (
            <ProductModal
              product={selectedProduct}
              onClose={handleCloseModal}
              modalRef={modalRef}
              onDragEnd={handleModalDragEnd}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ProductsList;