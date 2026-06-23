import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getGreeting, capitalize } from "@/lib/utils";
import { getExerciseById } from "@/lib/exercises";
import type { WorkoutDay } from "@/types/database";
import {
  Zap,
  Flame,
  Calendar,
  TrendingUp,
  ArrowRight,
  Dumbbell,
  Clock,
  Info,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: program }, { data: logs }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("programs")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("workout_logs")
      .select("id, date, workout_day_name")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(30),
  ]);

  const greeting = getGreeting();
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday

  // Determine today's workout from program
  const workoutDays: WorkoutDay[] = program?.workout_days ?? [];
  const todayWorkout = workoutDays[dayOfWeek % workoutDays.length] ?? workoutDays[0];

  // Calculate streak
  const streak = calculateStreak(logs ?? []);

  // Weekly completion
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());
  const thisWeekLogs = (logs ?? []).filter(
    (l) => new Date(l.date) >= thisWeekStart
  );
  const weeklyCompletion = workoutDays.length > 0
    ? Math.round((thisWeekLogs.length / workoutDays.length) * 100)
    : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8 lg:max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{greeting}</p>
          <h1 className="text-2xl font-bold mt-0.5">{firstName} 👋</h1>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-300">{streak} day streak</span>
          </div>
        )}
      </div>

      {/* Just Tell Me CTA */}
      <Link href="/just-tell-me">
        <div className="rounded-2xl bg-gradient-to-r from-violet-600/20 to-violet-800/20 border border-violet-500/30 p-5 flex items-center justify-between group cursor-pointer hover:border-violet-500/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-lg">Just Tell Me What To Do</p>
              <p className="text-sm text-muted-foreground">Instant workout, no decisions needed</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
        </div>
      </Link>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <p className="text-2xl font-bold">{streak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-5 h-5 text-violet-400 mx-auto mb-1" />
            <p className="text-2xl font-bold">{thisWeekLogs.length}</p>
            <p className="text-xs text-muted-foreground">This Week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-2xl font-bold">{weeklyCompletion}%</p>
            <p className="text-xs text-muted-foreground">Completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Workout */}
      {todayWorkout ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Today&apos;s Workout</CardTitle>
              <Badge variant="purple">{todayWorkout.name}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                ~{todayWorkout.estimatedDuration} min
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Dumbbell className="w-4 h-4" />
                {todayWorkout.exercises.length} exercises
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {todayWorkout.muscleEmphasis.map((m) => (
                <Badge key={m} variant="outline" className="capitalize text-xs">
                  {m}
                </Badge>
              ))}
            </div>

            <Separator className="mb-4" />

            <div className="space-y-2 mb-4">
              {todayWorkout.exercises.slice(0, 4).map((ex) => {
                const exercise = getExerciseById(ex.exerciseId);
                if (!exercise) return null;
                return (
                  <div key={ex.exerciseId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={ex.section === "main" ? "purple" : "secondary"}
                        className="text-[10px] capitalize"
                      >
                        {ex.section}
                      </Badge>
                      <span>{exercise.name}</span>
                    </div>
                    <span className="text-muted-foreground shrink-0">
                      {ex.sets} × {ex.repsMin}–{ex.repsMax}
                    </span>
                  </div>
                );
              })}
              {todayWorkout.exercises.length > 4 && (
                <p className="text-xs text-muted-foreground pl-1">
                  +{todayWorkout.exercises.length - 4} more exercises
                </p>
              )}
            </div>

            <Link href="/today">
              <Button className="w-full">
                Start Workout
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">No program found</p>
            <Link href="/onboarding">
              <Button>Generate a Program</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Program Rationale */}
      {program?.rationale && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Why this program?</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{program.rationale}</p>
            <div className="flex gap-2 mt-4 flex-wrap">
              <Badge variant="secondary">{program.split_type?.replace(/_/g, " ")}</Badge>
              <Badge variant="secondary">{program.days_per_week} days/week</Badge>
              {profile?.fitness_goal && (
                <Badge variant="secondary">{profile.fitness_goal.replace(/_/g, " ")}</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Schedule Preview */}
      {workoutDays.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Weekly Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {workoutDays.map((day, index) => (
                <div key={day.id} className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground w-24 shrink-0">{day.dayLabel}</span>
                  <Badge
                    variant={index === dayOfWeek % workoutDays.length ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {day.name}
                  </Badge>
                  <span className="text-muted-foreground text-xs ml-auto">
                    ~{day.estimatedDuration} min
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function calculateStreak(logs: Array<{ date: string }>): number {
  if (!logs.length) return 0;
  const dates = Array.from(new Set(logs.map((l) => l.date))).sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  let streak = 0;
  let current = new Date(today);

  for (const date of dates) {
    const d = new Date(date);
    const diff = Math.round(
      (current.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 0 || diff === 1) {
      streak++;
      current = d;
    } else {
      break;
    }
  }
  return streak;
}
