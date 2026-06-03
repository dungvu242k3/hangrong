"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center p-0 md:p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Bottom Sheet Box */}
          <motion.div
            initial={{ y: "100%", opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 1 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="bg-[#F8FAFC] border-t-4 border-cta md:border-2 md:border-slate-900/15 rounded-t-3xl md:rounded-3xl p-6 shadow-2xl w-full md:max-w-lg relative z-10 font-body overflow-hidden max-h-[85vh] md:max-h-none flex flex-col"
          >
            {/* Grab/Drag Handle Indicator for Mobile */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 md:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
              {title && (
                <h3 className="text-3xl font-bold font-heading text-slate-800 leading-tight">
                  {title}
                </h3>
              )}
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer text-slate-500"
                aria-label="Đóng bảng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Scrollable Content */}
            <div className="overflow-y-auto pr-1 flex-1 text-slate-700 text-sm md:text-base leading-relaxed">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default BottomSheet;
