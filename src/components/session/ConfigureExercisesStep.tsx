import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, GripVertical } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  description: string;
  body_area: string;
  goal: string;
  difficulty: string;
  instructions: string;
}

interface SelectedExercise extends Exercise {
  sets?: number;
  reps?: number;
  duration_seconds?: number;
  frequency: string;
  notes?: string;
}

interface ConfigureExercisesStepProps {
  selectedExercises: SelectedExercise[];
  onExercisesChange: (exercises: SelectedExercise[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const frequencyOptions = [
  { value: "daily", label: "Daily" },
  { value: "twice_daily", label: "Twice Daily" },
  { value: "3x_week", label: "3x per Week" },
  { value: "2x_week", label: "2x per Week" },
  { value: "weekly", label: "Weekly" },
];

export function ConfigureExercisesStep({
  selectedExercises,
  onExercisesChange,
  onNext,
  onBack,
}: ConfigureExercisesStepProps) {
  const updateExercise = (index: number, updates: Partial<SelectedExercise>) => {
    const updated = [...selectedExercises];
    updated[index] = { ...updated[index], ...updates };
    onExercisesChange(updated);
  };

  const moveExercise = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= selectedExercises.length) return;
    
    const updated = [...selectedExercises];
    const [removed] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, removed);
    onExercisesChange(updated);
  };

  return (
    <div className="space-y-6">
      <Card variant="elevated">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Configure Exercise Parameters</CardTitle>
          <p className="text-sm text-muted-foreground">
            Set the specific parameters for each exercise in the treatment plan
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {selectedExercises.map((exercise, index) => (
              <div
                key={exercise.id}
                className="p-4 rounded-lg border border-border bg-secondary/20"
              >
                <div className="flex items-start gap-4">
                  {/* Drag Handle & Number */}
                  <div className="flex flex-col items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-grab"
                      onClick={() => moveExercise(index, index - 1)}
                      disabled={index === 0}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      {index + 1}
                    </span>
                  </div>

                  {/* Exercise Details */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-foreground">{exercise.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {exercise.description}
                        </p>
                        <div className="flex gap-1 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {exercise.body_area}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {exercise.goal}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {exercise.difficulty}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Parameters */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-xs">Sets</Label>
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          value={exercise.sets || ""}
                          onChange={(e) =>
                            updateExercise(index, { sets: parseInt(e.target.value) || undefined })
                          }
                          placeholder="3"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Reps</Label>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={exercise.reps || ""}
                          onChange={(e) =>
                            updateExercise(index, { reps: parseInt(e.target.value) || undefined })
                          }
                          placeholder="10"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Duration (sec)</Label>
                        <Input
                          type="number"
                          min={5}
                          max={300}
                          value={exercise.duration_seconds || ""}
                          onChange={(e) =>
                            updateExercise(index, {
                              duration_seconds: parseInt(e.target.value) || undefined,
                            })
                          }
                          placeholder="30"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Frequency</Label>
                        <Select
                          value={exercise.frequency}
                          onValueChange={(v) => updateExercise(index, { frequency: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {frequencyOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <Label className="text-xs">Notes (optional)</Label>
                      <Textarea
                        value={exercise.notes || ""}
                        onChange={(e) => updateExercise(index, { notes: e.target.value })}
                        placeholder="Additional instructions or modifications..."
                        rows={2}
                      />
                    </div>

                    {/* Instructions Preview */}
                    {exercise.instructions && (
                      <div className="p-3 rounded-md bg-muted/50">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Instructions
                        </p>
                        <p className="text-sm text-foreground">{exercise.instructions}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext}>
          Review & Send
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
