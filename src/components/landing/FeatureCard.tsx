import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  children?: ReactNode;
  index?: number;
  gradient?: string;
}

export const FeatureCard = ({ 
  title, 
  description, 
  icon, 
  children, 
  index = 0,
  gradient = "from-primary/5 to-purple-500/5"
}: FeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className={`group relative bg-card rounded-2xl p-6 shadow-stripe hover:shadow-stripe-lg transition-all duration-300 border border-border/50 overflow-hidden`}
    >
      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      
      <div className="relative z-10">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>

        {/* Description */}
        <p className="text-muted-foreground text-sm mb-4">{description}</p>

        {/* Optional content (mockups, etc.) */}
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </div>
    </motion.div>
  );
};
