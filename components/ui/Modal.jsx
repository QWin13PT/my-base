"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Cancel01Icon } from '@hugeicons-pro/core-solid-standard';
import { HugeiconsIcon } from '@hugeicons/react';
import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';

const backdropVariants = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
};

const Modal = ({ title, description, children, showModal, closeModal, className, allowBackgroundScroll = false }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);


  useEffect(() => {
    if (showModal && !allowBackgroundScroll) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showModal, allowBackgroundScroll]);

  let modalVariants = {
    visible: {
      opacity: 1,
      scale: 1,
      y: "0%",
      transition: isMobile ? { stiffness: 100 } : undefined

    },
    hidden: {
      opacity: 0,
      scale: isMobile ? 1 : 0.8,
      y: isMobile ? "100%" : "0%",
      transition: isMobile ? { stiffness: 100 } : undefined

    }
  };

  return (
    <AnimatePresence mode="wait">
      {showModal && (
        <motion.div
          className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden  outline-none focus:outline-none backdrop-blur-sm bg-dark/20`}
          onClick={closeModal}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdropVariants}
        >

          <motion.div
            className={`absolute m-0 max-h-[90vh] md:relative w-full max-w-3xl bg-[#1A1A1A] rounded-3xl shadow-lg text-secondary flex flex-col overflow-hidden z-50 p-6 ${className || ''}`}
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className='absolute top-4 right-4 md:top-8 md:right-8 z-50'>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={closeModal}
                className="!p-2 !px-2 !py-2 w-10 h-10"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-4 pt-8 md:p-8 overflow-y-auto flex-1 min-h-0">
              {(title || description) && (
                <div className="pb-4 md:pb-8">
                  {title && <h2 className="text-xl font-semibold mb-2"> {title} </h2>}
                  {description && <span className="text-base opacity-50 ">{description}</span>}
                </div>
              )}

              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;