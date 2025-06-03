
import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close as CloseIcon, Delete as DeleteIcon } from '@mui/icons-material';

const ConfirmDeleteModal = memo(({ confirmDelete, setConfirmDelete, removeItem }) => (
  <AnimatePresence>
    {confirmDelete && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Mahsulotni o‘chirish</h2>
            <button
              onClick={() => setConfirmDelete(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <CloseIcon />
            </button>
          </div>
          <p className="text-gray-600 mb-6">
            Haqiqatan ham bu mahsulotni savatdan o‘chirmoqchimisiz?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmDelete(null)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Bekor qilish
            </button>
            <button
              onClick={() => removeItem(confirmDelete)}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center"
            >
              <DeleteIcon className="mr-1" />
              O‘chirish
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
));

export default ConfirmDeleteModal;
