// src/components/assistant/FloatingChatButton.tsx

import React from 'react';
import { MessageSquare, X, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface FloatingChatButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export function FloatingChatButton({ isOpen, onClick }: FloatingChatButtonProps) {
  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="relative">
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 opacity-75 blur-lg"
          animate={{
            scale: isOpen ? [1, 1.1, 1] : [1, 1.2, 1],
            opacity: isOpen ? [0.5, 0.8, 0.5] : [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: isOpen ? 1.5 : 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        <Button
          onClick={onClick}
          size="lg"
          className={`
            relative h-16 w-16 lg:h-20 lg:w-20 rounded-full shadow-2xl transition-all duration-500
            border-2 border-white/20 backdrop-blur-sm
            ${isOpen 
              ? 'bg-gradient-to-br from-red-500 via-pink-500 to-red-600 hover:from-red-600 hover:via-pink-600 hover:to-red-700' 
              : 'bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-800'
            }
            text-white overflow-hidden
          `}
        >
          {/* Background sparkle effect */}
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, white 2px, transparent 2px)',
                'radial-gradient(circle at 80% 50%, white 2px, transparent 2px)',
                'radial-gradient(circle at 50% 20%, white 2px, transparent 2px)',
                'radial-gradient(circle at 50% 80%, white 2px, transparent 2px)',
                'radial-gradient(circle at 20% 50%, white 2px, transparent 2px)',
              ],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
            className="relative z-10"
          >
            {isOpen ? (
              <X className="h-7 w-7 lg:h-8 lg:w-8" />
            ) : (
              <div className="relative">
                <MessageSquare className="h-7 w-7 lg:h-8 lg:w-8" />
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Sparkles className="h-3 w-3 text-yellow-300" />
                </motion.div>
              </div>
            )}
          </motion.div>
          
          {/* Inner shine effect */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent"
            animate={{
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </Button>
        
        {/* Notification dot */}
        {!isOpen && (
          <motion.div
            className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-white shadow-lg"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <div className="absolute inset-0 rounded-full bg-red-400 animate-ping" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default FloatingChatButton;