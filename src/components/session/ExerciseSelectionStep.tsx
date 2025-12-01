import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Plus,
  X,
  Sparkles,
  Dumbbell,
  ShoppingCart,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface ExerciseSelectionStepProps {
  condition: string;
  selectedExercises: SelectedExercise[];
  onExercisesChange: (exercises: SelectedExercise[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const bodyAreas = ["all", "shoulder", "knee", "back", "hip", "ankle", "neck", "wrist"];
const goals = ["all", "mobility", "strength", "flexibility"];
const difficulties = ["all", "easy", "medium", "hard"];

export function ExerciseSelectionStep({
  condition,
  selectedExercises,
  onExercisesChange,
  onNext,
  onBack,
}: ExerciseSelectionStepProps) {
  const { toast } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [bodyAreaFilter, setBodyAreaFilter] = useState("all");
  const [goalFilter, setGoalFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [aiSuggestions, setAiSuggestions] = useState<Exercise[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: "",
    description: "",
    body_area: "back",
    goal: "mobility",
    difficulty: "easy",
    instructions: "",
  });

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    // Generate AI suggestions based on condition
    if (exercises.length > 0 && condition) {
      generateAiSuggestions();
    }
  }, [exercises, condition]);

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .order("name");

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      toast({
        title: "Error",
        description: "Failed to load exercises",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAiSuggestions = () => {
    // Mock AI suggestions based on condition
    const conditionLower = condition?.toLowerCase() || "";
    let suggested: Exercise[] = [];

    if (conditionLower.includes("back")) {
      suggested = exercises.filter((e) => e.body_area === "back").slice(0, 4);
    } else if (conditionLower.includes("knee")) {
      suggested = exercises.filter((e) => e.body_area === "knee").slice(0, 4);
    } else if (conditionLower.includes("shoulder")) {
      suggested = exercises.filter((e) => e.body_area === "shoulder").slice(0, 4);
    } else {
      suggested = exercises.slice(0, 4);
    }

    setAiSuggestions(suggested);
  };

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch =
      exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBodyArea =
      bodyAreaFilter === "all" || exercise.body_area === bodyAreaFilter;
    const matchesGoal = goalFilter === "all" || exercise.goal === goalFilter;
    const matchesDifficulty =
      difficultyFilter === "all" || exercise.difficulty === difficultyFilter;

    return matchesSearch && matchesBodyArea && matchesGoal && matchesDifficulty;
  });

  const addExercise = (exercise: Exercise) => {
    if (selectedExercises.find((e) => e.id === exercise.id)) {
      toast({
        title: "Already added",
        description: "This exercise is already in your treatment plan",
      });
      return;
    }

    const newSelectedExercise: SelectedExercise = {
      ...exercise,
      sets: 3,
      reps: 10,
      frequency: "daily",
    };

    onExercisesChange([...selectedExercises, newSelectedExercise]);
    toast({
      title: "Exercise added",
      description: `${exercise.name} added to treatment plan`,
    });
  };

  const removeExercise = (exerciseId: string) => {
    onExercisesChange(selectedExercises.filter((e) => e.id !== exerciseId));
  };

  const handleAddCustomExercise = async () => {
    if (!newExercise.name.trim()) {
      toast({
        title: "Error",
        description: "Exercise name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("exercises")
        .insert([newExercise])
        .select()
        .single();

      if (error) throw error;

      setExercises([...exercises, data]);
      addExercise(data);
      setShowAddDialog(false);
      setNewExercise({
        name: "",
        description: "",
        body_area: "back",
        goal: "mobility",
        difficulty: "easy",
        instructions: "",
      });

      toast({
        title: "Exercise created",
        description: "New exercise added to library",
      });
    } catch (error) {
      console.error("Error adding exercise:", error);
      toast({
        title: "Error",
        description: "Failed to create exercise",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Exercise Library */}
      <div className="lg:col-span-2 space-y-6">
        {/* AI Suggestions */}
        {aiSuggestions.length > 0 && (
          <Card variant="elevated">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">AI Suggestions</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Based on: {condition || "patient condition"}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {aiSuggestions.map((exercise) => (
                  <div
                    key={exercise.id}
                    className="p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{exercise.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {exercise.description}
                        </p>
                        <div className="flex gap-1 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {exercise.body_area}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {exercise.goal}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => addExercise(exercise)}
                        disabled={selectedExercises.some((e) => e.id === exercise.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card variant="elevated">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Exercise Library</CardTitle>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Custom Exercise</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={newExercise.name}
                        onChange={(e) =>
                          setNewExercise({ ...newExercise, name: e.target.value })
                        }
                        placeholder="Exercise name"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newExercise.description}
                        onChange={(e) =>
                          setNewExercise({ ...newExercise, description: e.target.value })
                        }
                        placeholder="Brief description"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Body Area</Label>
                        <Select
                          value={newExercise.body_area}
                          onValueChange={(v) =>
                            setNewExercise({ ...newExercise, body_area: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {bodyAreas.slice(1).map((area) => (
                              <SelectItem key={area} value={area}>
                                {area}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Goal</Label>
                        <Select
                          value={newExercise.goal}
                          onValueChange={(v) =>
                            setNewExercise({ ...newExercise, goal: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {goals.slice(1).map((goal) => (
                              <SelectItem key={goal} value={goal}>
                                {goal}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Difficulty</Label>
                        <Select
                          value={newExercise.difficulty}
                          onValueChange={(v) =>
                            setNewExercise({ ...newExercise, difficulty: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {difficulties.slice(1).map((diff) => (
                              <SelectItem key={diff} value={diff}>
                                {diff}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Instructions</Label>
                      <Textarea
                        value={newExercise.instructions}
                        onChange={(e) =>
                          setNewExercise({ ...newExercise, instructions: e.target.value })
                        }
                        placeholder="Step-by-step instructions"
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleAddCustomExercise} className="w-full">
                      Add Exercise
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <Select value={bodyAreaFilter} onValueChange={setBodyAreaFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Body Area" />
                </SelectTrigger>
                <SelectContent>
                  {bodyAreas.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area === "all" ? "All Areas" : area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={goalFilter} onValueChange={setGoalFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Goal" />
                </SelectTrigger>
                <SelectContent>
                  {goals.map((goal) => (
                    <SelectItem key={goal} value={goal}>
                      {goal === "all" ? "All Goals" : goal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map((diff) => (
                    <SelectItem key={diff} value={diff}>
                      {diff === "all" ? "All Levels" : diff}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Exercise List */}
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Loading exercises...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredExercises.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="p-3 rounded-lg border border-border hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{exercise.name}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
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
                        <Button
                          size="sm"
                          onClick={() => addExercise(exercise)}
                          disabled={selectedExercises.some((e) => e.id === exercise.id)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={onNext} disabled={selectedExercises.length === 0}>
            Configure Exercises
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Treatment Cart */}
      <Card variant="elevated" className="lg:col-span-1">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Treatment Plan</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            {selectedExercises.length} exercise{selectedExercises.length !== 1 ? "s" : ""} selected
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {selectedExercises.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Dumbbell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  No exercises selected yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Add exercises from the library
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedExercises.map((exercise, index) => (
                  <div
                    key={exercise.id}
                    className="p-3 rounded-lg border border-border bg-secondary/30"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {exercise.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {exercise.body_area} • {exercise.goal}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => removeExercise(exercise.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
