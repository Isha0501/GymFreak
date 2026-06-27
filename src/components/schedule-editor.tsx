"use client";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { WorkoutDay } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Check, X, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface Props {
  workoutDays: WorkoutDay[];
  programId: string;
  todayIndex: number;
}

export function ScheduleEditor({ workoutDays: initial, programId, todayIndex }: Props) {
  const [editing, setEditing] = useState(false);
  const [days, setDays] = useState(initial);
  const [saving, setSaving] = useState(false);

  function moveUp(index: number) {
    if (index === 0) return;
    setDays((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveDown(index: number) {
    if (index === days.length - 1) return;
    setDays((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      const supabase = createClient();
      // Reassign dayLabels to match new positions
      const updated = days.map((day, i) => ({
        ...day,
        dayLabel: DAY_LABELS[i] ?? `Day ${i + 1}`,
      }));
      const { error } = await supabase
        .from("programs")
        .update({ workout_days: updated })
        .eq("id", programId);
      if (error) throw error;
      setDays(updated);
      toast.success("Schedule updated!");
      setEditing(false);
    } catch {
      toast.error("Failed to save schedule");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDays(initial);
    setEditing(false);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Weekly Schedule</CardTitle>
          {!editing ? (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
              <Pencil className="w-3.5 h-3.5" />
              Edit Order
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={cancel} disabled={saving}>
                <X className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" onClick={save} disabled={saving} className="gap-1.5">
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Save
              </Button>
            </div>
          )}
        </div>
        {editing && (
          <p className="text-xs text-muted-foreground">
            Move workouts to any day — changes save when you hit Save.
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {days.map((day, index) => {
            const isToday = index === todayIndex;
            return (
              <div
                key={day.id}
                className={cn(
                  "flex items-center gap-3 text-sm px-2 py-1.5 rounded-lg transition-colors",
                  isToday && "bg-primary/8"
                )}
              >
                <span
                  className={cn(
                    "w-24 shrink-0 text-muted-foreground",
                    isToday && "text-primary font-semibold"
                  )}
                >
                  {DAY_LABELS[index] ?? `Day ${index + 1}`}
                  {isToday && (
                    <span className="ml-1 text-[10px] font-normal opacity-70">today</span>
                  )}
                </span>
                <Badge variant={isToday ? "default" : "secondary"} className="capitalize">
                  {day.name}
                </Badge>
                <span className="text-muted-foreground text-xs ml-auto">
                  ~{day.estimatedDuration} min
                </span>
                {editing && (
                  <div className="flex gap-0.5 shrink-0">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-25 transition-colors"
                      aria-label="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === days.length - 1}
                      className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-25 transition-colors"
                      aria-label="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
