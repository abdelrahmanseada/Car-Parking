import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";

export function ThemeToggle() {
  const { state, dispatch } = useAppContext();

  const handleToggle = () => {
    dispatch({ type: "TOGGLE_THEME" });
  };

  return (
    <motion.button
      onClick={handleToggle}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-surface-elevated/90 shadow-2xl backdrop-blur-md ring-1 ring-black/5 transition-all hover:scale-110 hover:shadow-3xl dark:bg-surface-elevated-dark/90 dark:ring-white/10"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label={state.isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      title={state.isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state.isDarkMode ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <SunIcon className="h-6 w-6 text-amber-500" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <MoonIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

