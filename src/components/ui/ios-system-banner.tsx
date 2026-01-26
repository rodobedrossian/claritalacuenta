import { useIOSBanner } from "@/hooks/use-ios-banner";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function IOSSystemBanner() {
  const banner = useIOSBanner();

  return (
    <AnimatePresence>
      {banner && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[200] pt-safe px-4 pointer-events-none"
        >
          <div 
            className={cn(
              "mx-auto w-fit max-w-[90%] min-h-[36px] flex items-center gap-2 px-4 py-2 rounded-full shadow-lg backdrop-blur-md border border-white/10 mt-2 pointer-events-auto",
              banner.type === 'error' && "bg-destructive text-white",
              banner.type === 'info' && "bg-[#2D1B69] text-white", // Violeta oscuro branding
              banner.type === 'success' && "bg-success text-white"
            )}
          >
            {banner.type === 'error' && <AlertCircle className="h-4 w-4 shrink-0" />}
            {banner.type === 'info' && <Info className="h-4 w-4 shrink-0" />}
            {banner.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0" />}
            
            <span className="text-[13px] font-semibold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
              {banner.message}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
