"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface DraggableItemProps {
  src: string;
  alt: string;
  className?: string;
  containerRef: React.RefObject<HTMLDivElement>;
}

export default function DraggableItem({ src, alt, className, containerRef }: DraggableItemProps) {
  return (
    <motion.div
      drag
      dragConstraints={containerRef}
      dragElastic={0.2}
      animate={{ 
        filter: "drop-shadow(2px 4px 6px rgba(0,0,0,0.08))", 
        rotateX: 0, 
        rotateY: 0, 
        rotateZ: 0 
      }}
      whileHover={{ 
        scale: 1.05, 
        rotate: 3, 
        zIndex: 50 
      }}
      whileTap={{ 
        scale: 1.15, 
        rotateX: 25, 
        rotateY: -15, 
        rotateZ: -5,
        cursor: "grabbing", 
        zIndex: 50,
        filter: "drop-shadow(15px 25px 15px rgba(0,0,0,0.25))"
      }}
      className={`absolute cursor-grab ${className}`}
      style={{ perspective: 1000 }}
    >
      <div className="relative w-24 h-24 md:w-32 md:h-32 pointer-events-none drop-shadow-sm">
        <Image 
          src={src} 
          alt={alt} 
          fill 
          className="object-contain"
        />
      </div>
    </motion.div>
  );
}