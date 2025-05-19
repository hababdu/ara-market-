import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  Fastfood as FastfoodIcon,
  LocalDining as KitchenIcon,
  Category as CategoryIcon,
  AttachMoney as PriceIcon,
  Discount as DiscountIcon,
  Star as StarIcon,
  StarBorder as StarEmptyIcon,
  StarHalf as StarHalfIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ShoppingBasket as BasketIcon,
  Timer as TimerIcon,
  TrendingUp as PopularIcon,
  NewReleases as NewIcon,
  LocalOffer as OfferIcon,
} from '@mui/icons-material';

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState({
    price: false,
    category: false,
    kitchen: false,
    features: false,
  });

  // Filter states
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedKitchens, setSelectedKitchens] = useState([]);
  const [selectedFeatures, setSelectedFeatures] = useState([]);

  const API_URL = 'https://hosilbek.pythonanywhere.com/api/user/products/';

  const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('');
      const productsData = Array.isArray(response.data) ? response.data : [];
      setProducts(productsData);
      setFilteredProducts(productsData);
      
      // Initialize filters with available options
      if (productsData.length > 0) {
        const categories = [...new Set(productsData.map(p => p.category?.name).filter(Boolean))];
        const newLocal = [...new Set(productsData.map(p => p.kitchen?.name).filter(Boolean))];
        const kitchens = newLocal;
        setSelectedCategories(categories);
        setSelectedKitchens(kitchens);
        
        // Calculate price range
        const prices = productsData.map(p => parseFloat(p.price));
        setPriceRange([Math.min(...prices), Math.max(...prices)]);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Mahsulotlarni yuklab bo‘lmadi';
      setError(errorMessage);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, priceRange, selectedCategories, selectedKitchens, selectedFeatures, products]);

  const applyFilters = () => {
    let result = [...products];
    
    // Search filter
    if (search) {
      result = result.filter(product => 
        product.title?.toLowerCase().includes(search.toLowerCase()) ||
        product.description?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Price range filter
    result = result.filter(product => {
      const price = parseFloat(product.price);
      return price >= priceRange[0] && price <= priceRange[1];
    });
    
    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter(product => 
        selectedCategories.includes(product.category?.name)
      );
    }
    
    // Kitchen filter
    if (selectedKitchens.length > 0) {
      result = result.filter(product => 
        selectedKitchens.includes(product.kitchen?.name)
      );
    }
    
    // Features filter (example features)
    if (selectedFeatures.includes('discount') && selectedFeatures.length === 1) {
      result = result.filter(product => parseFloat(product.discount) > 0);
    }
    if (selectedFeatures.includes('popular') && selectedFeatures.length === 1) {
      result = result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    if (selectedFeatures.includes('new') && selectedFeatures.length === 1) {
      result = result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    setFilteredProducts(result);
  };

  const toggleFilterSection = (section) => {
    setExpandedFilters(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleCategory = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleKitchen = (kitchen) => {
    setSelectedKitchens(prev =>
      prev.includes(kitchen)
        ? prev.filter(k => k !== kitchen)
        : [...prev, kitchen]
    );
  };

  const toggleFeature = (feature) => {
    setSelectedFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [feature] // Only allow one feature at a time for simplicity
    );
  };

  const resetFilters = () => {
    setSearch('');
    setPriceRange([0, 100000]);
    const categories = [...new Set(products.map(p => p.category?.name).filter(Boolean))];
    const kitchens = [...new Set(products.map(p => p.kitchen?.name).filter(Boolean))];
    setSelectedCategories(categories);
    setSelectedKitchens(kitchens);
    setSelectedFeatures([]);
  };

  const renderRating = (rating) => {
    const stars = [];
    const maxStars = 5;
    const roundedRating = Math.round(rating * 2) / 2;

    for (let i = 1; i <= maxStars; i++) {
      if (i <= roundedRating) {
        stars.push(<StarIcon key={i} className="text-yellow-500 w-3 h-3" />);
      } else if (i - 0.5 === roundedRating) {
        stars.push(<StarHalfIcon key={i} className="text-yellow-500 w-3 h-3" />);
      } else {
        stars.push(<StarEmptyIcon key={i} className="text-yellow-500 w-3 h-3" />);
      }
    }

    return (
      <div className="flex items-center">
        {stars}
        <span className="text-gray-500 text-xs ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const uniqueCategories = [...new Set(products.map(p => p.category?.name).filter(Boolean))];
  const uniqueKitchens = [...new Set(products.map(p => p.kitchen?.name).filter(Boolean))];
  const features = [
    { id: 'discount', label: 'Chegirmalar', icon: <DiscountIcon className="w-4 h-4" /> },
    { id: 'popular', label: 'Mashhurlar', icon: <PopularIcon className="w-4 h-4" /> },
    { id: 'new', label: 'Yangi mahsulotlar', icon: <NewIcon className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="bg-white shadow-md rounded-lg px-6 py-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-500"></div>
          <p className="text-blue-600 font-medium">Mahsulotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg max-w-md mx-4">
          <p>{error}</p>
          <button
            onClick={fetchProducts}
            className="mt-2 text-red-700 hover:text-red-900 font-medium flex items-center"
          >
            <RefreshIcon className="mr-1" />
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-2 sm:px-4">
      {/* Mobile Header with Search and Filter */}
      <div className="sm:hidden mb-4">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-bold text-blue-600 flex items-center">
            <BasketIcon className="mr-2" />
            Mahsulotlar ({filteredProducts.length})
          </h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="p-2 rounded-full bg-blue-100 text-blue-600"
            >
              {mobileSearchOpen ? <CloseIcon /> : <SearchIcon />}
            </button>
            <button 
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="p-2 rounded-full bg-blue-100 text-blue-600"
            >
              {mobileFilterOpen ? <CloseIcon /> : <FilterIcon />}
            </button>
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="relative mb-2">
            <input
              type="text"
              placeholder="Mahsulot qidirish..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <SearchIcon className="absolute left-3 top-3 text-gray-400" />
          </div>
        )}

        {mobileFilterOpen && (
          <div className="bg-white p-3 rounded-lg shadow-md mb-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium flex items-center">
                <FilterIcon className="mr-1" />
                Filtrlash
              </h3>
              <button 
                onClick={resetFilters}
                className="text-blue-600 text-sm flex items-center"
              >
                <RefreshIcon className="mr-1 w-4 h-4" />
                Tozalash
              </button>
            </div>

            {/* Price Filter */}
            <div className="mb-3 border-b pb-2">
              <button 
                className="flex justify-between items-center w-full"
                onClick={() => toggleFilterSection('price')}
              >
                <span className="font-medium flex items-center">
                  <PriceIcon className="mr-1 w-4 h-4" />
                  Narx oralig'i
                </span>
                {expandedFilters.price ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </button>
              
              {expandedFilters.price && (
                <div className="mt-2 px-1">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{priceRange[0].toLocaleString()} so'm</span>
                    <span>{priceRange[1].toLocaleString()} so'm</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="1000"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                    className="w-full mb-2"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="1000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Category Filter */}
            <div className="mb-3 border-b pb-2">
              <button 
                className="flex justify-between items-center w-full"
                onClick={() => toggleFilterSection('category')}
              >
                <span className="font-medium flex items-center">
                  <CategoryIcon className="mr-1 w-4 h-4" />
                  Kategoriyalar
                </span>
                {expandedFilters.category ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </button>
              
              {expandedFilters.category && (
                <div className="mt-2 space-y-1">
                  {uniqueCategories.map(category => (
                    <label key={category} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                        className="rounded text-blue-600"
                      />
                      <span>{category}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Kitchen Filter */}
            <div className="mb-3 border-b pb-2">
              <button 
                className="flex justify-between items-center w-full"
                onClick={() => toggleFilterSection('kitchen')}
              >
                <span className="font-medium flex items-center">
                  <KitchenIcon className="mr-1 w-4 h-4" />
                  Oshxonalar
                </span>
                {expandedFilters.kitchen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </button>
              
              {expandedFilters.kitchen && (
                <div className="mt-2 space-y-1">
                  {uniqueKitchens.map(kitchen => (
                    <label key={kitchen} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedKitchens.includes(kitchen)}
                        onChange={() => toggleKitchen(kitchen)}
                        className="rounded text-blue-600"
                      />
                      <span>{kitchen}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Features Filter */}
            <div className="mb-2">
              <button 
                className="flex justify-between items-center w-full"
                onClick={() => toggleFilterSection('features')}
              >
                <span className="font-medium flex items-center">
                  <OfferIcon className="mr-1 w-4 h-4" />
                  Xususiyatlar
                </span>
                {expandedFilters.features ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </button>
              
              {expandedFilters.features && (
                <div className="mt-2 space-y-1">
                  {features.map(feature => (
                    <button
                      key={feature.id}
                      onClick={() => toggleFeature(feature.id)}
                      className={`flex items-center space-x-2 w-full p-1 rounded ${selectedFeatures.includes(feature.id) ? 'bg-blue-100 text-blue-600' : ''}`}
                    >
                      {feature.icon}
                      <span>{feature.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden sm:flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-blue-600 flex items-center">
          <BasketIcon className="mr-2" />
          Barcha mahsulotlar ({filteredProducts.length})
        </h1>

        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Qidiruv..."
              className="border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <SearchIcon className="absolute left-3 top-3 text-gray-400" />
          </div>

          <button
            onClick={fetchProducts}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
            disabled={loading}
          >
            <RefreshIcon className="mr-1" />
            Yangilash
          </button>
        </div>
      </div>

      {/* Desktop Filters */}
      <div className="hidden sm:block bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[200px]">
            <h3 className="font-medium mb-2 flex items-center">
              <PriceIcon className="mr-1 w-4 h-4" />
              Narx oralig'i
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([parseInt(e.target.value || 0), priceRange[1]])}
                className="border rounded p-1 w-20 text-sm"
              />
              <span>-</span>
              <input
                type="number"
                min="0"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value || 0)])}
                className="border rounded p-1 w-20 text-sm"
              />
              <span>so'm</span>
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <h3 className="font-medium mb-2 flex items-center">
              <CategoryIcon className="mr-1 w-4 h-4" />
              Kategoriyalar
            </h3>
            <div className="flex flex-wrap gap-2">
              {uniqueCategories.map(category => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`text-xs px-2 py-1 rounded-full flex items-center ${
                    selectedCategories.includes(category)
                      ? 'bg-blue-100 text-blue-600 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <h3 className="font-medium mb-2 flex items-center">
              <KitchenIcon className="mr-1 w-4 h-4" />
              Oshxonalar
            </h3>
            <div className="flex flex-wrap gap-2">
              {uniqueKitchens.map(kitchen => (
                <button
                  key={kitchen}
                  onClick={() => toggleKitchen(kitchen)}
                  className={`text-xs px-2 py-1 rounded-full flex items-center ${
                    selectedKitchens.includes(kitchen)
                      ? 'bg-blue-100 text-blue-600 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  {kitchen}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <h3 className="font-medium mb-2 flex items-center">
              <OfferIcon className="mr-1 w-4 h-4" />
              Xususiyatlar
            </h3>
            <div className="flex flex-wrap gap-2">
              {features.map(feature => (
                <button
                  key={feature.id}
                  onClick={() => toggleFeature(feature.id)}
                  className={`text-xs px-2 py-1 rounded-full flex items-center ${
                    selectedFeatures.includes(feature.id)
                      ? 'bg-blue-100 text-blue-600 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  {feature.icon}
                  <span className="ml-1">{feature.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={resetFilters}
            className="text-blue-600 text-sm flex items-center self-end"
          >
            <RefreshIcon className="mr-1 w-4 h-4" />
            Filtrlarni tozalash
          </button>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          {search ? (
            <>
              <SearchIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-lg">"{search}" bo‘yicha hech narsa topilmadi</p>
            </>
          ) : (
            <>
              <FastfoodIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-lg">Mahsulotlar topilmadi</p>
            </>
          )}
          <button 
            onClick={resetFilters}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center mx-auto"
          >
            <RefreshIcon className="mr-1" />
            Barcha filtrlarni tozalash
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Link
              to={`/products/${product.id}`}
              key={product.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow duration-200 flex flex-col h-full group"
            >
              {/* Product Image */}
              <div className="relative pt-[75%] overflow-hidden">
                {product.photo ? (
                  <img
                    src={`https://hosilbek.pythonanywhere.com${product.photo}`}
                    alt={product.title}
                    className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute top-0 left-0 w-full h-full bg-gray-100 flex items-center justify-center">
                    <FastfoodIcon className="text-gray-400 w-12 h-12" />
                  </div>
                )}
                {parseFloat(product.discount) > 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                    <DiscountIcon className="w-3 h-3 mr-1" />
                    {Math.round((parseFloat(product.discount) / parseFloat(product.price)) * 100)}%
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-3 flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-base truncate" title={product.title}>
                    {product.title || 'Yangi mahsulot'}
                  </h3>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                    {product.unit}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-grow">
                  {product.description || 'Tavsif mavjud emas'}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {product.kitchen?.name && (
                    <span className="flex items-center text-xs bg-gray-100 px-2 py-1 rounded">
                      <KitchenIcon className="w-3 h-3 mr-1" />
                      {product.kitchen.name}
                    </span>
                  )}
                  {product.category?.name && (
                    <span className="flex items-center text-xs bg-gray-100 px-2 py-1 rounded">
                      <CategoryIcon className="w-3 h-3 mr-1" />
                      {product.category.name}
                    </span>
                  )}
                </div>

                {/* Price and Rating */}
                <div className="mt-auto">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <PriceIcon className="text-blue-500 w-4 h-4 mr-1" />
                      <span className={`font-bold text-sm ${
                        parseFloat(product.discount) > 0 ? 'line-through text-gray-400' : ''
                      }`}>
                        {parseFloat(product.price).toLocaleString()} so'm
                      </span>
                    </div>
                    {product.created_at && (
                      <span className="text-gray-400 text-xs flex items-center">
                        <TimerIcon className="w-3 h-3 mr-1" />
                        {new Date(product.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {parseFloat(product.discount) > 0 && (
                    <p className="text-green-600 font-bold text-sm mb-2">
                      {parseFloat(product.discounted_price).toLocaleString()} so'm
                    </p>
                  )}

                  <div className="flex justify-between items-center">
                    {renderRating(product.rating || 0)}
                    {selectedFeatures.includes('popular') && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full flex items-center">
                        <PopularIcon className="w-3 h-3 mr-1" />
                        Mashhur
                      </span>
                    )}
                    {selectedFeatures.includes('new') && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full flex items-center">
                        <NewIcon className="w-3 h-3 mr-1" />
                        Yangi
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsList;