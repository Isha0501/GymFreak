import { EXERCISES, filterExercisesByEquipment, type Exercise } from "@/lib/exercises";
import type {
  UserProfile,
  GeneratedProgram,
  WorkoutDay,
  WorkoutExercise,
  FitnessGoal,
  ExperienceLevel,
  MuscleGroup,
  SplitType,
  UserEquipment,
} from "@/types/database";

// ─── SETS / REPS BY GOAL ─────────────────────────────────────────────────────

interface SetsReps {
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
}

function getSetsRepsByGoal(goal: FitnessGoal, isCompound: boolean): SetsReps {
  switch (goal) {
    case "gain_strength":
      return isCompound
        ? { sets: 5, repsMin: 3, repsMax: 5, restSeconds: 180 }
        : { sets: 3, repsMin: 6, repsMax: 8, restSeconds: 90 };
    case "build_muscle":
      return isCompound
        ? { sets: 4, repsMin: 6, repsMax: 12, restSeconds: 90 }
        : { sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60 };
    case "lose_fat":
      return isCompound
        ? { sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60 }
        : { sets: 3, repsMin: 15, repsMax: 20, restSeconds: 45 };
    case "athletic_performance":
      return isCompound
        ? { sets: 4, repsMin: 5, repsMax: 8, restSeconds: 120 }
        : { sets: 3, repsMin: 8, repsMax: 12, restSeconds: 60 };
    default: // general_fitness
      return isCompound
        ? { sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 }
        : { sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60 };
  }
}

// ─── EXERCISE COUNTS BY DURATION ─────────────────────────────────────────────

function getExerciseCounts(durationMinutes: number): {
  warmup: number;
  main: number;
  accessory: number;
  finisher: number;
} {
  if (durationMinutes <= 30) return { warmup: 2, main: 2, accessory: 1, finisher: 0 };
  if (durationMinutes <= 45) return { warmup: 2, main: 3, accessory: 2, finisher: 0 };
  if (durationMinutes <= 60) return { warmup: 3, main: 3, accessory: 3, finisher: 1 };
  return { warmup: 3, main: 4, accessory: 4, finisher: 1 };
}

// ─── SPLIT SELECTION ──────────────────────────────────────────────────────────

interface DayTemplate {
  name: string;
  splitFocus: string;
  muscles: MuscleGroup[];
  warmupMuscles: MuscleGroup[];
}

