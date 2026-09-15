import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { FileUpload } from "@/components/FileUpload";
import { useCreateAnalysis } from "@/hooks/use-analysis";
import { useToast } from "@/hooks/use-toast";
import { Settings2, ArrowLeft, Microscope, Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAnalysisSchema } from "@shared/schema";
import { z } from "zod";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Schema for the form
const formSchema = insertAnalysisSchema.extend({
  startAngle: z.coerce.number(),
  endAngle: z.coerce.number(),
  nMires: z.coerce.number(),
  workingDistance: z.coerce.number(),
  zernikeDegree: z.coerce.number(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewAnalysis() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createAnalysis = useCreateAnalysis();
  const [uploadedUrl, setUploadedUrl] = useState<string>("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      imageUrl: "",
      startAngle: 0,
      endAngle: 360,
      nMires: 22,
      workingDistance: 75,
      zernikeDegree: 8,
      mireSegMethod: "dl",
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!uploadedUrl) {
      toast({
        variant: "destructive",
        title: "Image required",
        description: "Please upload an image before starting analysis.",
      });
      return;
    }

    try {
      const result = await createAnalysis.mutateAsync({
        ...data,
        imageUrl: uploadedUrl,
      });
      
      toast({
        title: "Analysis started",
        description: "Your image is being processed.",
      });
      
      setLocation(`/analysis/${result.id}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
      });
    }
  };

  const onUploadComplete = (url: string) => {
    setUploadedUrl(url);
    form.setValue("imageUrl", url); // Needed for form validation if strictly required in schema
  };

  return (
    <Layout>
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={() => setLocation("/")}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">New Analysis</h1>
          <p className="text-sm text-muted-foreground">Configure parameters for image processing.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Image Upload */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Microscope className="w-5 h-5 text-primary" />
              Source Image
            </h2>
            <FileUpload value={uploadedUrl} onUploadComplete={onUploadComplete} />

            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Or choose a sample Placido disc image:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onUploadComplete("/images/sample_placido_normal.png");
                    form.setValue("nMires", 22);
                    form.setValue("mireSegMethod", "dl");
                  }}
                  className={cn(
                    "flex items-center gap-3 p-3 text-left rounded-xl border transition-all",
                    uploadedUrl === "/images/sample_placido_normal.png"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <img
                    src="/images/sample_placido_normal.png"
                    alt="Normal Placido"
                    className="w-12 h-12 rounded-lg object-cover bg-slate-900 border border-slate-200 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Standard Normal Cornea</p>
                    <p className="text-xs text-muted-foreground">22 concentric regular mires</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onUploadComplete("/images/sample_placido_keratoconus.png");
                    form.setValue("nMires", 24);
                    form.setValue("mireSegMethod", "dl");
                  }}
                  className={cn(
                    "flex items-center gap-3 p-3 text-left rounded-xl border transition-all",
                    uploadedUrl === "/images/sample_placido_keratoconus.png"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <img
                    src="/images/sample_placido_keratoconus.png"
                    alt="Keratoconus Placido"
                    className="w-12 h-12 rounded-lg object-cover bg-slate-900 border border-slate-200 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Keratoconus Screening</p>
                    <p className="text-xs text-muted-foreground">Astigmatic mire distortion</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Parameters Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border sticky top-8">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
              <Settings2 className="w-5 h-5 text-slate-600" />
              <h2 className="font-semibold text-lg">Configuration</h2>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startAngle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">Start Angle</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="font-mono text-sm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endAngle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">End Angle</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="font-mono text-sm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nMires"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                          N Mires
                          <Tooltip>
                            <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger>
                            <TooltipContent>Number of rings to detect</TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="font-mono text-sm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="workingDistance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">Distance (mm)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="font-mono text-sm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="zernikeDegree"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">Zernike Degree</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="number" {...field} className="font-mono text-sm pl-10" max={20} min={1} />
                          <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Deg</span>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">Polynomial fitting degree (1-20).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mireSegMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">Segmentation Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="dl">Deep Learning (DL)</SelectItem>
                          <SelectItem value="traditional">Traditional CV</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={createAnalysis.isPending}
                    className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 active:translate-y-0.5 active:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {createAnalysis.isPending ? (
                      <>Processing...</>
                    ) : (
                      <>Run Analysis</>
                    )}
                  </button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
