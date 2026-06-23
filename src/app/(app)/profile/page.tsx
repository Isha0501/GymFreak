"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { generateProgram } from "@/lib/ai/schedule-generator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { UserProfile } from "@/types/database";
import {
  User,
  Target,
  Calendar,
  Dumbbell,
  RefreshCw,
  LogOut,
  ChevronRight,
  Loader2,
  Settings,
} from "lucide-react";
import { capitalize } from "@/lib/utils";

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(data);
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function handleRegenerateProgram() {
    if (!profile) return;
    setRegenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const program = generateProgram(profile);

      // Deactivate old programs
      await supabase
        .from("programs")
        .update({ is_active: false })
        .eq("user_id", user.id);

      // Insert new program
      await supabase.from("programs").insert({
        user_id: user.id,
        name: program.name,
        split_type: program.splitType,
        days_per_week: program.daysPerWeek,
        rationale: program.rationale,
        workout_days: program.workoutDays,
        is_active: true,
      });

      toast.success("New program generated!");
      setShowRegenerateConfirm(false);
      router.push("/dashboard");
    } catch (err) {
      toast.error("Failed to regenerate program");
    } finally {
      setRegenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) return null;

  const profileItems = [
    {
      icon: User,
      label: "Name",
      value: profile.full_name ?? "—",
    },
    {
      icon: Target,
      label: "Goal",
      value: profile.fitness_goal?.replace(/_/g, " ") ?? "—",
    },
    {
      icon: Settings,
      label: "Experience",
      value: capitalize(profile.experience_level ?? "—"),
    },
    {
      icon: Calendar,
      label: "Training Days",
      value: profile.available_days ? `${profile.available_days} days/week` : "—",
    },
    {
      icon: Dumbbell,
      label: "Equipment",
      value: profile.equipment?.replace(/_/g, " ") ?? "—",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold mb-1">Profile</h1>
        <p className="text-muted-foreground text-sm">Your training profile and settings</p>
      </div>

      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
          <User className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-lg">{profile.full_name ?? "Athlete"}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="purple" className="capitalize">{profile.experience_level ?? "beginner"}</Badge>
            <Badge variant="secondary" className="capitalize">
              {profile.fitness_goal?.replace(/_/g, " ") ?? "general fitness"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Profile details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Training Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {profileItems.map((item, i) => (
              <div key={item.label}>
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium capitalize">{item.value}</span>
                </div>
                {i < profileItems.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Body stats */}
      {(profile.age || profile.weight_kg || profile.height_cm) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Body Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              {profile.age && (
                <div>
                  <p className="text-2xl font-bold">{profile.age}</p>
                  <p className="text-xs text-muted-foreground">Age</p>
                </div>
              )}
              {profile.height_cm && (
                <div>
                  <p className="text-2xl font-bold">{profile.height_cm}</p>
                  <p className="text-xs text-muted-foreground">Height (cm)</p>
                </div>
              )}
              {profile.weight_kg && (
                <div>
                  <p className="text-2xl font-bold">{profile.weight_kg}</p>
                  <p className="text-xs text-muted-foreground">Weight (kg)</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Muscle priorities */}
      {(profile.priority_muscles?.length > 0 || profile.depriority_muscles?.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Muscle Priorities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.priority_muscles?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Prioritized</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.priority_muscles.map((m) => (
                    <Badge key={m} variant="success" className="capitalize">{m}</Badge>
                  ))}
                </div>
              </div>
            )}
            {profile.depriority_muscles?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Deprioritized</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.depriority_muscles.map((m) => (
                    <Badge key={m} variant="warning" className="capitalize">{m}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => setShowRegenerateConfirm(true)}
        >
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Regenerate Program
          </div>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => router.push("/onboarding")}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Update Profile
          </div>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          className="w-full justify-between text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <div className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </div>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Regenerate confirm dialog */}
      <Dialog open={showRegenerateConfirm} onOpenChange={setShowRegenerateConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Program?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will create a new workout program based on your current profile. Your workout
            history will be preserved, but your current program will be replaced.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRegenerateConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleRegenerateProgram} disabled={regenerating}>
              {regenerating && <Loader2 className="w-4 h-4 animate-spin" />}
              Yes, Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
