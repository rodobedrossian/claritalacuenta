import { motion } from "framer-motion";

export const FloatingOrbs = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large soft green orb - top left */}
      <motion.div
        className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-green-300/40 to-emerald-300/30 blur-3xl"
        animate={{
          x: [0, 60, 0],
          y: [0, 40, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Medium purple orb - top right */}
      <motion.div
        className="absolute -top-20 right-20 w-64 h-64 rounded-full bg-gradient-to-bl from-emerald-300/35 to-green-300/25 blur-3xl"
        animate={{
          x: [0, -50, 0],
          y: [0, 50, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
      
      {/* Small blue orb - center right */}
      <motion.div
        className="absolute top-1/3 -right-20 w-48 h-48 rounded-full bg-gradient-to-tl from-blue-300/30 to-cyan-200/20 blur-2xl"
        animate={{
          x: [0, -30, 0],
          y: [0, -40, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
      />
      
      {/* Large indigo orb - bottom left */}
      <motion.div
        className="absolute bottom-20 -left-32 w-72 h-72 rounded-full bg-gradient-to-tr from-indigo-300/30 to-purple-200/20 blur-3xl"
        animate={{
          x: [0, 40, 0],
          y: [0, -30, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      
      {/* Small pink orb - bottom center */}
      <motion.div
        className="absolute bottom-40 left-1/2 w-40 h-40 rounded-full bg-gradient-to-r from-pink-200/25 to-rose-200/20 blur-2xl"
        animate={{
          x: [0, 30, -30, 0],
          y: [0, -20, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      />
    </div>
  );
};
