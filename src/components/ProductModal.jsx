import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Close as CloseIcon, ShoppingCart as CartIcon } from '@mui/icons-material';
import LazyImage from './LazyImage';

const ProductModal = memo(({ product, quantity, setQuantity, onClose, onAddToCart, addToCartButtonRef }) => {
  const handleModalDragEnd = (event, info) => {
    const dragDistance = info.offset.y;
    const dragVelocity = info.velocity.y;
    const closeThreshold = window.innerHeight * 0.3;
    const velocityThreshold = 500;

    if (dragDistance > closeThreshold || dragVelocity > velocityThreshold) {
      onClose();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="bg-[#FFF3E0] w-full rounded-t-2xl p-4 h-[90%] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
        onDragEnd={handleModalDragEnd}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex justify-center mb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-[#FF6200]">{product.title}</h2>
          <button
            onClick={onClose}
            className="text-[#FF6200] hover:text-[#FFAB40]"
            aria-label="Modalni yopish"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="relative mb-4">
          {product.photo ? (
            <LazyImage
              src={`https://hosilbek02.pythonanywhere.com${product.photo}`}
              placeholder="/images/placeholder.jpg"
              alt={product.title || 'Mahsulot rasmi'}
              className="w-full h-48 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-48 bg-[#FFF3E0] flex items-center justify-center rounded-lg">
              <FastfoodIcon className="w-16 h-16 text-[#FFAB40]" />
            </div>
          )}
        </div>
        <div className="mb-4">
          {product.discounted_price ? (
            <div className="flex items-center flex-wrap gap- Ref: fix-add-to-cart
2">
              <span className="text-lg font-bold text-[#FF6200]">
                {parseFloat(product.discounted_price).toLocaleString('uz-UZ')} so‘m
              </span>
              <span className="text-sm text-[#666] line-through">
                {parseFloat(product.price).toLocaleString('uz-UZ')} so‘m
              </span>
              <span className="bg-[#FFF3E0] text-[#FF6200] text-xs font-semibold px-2 py-1 rounded-full">
                {Math.round(
                  ((parseFloat(product.price) - parseFloat(product.discounted_price)) /
                    parseFloat(product.price)) * 100
                )}
                % chegirma
              </span>
            </div>
          ) : (
            <span className="text-lg font-bold text-[#333]">
              {parseFloat(product.price).toLocaleString('uz-UZ')} so‘m
            </span>
          )}
        </div>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[#333] mb-1">Tavsif</h3>
          <p className="text-sm text-[#666] whitespace-pre-line">
            {product.description || 'Tavsif mavjud emas'}
          </p>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center border border-[#FFAB40] rounded-lg overflow-hidden">
            <button
              onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              disabled={quantity <= 1}
              className={`px-4 py-2 text-[#FF6200] text-lg ${
                quantity <= 1 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              -
            </button>
            <span className="w-12 text-center text-lg text-[#333]">{quantity}</span>
            <button
              onClick={() => setQuantity((prev) => prev + 1)}
              className="px-4 py-2 text-[#FF6200] text-lg"
            >
              +
            </button>
          </div>
          <button
            ref={addToCartButtonRef} // Attach the ref here
            onClick={onAddToCart}
            className="flex items-center border border-[#FFAB40] rounded-lg overflow-hidden p-2 bg-[#FF6200] text-white hover:bg-[#FFAB40] transition-colors"
          >
            <CartIcon className="w-5 h-5 mr-2" />
            Savatga qo'shish
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
});

export default ProductModal;