import React from "react";
import { Resolution, AspectRatio } from "@/services/types/input.types";

interface VideoSettingsProps {
  selectedResolution: Resolution;
  selectedAspectRatio: AspectRatio;
  selectedFrames: number;
  onResolutionChange: (resolution: Resolution) => void;
  onAspectRatioChange: (aspectRatio: AspectRatio) => void;
  onFramesChange: (frames: number) => void;
  className?: string;
}

export function VideoSettings({
  selectedResolution,
  selectedAspectRatio,
  selectedFrames,
  onResolutionChange,
  onAspectRatioChange,
  onFramesChange,
  className = "",
}: VideoSettingsProps) {
  return (
    <div className={`mt-6 pt-6 border-t ${className}`}>
      <h5 className="text-lg font-medium mb-4">Video Settings</h5>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Resolution</label>
          <select
            value={selectedResolution}
            onChange={(e) => onResolutionChange(e.target.value as Resolution)}
            className="w-full border rounded-md px-3 py-2"
          >
            <option value="720p">720p</option>
            <option value="480p">480p</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
          <select
            value={selectedAspectRatio}
            onChange={(e) => onAspectRatioChange(e.target.value as AspectRatio)}
            className="w-full border rounded-md px-3 py-2"
          >
            <option value="1:1">1:1 (Square)</option>
            <option value="16:9">16:9 (Landscape)</option>
            <option value="9:16">9:16 (Portrait)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Frames</label>
          <select
            value={selectedFrames}
            onChange={(e) => onFramesChange(Number(e.target.value))}
            className="w-full border rounded-md px-3 py-2"
          >
            <option value={81}>81</option>
            <option value={101}>101</option>
          </select>
        </div>
      </div>
    </div>
  );
}
