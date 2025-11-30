import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Filter,
  ShoppingCart,
  Send,
  X,
  Dumbbell,
} from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  bodyPart: string;
  difficulty: "easy" | "medium" | "hard";
  equipment: string;
  image: string;
}

interface PlanExercise extends Exercise {
  sets: number;
  reps: number;
  frequency: string;
}

const mockExercises: Exercise[] = [
  {
    id: "1",
    name: "Supine Lumbar Rotation Stretch",
    bodyPart: "Lower Back",
    difficulty: "easy",
    equipment: "Mat",
    image: "/placeholder.svg",
  },
  {
    id: "2",
    name: "Bird Dog Exercise",
    bodyPart: "Core / Lower Back",
    difficulty: "medium",
    equipment: "Mat",
    image: "/placeholder.svg",
  },
  {
    id: "3",
    name: "Cat-Cow Stretch",
    bodyPart: "Spine",
    difficulty: "easy",
    equipment: "Mat",
    image: "/placeholder.svg",
  },
  {
    id: "4",
    name: "Glute Bridge",
    bodyPart: "Glutes / Lower Back",
    difficulty: "easy",
    equipment: "Mat",
    image: "/placeholder.svg",
  },
  {
    id: "5",
    name: "Side Plank",
    bodyPart: "Core / Obliques",
    difficulty: "medium",
    equipment: "Mat",
    image: "/placeholder.svg",
  },
  {
    id: "6",
    name: "Prone Press-Up",
    bodyPart: "Lower Back",
    difficulty: "easy",
    equipment: "Mat",
    image: "/placeholder.svg",
  },
];

const bodyParts = [
  "All",
  "Lower Back",
  "Upper Back",
  "Neck",
  "Shoulder",
  "Knee",
  "Hip",
  "Core",
  "Ankle",
];

export default function Exercises() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBodyPart, setSelectedBodyPart] = useState("All");
  const [planExercises, setPlanExercises] = useState<PlanExercise[]>([]);

  const filteredExercises = mockExercises.filter((exercise) => {
    const matchesSearch = exercise.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesBodyPart =
      selectedBodyPart === "All" ||
      exercise.bodyPart.includes(selectedBodyPart);
    return matchesSearch && matchesBodyPart;
  });

  const addToPlan = (exercise: Exercise) => {
    if (!planExercises.find((e) => e.id === exercise.id)) {
      setPlanExercises([
        ...planExercises,
        { ...exercise, sets: 3, reps: 10, frequency: "Daily" },
      ]);
    }
  };

  const removeFromPlan = (id: string) => {
    setPlanExercises(planExercises.filter((e) => e.id !== id));
  };

  const updatePlanExercise = (
    id: string,
    field: keyof PlanExercise,
    value: number | string
  ) => {
    setPlanExercises(
      planExercises.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  return (
    <MainLayout>
      <PageHeader
        title="Exercise Plans"
        description="Build personalized exercise programs for your patients."
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Plan
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exercise Library */}
        <div className="lg:col-span-2 space-y-6">
          <Card variant="elevated" className="animate-slide-up">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Exercise Library</CardTitle>
                <Badge variant="secondary">
                  {filteredExercises.length} exercises
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search exercises..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={selectedBodyPart}
                  onValueChange={setSelectedBodyPart}
                >
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Body Part" />
                  </SelectTrigger>
                  <SelectContent>
                    {bodyParts.map((part) => (
                      <SelectItem key={part} value={part}>
                        {part}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Exercise Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredExercises.map((exercise) => {
                  const isInPlan = planExercises.find((e) => e.id === exercise.id);

                  return (
                    <div
                      key={exercise.id}
                      className={`p-4 rounded-lg border transition-all ${
                        isInPlan
                          ? "bg-primary/5 border-primary/30"
                          : "bg-card border-border hover:border-primary/20"
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                          <Dumbbell className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate">
                            {exercise.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {exercise.bodyPart}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant={
                                exercise.difficulty === "easy"
                                  ? "completed"
                                  : exercise.difficulty === "medium"
                                  ? "pending"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {exercise.difficulty}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {exercise.equipment}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant={isInPlan ? "secondary" : "outline"}
                        size="sm"
                        className="w-full mt-3"
                        onClick={() =>
                          isInPlan
                            ? removeFromPlan(exercise.id)
                            : addToPlan(exercise)
                        }
                      >
                        {isInPlan ? (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Remove
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add to Plan
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Treatment Cart */}
        <div>
          <Card variant="elevated" className="animate-slide-up sticky top-8" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Treatment Plan
                </CardTitle>
                <Badge variant="secondary">{planExercises.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Patient Selection */}
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground">Patient</p>
                <p className="font-medium text-foreground">John Doe</p>
              </div>

              {planExercises.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Dumbbell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No exercises added yet</p>
                  <p className="text-sm">
                    Browse the library and add exercises to build a plan
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {planExercises.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="p-3 rounded-lg bg-secondary/50 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {exercise.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {exercise.bodyPart}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeFromPlan(exercise.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">
                            Sets
                          </label>
                          <Input
                            type="number"
                            value={exercise.sets}
                            onChange={(e) =>
                              updatePlanExercise(
                                exercise.id,
                                "sets",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">
                            Reps
                          </label>
                          <Input
                            type="number"
                            value={exercise.reps}
                            onChange={(e) =>
                              updatePlanExercise(
                                exercise.id,
                                "reps",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">
                            Freq
                          </label>
                          <Select
                            value={exercise.frequency}
                            onValueChange={(value) =>
                              updatePlanExercise(exercise.id, "frequency", value)
                            }
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Daily">Daily</SelectItem>
                              <SelectItem value="3x/week">3x/week</SelectItem>
                              <SelectItem value="2x/week">2x/week</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {planExercises.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-border">
                  <Button className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Send to Patient
                  </Button>
                  <Button variant="outline" className="w-full">
                    Save as Template
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
