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
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { 
  RadioGroup, 
  RadioGroupItem 
} from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Define the form schema
const candidateFeedbackSchema = z.object({
  overallExperience: z.enum(["excellent", "good", "average", "poor"]),
  processRating: z.enum(["excellent", "good", "average", "poor"]),
  reasonsRating: z.string().optional(),
  interviewerRating: z.enum(["excellent", "good", "average", "poor"]),
  environmentRating: z.enum(["excellent", "good", "average", "poor"]),
  waitTimeRating: z.enum(["excellent", "good", "average", "poor"]),
  improvementSuggestions: z.string().optional(),
  comparisonToOthers: z.string().optional(),
  additionalComments: z.string().optional(),
  anonymous: z.boolean().default(false),
});

type CandidateFeedbackFormValues = z.infer<typeof candidateFeedbackSchema>;

interface CandidateFeedbackFormProps {
  candidate: Candidate;
  onFeedbackSubmitted?: () => void;
}

export default function CandidateFeedbackForm({ candidate, onFeedbackSubmitted }: CandidateFeedbackFormProps) {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  // Initialize form
  const form = useForm<CandidateFeedbackFormValues>({
    resolver: zodResolver(candidateFeedbackSchema),
    defaultValues: {
      overallExperience: "good",
      processRating: "good",
      reasonsRating: "",
      interviewerRating: "good",
      environmentRating: "good",
      waitTimeRating: "good",
      improvementSuggestions: "",
      comparisonToOthers: "",
      additionalComments: "",
      anonymous: false,
    },
  });

  // Submit feedback mutation
  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: CandidateFeedbackFormValues) => {
      const feedbackData = {
        candidateId: candidate.id,
        overallExperience: data.overallExperience,
        processRating: data.processRating,
        reasonsRating: data.reasonsRating,
        interviewerRating: data.interviewerRating,
        environmentRating: data.environmentRating,
        waitTimeRating: data.waitTimeRating,
        improvementSuggestions: data.improvementSuggestions,
        comparisonToOthers: data.comparisonToOthers,
        additionalComments: data.additionalComments,
        anonymous: data.anonymous,
      };
      
      const response = await apiRequest("POST", "/api/candidate-feedback", feedbackData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidate-feedback"] });
      queryClient.invalidateQueries({ queryKey: [`/api/candidate-feedback/candidate/${candidate.id}`] });
      form.reset();
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
      });
      setSubmitted(true);
      if (onFeedbackSubmitted) onFeedbackSubmitted();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Form submission handler
  const onSubmit = (data: CandidateFeedbackFormValues) => {
    submitFeedbackMutation.mutate(data);
  };

  if (submitted) {
    return (
      <Card className="w-full mb-6">
        <CardContent className="pt-6 text-center">
          <div className="inline-flex items-center justify-center rounded-full bg-green-100 p-3 mb-4">
            <svg 
              className="h-8 w-8 text-green-600" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h2 className="text-2xl font-medium mb-2">Thank You!</h2>
          <p className="text-neutral-600 mb-6">
            Your feedback has been submitted successfully. We appreciate your time and input!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mb-6">
      <CardContent className="pt-6">
        <h2 className="text-xl font-medium mb-4">Share Your Interview Experience</h2>
        <p className="text-neutral-600 mb-6">
          Your feedback helps us improve our recruitment process. Please take a moment to share your thoughts.
        </p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="overallExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overall Experience</FormLabel>
                    <FormDescription>How would you rate your overall interview experience?</FormDescription>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="excellent" id="exp-excellent" />
                          <label htmlFor="exp-excellent">Excellent</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="good" id="exp-good" />
                          <label htmlFor="exp-good">Good</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="average" id="exp-average" />
                          <label htmlFor="exp-average">Average</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="poor" id="exp-poor" />
                          <label htmlFor="exp-poor">Poor</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="processRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interview Process</FormLabel>
                    <FormDescription>How satisfied were you with the overall interview process?</FormDescription>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="excellent" id="proc-excellent" />
                          <label htmlFor="proc-excellent">Excellent</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="good" id="proc-good" />
                          <label htmlFor="proc-good">Good</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="average" id="proc-average" />
                          <label htmlFor="proc-average">Average</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="poor" id="proc-poor" />
                          <label htmlFor="proc-poor">Poor</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reasonsRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reasons for Rating</FormLabel>
                  <FormDescription>What factors influenced your ratings above?</FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="Please explain why you gave these ratings..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="interviewerRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interviewers</FormLabel>
                    <FormDescription>Were the interviewers professional and knowledgeable?</FormDescription>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="excellent" id="int-excellent" />
                          <label htmlFor="int-excellent">Excellent</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="good" id="int-good" />
                          <label htmlFor="int-good">Good</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="average" id="int-average" />
                          <label htmlFor="int-average">Average</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="poor" id="int-poor" />
                          <label htmlFor="int-poor">Poor</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="environmentRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Environment</FormLabel>
                    <FormDescription>How was the interview environment?</FormDescription>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="excellent" id="env-excellent" />
                          <label htmlFor="env-excellent">Excellent</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="good" id="env-good" />
                          <label htmlFor="env-good">Good</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="average" id="env-average" />
                          <label htmlFor="env-average">Average</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="poor" id="env-poor" />
                          <label htmlFor="env-poor">Poor</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="waitTimeRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wait Time</FormLabel>
                    <FormDescription>How would you rate the waiting time between stages?</FormDescription>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="excellent" id="wait-excellent" />
                          <label htmlFor="wait-excellent">Excellent</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="good" id="wait-good" />
                          <label htmlFor="wait-good">Good</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="average" id="wait-average" />
                          <label htmlFor="wait-average">Average</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="poor" id="wait-poor" />
                          <label htmlFor="wait-poor">Poor</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="improvementSuggestions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Improvement Suggestions</FormLabel>
                  <FormDescription>What could we do better to improve the interview experience?</FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="Please share your suggestions for improvement..."
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
              name="comparisonToOthers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comparison to Other Interviews</FormLabel>
                  <FormDescription>How does this interview compare to others you've experienced?</FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="Please compare this interview to others you've had..."
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
              name="additionalComments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Comments</FormLabel>
                  <FormDescription>Any other thoughts or feedback you'd like to share?</FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide any additional comments..."
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
              name="anonymous"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Submit Anonymously</FormLabel>
                    <FormDescription>
                      Your feedback will be anonymous and not linked to your name or email.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={submitFeedbackMutation.isPending}
              >
                {submitFeedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}