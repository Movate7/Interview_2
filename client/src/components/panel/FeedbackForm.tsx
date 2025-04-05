import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Candidate } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel,
  FormMessage 
} from "@/components/ui/form";
import { 
  RadioGroup, 
  RadioGroupItem 
} from "@/components/ui/radio-group";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Define the form schema
const feedbackSchema = z.object({
  technicalSkills: z.enum(["excellent", "good", "average", "poor"]),
  communication: z.enum(["excellent", "good", "average", "poor"]),
  detailedFeedback: z.string().min(5, "Please provide detailed feedback"),
  decision: z.enum(["next", "reject", "hold"]),
  nextRound: z.string().optional(),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

interface FeedbackFormProps {
  candidate: Candidate;
  panelId: number;
}

export default function FeedbackForm({ candidate, panelId }: FeedbackFormProps) {
  const { toast } = useToast();
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Get next round options based on current round
  const getNextRoundOptions = () => {
    switch (candidate.currentRound) {
      case "gd":
        return ["screening"];
      case "screening":
        return ["manager"];
      case "manager":
        return ["hr", "technical_round_2"];
      default:
        return [];
    }
  };

  const nextRoundOptions = getNextRoundOptions();

  // Initialize form
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      technicalSkills: "good",
      communication: "good",
      detailedFeedback: "",
      decision: "next",
      nextRound: nextRoundOptions[0],
    },
  });

  // Watch decision field to conditionally show next round selector
  const watchDecision = form.watch("decision");

  // Submit feedback mutation
  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: FeedbackFormValues) => {
      const feedbackData = {
        candidateId: candidate.id,
        panelId,
        round: candidate.currentRound,
        technicalSkills: data.technicalSkills,
        communication: data.communication,
        detailedFeedback: data.detailedFeedback,
        decision: data.decision,
        nextRound: data.nextRound,
        createdAt: new Date(),
      };
      
      const response = await apiRequest("POST", "/api/feedback", feedbackData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      form.reset();
      toast({
        title: "Feedback Submitted",
        description: "Candidate feedback has been recorded",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
    }
  });

  // Form submission handler
  const onSubmit = (data: FeedbackFormValues) => {
    submitFeedbackMutation.mutate(data);
  };

  // Save draft handler
  const saveDraft = () => {
    setIsSavingDraft(true);
    
    // In a real app, this would save to local storage or backend
    setTimeout(() => {
      toast({
        title: "Draft Saved",
        description: "Your feedback draft has been saved",
      });
      setIsSavingDraft(false);
    }, 1000);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <h4 className="text-lg font-medium mb-4">Provide Feedback</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <FormField
            control={form.control}
            name="technicalSkills"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Technical Skills</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="excellent" id="tech-excellent" />
                      <label htmlFor="tech-excellent">Excellent</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="good" id="tech-good" />
                      <label htmlFor="tech-good">Good</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="average" id="tech-average" />
                      <label htmlFor="tech-average">Average</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="poor" id="tech-poor" />
                      <label htmlFor="tech-poor">Poor</label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="communication"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Communication</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="excellent" id="comm-excellent" />
                      <label htmlFor="comm-excellent">Excellent</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="good" id="comm-good" />
                      <label htmlFor="comm-good">Good</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="average" id="comm-average" />
                      <label htmlFor="comm-average">Average</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="poor" id="comm-poor" />
                      <label htmlFor="comm-poor">Poor</label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="detailedFeedback"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Detailed Feedback</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Provide detailed feedback about the candidate..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="decision"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Decision</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="next" id="dec-next" className="text-green-600" />
                      <label htmlFor="dec-next">Move to Next Round</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="reject" id="dec-reject" className="text-red-600" />
                      <label htmlFor="dec-reject">Reject</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hold" id="dec-hold" className="text-yellow-600" />
                      <label htmlFor="dec-hold">Hold</label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {watchDecision === "next" && nextRoundOptions.length > 0 && (
            <FormField
              control={form.control}
              name="nextRound"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Round</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select next round" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {nextRoundOptions.map((round) => (
                        <SelectItem 
                          key={round} 
                          value={round}
                          className="capitalize"
                        >
                          {round.replace('_', ' ')} Round
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={saveDraft}
            disabled={isSavingDraft || submitFeedbackMutation.isPending}
          >
            {isSavingDraft ? "Saving..." : "Save as Draft"}
          </Button>
          <Button
            type="submit"
            disabled={submitFeedbackMutation.isPending}
          >
            {submitFeedbackMutation.isPending ? "Submitting..." : "Submit & Next Candidate"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
