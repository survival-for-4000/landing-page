"use client";

import type React from "react";
import { useState, useCallback, useMemo, useEffect } from "react";
import { ModelSelectionModal } from "@/components/model-selection-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { VideoOptions, GenerationMode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Settings2, Send, X, ImageIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

const defaultOptions: VideoOptions = {
  style: null,
  character: null,
  aspectRatio: "16:9",
  duration: 4,
  quality: "720p",
};

interface ChatInputUIProps {
  onSubmit: (
    prompt: string,
    mode: GenerationMode,
    options: VideoOptions,
    uploadedImageFile?: File
  ) => void;
  isGenerating: boolean;
  availableModels: any[];
  styleModels: any[];
  characterModels: any[];
  onEnhancePrompt?: (prompt: string, selections: VideoOptions) => Promise<string>;
}

export function VideoGenerationChatBar({
  onSubmit,
  isGenerating,
  availableModels,
  styleModels,
  characterModels,
  onEnhancePrompt,
}: ChatInputUIProps) {
  const t = useTranslations("VideoCreation");
  const [mode, setMode] = useState<GenerationMode>("t2v");
  const [prompt, setPrompt] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [selections, setSelections] = useState<VideoOptions>(defaultOptions);
  const [isDragging, setIsDragging] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Set first style model as default when styleModels are loaded (only if no character is selected)
  useEffect(() => {
    if (styleModels.length > 0 && !selections.style && !selections.character) {
      setSelections(prev => ({
        ...prev,
        style: styleModels[0]
      }));
    }
  }, [styleModels, selections.style, selections.character]);

  const handleImageUpload = useCallback((file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setUploadedImageFile(file);
        setMode("i2v");
        setSelections((prev) => ({
          ...prev,
          style: null,
          character: null,
          aspectRatio: "1:1",
        }));
      };
      reader.readAsDataURL(file);
    } else {
      // Show error toast for non-image files
      toast.error(t("chatBar.uploadError"));
    }
  }, []);

  const handleRemoveImage = useCallback(() => {
    setUploadedImage(null);
    setUploadedImageFile(null);
    setMode("t2v");
    setSelections((prev) => ({
      ...prev,
      style: defaultOptions.style,
      character: defaultOptions.character,
    }));
  }, []);

  const handleModeChange = (newMode: GenerationMode) => {
    setMode(newMode);
    if (newMode === "t2v") {
      handleRemoveImage();
    }
  };

  const handleDragEvents = (
    e: React.DragEvent<HTMLDivElement>,
    isEntering: boolean
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (isEntering) {
      setIsDragging(true);
    } else if (
      e.relatedTarget === null ||
      (e.relatedTarget as Node).parentElement !== e.currentTarget
    ) {
      setIsDragging(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleImageUpload(e.dataTransfer.files[0]);
        e.dataTransfer.clearData();
      }
    },
    [handleImageUpload]
  );

  const handleBadgeRemove = (key: keyof VideoOptions) => {
    if (key === "style" || key === "character") {
      setSelections((prev) => ({ ...prev, [key]: null }));
    }
  };

  const handleSubmit = () => {
    if (prompt.trim() && !isGenerating) {
      onSubmit(prompt, mode, selections, uploadedImageFile || undefined);
      // Clear the prompt after successful submission
      setPrompt("");
    }
  };

  const handleEnhancePrompt = async () => {
    if (prompt.trim() && onEnhancePrompt && !isEnhancing) {
      setIsEnhancing(true);
      try {
        const enhancedPrompt = await onEnhancePrompt(prompt, selections);
        setPrompt(enhancedPrompt);
      } catch (error) {
        console.error("Failed to enhance prompt:", error);
      } finally {
        setIsEnhancing(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const selectionBadges = useMemo(() => {
    const badges = [];
    if (mode === "t2v") {
      // Always show lora badge (style or character)
      if (selections.style) {
        badges.push(
          <Badge
            key="style"
            variant="secondary"
            className="flex items-center gap-1"
          >
            Style: {selections.style?.name}
            <button
              onClick={() => handleBadgeRemove("style")}
              className="rounded-full hover:bg-muted-foreground/20"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        );
      } else if (selections.character) {
        badges.push(
          <Badge
            key="character"
            variant="secondary"
            className="flex items-center gap-1"
          >
            Character: {selections.character?.name}
            <button
              onClick={() => handleBadgeRemove("character")}
              className="rounded-full hover:bg-muted-foreground/20"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        );
      }
      badges.push(
        <Badge key="aspectRatio" variant="outline">
          {selections.aspectRatio}
        </Badge>
      );
    }
    badges.push(
      <Badge key="duration" variant="outline">
        {selections.duration}s
      </Badge>
    );
    badges.push(
      <Badge key="quality" variant="outline">
        {selections.quality}
      </Badge>
    );
    return badges;
  }, [selections, mode]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-6 bg-transparent sm:left-64">
      {/* 채팅바 영역 */}
      <div 
        className="p-4 w-full max-w-3xl mx-auto relative"
        onDragEnter={(e) => handleDragEvents(e, true)}
      >
        {/* 드래그 오버레이 - 채팅바 영역에만 표시 */}
        <div
          className={cn(
            "absolute inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm transition-opacity rounded-lg",
            isDragging ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onDragLeave={(e) => handleDragEvents(e, false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="text-center p-4 border-2 border-dashed border-primary rounded-lg">
            <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-semibold">Drop your image here</p>
            <p className="text-xs text-muted-foreground">
              to generate a video from it
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant={mode === "t2v" ? "default" : "destructive"}>
            {mode === "t2v" ? "Text-to-Video" : "Image-to-Video"}
          </Badge>
          {selectionBadges}
        </div>
        <div className="relative">
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {uploadedImage && (
              <div className="relative group">
                <img
                  src={uploadedImage || "/placeholder.svg"}
                  alt="Uploaded preview"
                  className="h-10 w-10 object-cover rounded-md"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute -top-1 -right-1 bg-secondary text-secondary-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Settings2 className="h-5 w-5" />
                  <span className="sr-only">Open settings</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-center">{t("chatBar.settingsTooltip")}</p>
              </TooltipContent>
            </Tooltip>
            {onEnhancePrompt && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleEnhancePrompt}
                      disabled={!prompt.trim() || isGenerating || isEnhancing}
                      className="hover:bg-primary/10 hover:text-primary disabled:opacity-50"
                    >
                      <Sparkles className={`h-5 w-5 ${isEnhancing ? 'animate-spin' : ''}`} />
                      <span className="sr-only">{t("chatBar.enhance")}</span>
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-center">{t("chatBar.enhanceTooltip")}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <Input
            type="text"
            placeholder={t("chatBar.promptPlaceholder")}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            className={cn(
              "w-full h-14 pr-14 bg-card border-border text-foreground",
              uploadedImage 
                ? onEnhancePrompt ? "pl-40" : "pl-28"
                : onEnhancePrompt ? "pl-28" : "pl-14"
            )}
            disabled={isGenerating}
          />
          <Button
            variant="default"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onClick={handleSubmit}
            disabled={isGenerating || !prompt.trim()}
          >
            <Send className="h-5 w-5" />
            <span className="sr-only">{isGenerating ? t("chatBar.generating") : t("chatBar.generate")}</span>
          </Button>
        </div>
      </div>

      <ModelSelectionModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={mode}
        options={selections}
        onSave={setSelections}
        onImageUpload={handleImageUpload}
        onModeChange={handleModeChange}
        uploadedImageFile={uploadedImageFile}
        styleModels={styleModels} // 추가
        characterModels={characterModels} // 추가
      />
    </div>
  );
}
