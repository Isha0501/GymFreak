"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { generateQuickWorkout } from "@/lib/ai/schedule-generator";
import { getExerciseById } from "@/lib/exercises";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { WorkoutDay, UserProfile } from "@/types/database";
import {
  Zap,
  RefreshCw,
  ArrowRight,
  Clock,
  Dumbbell,
  Target,
  Loader2,
} from "lucide-react";
import { capitalize } from "@/lib/utils";

export default function JustTellMePage() {
  const supabase = createClient();
  const router = useRouter();
  const [workout, setWorkout] = useState<WorkoutDay | null>(null);
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [generating, setGenerating] = useState(true);
  const [recentFocus, setRecentFocus] = useState<string | undefined>();

  const generateWorkout = useCallback(async (prof?: Partial<UserProfile> | null, focus?: string) => {
    const p = prof ?? profile;
    if (!p) return;
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 400)); // brief animation pause
    const w = generateQuickWorkout(p, focus ?? recentFocus);
    setWorkout(w);
    setGenerating(false);
  }, [profile, recentFocus]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: prof }, { data: lastLog }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
          .from("workout_logs")
          .select("workout_day_name")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(1)
          .single(),
      ]);

      setProfile(prof);
      const focus = lastLog?.workout_day_name?.split(" ")[0];
      setRecentFocus(focus);
      const w = generateQuickWorkout(prof ?? {}, focus);
      setWorkout(w);
      setGenerating(false);
    }
    load();
  }, [supabase]);

  function handleStartWorkout() {
    if (!workout) return;
    // Store the quick workout in session to use in a workout tracker
    sessionStorage.setItem("quickWorkout", JSON.stringify(workout));
    router.push("/today?quick=1");
  }

  const sectionOrder = ["warmup", "main", "accessory", "finisher"] as const;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto">
          <Zap className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Just Tell Me What To Do</h1>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Here&apos;s your workout for today. No decisions needed — just lift.
        </p>
      </div>

      {generating ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Building your workout...</p>
        </div>
      ) : workout ? (
        <>
          {/* Workout header card */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="font-bold text-lg">{workout.name}</h2>
                  <p className="text-sm text-muted-foreground capitalize">
                    {workout.splitFocus.replace(/_/g, " ")} session
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => generateWorkout()}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  ~{workout.estimatedDuration} min
                </span>
                <span className="flex items-center gap-1.5">
                  <Dumbbell className="w-4 h-4" />
                  {workout.exercises.length} exercises
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {workout.muscleEmphasis.map((m) => (
                  <Badge key={m} variant="purple" className="text-xs capitalize">
                    {m}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Rationale */}
          <Card>
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm">Why this workout?</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-sm text-muted-foreground">
                Based on your{" "}
                <strong>{profile?.fitness_goal?.replace(/_/g, " ") ?? "goals"}</strong> and{" "}
                <strong>{profile?.experience_level ?? "experience"}</strong> level,
                {recentFocus
                  ? ` this session focuses on a different muscle group from your last ${recentFocus} workout to ensure balanced recovery.`
                  : " this session targets the muscles you need most based on your program."}
                {" "}Sets and reps are optimized for{" "}
                <strong>
                  {profile?.fitness_goal === "gain_strength"
                    ? "heavy compound lifts with longer rest periods"
                    : profile?.fitness_goal === "lose_fat"
                    ? "higher reps with shorter rest to maximize calorie burn"
                    : profile?.fitness_goal === "build_muscle"
                    ? "hypertrophy rep ranges with moderate rest"
                    : "balanced volume and intensity"}
                </strong>
                .
              </p>
            </CardContent>
          </Card>

          {/* Exercise list by section */}
          {sectionOrder.map((section) => {
            const exercises = workout.exercises.filter((ex) => ex.section === section);
            if (!exercises.length) return null;
            return (
              <div key={section}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground capitalize">
                    {section}
                  </span>
                  <Separator className="flex-1" />
                </div>
                <div className="space-y-2">
                  {exercises.map((ex) => {
                    const exercise = getExerciseById(ex.exerciseId);
                    if (!exercise) return null;
                    return (
                      <Card key={ex.exerciseId}>
                        <CardContent className="py-3 px-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-sm">{exercise.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                <span className="capitalize">{exercise.primaryMuscle}</span>
                                {exercise.secondaryMuscles.length > 0 &&
                                  ` · ${exercise.secondaryMuscles.slice(0, 2).join(", ")}`}
                              </p>
                              <p className="text-xs text-muted-foreground/70 mt-1 italic">
                                {exercise.tips}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-semibold">
                                {ex.sets} × {ex.repsMin}–{ex.repsMax}
                              </p>
                              <p className="text-xs text-muted-foreground">{ex.restSeconds}s rest</p>
                              <Badge
                                variant={exercise.category === "compound" ? "purple" : "secondary"}
                                className="text-[10px] mt-1"
                              >
                                {exercise.category}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* CTA */}
          <Button className="w-full" size="lg" onClick={handleStartWorkout}>
            Start This Workout
            <ArrowRight className="w-4 h-4" />
          </Button>
        </>
      ) : null}
    </div>
  );
}
