"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Upload,
  Download,
  Share2,
  Sparkles,
  Settings,
  FileImage,
  Image as ImageIcon,
  Grid3X3,
  Palette,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

const Img2ImagePage: React.FC = () => {
  const t = useTranslations("Img2Image");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [proMode, setProMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState("stable-diffusion");
  const [imageSize, setImageSize] = useState("1024x1024");
  const [style, setStyle] = useState("natural");
  const [strength, setStrength] = useState([0.7]);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<
    string | null
  >(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  // 이미지 업로드 핸들러
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(t("errors.invalidFileType"));
      return;
    }

    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > 10) {
      toast.error(t("errors.fileTooLarge"));
      return;
    } else if (fileSizeMB > 1) {
      toast.info(t("info.largeFileDetected", { size: fileSizeMB.toFixed(1) }));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setReferenceImage(file);
      setReferenceImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  // 이미지 제거
  const removeImage = () => {
    setReferenceImage(null);
    setReferenceImagePreview(null);
  };

  // 파일 입력 트리거
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // 이미지 생성 핸들러
  const handleGenerate = async () => {
    if (!referenceImage || !prompt.trim()) {
      toast.error(t("errors.uploadImageAndPrompt"));
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setGeneratedImages([]);

    try {
      toast.info(t("status.creating"));

      // 임시 진행률 시뮬레이션
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            // 임시 완료 처리
            setTimeout(() => {
              setIsGenerating(false);
              setProgress(100);
              // 데모용 이미지들 (참조 이미지를 기반으로 변형된 것처럼)
              const demoImages = [
                "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=512&h=512&fit=crop",
                "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=512&h=512&fit=crop",
                "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=512&h=512&fit=crop",
                "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=512&h=512&fit=crop",
              ];
              setGeneratedImages(demoImages);
              toast.success(t("status.success"));
            }, 2000);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 1000);
    } catch (error: any) {
      setIsGenerating(false);
      setProgress(0);
      toast.error(error.message || t("errors.failedToGenerate"));
    }
  };

  return (
    <div className="flex h-full">
      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
        }}
      />

      {/* 왼쪽 패널 - 프롬프트 입력 */}
      <div className="w-1/2 border-r bg-white p-6 overflow-y-auto">
        <div className="max-w-lg space-y-6">
          {/* 참조 이미지 업로드 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              {t("referenceImage.title")}
            </Label>
            <Card className="aspect-square cursor-pointer hover:border-primary border-dashed border-2 transition-colors relative">
              <CardContent className="flex items-center justify-center h-full p-4">
                {referenceImagePreview ? (
                  <div
                    className="relative w-full h-full"
                    onClick={triggerFileInput}
                  >
                    <img
                      src={referenceImagePreview}
                      alt={t("referenceImage.alt")}
                      className="w-full h-full object-cover rounded"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage();
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="text-center text-gray-400"
                    onClick={triggerFileInput}
                  >
                    <Upload className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">
                      {t("referenceImage.upload")}
                    </p>
                    <p className="text-sm">{t("referenceImage.instruction")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 프롬프트 입력 */}
          <div className="space-y-3">
            <Label htmlFor="prompt" className="text-base font-medium">
              {t("prompt.title")}
            </Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t("prompt.placeholder")}
              className="min-h-[120px] resize-none"
            />
          </div>

          {/* 네거티브 프롬프트 */}
          {proMode && (
            <div className="space-y-3">
              <Label
                htmlFor="negative-prompt"
                className="text-base font-medium"
              >
                {t("negativePrompt.title")}
              </Label>
              <Textarea
                id="negative-prompt"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder={t("negativePrompt.placeholder")}
                className="min-h-[80px] resize-none"
              />
            </div>
          )}

          {/* Strength 슬라이더 */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base font-medium">
                {t("strength.title")}
              </Label>
              <span className="text-sm text-gray-500">
                {(strength[0] * 100).toFixed(0)}%
              </span>
            </div>
            <Slider
              value={strength}
              onValueChange={setStrength}
              max={1}
              min={0.1}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{t("strength.moreSimilar")}</span>
              <span>{t("strength.moreCreative")}</span>
            </div>
          </div>

          {/* Pro Mode */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-sm">{t("proMode.title")}</p>
                <p className="text-xs text-gray-600">
                  {t("proMode.description")}
                </p>
              </div>
            </div>
            <Switch checked={proMode} onCheckedChange={setProMode} />
          </div>

          {/* 모델 선택 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">{t("model.title")}</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue placeholder={t("model.placeholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stable-diffusion">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                    <span>Stable Diffusion</span>
                    <Badge variant="secondary" className="ml-2">
                      {t("model.popular")}
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="midjourney">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                    <span>Midjourney</span>
                    <Badge variant="secondary" className="ml-2">
                      {t("model.premium")}
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="dalle-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"></div>
                    <span>DALL-E 2</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 이미지 설정 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center">
                <Grid3X3 className="w-4 h-4 mr-2" />
                {t("settings.size")}
              </Label>
              <Select value={imageSize} onValueChange={setImageSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="512x512">512×512</SelectItem>
                  <SelectItem value="1024x1024">1024×1024</SelectItem>
                  <SelectItem value="768x768">768×768</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center">
                <Palette className="w-4 h-4 mr-2" />
                {t("settings.style")}
              </Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="natural">{t("style.natural")}</SelectItem>
                  <SelectItem value="vivid">{t("style.vivid")}</SelectItem>
                  <SelectItem value="cinematic">
                    {t("style.cinematic")}
                  </SelectItem>
                  <SelectItem value="anime">{t("style.anime")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 품질 설정 (Pro Mode) */}
          {proMode && (
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                {t("settings.quality")}
              </Label>
              <Select value="standard" onValueChange={() => {}}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">
                    {t("quality.standard")}
                  </SelectItem>
                  <SelectItem value="hd">{t("quality.hd")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || !referenceImage || isGenerating}
            className="w-full h-12 text-lg font-medium"
            size="lg"
          >
            {isGenerating ? t("buttons.generating") : t("buttons.create")}
          </Button>

          {/* Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t("progress.generating")}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <FileImage className="w-4 h-4 text-gray-500" />
              <Button variant="link" className="p-0 h-auto text-sm">
                {t("links.userGuide")}
              </Button>
            </div>
            <Button variant="outline" className="w-full">
              {t("buttons.trySamples")} →
            </Button>
          </div>
        </div>
      </div>

      {/* 오른쪽 패널 - 결과물 */}
      <div className="w-1/2 p-6 bg-gray-50">
        <div className="h-full flex flex-col">
          {/* 상단 정보 */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${isGenerating ? "bg-yellow-500 animate-pulse" : generatedImages.length > 0 ? "bg-green-500" : "bg-gray-400"}`}
                ></div>
                <span className="text-sm text-gray-600">
                  {isGenerating
                    ? t("status.processing")
                    : generatedImages.length > 0
                      ? t("status.completed")
                      : t("status.ready")}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <ImageIcon className="w-4 h-4" />
                <span>{t("type.imageToImage")}</span>
                <span>•</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* 이미지 결과 영역 */}
          <Card className="flex-1">
            <CardContent className="p-4 h-full">
              {isGenerating ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                    <p className="text-lg text-gray-700">
                      {t("progress.generatingImages")}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t("progress.takeFewMoments")}
                    </p>
                    {progress > 0 && (
                      <p className="text-sm text-gray-500">
                        {Math.round(progress)}% {t("progress.complete")}
                      </p>
                    )}
                  </div>
                </div>
              ) : generatedImages.length > 0 ? (
                <div className="h-full">
                  <div className="grid grid-cols-2 gap-4 h-full">
                    {generatedImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={t("results.generatedImage", {
                            number: index + 1,
                          })}
                          className="w-full h-full object-cover rounded-lg hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                const a = document.createElement("a");
                                a.href = imageUrl;
                                a.download = `generated-image-${index + 1}.jpg`;
                                a.click();
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="secondary">
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-400 space-y-4">
                    <FileImage className="w-16 h-16 mx-auto opacity-50" />
                    <p className="text-lg">
                      {t("results.modifiedImagesWillAppear")}
                    </p>
                    <p className="text-sm">
                      {t("results.uploadImageAndPrompt")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 하단 액션 버튼들 */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                disabled={generatedImages.length === 0 || isGenerating}
                onClick={handleGenerate}
              >
                {t("buttons.recreate")}
              </Button>
              <Button
                variant="outline"
                disabled={generatedImages.length === 0 || isGenerating}
              >
                <Share2 className="w-4 h-4 mr-2" />
                {t("buttons.publish")}
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={generatedImages.length === 0 || isGenerating}
                onClick={() => {
                  generatedImages.forEach((imageUrl, index) => {
                    const a = document.createElement("a");
                    a.href = imageUrl;
                    a.download = `generated-image-${index + 1}.jpg`;
                    a.click();
                  });
                }}
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={generatedImages.length === 0 || isGenerating}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Img2ImagePage;
