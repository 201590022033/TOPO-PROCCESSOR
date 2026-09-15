import { useState, useRef } from "react";
import { UploadCloud, File as FileIcon, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadFile } from "@/hooks/use-analysis";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  value?: string;
  onUploadComplete: (url: string) => void;
}

export function FileUpload({ value, onUploadComplete }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadFile();
  const { toast } = useToast();

  const activePreview = value || preview;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG).",
      });
      return;
    }

    // Create local preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      const result = await uploadMutation.mutateAsync(file);
      onUploadComplete(result.url);
      toast({
        title: "Upload successful",
        description: "Image ready for analysis.",
      });
    } catch (error) {
      setPreview(null);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Could not upload the image. Please try again.",
      });
    }
  };

  const clearFile = () => {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
    onUploadComplete(""); // Clear in parent
  };

  return (
    <div className="w-full">
      {activePreview ? (
        <div className="relative rounded-xl overflow-hidden border border-border bg-white shadow-sm group">
          <img 
            src={activePreview} 
            alt="Upload preview" 
            className="w-full h-64 object-contain bg-slate-50"
          />
          <div className="absolute top-2 right-2 flex gap-2">
             <div className="bg-emerald-500 text-white p-1.5 rounded-full shadow-lg">
                <Check className="w-4 h-4" />
             </div>
          </div>
          <button 
            onClick={clearFile}
            className="absolute top-2 left-2 bg-white/90 text-slate-700 hover:text-red-600 p-2 rounded-lg shadow-sm border border-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          {uploadMutation.isPending && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-foreground">Uploading...</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-out text-center cursor-pointer group",
            dragActive 
              ? "border-primary bg-primary/5 scale-[1.01]" 
              : "border-slate-200 hover:border-primary/50 hover:bg-slate-50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleChange}
          />
          
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-slate-100 group-hover:bg-primary/10 transition-colors duration-200">
              <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors duration-200" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                SVG, PNG, JPG or GIF (max. 10MB)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
