import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import BrandPageLayout from '../components/BrandPageLayout';
import CategoryNavigation from '../components/CategoryNavigation';
import FloatingNavPanel from '../components/FloatingNavPanel';
import ProductTile from '../components/ProductTile';
import SizeSelectionModal from '../components/SizeSelectionModal';
import SizeChartModal from '../components/SizeChartModal';
import FilterModal from '../components/FilterModal';
import AddToCartSuccessModal from '../components/AddToCartSuccessModal';
import ContentTile from '../components/ContentTile';
import ProgressTracker from '../components/ProgressTracker';
import MostLovedStyles from '../components/MostLovedStyles';
import Notification from '../components/Notification';
import GenderTabs from '../components/GenderTabs';
import api from '../config/api';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { getBrandTheme } from '../utils/brandThemes';
import './BrandPage.css';
import BestDiscounts from '../components/BestDiscounts';

const BrandPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const brandId = searchParams.get('brand');
  const categoryId = searchParams.get('category');
  const colorFilter = searchParams.get('color');
  const sortParam = searchParams.get('sort') || 'popular';

  const [selectedCategory, setSelectedCategory] = useState(categoryId || 'all');
  const [selectedGender, setSelectedGender] = useState(searchParams.get('gender') || null);
  const [filters, setFilters] = useState({});
  const [selectedSort, setSelectedSort] = useState(sortParam);
  const [sizeModalOpen, setSizeModalOpen] = useState(false);
  const [sizeChartModalOpen, setSizeChartModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewedCount, setViewedCount] = useState(0);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [addedProduct, setAddedProduct] = useState(null);
  const [addedSize, setAddedSize] = useState(null);
  const [addedColor, setAddedColor] = useState(null);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { addToCart, fetchCartCount } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  // Fetch brands
  const { data: brands = [] } = useQuery('brands', async () => {
    const response = await api.get('/products/brands/');
    return Array.isArray(response.data?.results) 
      ? response.data.results 
      : (Array.isArray(response.data) ? response.data : []);
  });

  // Get active brand
  const activeBrand = useMemo(() => {
    if (!brandId) return null;
    return brands.find(b => 
      b.slug === brandId || 
      b.id === brandId ||
      b.name?.toLowerCase().replace(/\s+/g, '-') === brandId
    ) || { name: brandId, slug: brandId };
  }, [brands, brandId]);

  // Fetch all products (for total count and pagination)
  const { data: productsData, isLoading: productsLoading, refetch: refetchProducts } = useQuery(
    ['products', brandId, selectedCategory, selectedGender, filters, selectedSort],
    async () => {
      const params = new URLSearchParams();
      if (brandId) params.append('brand', brandId);
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedGender) params.append('gender', selectedGender);
      
      // Handle color filter from URL or filters state
      const colorParam = colorFilter || (filters.colors && filters.colors.length > 0 ? filters.colors.join(',') : null);
      if (colorParam) params.append('color', colorParam);
      
      // Handle size filter
      if (filters.sizes && filters.sizes.length > 0) {
        params.append('size', filters.sizes.join(','));
      }
      
      // Handle price range
      if (filters.priceRange) {
        if (filters.priceRange.min > 0) {
          params.append('min_price', filters.priceRange.min.toString());
        }
        if (filters.priceRange.max < 100000) {
          params.append('max_price', filters.priceRange.max.toString());
        }
      }
      
      // Handle sort
      if (selectedSort) params.append('sort', selectedSort);

      const response = await api.get(`/products/?${params.toString()}`);
      return {
        results: Array.isArray(response.data?.results) 
          ? response.data.results 
          : (Array.isArray(response.data) ? response.data : []),
        count: response.data?.count || 0,
      };
    },
    { enabled: true }
  );

  // Memoize allProducts to prevent unnecessary re-renders
  const allProducts = useMemo(() => {
    return productsData?.results || [];
  }, [productsData?.results]);
  
  const totalCount = productsData?.count || 0;

  // Create a stable filter key to detect filter changes
  const filterKey = useMemo(() => {
    return JSON.stringify({ brandId, selectedCategory, selectedGender, filters, selectedSort });
  }, [brandId, selectedCategory, selectedGender, filters, selectedSort]);

  const prevFilterKeyRef = useRef(filterKey);
  const isInitialMountRef = useRef(true);

  // Reset displayed products and page when filters change
  useEffect(() => {
    const filtersChanged = prevFilterKeyRef.current !== filterKey;
    
    if (filtersChanged || (isInitialMountRef.current && allProducts.length > 0)) {
      // Reset when filters change or on initial mount
      setDisplayedProducts(allProducts.slice(0, 10));
      setCurrentPage(1);
      setViewedCount(Math.min(10, allProducts.length));
      prevFilterKeyRef.current = filterKey;
      isInitialMountRef.current = false;
    }
  }, [filterKey, allProducts]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    const startIndex = nextPage * 10;
    const endIndex = startIndex + 10;
    const nextProducts = allProducts.slice(startIndex, endIndex);
    
    if (nextProducts.length > 0) {
      // Add new products to the START (top) of the grid
      setDisplayedProducts([...nextProducts, ...displayedProducts]);
      setCurrentPage(nextPage);
      setViewedCount(Math.min(startIndex + 10, totalCount));
      
      // Wait a bit for DOM update, then scroll to first product
      setTimeout(() => {
        const productsGrid = document.querySelector('.products-grid');
        if (productsGrid) {
          const firstProduct = productsGrid.firstElementChild;
          if (firstProduct) {
            firstProduct.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            productsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 100);
    }
    setIsLoadingMore(false);
  };

  // Show only first 10 products initially
  const products = displayedProducts.length > 0 ? displayedProducts : allProducts.slice(0, 10);

  const sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price Low-High' },
    { value: 'price_desc', label: 'Price High-Low' },
  ];

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    const params = new URLSearchParams(searchParams);
    if (categoryId === 'all') {
      params.delete('category');
    } else {
      params.set('category', categoryId);
    }
    navigate(`/products?${params.toString()}`);
  };

  const handleBrandSelect = (brand) => {
    if (brand.id === 'all' || brand.slug === 'all') {
      navigate('/products');
    } else {
      navigate(`/products?brand=${brand.slug || brand.id}`);
    }
  };

  const handleSortChange = (sortValue) => {
    setSelectedSort(sortValue);
    const params = new URLSearchParams(searchParams);
    params.set('sort', sortValue);
    navigate(`/products?${params.toString()}`);
  };

  const handleSizeSelect = (product) => {
    setSelectedProduct(product);
    setSizeModalOpen(true);
  };

  const handleAddToCart = async (product, size, quantity, variantId) => {
    try {
      // Find variant ID if not provided
      const finalVariantId = variantId || product.variants?.find(v => v.size === size)?.id;
      
      if (!finalVariantId) {
        console.error('Variant not found for size:', size);
        return;
      }

      // Prepare product data for guest cart
      const productData = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        images: product.images,
      };

      // Get selected variant for color
      const selectedVariant = product.variants?.find(v => v.id === finalVariantId);
      const color = selectedVariant?.color || product.active_color || null;

      const result = await addToCart(product.id, finalVariantId, quantity, productData);
      
      if (result.success) {
        // Close size selection modal
        setSizeModalOpen(false);
        setSelectedProduct(null);
        
        // Set data for success modal
        setAddedProduct(product);
        setAddedSize(size);
        setAddedColor(color);
        
        // Show success modal
        setSuccessModalOpen(true);
        
        // Refresh cart count
        await fetchCartCount();
      } else {
        console.error('Error adding to cart:', result.error);
        // You could show an error notification here
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    const params = new URLSearchParams(searchParams);
    
    // Handle sizes
    if (newFilters.sizes && newFilters.sizes.length > 0) {
      params.set('size', newFilters.sizes.join(','));
    } else {
      params.delete('size');
    }
    
    // Handle colors
    if (newFilters.colors && newFilters.colors.length > 0) {
      params.set('color', newFilters.colors.join(','));
    } else {
      params.delete('color');
    }
    
    // Handle price range
    if (newFilters.priceRange) {
      if (newFilters.priceRange.min > 0) {
        params.set('min_price', newFilters.priceRange.min.toString());
      } else {
        params.delete('min_price');
      }
      if (newFilters.priceRange.max < 100000) {
        params.set('max_price', newFilters.priceRange.max.toString());
      } else {
        params.delete('max_price');
      }
    }
    
    // Handle features (if needed by backend)
    if (newFilters.features && newFilters.features.length > 0) {
      params.set('features', newFilters.features.join(','));
    } else {
      params.delete('features');
    }
    
    // Reset pagination when filters change
    setCurrentPage(1);
    setDisplayedProducts([]);
    
    navigate(`/products?${params.toString()}`);
  };

  const theme = getBrandTheme(activeBrand?.slug || brandId);

  return (
    <BrandPageLayout>
      <CategoryNavigation
        brandId={brandId}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
      />

      <FloatingNavPanel
        brandName={activeBrand?.name}
        itemCount={totalCount}
        brands={brands}
        onBrandSelect={handleBrandSelect}
        onFilterOpen={() => setFilterModalOpen(true)}
        sortOptions={sortOptions}
        selectedSort={selectedSort}
        onSortChange={handleSortChange}
      />

      <section className="products-section">
        <div className="section-container">
          <GenderTabs 
            activeGender={selectedGender === 'men' ? 'him' : selectedGender === 'women' ? 'her' : null}
            onGenderChange={(gender) => setSelectedGender(gender === 'him' ? 'men' : 'women')}
          />

          {productsLoading ? (
            <div className="products-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="product-tile-skeleton" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="products-grid">
                {products.map((product) => (
                  <ProductTile
                    key={product.id}
                    product={product}
                    onSizeSelect={handleSizeSelect}
                  />
                ))}
              </div>
              
              <ProgressTracker
                viewed={viewedCount}
                total={totalCount}
                onLoadMore={handleLoadMore}
                isLoading={isLoadingMore}
                showLoadMore={products.length >= 10 && viewedCount < totalCount}
              />
            </>
          ) : (
            <div className="no-products">
              <p>No products found. Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </section>

      <ContentTile brand={activeBrand} />

      
      <BestDiscounts />

      <SizeSelectionModal
        product={selectedProduct}
        isOpen={sizeModalOpen}
        onClose={() => {
          setSizeModalOpen(false);
          setSelectedProduct(null);
        }}
        onAddToCart={handleAddToCart}
        onSizeChartOpen={() => {
          setSizeChartModalOpen(true);
        }}
      />

      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
      />

      <SizeChartModal
        isOpen={sizeChartModalOpen}
        onClose={() => setSizeChartModalOpen(false)}
        product={selectedProduct}
      />

      <AddToCartSuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        product={addedProduct}
        selectedSize={addedSize}
        selectedColor={addedColor}
      />

      <Notification
        message="Added to cart"
        isVisible={notificationVisible}
        onClose={() => setNotificationVisible(false)}
      />
    </BrandPageLayout>
  );
};

export default BrandPage;

