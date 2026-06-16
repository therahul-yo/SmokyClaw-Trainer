import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useThinkingStore } from "../store";
import { MISTAKE_TAGS, type MistakeTag } from "../lib/thinkingTrace";
import { getQuizItem, getLesson } from "../lib/contentLoader";
import { Box } from "../components/terminal/Box";
import { Prompt } from "../components/terminal/Prompt";
import { BracketButton } from "../components/terminal/BracketButton";
import { AsciiProgress } from "../components/terminal/AsciiProgress";

type RuleItem = {
  targetId: string;
  type: "item" | "lesson" | "unknown";
  name: string;
  link: string;
  track: string;
  topic: string;
  rule: string;
  tags: MistakeTag[];
};

export function RulebookPage() {
  const traces = useThinkingStore((s) => s.traces);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedTrack, setSelectedTrack] = useState<string>("all");
  
  // Warm-up states
  const [warmupActive, setWarmupActive] = useState(false);
  const [warmupIndex, setWarmupIndex] = useState(0);
  const [warmupRules, setWarmupRules] = useState<RuleItem[]>([]);

  // Process traces into list of rules
  const rules = useMemo(() => {
    const list: RuleItem[] = [];
    for (const [targetId, trace] of Object.entries(traces)) {
      if (!trace.mistakeRule.trim() && trace.mistakeTags.length === 0) continue;
      
      const isItem = targetId.startsWith("item:");
      const isLesson = targetId.startsWith("lesson:");
      const cleanId = targetId.replace(/^(item|lesson):/, "");
      
      let name = cleanId;
      let link = "/";
      let track = "unknown";
      let topic = "unknown";
      let type: "item" | "lesson" | "unknown" = "unknown";

      if (isItem) {
        type = "item";
        const item = getQuizItem(cleanId);
        if (item) {
          name = `${item.id} (${item.type})`;
          link = `/quiz/${item.track}/${item.topic}`;
          track = item.track;
          topic = item.topic;
        }
      } else if (isLesson) {
        type = "lesson";
        const lesson = getLesson(cleanId);
        if (lesson) {
          name = lesson.title;
          link = `/lesson/${lesson.id}`;
          track = lesson.track;
          topic = lesson.topic;
        }
      }

      list.push({
        targetId,
        type,
        name,
        link,
        track,
        topic,
        rule: trace.mistakeRule,
        tags: trace.mistakeTags,
      });
    }
    return list;
  }, [traces]);

  // Aggregate Mistake DNA Tags
  const tagCounts = useMemo(() => {
    const counts: Record<MistakeTag, number> = {} as Record<MistakeTag, number>;
    for (const tag of MISTAKE_TAGS) {
      counts[tag.id] = 0;
    }
    for (const r of rules) {
      for (const t of r.tags) {
        counts[t] = (counts[t] || 0) + 1;
      }
    }
    return counts;
  }, [rules]);

  // Total mistake occurrences
  const totalMistakes = useMemo(() => {
    return Object.values(tagCounts).reduce((a, b) => a + b, 0);
  }, [tagCounts]);

  // Filter & Search rules
  const filteredRules = useMemo(() => {
    return rules
      .filter((r) => {
        if (!r.rule.trim()) return false; // Only show items with actual rules
        const matchesSearch =
          r.rule.toLowerCase().includes(search.toLowerCase()) ||
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.topic.toLowerCase().includes(search.toLowerCase());
        const matchesTag = selectedTag === "all" || r.tags.includes(selectedTag as MistakeTag);
        const matchesTrack = selectedTrack === "all" || r.track === selectedTrack;
        return matchesSearch && matchesTag && matchesTrack;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rules, search, selectedTag, selectedTrack]);

  // Custom tracks present in user rules
  const tracks = useMemo(() => {
    const set = new Set<string>();
    for (const r of rules) {
      if (r.track !== "unknown") set.add(r.track);
    }
    return Array.from(set).sort();
  }, [rules]);

  const startWarmup = () => {
    const rulesWithText = rules.filter((r) => r.rule.trim().length > 0);
    if (rulesWithText.length === 0) {
      alert("You need to write some compressed rules in your thinking traces first!");
      return;
    }
    // Pick up to 3 random rules per warm-up run.
    const shuffled = [...rulesWithText].sort(() => 0.5 - Math.random());
    setWarmupRules(shuffled.slice(0, 3));
    setWarmupIndex(0);
    setWarmupActive(true);
  };

  return (
    <div className="space-y-4 font-mono">
      <Prompt path="~/rulebook">
        <span>cat mistake_dna_report.txt</span>
      </Prompt>

      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <div
            className="text-2xl font-bold crt-glow"
            style={{ color: "var(--color-accent)" }}
          >
            mistake dna & rulebook
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--color-text-dim)" }}>
            // analyze your failure patterns and retrieve rules to debug your future self.
          </div>
        </div>
        <div className="flex gap-2">
          <BracketButton variant={warmupActive ? "primary" : "ghost"} onClick={startWarmup}>
            {warmupActive ? "re-shuffle warm-up" : "start mental warm-up"}
          </BracketButton>
        </div>
      </div>

      {/* Mental Warm-up Panel */}
      {warmupActive && warmupRules.length > 0 && (
        <Box
          title={`$ mental_warmup --step=${warmupIndex + 1}/${warmupRules.length}`}
          variant="amber"
          trailing={
            <BracketButton variant="ghost" onClick={() => setWarmupActive(false)}>
              close
            </BracketButton>
          }
        >
          <div className="space-y-3 p-2">
            <div className="text-[10px] uppercase" style={{ color: "var(--color-text-muted)" }}>
              focus rules before coding:
            </div>
            <div
              className="text-lg font-bold border-l-2 pl-3 py-1"
              style={{
                borderColor: "var(--color-amber)",
                color: "var(--color-text)",
              }}
            >
              "{warmupRules[warmupIndex].rule}"
            </div>
            <div className="flex items-center justify-between text-xs pt-2">
              <div style={{ color: "var(--color-text-dim)" }}>
                Source:{" "}
                <Link to={warmupRules[warmupIndex].link} className="underline" style={{ color: "var(--color-cyan)" }}>
                  {warmupRules[warmupIndex].track}/{warmupRules[warmupIndex].name}
                </Link>
              </div>
              <div className="flex gap-2">
                {warmupIndex > 0 && (
                  <BracketButton onClick={() => setWarmupIndex((i) => i - 1)}>
                    ← prev
                  </BracketButton>
                )}
                {warmupIndex < warmupRules.length - 1 ? (
                  <BracketButton variant="primary" onClick={() => setWarmupIndex((i) => i + 1)}>
                    next rule →
                  </BracketButton>
                ) : (
                  <BracketButton variant="primary" onClick={() => setWarmupActive(false)}>
                    finish warm-up!
                  </BracketButton>
                )}
              </div>
            </div>
          </div>
        </Box>
      )}

      {/* Mistake DNA Analytics */}
      <Box title="$ dna --frequency-analysis" trailing={`total logged: ${totalMistakes}`}>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs font-bold" style={{ color: "var(--color-accent)" }}>
              // mistake frequency distribution
            </div>
            <div className="space-y-2">
              {MISTAKE_TAGS.map((tag) => {
                const count = tagCounts[tag.id] || 0;
                const pct = totalMistakes > 0 ? Math.round((count / totalMistakes) * 100) : 0;
                return (
                  <div
                    key={tag.id}
                    className="grid grid-cols-[110px_1fr_40px] items-center text-xs gap-2"
                    style={{ opacity: count > 0 ? 1 : 0.4 }}
                  >
                    <span
                      className="cursor-pointer hover:underline truncate"
                      onClick={() => setSelectedTag(tag.id)}
                      style={{
                        color: selectedTag === tag.id ? "var(--color-accent)" : "var(--color-text-dim)",
                      }}
                    >
                      {tag.label}
                    </span>
                    <AsciiProgress value={pct} width={20} showPercent={false} />
                    <span className="text-right tabular-nums text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                      {count}x ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold" style={{ color: "var(--color-accent)" }}>
              // repair protocols for your weaknesses
            </div>
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {MISTAKE_TAGS.filter((tag) => (tagCounts[tag.id] || 0) > 0)
                .sort((a, b) => (tagCounts[b.id] || 0) - (tagCounts[a.id] || 0))
                .map((tag) => (
                  <div
                    key={tag.id}
                    className="p-2 border"
                    style={{
                      background: "var(--color-bg)",
                      borderColor: selectedTag === tag.id ? "var(--color-accent)" : "var(--color-border)",
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs" style={{ color: "var(--color-amber)" }}>
                        {tag.label}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                        {tagCounts[tag.id]} mistake{tagCounts[tag.id] === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="text-xs leading-relaxed mt-1" style={{ color: "var(--color-text)" }}>
                      <span className="text-[10px] text-red-400 font-bold uppercase mr-1">[REPAIR]:</span>
                      {tag.repair}
                    </div>
                  </div>
                ))}
              {totalMistakes === 0 && (
                <div className="text-xs italic py-8 text-center" style={{ color: "var(--color-text-muted)" }}>
                  No mistake DNA tags logged yet. Trace your thoughts and mark mistakes in lessons or coding drills to generate repair metrics.
                </div>
              )}
            </div>
          </div>
        </div>
      </Box>

      {/* Rules Dashboard */}
      <Box
        title="$ rulebook --query"
        trailing={
          <span style={{ color: "var(--color-text-muted)" }}>
            showing {filteredRules.length} of {rules.filter((r) => r.rule.trim()).length} rules
          </span>
        }
      >
        <div className="space-y-3">
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="search rule text, source or topic..."
              className="px-3 py-1 bg-transparent text-sm outline-none border font-mono flex-1"
              style={{
                color: "var(--color-text)",
                borderColor: "var(--color-border-bright)",
              }}
            />
            <div className="flex gap-2 flex-wrap md:flex-nowrap">
              <select
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
                className="px-2 py-1 bg-transparent text-xs outline-none border font-mono"
                style={{
                  color: "var(--color-text)",
                  backgroundColor: "var(--color-bg-alt)",
                  borderColor: "var(--color-border-bright)",
                }}
              >
                <option value="all">all tracks</option>
                {tracks.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-2 py-1 bg-transparent text-xs outline-none border font-mono"
                style={{
                  color: "var(--color-text)",
                  backgroundColor: "var(--color-bg-alt)",
                  borderColor: "var(--color-border-bright)",
                }}
              >
                <option value="all">all mistake DNA</option>
                {MISTAKE_TAGS.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.label}
                  </option>
                ))}
              </select>
              {(search || selectedTag !== "all" || selectedTrack !== "all") && (
                <BracketButton
                  onClick={() => {
                    setSearch("");
                    setSelectedTag("all");
                    setSelectedTrack("all");
                  }}
                >
                  reset
                </BracketButton>
              )}
            </div>
          </div>

          {/* Rules List */}
          <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
            {filteredRules.map((r) => (
              <div
                key={r.targetId}
                className="p-3 font-mono flex flex-col md:flex-row md:items-start gap-3 border transition-colors hover:border-[var(--color-accent)]"
                style={{
                  background: "var(--color-bg-card)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="md:w-48 shrink-0">
                  <div className="text-[10px] uppercase font-bold" style={{ color: "var(--color-text-muted)" }}>
                    {r.type === "item" ? "drill" : "lesson"}
                  </div>
                  <Link
                    to={r.link}
                    className="text-xs hover:underline block truncate font-bold"
                    style={{ color: "var(--color-cyan)" }}
                    title={r.name}
                  >
                    {r.name}
                  </Link>
                  <div className="text-[10px] mt-1" style={{ color: "var(--color-text-dim)" }}>
                    {r.track}/{r.topic}
                  </div>
                </div>

                <div className="flex-1 space-y-1.5 min-w-0">
                  <div
                    className="text-sm font-bold border-l pl-2 leading-relaxed whitespace-pre-wrap"
                    style={{
                      borderColor: "var(--color-border-bright)",
                      color: "var(--color-text)",
                    }}
                  >
                    "{r.rule}"
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.tags.map((t) => {
                      const tagMeta = MISTAKE_TAGS.find((m) => m.id === t);
                      return (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 text-[9px]"
                          style={{
                            color: "var(--color-bg)",
                            backgroundColor: "var(--color-amber)",
                          }}
                          title={tagMeta?.repair}
                        >
                          {tagMeta?.label || t}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}

            {filteredRules.length === 0 && (
              <div
                className="text-center py-12 text-sm italic border border-dashed"
                style={{
                  color: "var(--color-text-muted)",
                  borderColor: "var(--color-border)",
                }}
              >
                {rules.filter((r) => r.rule.trim()).length === 0
                  ? "// rulebook is currently empty. complete drills and add 'compressed rules' in the human compiler to log rules here."
                  : "// no rules match your search query and filters."}
              </div>
            )}
          </div>
        </div>
      </Box>
    </div>
  );
}
