/**
 * NotesView.tsx
 * ─────────────────────────────────────────────────────────────────────────
 * AI-generated lecture notes for a selected subject + module.
 * Calls geminiService.generateNotes() and displays structured content.
 * Results are cached in localStorage so the student doesn't re-generate.
 */

import { useState } from "react";
import {
  BookOpen, Lightbulb, HelpCircle, List, Loader2,
  RefreshCw, ChevronDown, ChevronRight, Cpu, FileText,
} from "lucide-react";
import { generateNotes, clearNotesCache } from "@/services/geminiService";
import type { GeminiNotes } from "@/services/geminiService";

interface Props {
  subject: string;
  module: string;
}

type SectionKey = "overview" | "concepts" | "explanations" | "definitions" | "examQuestions" | "summary";

export function NotesView({ subject, module }: Props) {
  const [notes, setNotes] = useState<GeminiNotes | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(
    new Set(["overview", "concepts"])
  );

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const load = async (regenerate = false) => {
    if (!subject || !module) return;
    setLoading(true);
    setError(null);
    if (regenerate) clearNotesCache(subject, module);
    try {
      const result = await generateNotes(subject, module);
      setNotes(result);
      setOpenSections(new Set(["overview", "concepts", "explanations"]));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Failed to generate notes. Check your Gemini API key."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!subject || !module) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <BookOpen className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">Select a course and module to generate notes.</p>
      </div>
    );
  }

  if (!notes && !loading && !error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Cpu className="w-10 h-10 text-primary" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full animate-pulse" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-foreground mb-1">AI Lecture Notes</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Generate structured notes for <span className="text-primary font-semibold">{subject}</span> · Module <span className="text-primary font-semibold">{module}</span> using Gemini AI.
          </p>
        </div>
        <button
          onClick={() => load()}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all hover:scale-105 shadow-lg"
        >
          <Cpu className="w-5 h-5" />
          Generate Notes
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">
          Gemini is generating lecture notes for <span className="text-primary">{subject} · Module {module}</span>…
        </p>
        <p className="text-xs text-muted-foreground">This may take 10–20 seconds.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <HelpCircle className="w-8 h-8 text-destructive" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground mb-1">Generation Failed</p>
          <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
        </div>
        <button
          onClick={() => load()}
          className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (!notes) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">{subject}</h2>
          <p className="text-sm text-muted-foreground">Module {module} · AI-Generated Lecture Notes</p>
        </div>
        <button
          onClick={() => load(true)}
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary border border-border px-3 py-1.5 rounded-lg hover:border-primary/50 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Regenerate
        </button>
      </div>

      {/* Overview */}
      <Section
        icon={<FileText className="w-4 h-4" />}
        title="Module Overview"
        sectionKey="overview"
        open={openSections.has("overview")}
        onToggle={toggleSection}
        color="cyan"
      >
        <p className="text-sm text-foreground leading-relaxed">{notes.overview}</p>
      </Section>

      {/* Key Concepts */}
      <Section
        icon={<Lightbulb className="w-4 h-4" />}
        title={`Key Concepts (${notes.concepts?.length ?? 0})`}
        sectionKey="concepts"
        open={openSections.has("concepts")}
        onToggle={toggleSection}
        color="purple"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {notes.concepts?.map((c, i) => (
            <div key={i} className="bg-muted/40 rounded-xl p-4 border border-border">
              <p className="font-bold text-sm text-foreground mb-1">{c.term}</p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2">{c.definition}</p>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                {c.importance}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Explanations */}
      <Section
        icon={<BookOpen className="w-4 h-4" />}
        title="Detailed Explanations"
        sectionKey="explanations"
        open={openSections.has("explanations")}
        onToggle={toggleSection}
        color="amber"
      >
        <div className="space-y-4">
          {notes.explanations?.map((e, i) => (
            <div key={i} className="border-l-2 border-primary/30 pl-4 py-1">
              <p className="font-bold text-sm text-foreground mb-1">{e.concept}</p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2">{e.explanation}</p>
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest block mb-1">Example</span>
                <p className="text-xs text-foreground">{e.example}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Definitions */}
      {notes.definitions && notes.definitions.length > 0 && (
        <Section
          icon={<List className="w-4 h-4" />}
          title="Key Definitions"
          sectionKey="definitions"
          open={openSections.has("definitions")}
          onToggle={toggleSection}
          color="green"
        >
          <div className="space-y-2">
            {notes.definitions.map((d, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="font-bold text-primary min-w-[140px] shrink-0">{d.term}</span>
                <span className="text-muted-foreground leading-relaxed">{d.value}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Exam Questions */}
      <Section
        icon={<HelpCircle className="w-4 h-4" />}
        title={`Exam Questions (${notes.examQuestions?.length ?? 0})`}
        sectionKey="examQuestions"
        open={openSections.has("examQuestions")}
        onToggle={toggleSection}
        color="purple"
      >
        <div className="space-y-4">
          {notes.examQuestions?.map((q, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4">
              <p className="font-semibold text-sm text-foreground mb-2">Q{i + 1}. {q.q}</p>
              <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-2">
                <span className="font-bold text-primary">A: </span>{q.a}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Summary */}
      <Section
        icon={<List className="w-4 h-4" />}
        title="Key Takeaways"
        sectionKey="summary"
        open={openSections.has("summary")}
        onToggle={toggleSection}
        color="cyan"
      >
        <ul className="space-y-2">
          {notes.summary?.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span className="text-foreground leading-relaxed">{s}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

// ── Accordion Section ─────────────────────────────────────────────────────
const COLOR_CLASSES: Record<string, { icon: string; header: string }> = {
  cyan:   { icon: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10",   header: "hover:border-cyan-500/30" },
  purple: { icon: "text-purple-600 dark:text-purple-400 bg-purple-500/10", header: "hover:border-purple-500/30" },
  amber:  { icon: "text-amber-600 dark:text-amber-400 bg-amber-500/10", header: "hover:border-amber-500/30" },
  green:  { icon: "text-green-600 dark:text-green-400 bg-green-500/10", header: "hover:border-green-500/30" },
};

function Section({
  icon, title, sectionKey, open, onToggle, color = "cyan", children,
}: {
  icon: React.ReactNode;
  title: string;
  sectionKey: SectionKey;
  open: boolean;
  onToggle: (k: SectionKey) => void;
  color?: string;
  children: React.ReactNode;
}) {
  const c = COLOR_CLASSES[color] ?? COLOR_CLASSES.cyan;
  return (
    <div className={`bg-card border border-border rounded-2xl overflow-hidden transition-colors ${c.header}`}>
      <button
        onClick={() => onToggle(sectionKey)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <span className={`p-2 rounded-lg ${c.icon}`}>{icon}</span>
        <span className="font-bold text-sm text-foreground flex-1">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}
