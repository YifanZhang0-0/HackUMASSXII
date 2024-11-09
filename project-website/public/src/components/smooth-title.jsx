// smooth-title.jsx
import React from 'react';
import { motion } from 'framer-motion';

export default function SmoothTitle({ title = "Welcome to my website" }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-700 to-blue-500">
      <motion.h1 
        className="text-4xl md:text-6xl font-bold text-white text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {title}
      </motion.h1>
    </div>
  );
}
smooth-title.jsx
