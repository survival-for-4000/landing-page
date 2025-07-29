
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Heart,
  Share2,
  Download,
  MoreHorizontal,
  Grid3X3,
  List,
  Filter,
  Loader2,
  Video,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { ModernVideoCard } from "@/components/ModernVideoCard";
import { config } from "@/config";
import VideoPopup from "@/components/VideoPopup";
import { useTranslations } from "next-intl";

// 백엔드 응답에 맞게 수정된 MediaItem
interface MediaItem {
  id: number;
  url: string;
  index: number;
  createdAt: string;
}

// 백엔드 응답 구조에 맞게 수정
interface BackendResponse {
  timestamp: string;
  statusCode: number;
  message: string;
  data: {
    content: MediaItem[];
    previousPageCursor: string | null;
    nextPageCursor: string | null;
  };
}

export default function LibraryPage() {
  const t = useTranslations("Library");
  const { isLoggedIn, userName } = useAuth();

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState("all");
  const [isVideoPopupOpen, setIsVideoPopupOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState("");

  const nextCursorRef = useRef<string | null>(null);

  const fetchMediaItems = useCallback(
    async (reset = false, cursor: string | null = null) => {
      if (loading) return;

      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("size", "24");

        if (!reset && cursor) {
          params.set("nextPageCursor", cursor);
        }

        const response = await fetch(
          `${config.apiUrl}/api/images/mypage?${params.toString()}`,
          {
            credentials: "include",
          },
        );

        if (!response.ok) throw new Error("Failed to fetch media");

        // 백엔드 응답 구조에 맞게 수정
        const backendResponse: BackendResponse = await response.json();
        const data = backendResponse.data; // data 필드에서 실제 데이터 추출

        if (reset) {
          setMediaItems(data.content);
        } else {
          setMediaItems((prev) => [...prev, ...data.content]);
        }

        setNextCursor(data.nextPageCursor);
        nextCursorRef.current = data.nextPageCursor;
        setHasMore(!!data.nextPageCursor);
      } catch (error) {
        console.error("❌ " + t("errors.loadFailed") + ":", error);
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  const handleScroll = useCallback(() => {
    if (loading || !hasMore || !nextCursorRef.current) return;

    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - 1000) {
      fetchMediaItems(false, nextCursorRef.current);
    }
  }, [loading, hasMore, fetchMediaItems]);

  useEffect(() => {
    if (isLoggedIn) {
      nextCursorRef.current = null;
      fetchMediaItems(true, null);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // 비디오 팝업 열기
  const openVideoPopup = (item: MediaItem) => {
    if (isVideo(item.url)) {
      setCurrentVideo(item.url);
      setIsVideoPopupOpen(true);
    }
  };

  // 비디오 팝업 닫기
  const closeVideoPopup = () => {
    setIsVideoPopupOpen(false);
    setCurrentVideo("");
  };

  // 필터링된 아이템들
  const filteredItems = mediaItems.filter((item) => {
    const matchesFilter =
      filterType === "all" ||
      (filterType === "video" && item.url.includes(".mp4")) ||
      (filterType === "image" && !item.url.includes(".mp4"));

    return matchesFilter;
  });

  // API에서 이미 ID 순서로 정렬되어 오므로 클라이언트 정렬 불필요
  const sortedItems = filteredItems;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isVideo = (url: string) => url.includes(".mp4");

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">{t("loginRequired")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {t("title")}
              </h1>
              <p className="text-muted-foreground">{t("subtitle")}</p>
            </div>
            <Badge variant="secondary" className="text-sm">
              {t("stats.total", { count: mediaItems.length })}
            </Badge>
          </div>

          {/* 필터 */}
          <div className="flex justify-end">
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.all")}</SelectItem>
                  <SelectItem value="video">{t("filters.video")}</SelectItem>
                  <SelectItem value="image">{t("filters.image")}</SelectItem>
                </SelectContent>
              </Select>


              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-1 py-1">
        {sortedItems.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">
              {t("empty.title")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("empty.subtitle")}
            </p>
          </div>
        ) : (
          <>
            {/* 그리드 뷰 */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {sortedItems.map((item) => (
                  <div key={item.id} className="group">
                    {isVideo(item.url) ? (
                      <div 
                        className="relative overflow-hidden bg-black rounded-lg cursor-pointer group hover:scale-[1.02] transition-all duration-300"
                        onClick={() => openVideoPopup(item)}
                      >
                        <video
                          src={item.url}
                          className="w-full h-auto object-contain"
                          muted
                          loop
                          playsInline
                          onMouseEnter={(e) => e.currentTarget.play()}
                          onMouseLeave={(e) => e.currentTarget.pause()}
                        />
                        
                      </div>
                    ) : (
                      <div className="relative overflow-hidden bg-secondary rounded-lg cursor-pointer group hover:scale-[1.02] transition-all duration-300">
                        <img
                          src={item.url}
                          alt={`Image ${item.id}`}
                          className="w-full h-auto object-contain"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 리스트 뷰 */}
            {viewMode === "list" && (
              <div className="space-y-4">
                {sortedItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-card rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        {isVideo(item.url) ? (
                          <video
                            src={item.url}
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <img
                            src={item.url}
                            alt={`Image ${item.id}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-foreground line-clamp-1">
                            {isVideo(item.url) ? t("filters.video") : t("filters.image")}
                          </h3>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <Badge variant="outline" className="text-xs">
                            {isVideo(item.url) ? (
                              <>
                                <Video className="w-3 h-3 mr-1" />
                                {t("filters.video")}
                              </>
                            ) : (
                              <>
                                <ImageIcon className="w-3 h-3 mr-1" />
                                {t("filters.image")}
                              </>
                            )}
                          </Badge>
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Heart className="w-4 h-4 mr-1" />
                            {t("actions.like")}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share2 className="w-4 h-4 mr-1" />
                            {t("actions.share")}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4 mr-1" />
                            {t("actions.download")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 로딩 표시 */}
            {loading && (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t("loading")}</span>
                </div>
              </div>
            )}

            {/* 더 이상 데이터가 없을 때 */}
            {!hasMore && sortedItems.length > 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t("allLoaded")}</p>
              </div>
            )}
          </>
        )}
      </div>

      <VideoPopup
        isOpen={isVideoPopupOpen}
        onClose={closeVideoPopup}
        videoSrc={currentVideo}
      />
    </div>
  );
}
