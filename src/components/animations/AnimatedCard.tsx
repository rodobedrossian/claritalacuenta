import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  delay?: number;
  className?: string;
}

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      delay: delay * 0.1,
      ease: "easeOut" as const
    }
  })
};

export const AnimatedCard = ({ 
  children, 
  delay = 0, 
  className = "",
  ...props 
}: AnimatedCardProps) => {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={delay}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Stagger container for groups of animated cards
export const AnimatedContainer = ({ 
  children, 
  className = "",
  staggerDelay = 0.1
}: { 
  children: ReactNode; 
  className?: string;
  staggerDelay?: number;
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Fade in animation for sections
export const AnimatedSection = ({ 
  children, 
  delay = 0,
  className = "" 
}: { 
  children: ReactNode; 
  delay?: number;
  className?: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: delay * 0.15,
        ease: "easeOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// List item animation
export const AnimatedListItem = motion.div;

export const listItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3 }
  }
};
