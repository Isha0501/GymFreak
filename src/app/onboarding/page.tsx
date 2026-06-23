"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { generateProgram } from "@/lib/ai/schedule-generator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { FitnessGoal, ExperienceLevel, MuscleGroup, UserEquipment } from "@/types/database";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 5;

interface OnboardingData {
  age: string;
  gender: string;
  height_cm: string;
  weight_kg: string;
  experience_level: ExperienceLevel | "";
  fitness_goal: FitnessGoal | "";
  available_days: number;
  workout_duration: number;
  equipment: UserEquipment | "";
  injury_notes: string;
  priority_muscles: MuscleGroup[];
  depriority_muscles: MuscleGroup[];
}

const GOALS: Array<{ value: FitnessGoal; label: string; emoji: string; description: string }> = [
  { value: "build_muscle", label: "Build Muscle", emoji: "💪", description: "Maximize hypertrophy and size" },
  { value: "lose_fat", label: "Lose Fat", emoji: "🔥", description: "Burn fat while preserving muscle" },
  { value: "gain_strength", label: "Gain Strength", emoji: "🏋️", description: "Increase 1RM and raw power" },
  { value: "general_fitness", label: "General Fitness", emoji: "⚡", description: "Stay healthy and active" },
  { value: "athletic_performance", label: "Athletic Performance", emoji: "🏃", description: "Speed, power, and endurance" },
];

const EXPERIENCE: Array<{ value: ExperienceLevel; label: string; description: string }> = [
  { value: "beginner", label: "Beginner", description: "Less than 1 year of consistent training" },
  { value: "intermediate", label: "Intermediate", description: "1–3 years of consistent training" },
  { value: "advanced", label: "Advanced", description: "3+ years, familiar with advanced techniques" },
];

const EQUIPMENT_OPTIONS: Array<{ value: UserEquipment; label: string; description: string }> = [
  { value: "full_gym", label: "Full Gym", description: "Barbells, machines, cables, everything" },
  { value: "dumbbells_only", label: "Dumbbells Only", description: "Just dumbbells and bodyweight" },
  { value: "home_gym", label: "Home Gym", description: "Dumbbells, pull-up bar, maybe bands" },
  { value: "bodyweight_only", label: "Bodyweight Only", description: "No equipment at all" },
];

const DURATION_OPTIONS = [
  { value: 30, label: "30 min", description: "Short and efficient" },
  { value: 45, label: "45 min", description: "Most popular" },
  { value: 60, label: "60 min", description: "Full session" },
  { value: 90, label: "90 min", description: "Long session" },
];