function getSplitPlan(days: number): {
  splitType: SplitType;
  rationale: string;
  dayTemplates: DayTemplate[];
} {
  switch (days) {
    case 1:
    case 2:
      return {
        splitType: "full_body",
        rationale: `With ${days} day${days > 1 ? "s" : ""} per week, a Full Body split is optimal. Each session hits every muscle group, maximizing training frequency and recovery time. This ensures you progress consistently despite limited gym time.`,
        dayTemplates: Array.from({ length: days }, (_, i) => ({
          name: `Full Body ${days > 1 ? `(Day ${i + 1})` : ""}`,
          splitFocus: "full_body",
          muscles: ["chest", "back", "shoulders", "quads", "hamstrings", "glutes", "core"] as MuscleGroup[],
          warmupMuscles: ["core", "shoulders"] as MuscleGroup[],
        })),
      };

    case 3:
      return {
        splitType: "full_body",
        rationale: "3 days per week is the sweet spot for Full Body training. You hit each muscle group 3× per week — the optimal frequency for beginners and intermediates. Rest days between sessions allow adequate recovery while maintaining a high training stimulus.",
        dayTemplates: [
          {
            name: "Full Body A",
            splitFocus: "full_body",
            muscles: ["chest", "back", "quads", "shoulders", "core"] as MuscleGroup[],
            warmupMuscles: ["core", "shoulders"] as MuscleGroup[],
          },
          {
            name: "Full Body B",
            splitFocus: "full_body",
            muscles: ["back", "chest", "hamstrings", "glutes", "biceps", "triceps"] as MuscleGroup[],
            warmupMuscles: ["core", "shoulders"] as MuscleGroup[],
          },
          {
            name: "Full Body C",
            splitFocus: "full_body",
            muscles: ["shoulders", "back", "quads", "hamstrings", "core"] as MuscleGroup[],
            warmupMuscles: ["core", "shoulders"] as MuscleGroup[],
          },
        ],
      };

    case 4:
      return {
        splitType: "upper_lower",
        rationale: "4 days is perfect for an Upper/Lower split. You train each muscle group twice per week — proven to be highly effective for muscle growth and strength. The split allows dedicated focus on upper and lower body with sufficient recovery between sessions.",
        dayTemplates: [
          {
            name: "Upper A (Push Focus)",
            splitFocus: "upper_push",
            muscles: ["chest", "shoulders", "triceps", "back"] as MuscleGroup[],
            warmupMuscles: ["shoulders", "core"] as MuscleGroup[],
          },
          {
            name: "Lower A (Quad Focus)",
            splitFocus: "lower_quad",
            muscles: ["quads", "glutes", "hamstrings", "calves", "core"] as MuscleGroup[],
            warmupMuscles: ["core", "glutes"] as MuscleGroup[],
          },
          {
            name: "Upper B (Pull Focus)",
            splitFocus: "upper_pull",
            muscles: ["back", "biceps", "shoulders", "traps"] as MuscleGroup[],
            warmupMuscles: ["shoulders", "core"] as MuscleGroup[],
          },
          {
            name: "Lower B (Posterior Chain)",
            splitFocus: "lower_posterior",
            muscles: ["hamstrings", "glutes", "quads", "calves", "core"] as MuscleGroup[],
            warmupMuscles: ["core", "glutes"] as MuscleGroup[],
          },
        ],
      };

    case 5:
      return {
        splitType: "push_pull_legs",
        rationale: "5 days per week uses a Push/Pull/Legs rotation with an extra Upper and Lower day. This gives you high frequency for the major patterns while specializing each session. An excellent structure for dedicated intermediate trainees.",
        dayTemplates: [
          {
            name: "Push",
            splitFocus: "push",
            muscles: ["chest", "shoulders", "triceps"] as MuscleGroup[],
            warmupMuscles: ["shoulders", "core"] as MuscleGroup[],
          },
          {
            name: "Pull",
            splitFocus: "pull",
            muscles: ["back", "biceps", "traps"] as MuscleGroup[],
            warmupMuscles: ["shoulders", "core"] as MuscleGroup[],
          },
          {
            name: "Legs",
            splitFocus: "legs",
            muscles: ["quads", "hamstrings", "glutes", "calves"] as MuscleGroup[],
            warmupMuscles: ["core", "glutes"] as MuscleGroup[],
          },
          {
            name: "Upper",
            splitFocus: "upper",
            muscles: ["chest", "back", "shoulders", "biceps", "triceps"] as MuscleGroup[],
            warmupMuscles: ["shoulders", "core"] as MuscleGroup[],
          },
          {
            name: "Lower",
            splitFocus: "lower",
            muscles: ["quads", "hamstrings", "glutes", "calves", "core"] as MuscleGroup[],
            warmupMuscles: ["core", "glutes"] as MuscleGroup[],
          },
        ],
      };

    case 6:
    case 7:
      return {
        splitType: "push_pull_legs",
        rationale: `6 days per week with Push/Pull/Legs × 2 is a high-volume approach suited for advanced trainees. Each muscle group gets trained twice per week with specialized sessions.${days === 7 ? " The 7th day is an active recovery or rest day — your body needs it at this intensity." : ""}`,
        dayTemplates: [
          {
            name: "Push A",
            splitFocus: "push",
            muscles: ["chest", "shoulders", "triceps"] as MuscleGroup[],
            warmupMuscles: ["shoulders", "core"] as MuscleGroup[],
          },
          {
            name: "Pull A",
            splitFocus: "pull",
            muscles: ["back", "biceps", "traps"] as MuscleGroup[],
            warmupMuscles: ["shoulders", "core"] as MuscleGroup[],
          },
          {
            name: "Legs A",
            splitFocus: "legs",
            muscles: ["quads", "hamstrings", "glutes", "calves"] as MuscleGroup[],
            warmupMuscles: ["core", "glutes"] as MuscleGroup[],
          },
          {
            name: "Push B",
            splitFocus: "push",
            muscles: ["chest", "triceps", "shoulders"] as MuscleGroup[],
            warmupMuscles: ["shoulders", "core"] as MuscleGroup[],
          },
          {
            name: "Pull B",
            splitFocus: "pull",
            muscles: ["back", "traps", "biceps"] as MuscleGroup[],
            warmupMuscles: ["shoulders", "core"] as MuscleGroup[],
          },
          {
            name: "Legs B",
            splitFocus: "legs",
            muscles: ["hamstrings", "glutes", "quads", "calves"] as MuscleGroup[],
            warmupMuscles: ["core", "glutes"] as MuscleGroup[],
          },
        ].slice(0, days === 7 ? 6 : 6),
      };

    default:
      return {
        splitType: "full_body",
        rationale: "Full Body training.",
        dayTemplates: [
          {
            name: "Full Body",
            splitFocus: "full_body",
            muscles: ["chest", "back", "shoulders", "quads", "hamstrings", "core"] as MuscleGroup[],
            warmupMuscles: ["core", "shoulders"] as MuscleGroup[],
          },
        ],
      };
  }
}

// ─── EXERCISE SELECTION ───────────────────────────────────────────────────────

// Tag-based target expressions map user-requested tags to exercises
const TAG_BOOSTERS: Record<string, string[]> = {
  "inner thighs":  ["adductors", "inner thighs", "wide stance"],
  "outer glutes":  ["abductors", "outer glutes"],
  "glutes":        ["glute-dominant", "posterior chain"],
  "hamstrings":    ["hamstring-dominant", "posterior chain"],
  "quads":         ["quad-dominant", "knee-dominant"],
  "posterior chain": ["posterior chain", "hinge"],
};

function scoreExercise(
  exercise: Exercise,
  targetMuscles: MuscleGroup[],
  goal: FitnessGoal,
  experience: ExperienceLevel,
  priorityMuscles: MuscleGroup[],
  deprioritMuscles: MuscleGroup[],
  targetTags?: string[]
): number {
  let score = 0;

  // Primary muscle match
  if (targetMuscles.includes(exercise.primaryMuscle)) {
    score += 50;
    if (priorityMuscles.includes(exercise.primaryMuscle)) score += 30;
    if (deprioritMuscles.includes(exercise.primaryMuscle)) score -= 20;
  }

  // Secondary muscle overlap
  const secondaryOverlap = exercise.secondaryMuscles.filter((m) =>
    targetMuscles.includes(m)
  ).length;
  score += secondaryOverlap * 10;

  // Priority muscle secondary boost
  const prioritySecondaryOverlap = exercise.secondaryMuscles.filter((m) =>
    priorityMuscles.includes(m)
  ).length;
  score += prioritySecondaryOverlap * 15;

  // Tag-based targeting — boosts exercises matching specific sub-muscle focus
  if (targetTags && targetTags.length > 0) {
    const exerciseTags = exercise.tags.map((t) => t.toLowerCase());
    const tagMatches = targetTags.filter((tag) => {
      const synonyms = TAG_BOOSTERS[tag] ?? [tag];
      return synonyms.some((s) => exerciseTags.includes(s));
    }).length;
    score += tagMatches * 25;
  }

  // Difficulty match
  if (exercise.difficulty === experience) score += 20;
  if (experience === "beginner" && exercise.difficulty === "intermediate") score -= 15;
  if (experience === "beginner" && exercise.difficulty === "advanced") score -= 40;
  if (experience === "intermediate" && exercise.difficulty === "advanced") score -= 10;

  // Compound bonus for strength/muscle goals
  if (exercise.category === "compound") {
    if (goal === "gain_strength" || goal === "build_muscle") score += 15;
    if (goal === "athletic_performance") score += 20;
  }

  // For fat loss, prefer exercises with more muscle group involvement
  if (goal === "lose_fat") {
    score += exercise.secondaryMuscles.length * 3;
  }

  return score;
}

function selectExercises(
  targetMuscles: MuscleGroup[],
  count: number,
  availableExercises: Exercise[],
  goal: FitnessGoal,
  experience: ExperienceLevel,
  priorityMuscles: MuscleGroup[],
  deprioritMuscles: MuscleGroup[],
  alreadySelected: Set<string>,
  targetTags?: string[]
): Exercise[] {
  const scored = availableExercises
    .filter((e) => !alreadySelected.has(e.id))
    .filter((e) =>
      targetMuscles.includes(e.primaryMuscle) ||
      e.secondaryMuscles.some((m) => targetMuscles.includes(m))
    )
    .map((e) => ({
      exercise: e,
      score: scoreExercise(e, targetMuscles, goal, experience, priorityMuscles, deprioritMuscles, targetTags),
    }))
    .sort((a, b) => b.score - a.score);

  const selected: Exercise[] = [];
  const usedMuscles = new Set<MuscleGroup>();

  // First pass: pick best exercise per muscle (diversity)
  for (const { exercise } of scored) {
    if (selected.length >= count) break;
    if (!usedMuscles.has(exercise.primaryMuscle)) {
      selected.push(exercise);
      usedMuscles.add(exercise.primaryMuscle);
      alreadySelected.add(exercise.id);
    }
  }

  // Second pass: fill remaining slots
  for (const { exercise } of scored) {
    if (selected.length >= count) break;
    if (!selected.includes(exercise)) {
      selected.push(exercise);
      alreadySelected.add(exercise.id);
    }
  }

  return selected;
}

