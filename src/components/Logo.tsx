import React from 'react';
import { motion } from 'motion/react';

export function Logo({ className = "" }: { className?: string }) {
  const logoUrl = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEih11jAXSESceAETWWw0j-TzfeLr0miEP1AFQi4S0BD4hlgLj524ADVAyw2tF1MWbC_R12Cdq4mYs-8Syc_coHQCTjwrsuqnP71UYR_AXgvoRywKRStyFGguhNtUIdPyNuhgFX3FTxSHmei-mQKPjZO4Jah87Z29KkkfBuA1nDX5rYD75JIuyBOWvmJ2SOl/s677/Gemini_Generated_Image_8qqvb58qqvb58qqv-removebg-preview.png";

  return (
    <div className={`relative ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10"
      >
        {/* Main Logo Container with Masking for the Shine */}
        <div className="relative overflow-hidden group">
          <motion.img
            src={logoUrl}
            alt="MH Studio Logo"
            className="h-24 md:h-28 w-auto object-contain drop-shadow-[0_0_20px_rgba(14,165,233,0.4)]"
            animate={{
              y: [0, -4, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Refined Shine Effect restricted to the logo's visible area using mask-image */}
          <motion.div
            className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-[-25deg]"
            style={{
              maskImage: `url(${logoUrl})`,
              WebkitMaskImage: `url(${logoUrl})`,
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskPosition: 'center'
            }}
            initial={{ left: '-150%' }}
            animate={{ left: '150%' }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              repeatDelay: 3
            }}
          />
        </div>
      </motion.div>

      {/* Enhanced Background Glow */}
      <motion.div
        className="absolute inset-0 -top-4 bg-blue-500/10 blur-[40px] rounded-full -z-10"
        animate={{
          opacity: [0.1, 0.25, 0.1],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
}
