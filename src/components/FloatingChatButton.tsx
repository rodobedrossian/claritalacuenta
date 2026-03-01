import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export const FloatingChatButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on chat page itself
  if (location.pathname === "/chat") return null;

  return (
    <motion.button
      onClick={() => navigate("/chat")}
      className="fixed bottom-[calc(72px+env(safe-area-inset-bottom,0px)+12px)] left-4 z-[70] flex items-center gap-2 px-4 py-3 rounded-full gradient-primary shadow-stripe-lg active:scale-95 transition-transform"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
      whileTap={{ scale: 0.9 }}
    >
      <Sparkles className="h-5 w-5 text-primary-foreground" />
      <span className="text-sm font-bold text-primary-foreground">Rúcula AI</span>
    </motion.button>
  );
};
