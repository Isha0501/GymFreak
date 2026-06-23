"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getExerciseById, getAlternatives } from "@/lib/exercises";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { WorkoutDay, WorkoutExercise, UserEquipment } from "@/types/database";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2,
  Trophy,
  Clock,
  Dumbbell,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SetLog {
  reps: string;
  weight: string;
  completed: boolean;
}

interface ExerciseState {
  sets: SetLog[];
  expanded: boolean;
}

export default function TodayPage() {
  const supabase = createClient();
  const router = useRouter();
  const [workout, setWorkout] = useState<WorkoutDay | null>(null);
  const [equipment, setEquipment] = useState<UserEquipment>("full_gym");
  const [exerciseState, setExerciseState] = useState<Record<string, ExerciseState>>({});
  const [saving, setSaving] = useState(false);
  const [startTime] = useState(Date.now());
  const [alternativeFor, setAlternativeFor] = useState<WorkoutExercise | null>(null);
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);

  const loadWorkout = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check for a quick workout from "Just Tell Me" feature
    const isQuick = new URLSearchParams(window.location.search).get("quick") === "1";
    const quickJson = isQuick ? sessionStorage.getItem("quickWorkout") : null;

    if (quickJson) {
      const quickWorkout: WorkoutDay = JSON.parse(quickJson);
      sessionStorage.removeItem("quickWorkout");
      const { data: profile } = await supabase
        .from("profiles")
        .select("equipment")
        .eq("id", user.id)
        .single();
      if (profile?.equipment) setEquipment(profile.equipment as UserEquipment);
      setWorkout(quickWorkout);
      const initialState: Record<string, ExerciseState> = {};
      quickWorkout.exercises.forEach((ex) => {
        initialState[ex.exerciseId] = {
          sets: Array.from({ length: ex.sets }, () => ({ reps: "", weight: "", completed: false })),
          expanded: ex.section === "main" || ex.section === "warmup",
        };
      });
      setExerciseState(initialState);
      return;
    }

    const [{ data: program }, { data: profile }] = await Promise.all([
      supabase
        .from("programs")
        .select("workout_days")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
      supabase.from("profiles").select("equipment").eq("id", user.id).single(),
    ]);

    if (profile?.equipment) setEquipment(profile.equipment as UserEquipment);
    if (program?.workout_days) {
      const days: WorkoutDay[] = program.workout_days;
      setWorkoutDays(days);
      const dayOfWeek = new Date().getDay();
      const todayWorkout = days[dayOfWeek % days.length] ?? days[0];
      setWorkout(todayWorkout);

      // Initialize exercise state
      const initialState: Record<string, ExerciseState> = {};
      todayWorkout.exercises.forEach((ex) => {
        initialState[ex.exerciseId] = {
          sets: Array.from({ length: ex.sets }, () => ({ reps: "", weight: "", completed: false })),
          expanded: ex.section === "main" || ex.section === "warmup",
        };
      });
      setExerciseState(initialState);
    }
  }, [supabase]);

  useEffect(() => {
    loadWorkout();
  }, [loadWorkout]);

  function toggleSet(exerciseId: string, setIndex: number) {
    setExerciseState((prev) => {
      const state = prev[exerciseId];
      if (!state) return prev;
      const sets = [...state.sets];
      sets[setIndex] = { ...sets[setIndex], completed: !sets[setIndex].completed };
      return { ...prev, [exerciseId]: { ...state, sets } };
    });
  }

  function updateSet(exerciseId: string, setIndex: number, field: "reps" | "weight", value: string) {
    setExerciseState((prev) => {
      const state = prev[exerciseId];
      if (!state) return prev;
      const sets = [...state.sets];
      sets[setIndex] = { ...sets[setIndex], [field]: value };
      return { ...prev, [exerciseId]: { ...state, sets } };
    });
  }

  function toggleExpanded(exerciseId: string) {
    setExerciseState((prev) => ({
      ...prev,
      [exerciseId]: { ...prev[exerciseId], expanded: !prev[exerciseId]?.expanded },
    }));
  }

  function swapExercise(oldId: string, newId: string) {
    if (!workout) return;
    const updated = {
      ...workout,
      exercises: workout.exercises.map((ex) =>
        ex.exerciseId === oldId ? { ...ex, exerciseId: newId } : ex
      ),
    };
    setWorkout(updated);

    // Initialize state for new exercise
    const ex = updated.exercises.find((e) => e.exerciseId === newId);
    if (ex) {
      setExerciseState((prev) => ({
        ...prev,
        [newId]: {
          sets: Array.from({ length: ex.sets }, () => ({ reps: "", weight: "", completed: false })),
          expanded: true,
        },
      }));
    }
    setAlternativeFor(null);
    toast.success("Exercise swapped!");
  }

  async function finishWorkout() {
    if (!workout) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const durationMinutes = Math.round((Date.now() - startTime) / 60000);
      const exercises = workout.exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        sets: (exerciseState[ex.exerciseId]?.sets ?? []).map((s) => ({
          reps: parseInt(s.reps) || 0,
          weight: parseFloat(s.weight) || 0,
          completed: s.completed,
        })),
      }));

      await supabase.from("workout_logs").insert({
        user_id: user.id,
        date: new Date().toISOString().split("T")[0],
        workout_day_id: workout.id,
        workout_day_name: workout.name,
        exercises,
        duration_minutes: durationMinutes || 1,
      });

      toast.success("Workout logged! Great work! 💪");
      router.push("/dashboard");
    } catch (err) {
      toast.error("Failed to save workout");
    } finally {
      setSaving(false);
    }
  }

  if (!workout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const completedExercises = workout.exercises.filter(
    (ex) => exerciseState[ex.exerciseId]?.sets.some((s) => s.completed)
  ).length;
  const progressPct = Math.round((completedExercises / workout.exercises.length) * 100);

  const sectionOrder = ["warmup", "main", "accessory", "finisher"] as const;
  const grouped = sectionOrder
    .map((section) => ({
      section,
      exercises: workout.exercises.filter((ex) => ex.section === section),
    }))
    .filter((g) => g.exercises.length > 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold">{workout.name}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                ~{workout.estimatedDuration} min
              </span>
              <span className="flex items-center gap-1">
                <Dumbbell className="w-3.5 h-3.5" />
                {workout.exercises.length} exercises
              </span>
            </div>
          </div>
          {progressPct === 100 && (
            <Trophy className="w-6 h-6 text-amber-400" />
          )}
        </div>
        <div className="flex items-center gap-3">
          <Progress value={progressPct} className="flex-1" />
          <span className="text-sm text-muted-foreground w-10 shrink-0">{progressPct}%</span>
        </div>
      </div>

      {/* Exercise sections */}
      {grouped.map(({ section, exercises }) => (
        <div key={section}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section}
            </span>
            <Separator className="flex-1" />
          </div>

          <div className="space-y-3">
            {exercises.map((ex) => {
              const exercise = getExerciseById(ex.exerciseId);
              if (!exercise) return null;
              const state = exerciseState[ex.exerciseId];
              const completedSets = state?.sets.filter((s) => s.completed).length ?? 0;
              const allDone = completedSets === ex.sets;

              return (
                <Card
                  key={ex.exerciseId}
                  className={cn(allDone && "border-emerald-500/30 bg-emerald-500/5")}
                >
                  <CardHeader className="pb-0 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {allDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="font-medium text-sm truncate">{exercise.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {completedSets}/{ex.sets} sets
                        </span>
                        <button
                          onClick={() => toggleExpanded(ex.exerciseId)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {state?.expanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-6 mt-1">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {exercise.primaryMuscle}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {ex.sets} × {ex.repsMin}–{ex.repsMax} reps
                      </span>
                      {ex.restSeconds > 0 && (
                        <span className="text-xs text-muted-foreground">
                          · {ex.restSeconds}s rest
                        </span>
                      )}
                    </div>
                  </CardHeader>

                  {state?.expanded && (
                    <CardContent className="px-4 pt-3 pb-4 space-y-3">
                      {/* Sets */}
                      <div className="space-y-2">
                        {state.sets.map((set, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <button
                              onClick={() => toggleSet(ex.exerciseId, i)}
                              className={cn(
                                "w-7 h-7 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                                set.completed
                                  ? "border-emerald-500 bg-emerald-500/20"
                                  : "border-border hover:border-primary"
                              )}
                            >
                              {set.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <span className="text-xs font-mono text-muted-foreground">{i + 1}</span>
                              )}
                            </button>
                            <Input
                              type="number"
                              placeholder="Reps"
                              value={set.reps}
                              onChange={(e) => updateSet(ex.exerciseId, i, "reps", e.target.value)}
                              className="h-8 text-sm"
                            />
                            <Input
                              type="number"
                              placeholder="kg"
                              value={set.weight}
                              onChange={(e) => updateSet(ex.exerciseId, i, "weight", e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Tips */}
                      <p className="text-xs text-muted-foreground italic">{exercise.tips}</p>

                      {/* Swap button */}
                      <button
                        onClick={() => setAlternativeFor(ex)}
                        className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Swap exercise
                      </button>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Finish button */}
      <Button
        className="w-full"
        size="lg"
        onClick={finishWorkout}
        disabled={saving}
        variant={progressPct === 100 ? "success" : "default"}
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : progressPct === 100 ? (
          <Trophy className="w-4 h-4" />
        ) : null}
        {saving ? "Saving..." : progressPct === 100 ? "Complete Workout!" : "Finish & Log Workout"}
      </Button>

      {/* Alternatives Dialog */}
      <Dialog open={!!alternativeFor} onOpenChange={() => setAlternativeFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Swap exercise</DialogTitle>
          </DialogHeader>
          {alternativeFor && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">
                Alternatives for{" "}
                <strong>{getExerciseById(alternativeFor.exerciseId)?.name}</strong>
              </p>
              {getAlternatives(alternativeFor.exerciseId, equipment).map((alt) => (
                <button
                  key={alt.id}
                  onClick={() => swapExercise(alternativeFor.exerciseId, alt.id)}
                  className="w-full text-left rounded-xl border border-border hover:border-primary p-3 transition-colors"
                >
                  <div className="font-medium text-sm">{alt.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {alt.primaryMuscle} · {alt.difficulty} · {alt.equipment.join(", ")}
                  </div>
                </button>
              ))}
              {getAlternatives(alternativeFor.exerciseId, equipment).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No alternatives available with your current equipment.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
