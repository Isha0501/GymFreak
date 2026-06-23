"use client";
import { useState, useMemo } from "react";
import { EXERCISES, getAlternatives } from "@/lib/exercises";
import type { Exercise } from "@/lib/exercises";
import type { MuscleGroup, Equipment, Difficulty, UserEquipment } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Info, RefreshCw } from "lucide-react";

const MUSCLE_GROUPS: Array<{ value: MuscleGroup | "all"; label: string }> = [
  { value: "all", label: "All Muscles" },
  { value: "chest", label: "Chest" },
  { value: "back", label: "Back" },
  { value: "shoulders", label: "Shoulders" },
  { value: "biceps", label: "Biceps" },
  { value: "triceps", label: "Triceps" },
  { value: "quads", label: "Quads" },
  { value: "hamstrings", label: "Hamstrings" },
  { value: "glutes", label: "Glutes" },
  { value: "calves", label: "Calves" },
  { value: "core", label: "Core" },
];

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: "success",
  intermediate: "warning",
  advanced: "destructive",
};

export default function ExercisesPage() {
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "compound" | "isolation">("all");
  const [selected, setSelected] = useState<Exercise | null>(null);

  const filtered = useMemo(() => {
    return EXERCISES.filter((ex) => {
      const matchesSearch =
        !search ||
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.primaryMuscle.includes(search.toLowerCase()) ||
        ex.secondaryMuscles.some((m) => m.includes(search.toLowerCase()));

      const matchesMuscle =
        muscleFilter === "all" ||
        ex.primaryMuscle === muscleFilter ||
        ex.secondaryMuscles.includes(muscleFilter);

      const matchesCategory = categoryFilter === "all" || ex.category === categoryFilter;

      return matchesSearch && matchesMuscle && matchesCategory;
    });
  }, [search, muscleFilter, categoryFilter]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 lg:max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">Exercise Library</h1>
        <p className="text-muted-foreground text-sm">
          {EXERCISES.length} exercises with alternatives and tips
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises, muscles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={muscleFilter}
            onValueChange={(v) => setMuscleFilter(v as MuscleGroup | "all")}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Muscle group" />
            </SelectTrigger>
            <SelectContent>
              {MUSCLE_GROUPS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v as "all" | "compound" | "isolation")}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="compound">Compound</SelectItem>
              <SelectItem value="isolation">Isolation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} exercise{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Exercise grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((ex) => (
          <button
            key={ex.id}
            onClick={() => setSelected(ex)}
            className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-medium text-sm leading-tight">{ex.name}</h3>
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="purple" className="text-[10px] capitalize">
                {ex.primaryMuscle}
              </Badge>
              <Badge
                variant={DIFFICULTY_COLORS[ex.difficulty] as "success" | "warning" | "destructive"}
                className="text-[10px] capitalize"
              >
                {ex.difficulty}
              </Badge>
              <Badge variant="secondary" className="text-[10px] capitalize">
                {ex.category}
              </Badge>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No exercises found. Try a different search.</p>
        </div>
      )}

      {/* Exercise Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="purple" className="capitalize">{selected.primaryMuscle}</Badge>
                  <Badge
                    variant={DIFFICULTY_COLORS[selected.difficulty] as "success" | "warning" | "destructive"}
                    className="capitalize"
                  >
                    {selected.difficulty}
                  </Badge>
                  <Badge variant="secondary" className="capitalize">{selected.category}</Badge>
                  <Badge variant="outline" className="capitalize">{selected.movementPattern}</Badge>
                </div>

                {/* Muscles */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Muscles
                  </p>
                  <div className="text-sm">
                    <span className="font-medium">Primary:</span>{" "}
                    <span className="capitalize">{selected.primaryMuscle}</span>
                  </div>
                  {selected.secondaryMuscles.length > 0 && (
                    <div className="text-sm text-muted-foreground mt-0.5">
                      <span className="font-medium text-foreground">Secondary:</span>{" "}
                      <span className="capitalize">{selected.secondaryMuscles.join(", ")}</span>
                    </div>
                  )}
                </div>

                {/* Equipment */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Equipment Required
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.equipment.map((eq) => (
                      <Badge key={eq} variant="outline" className="capitalize">
                        {eq.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Instructions */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    How To
                  </p>
                  <p className="text-sm leading-relaxed">{selected.instructions}</p>
                </div>

                {/* Tips */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Coach&apos;s Tip
                  </p>
                  <p className="text-sm text-muted-foreground italic leading-relaxed">{selected.tips}</p>
                </div>

                {/* Alternatives */}
                {selected.alternatives.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Alternatives
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      {getAlternatives(selected.id, "full_gym").map((alt) => (
                        <button
                          key={alt.id}
                          onClick={() => setSelected(alt)}
                          className="w-full text-left rounded-lg border border-border hover:border-primary/50 px-3 py-2 text-sm transition-colors"
                        >
                          <span className="font-medium">{alt.name}</span>
                          <span className="text-muted-foreground text-xs ml-2 capitalize">
                            {alt.equipment.join(", ")}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
