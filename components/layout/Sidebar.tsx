"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { FileText, ChevronLeft, ChevronRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, studies, setActiveStudy, activeStudy } =
    useAppStore();

  return (
    <>
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full bg-neutral-950 border-r border-neutral-800 flex flex-col overflow-hidden shrink-0"
          >
            <div className="px-4 py-5 flex items-center gap-2 border-b border-neutral-800">
              <Activity className="w-5 h-5 text-violet-400" />
              <span className="font-semibold text-sm tracking-tight text-white">
                AuraDoc
              </span>
            </div>

            <div className="flex-1 overflow-y-auto py-3 px-2">
              {studies.length === 0 ? (
                <p className="text-xs text-neutral-500 px-2 py-4 text-center">
                  Aucune étude chargée
                </p>
              ) : (
                <ul className="space-y-1">
                  {studies.map((study) => (
                    <li key={study.id}>
                      <button
                        onClick={() => setActiveStudy(study)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-xs flex items-center gap-2 transition-colors",
                          activeStudy?.id === study.id
                            ? "bg-violet-500/20 text-violet-300"
                            : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                        )}
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{study.fileName}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <button
        onClick={toggleSidebar}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-neutral-900 border border-neutral-700 rounded-r-md p-1 hover:bg-neutral-800 transition-colors"
        style={{ left: sidebarOpen ? 260 : 0 }}
      >
        {sidebarOpen ? (
          <ChevronLeft className="w-3 h-3 text-neutral-400" />
        ) : (
          <ChevronRight className="w-3 h-3 text-neutral-400" />
        )}
      </button>
    </>
  );
}
