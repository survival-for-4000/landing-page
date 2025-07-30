"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSSE } from "@/components/SSEProvider";
import { config } from "@/config";
import VideoResultModal from "@/components/video-result-modal";
import { useRouter, useSearchParams } from "next/navigation";
import { VideoList } from "@/components/video/VideoList";
import {
  TaskItem,
  BackendResponse,
  TaskListData,
} from "@/services/types/video.types";
import { ChatInput } from "@/components/input/ChatInput";
import { VideoGenerationParams } from "@/services/types/input.types";
import type { VideoOptions, GenerationMode } from "@/lib/types";
import { VideoGenerationChatBar } from "@/components/VideoGenerationChatBar";
import { api } from "@/lib/auth/apiClient";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function CreatePage() {
  const t = useTranslations("VideoCreation");
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId"); // URL에서 taskId 읽기
  const { isLoggedIn, userName, memberId } = useAuth();
  const { isConnected, notifications } = useSSE(); // lastNotification 제거

  //   const listRef = useRef(null)
  const [isGenerating, setIsGenerating] = useState(false);
  // const [taskList, setTaskList] = useState<TaskItem[]>([]);
  const [taskList, setTaskList] = useState<TaskItem[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState("");

  // 모델 관련 상태
  const [availableModels, setAvailableModels] = useState<any[]>([]);

  const [selectedTab, setSelectedTab] = useState("STYLE"); // 또는 "CHARACTER"
  const [styleModels, setStyleModels] = useState<any[]>([]);
  const [characterModels, setCharacterModels] = useState<any[]>([]);

  // 무한 스크롤 관련 상태 추가
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // 기존 상태들 아래에 추가
  const [selectedResolution, setSelectedResolution] = useState<"720p" | "480p">(
    "720p"
  );
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<
    "1:1" | "16:9" | "9:16"
  >("16:9");
  const [selectedFrames, setSelectedFrames] = useState(81);

  // taskId가 있으면 해당 영상 찾기
  const selectedTask = taskId
    ? taskList.find((item) => item.task.id.toString() === taskId.toString())
    : null;

  // 모델 목록 불러오기 - 백엔드 응답 구조에 맞게 수정
  const fetchAvailableModels = async () => {
    try {
      // STYLE 모델 조회
      const styleResponse = await api.get(
        `${config.apiUrl}/api/lora?mediaType=VIDEO&styleType=STYLE`
      );

      if (styleResponse.ok) {
        const styleData = await styleResponse.json();
        const styleModels = styleData.data || styleData; // 백엔드 응답 구조에 따라 처리
        setStyleModels(styleModels);
        console.log("🎨 Style Models API Response:", styleData);
        console.log("🎨 Style Models Array:", styleModels);
        if (styleModels.length > 0) {
          console.log("🎨 First Style Model Structure:", styleModels[0]);
        }
      }

      // CHARACTER 모델 조회
      const characterResponse = await api.get(
        `${config.apiUrl}/api/lora?mediaType=VIDEO&styleType=CHARACTER`
      );

      if (characterResponse.ok) {
        const characterData = await characterResponse.json();
        const characterModels = characterData.data || characterData;
        setCharacterModels(characterModels);
        console.log("👤 Character Models API Response:", characterData);
        console.log("👤 Character Models Array:", characterModels);
        if (characterModels.length > 0) {
          console.log("👤 First Character Model Structure:", characterModels[0]);
        }
      }

      // 전체 모델 목록 설정 (현재 탭에 따라)
      const currentModels =
        selectedTab === "STYLE" ? styleModels : characterModels;
      setAvailableModels(currentModels);
    } catch (error) {
      console.error("❌ 모델 목록 로드 실패:", error);
    }
  };

  // ref들
  const taskListRef = useRef<TaskItem[]>([]);
  const loadingRef = useRef(false);
  const nextCursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);

  // 상태 동기화
  useEffect(() => {
    hasMoreRef.current = hasMore;
    taskListRef.current = taskList;
  }, [hasMore, taskList]);

  // 무한 스크롤 핸들러
  useEffect(() => {
    const handleScroll = () => {
      if (loadingRef.current || !hasMoreRef.current) {
        return;
      }

      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const threshold = 150;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - threshold;

      if (isNearBottom) {
        console.log("🚀 무한 스크롤 트리거!");
        fetchTaskList(false);
      }
    };

    let timeoutId: NodeJS.Timeout; // 타입 명시
    const debouncedHandleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 100);
    };

    window.addEventListener("scroll", debouncedHandleScroll, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("scroll", debouncedHandleScroll);
    };
  }, []);

  // fetchTaskList - 백엔드 응답 구조에 맞게 수정
  const fetchTaskList = useCallback(async (reset = false) => {
    if (loadingRef.current) {
      console.log("❌ 이미 로딩 중이므로 요청 무시");
      return;
    }

    loadingRef.current = true;
    setLoading(true);

    try {
      console.log("🔄 Task list 새로고침 중...");

      const size = reset ? "8" : "6";
      const params = new URLSearchParams({ size });

      const currentCursor = nextCursorRef.current;
      if (!reset && currentCursor) {
        params.append("nextPageCursor", currentCursor);
        console.log(
          "📝 현재 커서 전달:",
          typeof currentCursor === "string"
            ? currentCursor.substring(0, 30) + "..."
            : currentCursor
        );
      }

      const url = `${config.apiUrl}/api/videos/task?${params}`;
      console.log("📡 API 요청 URL:", url);

      const res = await api.get(url);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      // 백엔드 응답 구조에 맞게 파싱
      const backendResponse: BackendResponse<TaskListData> = await res.json();
      console.log("📦 전체 응답:", backendResponse);

      // 데이터가 null인 경우 처리
      if (!backendResponse.data) {
        console.log("⚠️ data가 null입니다. 빈 배열로 처리");
        if (reset) {
          setTaskList([]);
          taskListRef.current = [];
        }
        setHasMore(false);
        hasMoreRef.current = false;
        return;
      }

      const content = backendResponse.data.content || [];
      console.log("📋 받은 데이터 개수:", content.length);
      console.log(
        "📋 받은 데이터 ID들:",
        content.map((item) => item.task.id)
      );

      if (reset) {
        console.log("🔄 Reset: 전체 교체");
        taskListRef.current = content;
        setTaskList(content);
      } else {
        console.log("➕ Append: 기존 데이터에 추가");
        const existingIds = new Set(taskListRef.current.map((t) => t.task.id));
        const newItems = content.filter(
          (item) => !existingIds.has(item.task.id)
        );

        console.log("🔍 실제 추가될 새 항목:", newItems.length, "개");

        if (newItems.length === 0 && content.length > 0) {
          console.warn("⚠️ 중복 데이터 - hasMore를 false로 설정");
          setHasMore(false);
          hasMoreRef.current = false;
          return;
        }

        const updatedList = [...taskListRef.current, ...newItems];
        taskListRef.current = updatedList;
        setTaskList(updatedList);
      }

      // 커서 처리
      const newNextCursor = backendResponse.data.nextPageCursor;
      console.log("🔍 새 커서:", newNextCursor ? "있음" : "없음");

      setNextCursor(newNextCursor);
      nextCursorRef.current = newNextCursor;
      setHasMore(!!newNextCursor);
      hasMoreRef.current = !!newNextCursor;

      console.log(
        "✅ Task list 업데이트 완료:",
        content.length,
        "개 항목 받음"
      );
      console.log("📊 현재 전체 taskList 길이:", taskListRef.current.length);

      // 마지막 업데이트 시간 설정
      setLastFetchTime(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("❌ " + t("error.title") + ":", error);
      setHasMore(false);
      hasMoreRef.current = false;
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  // 비디오 정보 계산 유틸리티 함수들
  const calculateAspectRatio = (width: number, height: number): string => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(width, height);
    const ratioWidth = width / divisor;
    const ratioHeight = height / divisor;
    
    // 일반적인 비율들 체크
    if (ratioWidth === ratioHeight) return "1:1";
    if (ratioWidth === 16 && ratioHeight === 9) return "16:9";
    if (ratioWidth === 9 && ratioHeight === 16) return "9:16";
    if (ratioWidth === 4 && ratioHeight === 3) return "4:3";
    if (ratioWidth === 3 && ratioHeight === 4) return "3:4";
    
    // 그 외의 경우 계산된 비율 반환
    return `${ratioWidth}:${ratioHeight}`;
  };

  const calculateDuration = (numFrames: number): string => {
    // 일반적으로 20 FPS 기준으로 계산 (백엔드 설정에 따라 다를 수 있음)
    // 81 frames = ~4s, 121 frames = ~6s 패턴으로 보임
    if (numFrames <= 81) return "4s";
    if (numFrames <= 101) return "6s";
    
    // 더 정확한 계산이 필요한 경우
    const fps = 20; // 추정 FPS (실제 백엔드 설정 확인 필요)
    const seconds = Math.round(numFrames / fps);
    return `${seconds}s`;
  };

  const getResolutionLabel = (width: number, height: number): string => {
    const minDimension = Math.min(width, height);
    if (minDimension >= 720) return "720p";
    if (minDimension >= 480) return "480p";
    return `${width}x${height}`;
  };

  // aspect ratio에 따른 width, height 계산 함수
  const getVideoDimensions = (aspectRatio: string, quality: string) => {
    const isHD = quality === "720p";
    switch (aspectRatio) {
      case "1:1":
        return { width: isHD ? 720 : 480, height: isHD ? 720 : 480 };
      case "16:9":
        return { width: isHD ? 1280 : 854, height: isHD ? 720 : 480 };
      case "9:16":
        return { width: isHD ? 720 : 480, height: isHD ? 1280 : 854 };
      default:
        return { width: isHD ? 1280 : 854, height: isHD ? 720 : 480 };
    }
  };

  // 이미지 크기를 가져오는 유틸리티 함수
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // 이미지 크기를 품질 설정에 맞게 조정하는 함수
  const calculateScaledDimensions = (
    originalWidth: number,
    originalHeight: number,
    quality: string
  ) => {
    const targetSize = quality === "720p" ? 720 : 480;
    const minDimension = Math.min(originalWidth, originalHeight);
    
    // 더 작은 차원을 목표 크기로 맞추고 비율을 유지
    const scale = targetSize / minDimension;
    const scaledWidth = Math.round(originalWidth * scale);
    const scaledHeight = Math.round(originalHeight * scale);
    
    return { width: scaledWidth, height: scaledHeight };
  };

  // VideoGenerationUI에서 사용할 새로운 핸들러
  const handleVideoGeneration = async (
    prompt: string,
    mode: GenerationMode,
    options: VideoOptions,
    uploadedImageFile?: File
  ) => {
    setIsGenerating(true);

    // Get lora model with fallback
    const selectedLoraModel = options.style || options.character;
    
    const tempId = Date.now();
    // Calculate dimensions for optimistic task
    let tempWidth: number, tempHeight: number, tempFrames: number;
    
    if (mode === "i2v" && uploadedImageFile) {
      const imageDimensions = await getImageDimensions(uploadedImageFile);
      const scaledDimensions = calculateScaledDimensions(
        imageDimensions.width,
        imageDimensions.height,
        options.quality
      );
      tempWidth = scaledDimensions.width;
      tempHeight = scaledDimensions.height;
    } else {
      const dimensions = getVideoDimensions(options.aspectRatio, options.quality);
      tempWidth = dimensions.width;
      tempHeight = dimensions.height;
    }
    
    tempFrames = options.duration === 4 ? 81 : 101;

    const optimisticTask: TaskItem = {
      type: "video",
      task: {
        id: tempId,
        prompt: prompt,
        lora: selectedLoraModel?.name || "studio ghibli style",
        imageUrl: null,
        height: tempHeight,
        width: tempWidth,
        numFrames: tempFrames,
        status: "IN_PROGRESS",
        runpodId: null,
        createdAt: new Date().toISOString(),
      },
      image: null,
    };

    setTaskList((prev) => [optimisticTask, ...prev]);

    try {
      const endpoint =
        mode === "t2v" ? "/api/videos/create/t2v" : "/api/videos/create/i2v";

      let width: number, height: number;
      
      // i2v의 경우 업로드된 이미지 크기를 기반으로 계산
      if (mode === "i2v" && uploadedImageFile) {
        const imageDimensions = await getImageDimensions(uploadedImageFile);
        const scaledDimensions = calculateScaledDimensions(
          imageDimensions.width,
          imageDimensions.height,
          options.quality
        );
        width = scaledDimensions.width;
        height = scaledDimensions.height;
        
        console.log(`📏 Original image: ${imageDimensions.width}x${imageDimensions.height}`);
        console.log(`📏 Scaled for ${options.quality}: ${width}x${height}`);
      } else {
        // t2v의 경우 기존 로직 사용
        const dimensions = getVideoDimensions(options.aspectRatio, options.quality);
        width = dimensions.width;
        height = dimensions.height;
      }

      const frames =
        options.duration === 4 ? 81 : 101;

      // Get lora ID with fallback to default (1 is Studio Ghibli based on API response)
      const loraId = selectedLoraModel?.id || 1; // Default to Studio Ghibli (id: 1)

      let response: Response;

      if (mode === "i2v" && uploadedImageFile) {
        const formData = new FormData();
        formData.append("image", uploadedImageFile);
        formData.append(
          "request",
          JSON.stringify({
            loraId: loraId,
            prompt: prompt,
            width: width,
            height: height,
            numFrames: frames,
          })
        );
        
        response = await api.postForm(`${config.apiUrl}${endpoint}`, formData);
      } else {
        const requestData = {
          prompt: prompt,
          loraId: loraId,
          width: width,
          height: height,
          numFrames: frames,
        };
        
        response = await api.post(`${config.apiUrl}${endpoint}`, requestData);
      }

      if (response.ok) {
        const backendResponse: BackendResponse<any> = await response.json();
        console.log("✅ 비디오 생성 요청 성공!", backendResponse);

        // Unlock the input immediately after successful submission
        setIsGenerating(false);

        // const checkInterval = setInterval(() => {
        //   console.log("🔄 상태 확인을 위해 fetchTaskList 호출");
        //   fetchTaskList(true);
        // }, 5000);

        // setTimeout(() => {
        //   clearInterval(checkInterval);
        //   console.log("⏰ 주기적 확인 중단");
        // }, 30000);
      } else {
        console.error("❌ API 요청 실패:", response.statusText);
        
        // Handle different error status codes
        if (response.status === 500) {
          toast.error(t("toast.serverError"));
        } else if (response.status === 400) {
          toast.error(t("toast.invalidRequest"));
        } else if (response.status === 401) {
          toast.error(t("toast.authFailed"));
        } else {
          toast.error(`Video generation failed (Error ${response.status}). Please try again.`);
        }
        
        setTaskList((prev) => prev.filter((task) => task.task.id !== tempId));
        setIsGenerating(false);
      }
    } catch (e) {
      console.error("❌ 네트워크 에러:", e);
      toast.error(t("toast.networkError"));
      setTaskList((prev) => prev.filter((task) => task.task.id !== tempId));
      setIsGenerating(false);
    }
  };


  // 초기 데이터 로드
  useEffect(() => {
    if (isLoggedIn) {
      console.log("🚀 초기 데이터 로드 시작");
      fetchTaskList(true);
      fetchAvailableModels();
      console.log("✅ 초기 로딩 완료");
    }
  }, [isLoggedIn]);

  // 탭 변경 시 모델 목록 업데이트
  useEffect(() => {
    const currentModels =
      selectedTab === "STYLE" ? styleModels : characterModels;
    setAvailableModels(currentModels);
  }, [selectedTab, styleModels, characterModels]);

  // SSE 알림을 받았을 때 새로고침 처리를 위한 이벤트 리스너
  useEffect(() => {
    const handleVideoCompleted = () => {
      console.log(
        "🎬 Create 페이지: 비디오 생성 완료 알림 받음! 데이터 새로고침..."
      );
      fetchTaskList(true);
      setIsGenerating(false);
    };

    const handleImageCompleted = () => {
      console.log(
        "🖼️ Create 페이지: 이미지 생성 완료 알림 받음! 데이터 새로고침..."
      );
      fetchTaskList(true);
      setIsGenerating(false);
    };

    const handleUpscaleCompleted = () => {
      console.log(
        "⬆️ Create 페이지: 업스케일 완료 알림 받음! 데이터 새로고침..."
      );
      fetchTaskList(true);
      setIsGenerating(false);
    };

    // 윈도우 이벤트 리스너 등록
    window.addEventListener("videoCompleted", handleVideoCompleted);
    window.addEventListener("imageCompleted", handleImageCompleted);
    window.addEventListener("upscaleCompleted", handleUpscaleCompleted);

    return () => {
      // cleanup
      window.removeEventListener("videoCompleted", handleVideoCompleted);
      window.removeEventListener("imageCompleted", handleImageCompleted);
      window.removeEventListener("upscaleCompleted", handleUpscaleCompleted);
    };
  }, [fetchTaskList]);

  const handleMediaClick = (clickedItem: TaskItem) => {
    router.push(`/create/videos?taskId=${clickedItem.task.id}`);
  };

  const handleCopyPrompt = async (item: TaskItem) => {
    try {
      await navigator.clipboard.writeText(item.task.prompt);
      console.log("Copied prompt:", item.task.prompt);
      toast.success(t("toast.promptCopied"));
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error(t("toast.copyFailed"));
    }
  };

  const handleDownload = async (item: TaskItem) => {
    if (!item.image?.url) return;

    try {
      console.log("Starting download for task:", item.task.id);
      
      // Use the download API route with the video URL
      const filename = `video-${item.task.id}.mp4`;
      const downloadApiUrl = `/api/download?url=${encodeURIComponent(item.image.url)}&filename=${encodeURIComponent(filename)}`;
      
      const link = document.createElement('a');
      link.href = downloadApiUrl;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log("✅ Download initiated for task:", item.task.id);
      toast.success(t("toast.downloadStarted"));
      
    } catch (error) {
      console.error("❌ Download failed:", error);
      toast.error(t("toast.downloadFailed"));
    }
  };

  const handleDelete = async (item: TaskItem) => {
    // Confirmation dialog
    const shortPrompt = item.task.prompt.length > 50 ? item.task.prompt.substring(0, 50) + '...' : item.task.prompt;
    if (!confirm(t("delete.confirm") + "\n\n" + shortPrompt)) {
      return;
    }

    try {
      console.log("Deleting task:", item.task.id);
      
      const response = await api.delete(`${config.apiUrl}/api/videos/${item.task.id}`);
      
      if (response.ok) {
        // Remove from local state immediately
        setTaskList((prev) => prev.filter((task) => task.task.id !== item.task.id));
        
        toast.success(t("delete.success"));
        console.log("✅ Successfully deleted task:", item.task.id);
        
        // Refresh the list to ensure consistency
        fetchTaskList(true);
      } else {
        throw new Error(`Delete failed: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Delete failed:", error);
      
      // Check if it's a constraint violation error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('constraint') || errorMessage.includes('foreign key')) {
        toast.error(t("delete.constraintError"));
      } else {
        toast.error(t("delete.failed"));
      }
    }
  };

  const handleEnhancePrompt = async (prompt: string, selections: VideoOptions): Promise<string> => {
    console.log("Enhancing prompt:", prompt);
    
    try {
      // Get the selected lora model
      const selectedLoraModel = selections.style || selections.character;
      
      // Build request payload - only include loraId if a lora model is selected
      const requestPayload: any = {
        prompt: prompt
      };
      
      if (selectedLoraModel?.id) {
        requestPayload.loraId = selectedLoraModel.id;
        console.log("Using lora ID:", selectedLoraModel.id, "for prompt:", prompt);
      } else {
        console.log("No lora model selected, enhancing prompt without loraId");
      }
      
      const response = await api.post(`${config.apiUrl}/api/lora`, requestPayload);
      
      if (response.ok) {
        const backendResponse: BackendResponse<string> = await response.json();
        console.log("✅ Prompt enhanced successfully!", backendResponse);
        
        // Return the enhanced prompt from the response
        return backendResponse.data || prompt; // Fallback to original prompt if data is null
      } else {
        console.error("❌ API request failed:", response.statusText);
        throw new Error(`Failed to enhance prompt: ${response.statusText}`);
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      throw new Error("Failed to enhance prompt");
    }
  };

  const handleCloseModal = () => {
    // URL에서 taskId 제거
    router.push("/create/videos");
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">{t("loginRequired")}</p>
      </div>
    );
  }

  return (
    <>
      <VideoList
        taskList={taskList}
        loading={loading}
        hasMore={hasMore}
        onVideoClick={handleMediaClick}
        onCopyPrompt={handleCopyPrompt}
        onDownload={handleDownload}
        onDelete={handleDelete}
      />
      <VideoGenerationChatBar
        onSubmit={handleVideoGeneration}
        isGenerating={isGenerating}
        availableModels={availableModels}
        styleModels={styleModels}
        characterModels={characterModels}
        onEnhancePrompt={handleEnhancePrompt}
      />
      {/* ✅ URL 기반 모달 */}
      {selectedTask && (() => {
        // 디버깅을 위한 콘솔 로그
        console.log("🎬 Selected Task Data:", selectedTask);
        console.log("📏 Task width:", selectedTask.task.width);
        console.log("📏 Task height:", selectedTask.task.height);
        console.log("⏱️ Task numFrames:", selectedTask.task.numFrames);
        
        const aspectRatio = calculateAspectRatio(selectedTask.task.width, selectedTask.task.height);
        const duration = calculateDuration(selectedTask.task.numFrames);
        const resolution = getResolutionLabel(selectedTask.task.width, selectedTask.task.height);
        
        console.log("🎯 Calculated aspect ratio:", aspectRatio);
        console.log("🎯 Calculated duration:", duration);
        console.log("🎯 Calculated resolution:", resolution);
        
        return (
          <VideoResultModal
            isOpen={true}
            onClose={handleCloseModal}
            videoResult={{
              src: selectedTask.image?.url || "",
              prompt: selectedTask.task.prompt,
              inputImageUrl: selectedTask.task.imageUrl || undefined,
              parameters: {
                "Aspect Ratio": aspectRatio,
                Duration: duration,
                Style: selectedTask.task.lora,
                Resolution: resolution,
                "Task ID": selectedTask.task.id.toString(),
                "Created At": new Date(
                  selectedTask.task.createdAt
                ).toLocaleDateString(),
              },
            }}
          />
        );
      })()}
    </>
  );
}
