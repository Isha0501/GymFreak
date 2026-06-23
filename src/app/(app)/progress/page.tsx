import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getExerciseById } from "@/lib/exercises";
import { Calendar, Trophy, Dumbbell, TrendingUp, Flame } from "lucide-react";
import { format, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: logs } = await supabase
    .from("workout_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(50);

  const totalWorkouts = logs?.length ?? 0;
  const recentLogs = logs?.slice(0, 10) ?? [];

  // Calculate total volume and most trained muscles
  const muscleVolume: Record<string, number> = {};
  (logs ?? []).forEach((log) => {
    const exercises = log.exercises as Array<{ exerciseId: string; sets: Array<{ reps: number; weight: number }> }>;
    exercises.forEach((ex) => {
      const exercise = getExerciseById(ex.exerciseId);
      if (!exercise) return;
      const volume = ex.sets.reduce((acc, s) => acc + s.reps * (s.weight || 0), 0);
      muscleVolume[exercise.primaryMuscle] = (muscleVolume[exercise.primaryMuscle] ?? 0) + volume;
    });
  });

  const topMuscles = Object.entries(muscleVolume)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 lg:max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">Progress</h1>
        <p className="text-muted-foreground text-sm">Your training history and achievements</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalWorkouts}</p>
                <p className="text-xs text-muted-foreground">Total Workouts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Math.round(
                    (logs ?? []).reduce((a, l) => a + (l.duration_minutes ?? 0), 0) / 60
                  )}h
                </p>
                <p className="text-xs text-muted-foreground">Total Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Volume by muscle */}
      {topMuscles.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Volume by Muscle</CardTitle>
            </div>
            <CardDescription>Total kg lifted (reps × weight)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topMuscles.map(([muscle, volume]) => {
                const max = topMuscles[0][1];
                const pct = Math.round((volume / max) * 100);
                return (
                  <div key={muscle}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="capitalize font-medium">{muscle}</span>
                      <span className="text-muted-foreground">{Math.round(volume).toLocaleString()} kg</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workout history */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Recent Workouts</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No workouts logged yet.</p>
              <p className="text-muted-foreground text-sm mt-1">Start your first workout!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => {
                const exercises = log.exercises as Array<{ exerciseId: string; sets: Array<{ reps: number; weight: number; completed: boolean }> }>;
                const completedSets = exercises.reduce(
                  (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
                  0
                );
                const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

                return (
                  <div
                    key={log.id}
                    className="flex items-start justify-between py-3 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="font-medium text-sm">{log.workout_day_name ?? "Workout"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(parseISO(log.date), "EEE, MMM d")}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {log.duration_minutes && (
                          <Badge variant="secondary" className="text-xs">
                            {log.duration_minutes} min
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {completedSets}/{totalSets} sets
                        </Badge>
                      </div>
                    </div>
                    <Trophy className="w-4 h-4 text-amber-400 shrink-0 mt-1" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
