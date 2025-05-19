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
  AddShoppingCart as CartIcon,
  RemoveShoppingCart as RemoveCartIcon,
} from '@mui/icons-material';
import { useCart } from '../context/CartContext';

const ProductsList = () => {
  const { addToCart, removeFromCart, cartItems } = useCart();
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
  const [sortOption, setSortOption] = useState('default');

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
      
      // Initialize filters with available options
      if (productsData.length > 0) {
        const categories = [...new Set(productsData.map(p => p.category?.name).filter(Boolean))];
        const kitchens = [...new Set(productsData.map(p => p.kitchen?.name).filter(Boolean))];
        setSelectedCategories(categories);
        setSelectedKitchens(kitchens);
        
        // Calculate price range
        const prices = productsData.map(p => parseFloat(p.price));
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        setPriceRange([minPrice, maxPrice]);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Mahsulotlarni yuklab bo‘lmadi';
      setError(errorMessage);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, priceRange, selectedCategories, selectedKitchens, selectedFeatures, products, sortOption]);

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
    
    // Features filter
    if (selectedFeatures.includes('discount')) {
      result = result.filter(product => parseFloat(product.discount) > 0);
    }
    if (selectedFeatures.includes('popular')) {
      result = result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    if (selectedFeatures.includes('new')) {
      result = result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    // Sorting options
    switch(sortOption) {
      case 'price-asc':
        result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price-desc':
        result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'name-asc':
        result.sort((a, b) => a.title?.localeCompare(b.title));
        break;
      case 'name-desc':
        result.sort((a, b) => b.title?.localeCompare(a.title));
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        // Default sorting (newest first)
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
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
        : [...prev, feature]
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
    setSortOption('default');
  };

  const renderRating = (rating) => {
    const stars = [];
    const maxStars = 5;
    const roundedRating = Math.round(rating * 2) / 2;

    for (let i = 1; i <= maxStars; i++) {
      if (i <= roundedRating) {
        stars.push(<StarIcon key={i} className="text-yellow-500 w-4 h-4" />);
      } else if (i - 0.5 === roundedRating) {
        stars.push(<StarHalfIcon key={i} className="text-yellow-500 w-4 h-4" />);
      } else {
        stars.push(<StarEmptyIcon key={i} className="text-yellow-500 w-4 h-4" />);
      }
    }

    return (
      <div className="flex items-center">
        {stars}
        <span className="text-gray-500 text-xs ml-1">({rating?.toFixed(1) || 0})</span>
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

  const sortOptions = [
    { value: 'default', label: 'Standart tartib' },
    { value: 'price-asc', label: 'Narx: Pastdan yuqoriga' },
    { value: 'price-desc', label: 'Narx: Yuqoridan pastga' },
    { value: 'name-asc', label: 'Nomi: A-Z' },
    { value: 'name-desc', label: 'Nomi: Z-A' },
    { value: 'rating', label: 'Reyting boʻyicha' },
  ];

  const isInCart = (productId) => {
    return cartItems.some(item => item.id === productId);
  };

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

            {/* Sorting */}
            <div className="mb-3 border-b pb-2">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
                  <div className="px-2">
                    <input
                      type="range"
                      min="0"
                      max={priceRange[1]}
                      step="1000"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                      className="w-full mb-2"
                    />
                    <input
                      type="range"
                      min="0"
                      max={priceRange[1]}
                      step="1000"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full"
                    />
                  </div>
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
        <div className="flex items-center gap-4 w-full max-w-3xl">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Mahsulot qidirish..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <SearchIcon className="absolute left-3 top-3 text-gray-400" />
          </div>
          <button 
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="p-2 rounded-lg bg-blue-100 text-blue-600 flex items-center gap-1"
          >
            <FilterIcon />
            <span className="hidden md:inline">Filtrlar</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Desktop Filters */}
        <div className={`hidden md:block w-64 flex-shrink-0 ${mobileFilterOpen ? 'block' : 'hidden'}`}>
          <div className="bg-white p-4 rounded-lg shadow-md sticky top-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-lg flex items-center">
                <FilterIcon className="mr-2" />
                Filtrlash
              </h3>
              <button 
                onClick={resetFilters}
                className="text-blue-600 text-sm flex items-center hover:text-blue-800"
              >
                <RefreshIcon className="mr-1" />
                Tozalash
              </button>
            </div>

            {/* Sorting */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Saralash</label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Filter */}
            <div className="mb-4">
              <h4 className="font-medium flex items-center mb-2">
                <PriceIcon className="mr-2 w-4 h-4" />
                Narx oralig'i
              </h4>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{priceRange[0].toLocaleString()} so'm</span>
                <span>{priceRange[1].toLocaleString()} so'm</span>
              </div>
              <div className="px-2">
                <input
                  type="range"
                  min="0"
                  max={priceRange[1]}
                  step="1000"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                  className="w-full mb-2"
                />
                <input
                  type="range"
                  min="0"
                  max={priceRange[1]}
                  step="1000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="mb-4">
              <h4 className="font-medium flex items-center mb-2">
                <CategoryIcon className="mr-2 w-4 h-4" />
                Kategoriyalar
              </h4>
              <div className="space-y-2">
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
            </div>

            {/* Kitchen Filter */}
            <div className="mb-4">
              <h4 className="font-medium flex items-center mb-2">
                <KitchenIcon className="mr-2 w-4 h-4" />
                Oshxonalar
              </h4>
              <div className="space-y-2">
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
            </div>

            {/* Features Filter */}
            <div>
              <h4 className="font-medium flex items-center mb-2">
                <OfferIcon className="mr-2 w-4 h-4" />
                Xususiyatlar
              </h4>
              <div className="space-y-2">
                {features.map(feature => (
                  <button
                    key={feature.id}
                    onClick={() => toggleFeature(feature.id)}
                    className={`flex items-center space-x-2 w-full p-2 rounded-lg text-left ${selectedFeatures.includes(feature.id) ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                  >
                    {feature.icon}
                    <span>{feature.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <FastfoodIcon className="mx-auto text-gray-400 w-12 h-12 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Mahsulot topilmadi</h3>
              <p className="text-gray-500 mb-4">Siz qidirgan mahsulotlar mavjud emas yoki filtrlaringiz juda qattiq</p>
              <button
                onClick={resetFilters}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center mx-auto"
              >
                <RefreshIcon className="mr-2" />
                Filtrlarni tozalash
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <Link to={`/products/${product.id}`} className="block">
                    <div className="relative pb-[75%] bg-gray-100">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.title}
                          className="absolute h-full w-full object-cover"
                        />
                      ) : (
                        <div className="absolute h-full w-full flex items-center justify-center text-gray-400">
                          <FastfoodIcon className="w-12 h-12" />
                        </div>
                      )}
                      {product.discount > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          -{product.discount}%
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">{product.title}</h3>
                      <p className="text-gray-500 text-sm mb-2 line-clamp-2">{product.description}</p>
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          {product.discount > 0 ? (
                            <>
                              <span className="text-red-500 font-bold">
                                {Math.round(parseFloat(product.price) * (1 - parseFloat(product.discount) / 100)).toLocaleString()} so'm
                              </span>
                              <span className="text-gray-400 text-sm line-through ml-2">
                                {parseFloat(product.price).toLocaleString()} so'm
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-900 font-bold">
                              {parseFloat(product.price).toLocaleString()} so'm
                            </span>
                          )}
                        </div>
                        {product.rating && renderRating(product.rating)}
                      </div>
                      {product.cooking_time && (
                        <div className="flex items-center text-gray-500 text-xs mb-2">
                          <TimerIcon className="w-3 h-3 mr-1" />
                          <span>{product.cooking_time} daqiqa</span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => isInCart(product.id) ? removeFromCart(product.id) : addToCart(product)}
                      className={`w-full py-2 rounded-lg flex items-center justify-center ${isInCart(product.id) ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                      {isInCart(product.id) ? (
                        <>
                          <RemoveCartIcon className="mr-2" />
                          Savatdan o'chirish
                        </>
                      ) : (
                        <>
                          <CartIcon className="mr-2" />
                          Savatga qo'shish
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsList;