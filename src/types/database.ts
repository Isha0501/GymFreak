export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "core"
  | "forearms"
  | "traps";

export type Equipment =
  | "barbell"
  | "dumbbell"
  | "cable"
  | "machine"
  | "bodyweight"
  | "kettlebell"
  | "bands"
  | "pullup_bar";

export type UserEquipment =
  | "full_gym"
  | "dumbbells_only"
  | "home_gym"
  | "bodyweight_only";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type MovementPattern =
  | "push"
  | "pull"
  | "hinge"
  | "squat"
  | "carry"
  | "rotation"
  | "isolation";

export type FitnessGoal =
  | "build_muscle"
  | "lose_fat"
  | "gain_strength"
  | "general_fitness"
  | "athletic_performance";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export type SplitType =
  | "full_body"
  | "upper_lower"
  | "push_pull_legs"
  | "bro_split"
  | "custom";

export type WorkoutSection = "warmup" | "main" | "accessory" | "finisher";

export interface UserProfile {
  id: string;
  full_name: string | null;
  age: number | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  experience_level: ExperienceLevel | null;
  fitness_goal: FitnessGoal | null;
  available_days: number | null;
  workout_duration: number | null;
  equipment: UserEquipment | null;
  injury_notes: string | null;
  priority_muscles: MuscleGroup[];
  depriority_muscles: MuscleGroup[];
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  section: WorkoutSection;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  notes?: string;
  orderIndex: number;
}

export interface WorkoutDay {
  id: string;
  name: string;
  dayLabel: string;
  splitFocus: string;
  exercises: WorkoutExercise[];
  estimatedDuration: number;
  muscleEmphasis: MuscleGroup[];
}

export interface GeneratedProgram {
  id: string;
  name: string;
  splitType: SplitType;
  daysPerWeek: number;
  rationale: string;
  workoutDays: WorkoutDay[];
  createdAt: string;
}

export interface ExerciseSet {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  sets: ExerciseSet[];
}

export interface WorkoutLog {
  id: string;
  userId: string;
  date: string;
  workoutDayId: string;
  workoutDayName: string;
  exercises: ExerciseLog[];
  durationMinutes: number;
  notes?: string;
  createdAt: string;
}
