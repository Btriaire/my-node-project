import { create } from "zustand";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface PubMedEntity {
  text: string;
  type: "drug" | "disease" | "gene" | "cell" | "other";
  score: number;
}

export interface StudyAnalysis {
  id: string;
  fileName: string;
  uploadedAt: string;
  storageUrl: string;
  extractedText: string;
  status: "uploading" | "analyzing" | "ready" | "error";
  pitch?: string;
  limitations?: string[];
  keyTakeaways?: string[];
  entities?: { id: string; label: string; type: string; links: string[] }[];
  chatMessages?: ChatMessage[];
  pubmedEntities?: PubMedEntity[];
  pubmedStatus?: "idle" | "loading" | "ready" | "error";
}

interface AppState {
  studies: StudyAnalysis[];
  activeStudy: StudyAnalysis | null;
  sidebarOpen: boolean;
  activeTab: "insights" | "chat" | "expert";
  setActiveStudy: (study: StudyAnalysis | null) => void;
  toggleSidebar: () => void;
  setActiveTab: (tab: "insights" | "chat" | "expert") => void;
  addStudy: (study: StudyAnalysis) => void;
  updateStudy: (id: string, patch: Partial<StudyAnalysis>) => void;
  addChatMessage: (studyId: string, message: ChatMessage) => void;
  updateLastAssistantMessage: (studyId: string, content: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  studies: [],
  activeStudy: null,
  sidebarOpen: true,
  activeTab: "insights",
  setActiveStudy: (study) => set({ activeStudy: study, activeTab: "insights" }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  addStudy: (study) => set((s) => ({ studies: [study, ...s.studies] })),
  updateStudy: (id, patch) =>
    set((s) => ({
      studies: s.studies.map((st) => (st.id === id ? { ...st, ...patch } : st)),
      activeStudy:
        s.activeStudy?.id === id ? { ...s.activeStudy, ...patch } : s.activeStudy,
    })),
  addChatMessage: (studyId, message) =>
    set((s) => {
      const patch = (st: StudyAnalysis) => ({
        ...st,
        chatMessages: [...(st.chatMessages ?? []), message],
      });
      return {
        studies: s.studies.map((st) => (st.id === studyId ? patch(st) : st)),
        activeStudy:
          s.activeStudy?.id === studyId ? patch(s.activeStudy) : s.activeStudy,
      };
    }),
  updateLastAssistantMessage: (studyId, content) =>
    set((s) => {
      const patch = (st: StudyAnalysis) => {
        const msgs = [...(st.chatMessages ?? [])];
        if (msgs.length > 0 && msgs[msgs.length - 1].role === "assistant") {
          msgs[msgs.length - 1] = { role: "assistant", content };
        }
        return { ...st, chatMessages: msgs };
      };
      return {
        studies: s.studies.map((st) => (st.id === studyId ? patch(st) : st)),
        activeStudy:
          s.activeStudy?.id === studyId ? patch(s.activeStudy) : s.activeStudy,
      };
    }),
}));
