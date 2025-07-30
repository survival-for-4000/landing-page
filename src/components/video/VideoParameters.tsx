import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, Maximize2, Palette } from "lucide-react";

interface VideoParametersProps {
  lora?: string;
  taskId?: number;
  width?: number;
  height?: number;
  numFrames?: number;
  inputImageUrl?: string;
  className?: string;
}

export function VideoParameters({ lora, taskId, width, height, numFrames, inputImageUrl, className = "" }: VideoParametersProps) {
  const getStyleName = (lora: string) => {
    if (!lora) return "Default";
    // Extract style name from lora filename
    if (lora.includes("adapter_model")) return "Base Model";
    return lora.replace(/\.safetensors$/, "").replace(/_/g, " ");
  };

  // Calculate aspect ratio from actual dimensions
  const calculateAspectRatio = (w: number, h: number): string => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(w, h);
    const ratioWidth = w / divisor;
    const ratioHeight = h / divisor;
    
    // Common ratios
    if (ratioWidth === ratioHeight) return "1:1";
    if (ratioWidth === 16 && ratioHeight === 9) return "16:9";
    if (ratioWidth === 9 && ratioHeight === 16) return "9:16";
    if (ratioWidth === 4 && ratioHeight === 3) return "4:3";
    if (ratioWidth === 3 && ratioHeight === 4) return "3:4";
    
    return `${ratioWidth}:${ratioHeight}`;
  };

  // Calculate duration from frames
  const calculateDuration = (frames: number): string => {
    if (frames <= 81) return "4s";
    if (frames <= 101) return "6s";
    
    const fps = 20;
    const seconds = Math.round(frames / fps);
    return `${seconds}s`;
  };

  // Use calculated values or fallback to defaults
  const aspectRatio = (width && height) ? calculateAspectRatio(width, height) : "16:9";
  const duration = numFrames ? calculateDuration(numFrames) : "4s";

  return (
    <div className={`flex flex-wrap items-center gap-2 mb-3 ${className}`}>
      {/* Input Image (if exists) */}
      {inputImageUrl && (
        <div className="inline-block">
          <img 
            src={inputImageUrl} 
            alt="Input image"
            className="w-8 h-8 object-cover rounded border border-border"
            onError={(e) => {
              console.error("Failed to load input image:", inputImageUrl);
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Aspect Ratio */}
      <Badge variant="outline" className="flex items-center gap-1 text-xs">
        <Maximize2 className="w-3 h-3" />
        {aspectRatio}
      </Badge>

      {/* Duration */}
      <Badge variant="outline" className="flex items-center gap-1 text-xs">
        <Clock className="w-3 h-3" />
        {duration}
      </Badge>

      {/* Style/LoRA */}
      {lora && (
        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
          <Palette className="w-3 h-3" />
          {getStyleName(lora)}
        </Badge>
      )}

    </div>
  );
}