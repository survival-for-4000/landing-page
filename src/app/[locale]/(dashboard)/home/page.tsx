"use client";

import React, { useState, useEffect } from "react";
import { Play, X } from "lucide-react";
import { useTranslations } from "next-intl";
import VideoPopup from "@/components/VideoPopup";

interface Work {
  id: number;
  title: string;
  description: string;
  image_url: string;
  video_url: string;
  user_info: string;
  created_at: string;
}

const HomePage: React.FC = () => {
  const t = useTranslations("HomePage");
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Work | null>(null);
  const [isVideoPopupOpen, setIsVideoPopupOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState("");

  // 번역된 배너 텍스트
  const bannerTexts = [t("banner.createAnimation"), t("banner.createImages")];
  const [currentBannerTextIndex, setCurrentBannerTextIndex] = useState(0);

  // 배너 텍스트 순환
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerTextIndex(
        (prevIndex) => (prevIndex + 1) % bannerTexts.length,
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [bannerTexts.length]);

  // DB에서 작품 데이터 가져오기
  useEffect(() => {
    const fetchWorks = async () => {
      try {
        const response = await fetch("/api/works");
        if (response.ok) {
          const data = await response.json();
          setWorks(data);
        } else {
          console.error("Failed to fetch works");
        }
      } catch (error) {
        console.error("Error fetching works:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorks();
  }, []);

  // VideoPopup 열기
  const openVideoPopup = (work: Work) => {
    if (work.video_url) {
      setCurrentVideoUrl(work.video_url);
      setIsVideoPopupOpen(true);
    }
  };

  // 기존 모달 열기 (호환성 유지)
  const openVideoModal = (work: Work) => {
    if (work.video_url) {
      setSelectedVideo(work);
    }
  };

  // VideoPopup 닫기
  const closeVideoPopup = () => {
    setIsVideoPopupOpen(false);
    setCurrentVideoUrl("");
  };

  // 기존 모달 닫기 (호환성 유지)
  const closeVideoModal = () => {
    setSelectedVideo(null);
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeVideoModal();
      }
    };

    if (selectedVideo) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // 스크롤 방지
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [selectedVideo]);

  return (
    <div className="p-10 bg-background">
      {/* Hero Section - 3개 박스 */}
      <section className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-10 lg:mb-12">
        {/* 상단 박스 (전체 너비) */}
        <div className="md:col-span-2 relative aspect-[16/9] rounded-xl overflow-hidden shadow-2xl">
          <video
            src="https://hoit-landingpage.han1000llm.workers.dev/landingpage_video/tomato_00523.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4 md:p-6 lg:p-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
              {t("hero.consistentCharacter")}
            </h2>
          </div>
        </div>

        {/* 하단 왼쪽 박스 */}
        <div className="relative aspect-[16/9] rounded-xl overflow-hidden shadow-2xl">
          <video
            src="https://hoit-landingpage.han1000llm.workers.dev/landingpage_video/tomato_00582.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4 md:p-6">
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
              {t("hero.unifiedStyle")}
            </h3>
          </div>
        </div>

        {/* 하단 오른쪽 박스 */}
        <div className="relative aspect-[16/9] rounded-xl overflow-hidden shadow-2xl">
          <video
            src="https://hoit-landingpage.han1000llm.workers.dev/landingpage_video/tomato_00467.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4 md:p-6">
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
              {t("hero.continuousStories")}
            </h3>
          </div>
        </div>
      </section>

      {/* Works Grid */}
      <section className="max-w-6xl mx-auto">
        <h3 className="text-3xl font-bold mb-8 text-foreground">
          {t("explore.title")}
        </h3>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg text-muted-foreground">{t("explore.loading")}</div>
          </div>
        ) : works.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-lg text-muted-foreground">{t("explore.noWorks")}</div>
          </div>
        ) : (
          /* Masonry Grid */
          <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-4 gap-4 space-y-4">
            {works.map((work, index) => {
              // 랜덤 높이 생성
              // const heights = ["h-48", "h-64", "h-80", "h-56", "h-72", "h-44"];
              // const randomHeight = heights[index % heights.length];

              // 이미지 또는 비디오가 있는지 확인
              const hasImage = work.image_url;
              const hasVideo = work.video_url;
              const mediaUrl = hasImage
                ? work.image_url
                : hasVideo
                  ? work.video_url
                  : null;

              if (!mediaUrl) return null;

              return (
                <div
                  key={work.id}
                  className={`bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 group border border-border break-inside-avoid mb-4 cursor-pointer`}
                  onClick={() => hasVideo && openVideoPopup(work)}
                  onMouseEnter={() => {
                    if (hasVideo && !hasImage) {
                      const video = document.getElementById(
                        `video-${work.id}`,
                      ) as HTMLVideoElement;
                      if (video) {
                        video.play().catch(() => {
                          // 자동재생 실패시 무시
                        });
                      }
                    }
                  }}
                  onMouseLeave={() => {
                    if (hasVideo && !hasImage) {
                      const video = document.getElementById(
                        `video-${work.id}`,
                      ) as HTMLVideoElement;
                      if (video) {
                        video.pause();
                        video.currentTime = 0;
                      }
                    }
                  }}
                >
                  <div className="relative w-full h-full">
                    {hasImage ? (
                      // 이미지 표시
                      <img
                        src={work.image_url}
                        alt={work.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      // 비디오 표시 (호버 시 재생)
                      <video
                        id={`video-${work.id}`}
                        src={work.video_url}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        muted
                        loop
                        playsInline
                      />
                    )}

                    {/* 호버 오버레이 */}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {hasVideo && (
                        <div className="text-white text-sm font-medium">
                          Click to play
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* VideoPopup */}
      <VideoPopup
        isOpen={isVideoPopupOpen}
        onClose={closeVideoPopup}
        videoSrc={currentVideoUrl}
      />
    </div>
  );
};

export default HomePage;