function buildWorkoutDay(
  template: DayTemplate,
  index: number,
  availableExercises: Exercise[],
  goal: FitnessGoal,
  experience: ExperienceLevel,
  durationMinutes: number,
  priorityMuscles: MuscleGroup[],
  deprioritMuscles: MuscleGroup[],
  targetTags?: string[]
): WorkoutDay {
  const counts = getExerciseCounts(durationMinutes);
  const alreadySelected = new Set<string>();

  // Warmup: mobility / activation movements
  const warmupPool = availableExercises.filter(
    (e) => e.category === "isolation" && e.difficulty === "beginner"
  );
  const warmupExercises = selectExercises(
    template.warmupMuscles,
    counts.warmup,
    warmupPool,
    goal,
    experience,
    priorityMuscles,
    deprioritMuscles,
    alreadySelected,
    targetTags
  );

  // Main: compound movements
  const compoundPool = availableExercises.filter((e) => e.category === "compound");
  const mainExercises = selectExercises(
    template.muscles,
    counts.main,
    compoundPool,
    goal,
    experience,
    priorityMuscles,
    deprioritMuscles,
    alreadySelected,
    targetTags
  );

  // Accessory: mix of compound and isolation
  const accessoryExercises = selectExercises(
    template.muscles,
    counts.accessory,
    availableExercises,
    goal,
    experience,
    priorityMuscles,
    deprioritMuscles,
    alreadySelected,
    targetTags
  );

  // Finisher: core or high-rep isolation
  const finisherPool = availableExercises.filter(
    (e) => e.primaryMuscle === "core" || e.category === "isolation"
  );
  const finisherExercises =
    counts.finisher > 0
      ? selectExercises(
          ["core", ...template.muscles],
          counts.finisher,
          finisherPool,
          goal,
          experience,
          priorityMuscles,
          deprioritMuscles,
          alreadySelected,
          targetTags
        )
      : [];

  const toWorkoutExercise = (
    e: Exercise,
    section: WorkoutExercise["section"],
    orderIndex: number
  ): WorkoutExercise => {
    const { sets, repsMin, repsMax, restSeconds } = getSetsRepsByGoal(
      goal,
      e.category === "compound"
    );
    return {
      exerciseId: e.id,
      section,
      sets: section === "warmup" ? 2 : sets,
      repsMin: section === "warmup" ? 10 : repsMin,
      repsMax: section === "warmup" ? 15 : repsMax,
      restSeconds: section === "warmup" ? 30 : restSeconds,
      orderIndex,
    };
  };

  const allExercises: WorkoutExercise[] = [
    ...warmupExercises.map((e, i) => toWorkoutExercise(e, "warmup", i)),
    ...mainExercises.map((e, i) => toWorkoutExercise(e, "main", warmupExercises.length + i)),
    ...accessoryExercises.map((e, i) =>
      toWorkoutExercise(e, "accessory", warmupExercises.length + mainExercises.length + i)
    ),
    ...finisherExercises.map((e, i) =>
      toWorkoutExercise(
        e,
        "finisher",
        warmupExercises.length + mainExercises.length + accessoryExercises.length + i
      )
    ),
  ];

  const dayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return {
    id: `day_${index}`,
    name: template.name,
    dayLabel: dayLabels[index] || `Day ${index + 1}`,
    splitFocus: template.splitFocus,
    exercises: allExercises,
    estimatedDuration: durationMinutes,
    muscleEmphasis: template.muscles.slice(0, 4),
  };
}

// ─── INJURY FILTERING ─────────────────────────────────────────────────────────

const INJURY_EXCLUSIONS: Record<string, string[]> = {
  shoulder: ["bench_press", "incline_bench", "ohp", "barbell_row", "arnold_press"],
  knee: ["barbell_squat", "bulgarian_split", "hack_squat", "lunge", "leg_press"],
  lower_back: ["deadlift", "barbell_squat", "good_morning", "barbell_row"],
  wrist: ["barbell_curl", "skull_crusher", "close_grip_bench", "bench_press"],
  elbow: ["skull_crusher", "close_grip_bench", "tricep_dip", "chin_up"],
};

function applyInjuryFilter(exercises: Exercise[], injuryNotes: string): Exercise[] {
  const notes = injuryNotes.toLowerCase();
  const excludeIds = new Set<string>();

  Object.entries(INJURY_EXCLUSIONS).forEach(([keyword, ids]) => {
    if (notes.includes(keyword)) {
      ids.forEach((id) => excludeIds.add(id));
    }
  });

  return exercises.filter((e) => !excludeIds.has(e.id));
}