const MUSCLE_GROUPS: MuscleGroup[] = [
  "chest", "back", "shoulders", "biceps", "triceps",
  "quads", "hamstrings", "glutes", "calves", "core",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    age: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    experience_level: "",
    fitness_goal: "",
    available_days: 3,
    workout_duration: 60,
    equipment: "",
    injury_notes: "",
    priority_muscles: [],
    depriority_muscles: [],
  });

  function update(field: keyof OnboardingData, value: unknown) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function toggleMuscle(muscle: MuscleGroup, list: "priority_muscles" | "depriority_muscles") {
    const other = list === "priority_muscles" ? "depriority_muscles" : "priority_muscles";
    setData((prev) => {
      const current = prev[list];
      const otherList = prev[other].filter((m) => m !== muscle);
      const next = current.includes(muscle)
        ? current.filter((m) => m !== muscle)
        : [...current, muscle];
      return { ...prev, [list]: next, [other]: otherList };
    });
  }

  function canProceed(): boolean {
    switch (step) {
      case 1: return !!data.experience_level && !!data.fitness_goal;
      case 2: return !!data.equipment;
      case 3: return data.available_days > 0;
      case 4: return true;
      case 5: return true;
      default: return true;
    }
  }

  async function handleFinish() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const profileData = {
        age: data.age ? parseInt(data.age) : null,
        gender: data.gender || null,
        height_cm: data.height_cm ? parseFloat(data.height_cm) : null,
        weight_kg: data.weight_kg ? parseFloat(data.weight_kg) : null,
        experience_level: data.experience_level || null,
        fitness_goal: data.fitness_goal || null,
        available_days: data.available_days,
        workout_duration: data.workout_duration,
        equipment: data.equipment || null,
        injury_notes: data.injury_notes || null,
        priority_muscles: data.priority_muscles,
        depriority_muscles: data.depriority_muscles,
        onboarding_completed: true,
      };

      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Generate and save the program
      const program = generateProgram(profileData);
      const { error: programError } = await supabase.from("programs").insert({
        user_id: user.id,
        name: program.name,
        split_type: program.splitType,
        days_per_week: program.daysPerWeek,
        rationale: program.rationale,
        workout_days: program.workoutDays,
        is_active: true,
      });

      if (programError) throw programError;

      toast.success("Your program is ready!");
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border/50 px-4 py-4 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <Dumbbell className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-bold">GymFlow AI</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Step {step} of {TOTAL_STEPS}</span>
          <div className="w-32">
            <Progress value={(step / TOTAL_STEPS) * 100} />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {/* Step 1: Experience + Goal */}
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold mb-1">Let&apos;s get to know you</h1>
              <p className="text-muted-foreground">Your experience and goals shape everything we recommend.</p>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Experience Level</Label>
              <div className="grid gap-2">
                {EXPERIENCE.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => update("experience_level", opt.value)}
                    className={cn(
                      "text-left rounded-xl border p-4 transition-colors",
                      data.experience_level === opt.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-muted-foreground"
                    )}
                  >
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{opt.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Primary Fitness Goal</Label>
              <div className="grid sm:grid-cols-2 gap-2">
                {GOALS.map((goal) => (
                  <button
                    key={goal.value}
                    onClick={() => update("fitness_goal", goal.value)}
                    className={cn(
                      "text-left rounded-xl border p-4 transition-colors",
                      data.fitness_goal === goal.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-muted-foreground"
                    )}
                  >
                    <div className="text-xl mb-1">{goal.emoji}</div>
                    <div className="font-medium">{goal.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{goal.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Equipment */}
        {step === 2 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold mb-1">What equipment do you have?</h1>
              <p className="text-muted-foreground">We&apos;ll only recommend exercises you can actually do.</p>
            </div>
            <div className="grid gap-3">
              {EQUIPMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update("equipment", opt.value)}
                  className={cn(
                    "text-left rounded-xl border p-5 transition-colors",
                    data.equipment === opt.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground"
                  )}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-sm text-muted-foreground mt-1">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Schedule */}
        {step === 3 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold mb-1">Your schedule</h1>
              <p className="text-muted-foreground">How many days per week can you commit to training?</p>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Days per week</Label>
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <button
                    key={d}
                    onClick={() => update("available_days", d)}
                    className={cn(
                      "w-12 h-12 rounded-xl border font-semibold transition-colors",
                      data.available_days === d
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {data.available_days <= 2 && "We'll use a Full Body split — perfect for your schedule."}
                {data.available_days === 3 && "3 days is ideal for Full Body training — each muscle gets hit 3x per week."}
                {data.available_days === 4 && "4 days is perfect for an Upper/Lower split — great balance of volume and recovery."}
                {data.available_days === 5 && "5 days allows a Push/Pull/Legs + Upper/Lower hybrid split."}
                {data.available_days >= 6 && "6+ days is Push/Pull/Legs twice per week — high volume for serious gains."}
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Workout duration</Label>
              <div className="grid grid-cols-2 gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => update("workout_duration", opt.value)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-colors",
                      data.workout_duration === opt.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-muted-foreground"
                    )}
                  >
                    <div className="font-semibold">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Injuries + Body Stats */}
        {step === 4 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold mb-1">Body & limitations</h1>
              <p className="text-muted-foreground">Optional but helpful for better recommendations.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="25"
                  value={data.age}
                  onChange={(e) => update("age", e.target.value)}
                  min={13}
                  max={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender (optional)</Label>
                <Input
                  id="gender"
                  type="text"
                  placeholder="Any"
                  value={data.gender}
                  onChange={(e) => update("gender", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="175"
                  value={data.height_cm}
                  onChange={(e) => update("height_cm", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="75"
                  value={data.weight_kg}
                  onChange={(e) => update("weight_kg", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="injuries">Injuries or limitations</Label>
              <Textarea
                id="injuries"
                placeholder="e.g., left shoulder pain, bad knees, lower back issues..."
                value={data.injury_notes}
                onChange={(e) => update("injury_notes", e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                We&apos;ll automatically avoid exercises that aggravate common injuries.
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Muscle Priorities */}
        {step === 5 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold mb-1">Muscle priorities</h1>
              <p className="text-muted-foreground">
                Anything you want to focus on — or avoid? We&apos;ll adjust your program accordingly.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold text-emerald-400 mb-2 block">
                  Prioritize (train more)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {MUSCLE_GROUPS.map((muscle) => (
                    <button
                      key={muscle}
                      onClick={() => toggleMuscle(muscle, "priority_muscles")}
                      className={cn(
                        "px-3 py-1.5 rounded-full border text-sm capitalize transition-colors",
                        data.priority_muscles.includes(muscle)
                          ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                          : "border-border hover:border-emerald-500/50"
                      )}
                    >
                      {muscle}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold text-orange-400 mb-2 block">
                  Deprioritize (train less)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {MUSCLE_GROUPS.map((muscle) => (
                    <button
                      key={muscle}
                      onClick={() => toggleMuscle(muscle, "depriority_muscles")}
                      className={cn(
                        "px-3 py-1.5 rounded-full border text-sm capitalize transition-colors",
                        data.depriority_muscles.includes(muscle)
                          ? "border-orange-500 bg-orange-500/20 text-orange-300"
                          : "border-border hover:border-orange-500/50"
                      )}
                    >
                      {muscle}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Ready to generate your program</p>
                  <p className="text-muted-foreground">
                    We&apos;ll create a personalized{" "}
                    <strong>
                      {data.available_days}-day program
                    </strong>{" "}
                    based on your{" "}
                    <strong>
                      {GOALS.find((g) => g.value === data.fitness_goal)?.label ?? "goal"}
                    </strong>{" "}
                    with{" "}
                    <strong>
                      {EQUIPMENT_OPTIONS.find((e) => e.value === data.equipment)?.label ?? "your equipment"}
                    </strong>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-10">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {step < TOTAL_STEPS ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {saving ? "Building your program..." : "Generate My Program"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