// ─── MAIN GENERATOR ───────────────────────────────────────────────────────────

export function generateProgram(profile: Partial<UserProfile>): GeneratedProgram {
  const days = profile.available_days ?? 3;
  const duration = profile.workout_duration ?? 60;
  const goal: FitnessGoal = profile.fitness_goal ?? "general_fitness";
  const experience: ExperienceLevel = profile.experience_level ?? "beginner";
  const equipment: UserEquipment = profile.equipment ?? "full_gym";
  const priorityMuscles: MuscleGroup[] = (profile.priority_muscles as MuscleGroup[]) ?? [];
  const deprioritMuscles: MuscleGroup[] = (profile.depriority_muscles as MuscleGroup[]) ?? [];

  // Derive target tags from priority muscles for sub-muscle targeting
  const targetTags: string[] = priorityMuscles.flatMap((m) => {
    const boosts: Record<string, string[]> = {
      glutes: ["glute-dominant", "posterior chain"],
      hamstrings: ["hamstring-dominant", "posterior chain"],
      quads: ["quad-dominant"],
    };
    return boosts[m] ?? [];
  });

  // Filter exercises by equipment
  let availableExercises = filterExercisesByEquipment(EXERCISES, equipment);

  // Apply injury filters
  if (profile.injury_notes) {
    availableExercises = applyInjuryFilter(availableExercises, profile.injury_notes);
  }

  // Get split plan
  const { splitType, rationale, dayTemplates } = getSplitPlan(days);

  // Build workout days
  const workoutDays: WorkoutDay[] = dayTemplates.map((template, index) =>
    buildWorkoutDay(
      template,
      index,
      availableExercises,
      goal,
      experience,
      duration,
      priorityMuscles,
      deprioritMuscles,
      targetTags
    )
  );

  const splitNames: Record<SplitType, string> = {
    full_body: "Full Body",
    upper_lower: "Upper / Lower",
    push_pull_legs: "Push / Pull / Legs",
    bro_split: "Body Part Split",
    custom: "Custom",
  };

  const goalNames: Record<FitnessGoal, string> = {
    build_muscle: "Build Muscle",
    lose_fat: "Lose Fat",
    gain_strength: "Gain Strength",
    general_fitness: "General Fitness",
    athletic_performance: "Athletic Performance",
  };

  return {
    id: `program_${Date.now()}`,
    name: `${goalNames[goal]} — ${splitNames[splitType]}`,
    splitType,
    daysPerWeek: days,
    rationale,
    workoutDays,
    createdAt: new Date().toISOString(),
  };
}

// ─── JUST TELL ME WHAT TO DO ──────────────────────────────────────────────────

export function generateQuickWorkout(
  profile: Partial<UserProfile>,
  recentWorkoutFocus?: string
): WorkoutDay {
  const duration = profile.workout_duration ?? 45;
  const goal: FitnessGoal = profile.fitness_goal ?? "general_fitness";
  const experience: ExperienceLevel = profile.experience_level ?? "beginner";
  const equipment: UserEquipment = profile.equipment ?? "full_gym";
  const priorityMuscles: MuscleGroup[] = (profile.priority_muscles as MuscleGroup[]) ?? [];
  const deprioritMuscles: MuscleGroup[] = (profile.depriority_muscles as MuscleGroup[]) ?? [];

  let availableExercises = filterExercisesByEquipment(EXERCISES, equipment);
  if (profile.injury_notes) {
    availableExercises = applyInjuryFilter(availableExercises, profile.injury_notes);
  }

  // Avoid the same focus as recent workout
  const focusOptions: Array<{ focus: MuscleGroup[]; name: string }> = [
    { focus: ["chest", "shoulders", "triceps"], name: "Push" },
    { focus: ["back", "biceps", "traps"], name: "Pull" },
    { focus: ["quads", "hamstrings", "glutes", "calves"], name: "Legs" },
    { focus: ["chest", "back", "core"], name: "Upper" },
    { focus: ["quads", "hamstrings", "glutes", "core"], name: "Lower" },
  ];

  const chosen =
    focusOptions.find((f) => recentWorkoutFocus !== f.name) ?? focusOptions[0];

  const template: DayTemplate = {
    name: `${chosen.name} Day`,
    splitFocus: chosen.name.toLowerCase(),
    muscles: chosen.focus,
    warmupMuscles: ["core", "shoulders"],
  };

  return buildWorkoutDay(
    template,
    0,
    availableExercises,
    goal,
    experience,
    duration,
    priorityMuscles,
    deprioritMuscles
  );
}
