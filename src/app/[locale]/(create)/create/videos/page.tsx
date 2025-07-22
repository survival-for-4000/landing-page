// "use client";

// import React, { useEffect, useState, useCallback, useRef } from "react";
// import {
//   RotateCcw,
//   MoreHorizontal,
//   ArrowUpRight,
//   ArrowUp,
//   Loader2,
//   Sparkles,
//   Check,
//   Wifi,
//   WifiOff,
//   Settings,
// } from "lucide-react";
// import { Heart, Share2, Download } from "lucide-react";
// // import React, { useEffect, useState, useCallback } from "react";
// import { Button } from "@/components/ui/button";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { useAuth } from "@/hooks/useAuth";
// import { useSSE } from "@/components/SSEProvider";
// import { ModernVideoCard } from "@/components/ModernVideoCard";
// import { config } from "@/config";

// export default function CreatePage() {
//   const { isLoggedIn, userName, memberId } = useAuth();
//   const { lastNotification, isConnected, notifications } = useSSE();

//   const listRef = useRef(null);

//   const [prompt, setPrompt] = useState("");
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [taskList, setTaskList] = useState([]);
//   const [lastFetchTime, setLastFetchTime] = useState("");

//   // 모델 관련 상태
//   const [availableModels, setAvailableModels] = useState([]);
//   const [selectedModel, setSelectedModel] = useState("");
//   const [isPopoverOpen, setIsPopoverOpen] = useState(false);
//   const [tempModel, setTempModel] = useState("");

//   // 현재 RadioGroup 대신 선택된 모델 객체 전체를 저장
//   const [selectedModelData, setSelectedModelData] = useState(null);
//   const [tempSelectedModel, setTempSelectedModel] = useState(null);

//   const [selectedTab, setSelectedTab] = useState("STYLE"); // 또는 "CHARACTER"
//   const [styleModels, setStyleModels] = useState([]);
//   const [characterModels, setCharacterModels] = useState([]);

//   // 모달 관련 상태 추가
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
//   const [allMediaItems, setAllMediaItems] = useState([]);

//   // 무한 스크롤 관련 상태 추가
//   const [loading, setLoading] = useState(false);
//   const [hasMore, setHasMore] = useState(true);
//   const [nextCursor, setNextCursor] = useState(null);

//   // 모델 목록 불러오기
//   // 두 개의 API를 모두 호출하도록 변경
//   const fetchAvailableModels = async () => {
//     try {
//       // STYLE 모델 조회
//       const styleResponse = await fetch(
//         `${config.apiUrl}/api/lora?mediaType=VIDEO&styleType=STYLE`,
//         { credentials: "include" }
//       );
//       const styleModels = await styleResponse.json();
//       setStyleModels(styleModels);

//       // CHARACTER 모델 조회
//       const characterResponse = await fetch(
//         `${config.apiUrl}/api/lora?mediaType=VIDEO&styleType=CHARACTER`,
//         { credentials: "include" }
//       );
//       const characterModels = await characterResponse.json();
//       setCharacterModels(characterModels);

//       // 전체 모델 목록 설정 (현재 탭에 따라)
//       const currentModels =
//         selectedTab === "STYLE" ? styleModels : characterModels;
//       setAvailableModels(currentModels);

//       // 기본값 설정 로직도 수정 필요
//     } catch (error) {
//       console.error("❌ 모델 목록 로드 실패:", error);
//     }
//   };

//   // 🔥 커서 디코딩 및 백엔드 문제 확인 도구
//   const debugCursor = (cursor) => {
//     if (!cursor) return "커서 없음";

//     try {
//       const decoded = atob(cursor);
//       const parts = decoded.split(" - ");

//       if (parts.length === 2) {
//         const baseTime = parts[0].replace(/###/g, "");
//         const requestTime = parts[1];

//         return {
//           raw: decoded,
//           baseTime: new Date(baseTime).toISOString(),
//           requestTime: new Date(requestTime).toISOString(),
//           baseTimeKST: new Date(baseTime).toLocaleString("ko-KR"),
//           requestTimeKST: new Date(requestTime).toLocaleString("ko-KR"),
//         };
//       }
//     } catch (e) {
//       return "디코딩 실패: " + e.message;
//     }
//   };

//   // 🔥 수정된 fetchTaskList - useRef로 최신 상태 참조
//   const taskListRef = useRef([]);
//   const loadingRef = useRef(false);

//   // 🔥 문제 해결: nextCursor를 ref로 관리
//   const nextCursorRef = useRef(null);

//   const hasMoreRef = useRef(true);

//   // 2. hasMore 상태 변경 시 ref 동기화
//   useEffect(() => {
//     hasMoreRef.current = hasMore;
//     console.log("🔄 hasMore ref 업데이트:", hasMore);
//   }, [hasMore]);

//   // 3. 스크롤 이벤트 리스너 단순화 (의존성 배열 비우기)
//   useEffect(() => {
//     const handleScroll = () => {
//       // ref로 최신 상태 확인
//       if (loadingRef.current || !hasMoreRef.current) {
//         console.log("❌ 스크롤 무시:", {
//           loading: loadingRef.current,
//           hasMore: hasMoreRef.current,
//           taskListLength: taskListRef.current.length,
//         });
//         return;
//       }

//       const scrollTop = document.documentElement.scrollTop;
//       const scrollHeight = document.documentElement.scrollHeight;
//       const clientHeight = document.documentElement.clientHeight;

//       // 더 민감하게 - 하단 150px 지점에서 트리거
//       const threshold = 150;
//       const isNearBottom = scrollTop + clientHeight >= scrollHeight - threshold;

//       console.log("📏 스크롤 상태:", {
//         scrollTop: Math.round(scrollTop),
//         scrollHeight: Math.round(scrollHeight),
//         clientHeight: Math.round(clientHeight),
//         remainingDistance: Math.round(scrollHeight - scrollTop - clientHeight),
//         threshold,
//         isNearBottom,
//         loading: loadingRef.current,
//         hasMore: hasMoreRef.current,
//         taskListLength: taskListRef.current.length,
//       });

//       if (isNearBottom) {
//         console.log(
//           "🚀 무한 스크롤 트리거! 현재:",
//           taskListRef.current.length,
//           "개"
//         );
//         fetchTaskList(false);
//       }
//     };

//     // 디바운싱 추가하여 성능 최적화
//     let timeoutId;
//     const debouncedHandleScroll = () => {
//       clearTimeout(timeoutId);
//       timeoutId = setTimeout(handleScroll, 100);
//     };

//     window.addEventListener("scroll", debouncedHandleScroll, { passive: true });

//     return () => {
//       clearTimeout(timeoutId);
//       window.removeEventListener("scroll", debouncedHandleScroll);
//     };
//   }, []); // 🔥 의존성 배열 완전히 비우기

//   // 4. fetchTaskList에서 의존성 배열 비우기
//   const fetchTaskList = useCallback(async (reset = false) => {
//     if (loadingRef.current) {
//       console.log("❌ 이미 로딩 중이므로 요청 무시");
//       return;
//     }

//     loadingRef.current = true;
//     setLoading(true);

//     try {
//       console.log("🔄 Task list 새로고침 중...");

//       // 🔥 초기 로딩 시 더 많은 데이터 요청 (스크롤 가능하도록)
//       const size = reset ? "3" : "2"; // 첫 로딩은 5개, 이후는 3개씩
//       const params = new URLSearchParams({ size });

//       const currentCursor = nextCursorRef.current;

//       if (!reset && currentCursor) {
//         params.append("nextPageCursor", currentCursor);
//         console.log(
//           "📝 현재 커서 전달:",
//           currentCursor.substring(0, 30) + "..."
//         );
//       } else {
//         console.log(
//           "📝 첫 번째 요청 - 6개 데이터 로드하여 스크롤 가능하게 만들기"
//         );
//       }

//       const url = `${config.apiUrl}/api/videos/task?${params}`;
//       console.log("📡 API 요청 URL:", url);

//       const res = await fetch(url, { credentials: "include" });

//       if (!res.ok) {
//         throw new Error(`HTTP ${res.status}: ${res.statusText}`);
//       }

//       const json = await res.json();
//       console.log("📦 전체 응답:", json);
//       const content = json?.data?.content || [];

//       console.log(
//         "📋 받은 데이터 ID들:",
//         content.map((item) => item.task.id)
//       );

//       if (reset) {
//         console.log("🔄 Reset: 전체 교체");
//         taskListRef.current = content;
//         setTaskList(content);
//       } else {
//         console.log("➕ Append: 기존 데이터에 추가");
//         const existingIds = new Set(taskListRef.current.map((t) => t.task.id));
//         const newItems = content.filter(
//           (item) => !existingIds.has(item.task.id)
//         );

//         console.log("🔍 실제 추가될 새 항목:", newItems.length, "개");

//         if (newItems.length === 0 && content.length > 0) {
//           console.warn("⚠️ 중복 데이터 - hasMore를 false로 설정");
//           setHasMore(false);
//           hasMoreRef.current = false;
//           loadingRef.current = false;
//           setLoading(false);
//           return;
//         }

//         const updatedList = [...taskListRef.current, ...newItems];
//         taskListRef.current = updatedList;
//         setTaskList(updatedList);
//       }

//       // 새 커서 처리
//       const newNextCursor =
//         json?.data?.nextPageCursor || json?.data?.nextCursor;
//       console.log("🔍 새 커서:", newNextCursor ? "있음" : "없음");

//       setNextCursor(newNextCursor);
//       nextCursorRef.current = newNextCursor;
//       setHasMore(!!newNextCursor);
//       hasMoreRef.current = !!newNextCursor;

//       console.log(
//         "✅ Task list 업데이트 완료:",
//         content.length,
//         "개 항목 받음"
//       );
//       console.log("📊 현재 전체 taskList 길이:", taskListRef.current.length);

//       // 🔥 로딩 후 스크롤 가능 여부 체크
//       setTimeout(() => {
//         const scrollHeight = document.documentElement.scrollHeight;
//         const clientHeight = document.documentElement.clientHeight;
//         console.log("📺 로딩 후 스크롤 상태:", {
//           scrollHeight,
//           clientHeight,
//           canScroll: scrollHeight > clientHeight,
//           itemCount: taskListRef.current.length,
//         });
//       }, 100);
//     } catch (error) {
//       console.error("❌ Task list fetch failed:", error);
//       setHasMore(false);
//       hasMoreRef.current = false;
//     } finally {
//       loadingRef.current = false;
//       setLoading(false);
//     }
//   }, []);

//   // 🔥 taskList 변경 시 ref 동기화
//   useEffect(() => {
//     taskListRef.current = taskList;
//   }, [taskList]);

//   // 🔥 백엔드 개발자에게 제공할 디버깅 정보
//   const generateBackendDebugInfo = () => {
//     console.log("🔧 백엔드 개발자용 디버깅 정보:");
//     console.log("1. 현재 커서:", nextCursor);
//     console.log("2. 커서 분석:", debugCursor(nextCursor));
//     console.log("3. 현재 taskList 길이:", taskList.length);
//     console.log(
//       "4. 마지막 항목 생성시간:",
//       taskList.length > 0
//         ? taskList[taskList.length - 1].task.createdAt
//         : "없음"
//     );
//     console.log(
//       "5. 문제: 커서의 baseTime이 항상 고정되어 있어 같은 데이터만 반환됨"
//     );
//     console.log(
//       "6. 해결방안: 커서 생성 시 마지막 조회된 데이터의 createdAt을 baseTime으로 사용해야 함"
//     );
//   };

//   const handlePromptSubmit = async () => {
//     if (!prompt.trim()) return;
//     if (!selectedModel) {
//       alert("모델을 선택해주세요.");
//       return;
//     }

//     console.log("🚀 비디오 생성 요청:", prompt, "모델:", selectedModel);

//     const tempId = Date.now();
//     const optimisticTask = {
//       task: {
//         id: tempId,
//         prompt,
//         status: "IN_PROGRESS",
//       },
//       image: null,
//     };

//     setTaskList((prev) => [optimisticTask, ...prev]);
//     setIsGenerating(true);

//     try {
//       const response = await fetch(`${config.apiUrl}/api/videos/create`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify({ prompt, lora: selectedModel }),
//       });

//       console.log("📤 API 요청 완료, 응답 상태:", response.status);

//       if (response.ok) {
//         console.log("✅ 비디오 생성 요청 성공! SSE 알림 대기 중...");
//         // 실제 데이터와 동기화
//         setTimeout(() => fetchTaskList(), 1000);
//       } else {
//         console.error("❌ API 요청 실패:", response.statusText);
//       }
//     } catch (e) {
//       console.error("❌ 네트워크 에러:", e);
//       alert("요청 실패");
//       setTaskList((prev) => prev.filter((task) => task.task.id !== tempId));
//     } finally {
//       setIsGenerating(false);
//       setPrompt(""); // 프롬프트 초기화
//     }
//   };

//   // 🔥 자동 로딩 제거 - 초기에 3개만 로드하고 끝
//   useEffect(() => {
//     const initializeData = async () => {
//       console.log("🚀 초기 데이터 로드 시작");
//       await fetchTaskList(true); // 첫 번째 배치 (3개만)
//       console.log("✅ 초기 로딩 완료 - 이제 사용자가 스크롤해야 함");
//     };

//     initializeData();
//     fetchAvailableModels();
//   }, []);

//   // 🔥 디버깅용 상태 로그 강화
//   useEffect(() => {
//     console.log("📊 상태 업데이트:", {
//       loading,
//       hasMore,
//       nextCursor: nextCursor
//         ? `있음 (${nextCursor.substring(0, 20)}...)`
//         : "없음",
//       taskListLength: taskList.length,
//       taskIds: taskList.map((t) => t.task.id).slice(0, 5), // 처음 5개 ID만 표시
//     });
//   }, [loading, hasMore, nextCursor, taskList.length]);

//   useEffect(() => {
//     const currentModels =
//       selectedTab === "STYLE" ? styleModels : characterModels;
//     setAvailableModels(currentModels);
//   }, [selectedTab, styleModels, characterModels]);

//   useEffect(() => {
//     // 완료된 항목들만 필터링해서 저장
//     const completedItems = taskList.filter(
//       (item) => item.task.status === "COMPLETED" && item.image?.url
//     );
//     setAllMediaItems(completedItems);
//   }, [taskList]);

//   // SSE 알림 처리
//   useEffect(() => {
//     console.log("🔄 lastNotification 변경 감지:", lastNotification);

//     if (lastNotification) {
//       console.log("📨 새 SSE 알림 수신:", {
//         id: lastNotification.id,
//         type: lastNotification.type,
//         status: lastNotification.status,
//         message: lastNotification.message,
//       });

//       if (
//         lastNotification.status === "SUCCESS" &&
//         lastNotification.type === "video"
//       ) {
//         console.log("🎬 비디오 생성 완료! 화면 새로고침...");
//         fetchTaskList(true);
//         setIsGenerating(false);

//         // 브라우저 알림 (권한이 있다면)
//         if ("Notification" in window && Notification.permission === "granted") {
//           new Notification("비디오 생성 완료!", {
//             body: lastNotification.message,
//             icon: "/favicon.ico",
//           });
//         }
//       } else {
//         console.log("⚠️ 조건 불일치:", {
//           status: lastNotification.status,
//           type: lastNotification.type,
//           statusMatch: lastNotification.status === "SUCCESS",
//           typeMatch: lastNotification.type === "video",
//         });
//       }
//     }
//   }, [lastNotification]);

//   const handleConfirm = () => {
//     setSelectedModelData(tempSelectedModel);
//     setSelectedModel(tempSelectedModel?.modelName || "");
//     setIsPopoverOpen(false);
//   };

//   const handleCancel = () => {
//     setTempSelectedModel(selectedModelData);
//     setIsPopoverOpen(false);
//   };

//   const handleMediaClick = (clickedItem) => {
//     const completedItems = taskList.filter(
//       (item) => item.task.status === "COMPLETED" && item.image?.url
//     );
//     const index = completedItems.findIndex(
//       (item) => item.task.id === clickedItem.task.id
//     );
//     setSelectedMediaIndex(index);
//     setAllMediaItems(completedItems);
//     setIsModalOpen(true);
//   };

//   if (!isLoggedIn) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <p className="text-gray-500">로그인이 필요합니다.</p>
//       </div>
//     );
//   }

//   return (
//     <>
//       {/* SSE 상태 표시 (개발용) */}
//       <div className="fixed top-4 right-4 z-50 bg-black/80 text-white px-3 py-2 rounded-lg text-xs">
//         <div className="flex items-center gap-2">
//           {isConnected ? (
//             <>
//               <Wifi className="w-3 h-3 text-green-400" />
//               <span>SSE 연결됨 (ID: {memberId})</span>
//             </>
//           ) : (
//             <>
//               <WifiOff className="w-3 h-3 text-red-400" />
//               <span>SSE 연결 끊어짐</span>
//             </>
//           )}
//         </div>
//         {lastFetchTime && (
//           <div className="text-gray-400 mt-1">
//             마지막 업데이트: {lastFetchTime}
//           </div>
//         )}
//         <div className="text-gray-400">총 알림: {notifications.length}개</div>
//       </div>

//       <div
//         ref={listRef}
//         className="w-full p-6 space-y-6 pb-32"
//         style={{
//           minHeight: "auto",
//           height: "auto",
//           overflow: "visible",
//         }}
//       >
//         {taskList.length === 0 ? (
//           <div className="text-center py-12 text-gray-500">
//             <p>아직 생성된 영상이 없습니다.</p>
//             <p className="text-sm mt-2">
//               아래에서 프롬프트를 입력해 영상을 생성해보세요!
//             </p>
//           </div>
//         ) : (
//           taskList.map((item) => (
//             <div key={item.task.id} className="max-w-2xl mx-auto mb-25">
//               {/* 프롬프트 텍스트 */}
//               <div className="mb-4">
//                 <p className="text-gray-700 text-base leading-relaxed">
//                   {item.task.prompt}
//                 </p>
//               </div>

//               {/* 액션 버튼들 */}
//               <div className="flex items-center gap-3 mb-4">
//                 <Button
//                   variant="secondary"
//                   size="sm"
//                   className="rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
//                 >
//                   <RotateCcw className="w-4 h-4 mr-2" />
//                   Show More
//                 </Button>
//                 <Button
//                   variant="secondary"
//                   size="sm"
//                   className="rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
//                 >
//                   <Sparkles className="w-4 h-4 mr-2" />
//                   Brainstorm
//                 </Button>
//                 <Button
//                   variant="secondary"
//                   size="sm"
//                   className="rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
//                 >
//                   💬 Reply
//                 </Button>
//                 <Button variant="ghost" size="sm" className="rounded-full">
//                   <MoreHorizontal className="w-4 h-4" />
//                 </Button>
//               </div>

//               {/* 비디오/상태 표시 */}
//               {item.task.status === "IN_PROGRESS" ? (
//                 <div className="w-full aspect-video bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col items-center justify-center border-2 border-dashed border-blue-200 rounded-2xl">
//                   <div className="flex items-center space-x-3 mb-4">
//                     <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
//                     <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
//                   </div>
//                   <p className="text-sm text-gray-500">영상 생성 중...</p>
//                   <p className="text-xs text-gray-400 mt-2">
//                     SSE 알림을 기다리는 중
//                   </p>
//                 </div>
//               ) : item.task.status === "COMPLETED" && item.image?.url ? (
//                 // 기존 ModernVideoCard 부분을 이렇게 교체
//                 <div
//                   className="relative rounded-2xl overflow-hidden shadow-lg cursor-pointer group"
//                   onClick={() => handleMediaClick(item)}
//                 >
//                   <ModernVideoCard
//                     videoUrl={item.image.url}
//                     prompt={item.task.prompt}
//                     taskId={item.task.id}
//                     createdAt={item.task.createdAt}
//                     isNew={true}
//                     variant="cinematic"
//                   />
//                   {/* 호버 효과 */}
//                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
//                 </div>
//               ) : item.task.status === "FAILED" ? (
//                 <div className="w-full aspect-video bg-gradient-to-br from-red-50 to-orange-50 flex flex-col items-center justify-center border-2 border-dashed border-red-200 rounded-2xl">
//                   <div className="flex items-center space-x-3 mb-4">
//                     <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
//                       <span className="text-white text-sm font-bold">✕</span>
//                     </div>
//                   </div>
//                   <p className="text-sm text-red-600 font-medium">
//                     영상 생성 실패
//                   </p>
//                   <p className="text-xs text-red-400 mt-2">다시 시도해주세요</p>
//                 </div>
//               ) : (
//                 <div className="text-red-500 p-4 bg-red-50 rounded-2xl">
//                   <p>❌ 상태: {item.task.status}</p>
//                   <p className="text-xs mt-1">예상하지 못한 상태입니다.</p>
//                 </div>
//               )}
//             </div>
//           ))
//         )}
//       </div>

//       {/* 로딩 표시 추가 */}
//       {loading && (
//         <div className="flex justify-center py-8">
//           <div className="flex items-center gap-2 text-gray-500">
//             <Loader2 className="w-5 h-5 animate-spin" />
//             <span>더 불러오는 중...</span>
//           </div>
//         </div>
//       )}

//       {/* 더 이상 데이터가 없을 때 */}
//       {!hasMore && taskList.length > 0 && (
//         <div className="text-center py-8 text-gray-500">
//           <p>모든 콘텐츠를 불러왔습니다.</p>
//         </div>
//       )}

//       <div className="fixed bottom-0 left-0 right-0 z-50 p-6 bg-transparent sm:left-64">
//         <div className="max-w-4xl mx-auto">
//           <div className="relative">
//             <input
//               value={prompt}
//               onChange={(e) => setPrompt(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && handlePromptSubmit()}
//               placeholder="What do you want to see..."
//               className="w-full bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl px-6 py-4 text-gray-700 placeholder-gray-500 pr-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg transition-all"
//               disabled={isGenerating}
//             />
//             <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
//               {/* 모델 선택 버튼 */}
//               <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
//                 <PopoverTrigger asChild>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     className="bg-white/90 backdrop-blur-sm border-gray-200 text-gray-700 hover:bg-gray-50"
//                   >
//                     <Settings className="w-4 h-4 mr-2" />
//                     모델
//                   </Button>
//                 </PopoverTrigger>
//                 <PopoverContent
//                   className="w-[800px] max-h-[600px] p-0"
//                   align="end"
//                 >
//                   <div className="p-6">
//                     <div className="flex items-center justify-between mb-6">
//                       <h4 className="text-xl font-semibold">Choose a Model</h4>
//                       <Button variant="ghost" size="sm">
//                         <ArrowUpRight className="w-4 h-4" />
//                       </Button>
//                     </div>

//                     {/* 탭바 */}
//                     <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
//                       <button
//                         className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
//                           selectedTab === "STYLE"
//                             ? "bg-white text-black shadow-sm"
//                             : "text-gray-600 hover:text-black"
//                         }`}
//                         onClick={() => setSelectedTab("STYLE")}
//                       >
//                         All
//                       </button>
//                       <button
//                         className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
//                           selectedTab === "CHARACTER"
//                             ? "bg-white text-black shadow-sm"
//                             : "text-gray-600 hover:text-black"
//                         }`}
//                         onClick={() => setSelectedTab("CHARACTER")}
//                       >
//                         Flux
//                       </button>
//                       {/* 추가 탭들... */}
//                     </div>

//                     {/* 모델 그리드 */}
//                     <div className="grid grid-cols-5 gap-4 max-h-80 overflow-y-auto">
//                       {availableModels.map((model) => (
//                         <div
//                           key={model.modelName}
//                           className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
//                             tempSelectedModel?.modelName === model.modelName
//                               ? "border-blue-500 ring-2 ring-blue-200"
//                               : "border-transparent hover:border-gray-300"
//                           }`}
//                           onClick={() => setTempSelectedModel(model)}
//                         >
//                           <div className="aspect-[3/4] relative">
//                             <img
//                               src={model.image}
//                               alt={model.name}
//                               className="w-full h-full object-cover"
//                             />
//                             {/* 모델 타입 뱃지 */}
//                             <div className="absolute top-2 left-2">
//                               <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
//                                 {selectedTab}
//                               </span>
//                             </div>
//                             {/* New 뱃지 (필요시) */}
//                             {model.isNew && (
//                               <div className="absolute top-2 right-2">
//                                 <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
//                                   New
//                                 </span>
//                               </div>
//                             )}
//                             {/* 선택 체크마크 */}
//                             {tempSelectedModel?.modelName ===
//                               model.modelName && (
//                               <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
//                                 <div className="bg-blue-500 text-white rounded-full p-1">
//                                   <Check className="w-4 h-4" />
//                                 </div>
//                               </div>
//                             )}
//                           </div>
//                           <div className="p-3 bg-white">
//                             <h3 className="font-medium text-sm truncate">
//                               {model.name}
//                             </h3>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>

//                   {/* 하단 버튼들 */}
//                   <div className="border-t p-4 flex justify-between items-center">
//                     <div className="text-sm text-gray-600">
//                       {tempSelectedModel?.name || "No model selected"}
//                     </div>
//                     <div className="flex space-x-2">
//                       <Button variant="outline" onClick={handleCancel}>
//                         Cancel
//                       </Button>
//                       <Button
//                         onClick={handleConfirm}
//                         disabled={!tempSelectedModel}
//                       >
//                         Use Model
//                       </Button>
//                     </div>
//                   </div>
//                 </PopoverContent>
//               </Popover>

//               {/* 전송 버튼 */}
//               <button
//                 onClick={handlePromptSubmit}
//                 disabled={isGenerating || !prompt.trim()}
//                 className="bg-black text-white p-2 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {isGenerating ? (
//                   <Loader2 className="w-5 h-5 animate-spin" />
//                 ) : (
//                   <ArrowUp className="w-5 h-5" />
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//       {/* 전체화면 모달 */}
//       {isModalOpen && (
//         <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center">
//           {/* 상단 헤더 */}
//           <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
//             {/* 썸네일 네비게이션 */}
//             <div className="flex gap-2">
//               {allMediaItems.map((item, index) => (
//                 <button
//                   key={item.task.id}
//                   onClick={() => setSelectedMediaIndex(index)}
//                   className={`w-12 h-8 rounded overflow-hidden border-2 transition-colors ${
//                     selectedMediaIndex === index
//                       ? "border-white"
//                       : "border-gray-500 hover:border-gray-300"
//                   }`}
//                 >
//                   <video
//                     src={item.image.url}
//                     className="w-full h-full object-cover"
//                     muted
//                   />
//                 </button>
//               ))}
//             </div>

//             {/* 액션 버튼들 */}
//             <div className="flex gap-3 text-white">
//               <button className="hover:bg-white/20 p-2 rounded-full transition-colors">
//                 <Heart className="w-5 h-5" />
//               </button>
//               <button className="hover:bg-white/20 p-2 rounded-full transition-colors">
//                 <Share2 className="w-5 h-5" />
//               </button>
//               <button className="hover:bg-white/20 p-2 rounded-full transition-colors">
//                 <Download className="w-5 h-5" />
//               </button>
//               <button
//                 onClick={() => setIsModalOpen(false)}
//                 className="hover:bg-white/20 p-2 rounded-full transition-colors"
//               >
//                 <MoreHorizontal className="w-5 h-5" />
//               </button>
//             </div>
//           </div>

//           {/* 메인 미디어 */}
//           <div className="w-full h-full flex items-center justify-center p-16">
//             {allMediaItems[selectedMediaIndex] && (
//               <div className="max-w-5xl w-full">
//                 <video
//                   src={allMediaItems[selectedMediaIndex].image.url}
//                   controls
//                   autoPlay
//                   className="w-full rounded-xl shadow-2xl"
//                   style={{ maxHeight: "70vh" }}
//                 />
//               </div>
//             )}
//           </div>

//           {/* 하단 액션 버튼들 */}
//           <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
//             <div className="flex gap-4">
//               <Button
//                 variant="secondary"
//                 className="rounded-full bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20"
//               >
//                 💬 Modify...
//               </Button>
//               <Button
//                 variant="secondary"
//                 className="rounded-full bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20"
//               >
//                 📽️ Extend Video...
//               </Button>
//               <Button
//                 variant="secondary"
//                 className="rounded-full bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20"
//               >
//                 ⭐ More Like This
//               </Button>
//               <Button
//                 variant="secondary"
//                 className="rounded-full bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20"
//               >
//                 🖼️ Reframe
//               </Button>
//               <Button
//                 variant="secondary"
//                 className="rounded-full bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20"
//               >
//                 📈 Upscale...
//               </Button>
//               <Button
//                 variant="secondary"
//                 className="rounded-full bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20"
//               >
//                 🎵 Audio...
//               </Button>
//             </div>
//           </div>

//           {/* ESC 키로 닫기 */}
//           <div
//             className="absolute inset-0"
//             onClick={() => setIsModalOpen(false)}
//           />
//         </div>
//       )}
//     </>
//   );
// }

"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  RotateCcw,
  MoreHorizontal,
  ArrowUpRight,
  ArrowUp,
  Loader2,
  Sparkles,
  Check,
  Wifi,
  WifiOff,
  Settings,
} from "lucide-react";
import { Heart, Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { useSSE } from "@/components/SSEProvider";
import { ModernVideoCard } from "@/components/ModernVideoCard";
import { config } from "@/config";

// 백엔드 응답 구조
interface BackendResponse<T> {
  timestamp: string;
  statusCode: number;
  message: string;
  data: T;
}

interface TaskListData {
  content: TaskItem[];
  nextPageCursor: string | null;
  previousPageCursor: string | null;
}

interface TaskItem {
  type: string;
  task: {
    id: number;
    prompt: string;
    lora: string;
    status: string;
    runpodId: string | null;
    createdAt: string;
  };
  image: {
    id: number;
    url: string;
    index: number;
    createdAt: string;
  } | null;
}

export default function CreatePage() {
  const { isLoggedIn, userName, memberId } = useAuth();
  const { isConnected, notifications } = useSSE(); // lastNotification 제거

  const listRef = useRef(null);

  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskList, setTaskList] = useState([]);
  const [lastFetchTime, setLastFetchTime] = useState("");

  // 모델 관련 상태
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [tempModel, setTempModel] = useState("");

  // 현재 RadioGroup 대신 선택된 모델 객체 전체를 저장
  const [selectedModelData, setSelectedModelData] = useState(null);
  const [tempSelectedModel, setTempSelectedModel] = useState(null);

  const [selectedTab, setSelectedTab] = useState("STYLE"); // 또는 "CHARACTER"
  const [styleModels, setStyleModels] = useState([]);
  const [characterModels, setCharacterModels] = useState([]);

  // 모달 관련 상태 추가
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [allMediaItems, setAllMediaItems] = useState([]);

  // 무한 스크롤 관련 상태 추가
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);

  // 기존 상태들 아래에 추가
  const [selectedResolution, setSelectedResolution] = useState("720p");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState("16:9");
  const [selectedFrames, setSelectedFrames] = useState(81);

  const [showSelectedSettings, setShowSelectedSettings] = useState(false);

  // 해상도와 비율에 따른 width, height 계산 함수
  const getVideoSize = (resolution, aspectRatio) => {
    const resolutionMap = {
      "720p": { "1:1": [720, 720], "16:9": [1280, 720], "9:16": [720, 1280] },
      "480p": { "1:1": [480, 480], "16:9": [854, 480], "9:16": [480, 854] },
    };
    return resolutionMap[resolution][aspectRatio] || [1280, 720];
  };

  // 모델 목록 불러오기 - 백엔드 응답 구조에 맞게 수정
  const fetchAvailableModels = async () => {
    try {
      // STYLE 모델 조회
      const styleResponse = await fetch(
        `${config.apiUrl}/api/lora?mediaType=VIDEO&styleType=STYLE`,
        { credentials: "include" }
      );

      if (styleResponse.ok) {
        const styleData = await styleResponse.json();
        const styleModels = styleData.data || styleData; // 백엔드 응답 구조에 따라 처리
        setStyleModels(styleModels);
      }

      // CHARACTER 모델 조회
      const characterResponse = await fetch(
        `${config.apiUrl}/api/lora?mediaType=VIDEO&styleType=CHARACTER`,
        { credentials: "include" }
      );

      if (characterResponse.ok) {
        const characterData = await characterResponse.json();
        const characterModels = characterData.data || characterData;
        setCharacterModels(characterModels);
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
  const taskListRef = useRef([]);
  const loadingRef = useRef(false);
  const nextCursorRef = useRef(null);
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

    let timeoutId;
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

      const size = reset ? "3" : "2";
      const params = new URLSearchParams({ size });

      const currentCursor = nextCursorRef.current;
      if (!reset && currentCursor) {
        params.append("nextPageCursor", currentCursor);
        console.log(
          "📝 현재 커서 전달:",
          currentCursor.substring(0, 30) + "..."
        );
      }

      const url = `${config.apiUrl}/api/videos/task?${params}`;
      console.log("📡 API 요청 URL:", url);

      const res = await fetch(url, { credentials: "include" });

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
      console.error("❌ Task list fetch failed:", error);
      setHasMore(false);
      hasMoreRef.current = false;
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  // 비디오 생성 요청
  const handlePromptSubmit = async () => {
    if (!prompt.trim()) return;
    if (!selectedModel) {
      alert("모델을 선택해주세요.");
      return;
    }

    // 추가
    if (!selectedResolution || !selectedAspectRatio || !selectedFrames) {
      alert("비디오 설정을 모두 선택해주세요.");
      return;
    }

    console.log("🚀 비디오 생성 요청:", prompt, "모델:", selectedModel);

    const [width, height] = getVideoSize(
      selectedResolution,
      selectedAspectRatio
    );

    const tempId = Date.now();
    const optimisticTask = {
      type: "video",
      task: {
        id: tempId,
        prompt,
        lora: selectedModel,
        status: "IN_PROGRESS",
        runpodId: null,
        createdAt: new Date().toISOString(),
      },
      image: null,
    };

    setTaskList((prev) => [optimisticTask, ...prev]);
    setIsGenerating(true);

    try {
      const response = await fetch(`${config.apiUrl}/api/videos/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",

        body: JSON.stringify({
          prompt,
          lora: selectedModel,
          width: width, // 추가 필요
          height: height, // 추가 필요
          numFrames: selectedFrames, // 추가 필요
        }),
      });

      console.log("📤 API 요청 완료, 응답 상태:", response.status);

      if (response.ok) {
        const backendResponse: BackendResponse<any> = await response.json();
        console.log("✅ 비디오 생성 요청 성공!", backendResponse);

        // 주기적으로 상태 확인 (SSE 대신)
        const checkInterval = setInterval(() => {
          console.log("🔄 상태 확인을 위해 fetchTaskList 호출");
          fetchTaskList(true); // 전체 새로고침으로 최신 상태 확인
        }, 5000); // 5초마다 확인

        // 30초 후 주기적 확인 중단
        setTimeout(() => {
          clearInterval(checkInterval);
          setIsGenerating(false);
          console.log("⏰ 주기적 확인 중단");
        }, 30000);
      } else {
        console.error("❌ API 요청 실패:", response.statusText);
        setTaskList((prev) => prev.filter((task) => task.task.id !== tempId));
        setIsGenerating(false);
      }
    } catch (e) {
      console.error("❌ 네트워크 에러:", e);
      alert("요청 실패");
      setTaskList((prev) => prev.filter((task) => task.task.id !== tempId));
      setIsGenerating(false);
    }

    setPrompt(""); // 프롬프트 초기화
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

  // 완료된 항목 필터링
  useEffect(() => {
    const completedItems = taskList.filter(
      (item) => item.task.status === "COMPLETED" && item.image?.url
    );
    setAllMediaItems(completedItems);
  }, [taskList]);

  // 모델 선택 핸들러들
  const handleConfirm = () => {
    setSelectedModelData(tempSelectedModel);
    setSelectedModel(tempSelectedModel?.modelName || "");
    setShowSelectedSettings(true); // 🔥 추가 🔥
    setIsPopoverOpen(false);
  };

  const handleCancel = () => {
    setTempSelectedModel(selectedModelData);
    setIsPopoverOpen(false);
  };

  const handleMediaClick = (clickedItem) => {
    const completedItems = taskList.filter(
      (item) => item.task.status === "COMPLETED" && item.image?.url
    );
    const index = completedItems.findIndex(
      (item) => item.task.id === clickedItem.task.id
    );
    setSelectedMediaIndex(index);
    setAllMediaItems(completedItems);
    setIsModalOpen(true);
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <>
      {/* SSE 상태 표시 (개발용) */}
      {/* <div className="fixed top-4 right-4 z-50 bg-black/80 text-white px-3 py-2 rounded-lg text-xs">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="w-3 h-3 text-green-400" />
              <span>SSE 연결됨 (ID: {memberId})</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-red-400" />
              <span>SSE 연결 끊어짐</span>
            </>
          )}
        </div>
        {lastFetchTime && (
          <div className="text-gray-400 mt-1">
            마지막 업데이트: {lastFetchTime}
          </div>
        )}
        <div className="text-gray-400">총 알림: {notifications.length}개</div>
      </div> */}

      <div
        ref={listRef}
        className="w-full p-6 space-y-6 pb-32"
        style={{
          minHeight: "auto",
          height: "auto",
          overflow: "visible",
        }}
      >
        {taskList.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>아직 생성된 영상이 없습니다.</p>
            <p className="text-sm mt-2">
              아래에서 프롬프트를 입력해 영상을 생성해보세요!
            </p>
          </div>
        ) : (
          taskList.map((item) => (
            <div key={item.task.id} className="max-w-2xl mx-auto mb-25">
              {/* 프롬프트 텍스트 */}
              <div className="mb-4">
                <p className="text-gray-700 text-base leading-relaxed">
                  {item.task.prompt}
                </p>
              </div>

              {/* 액션 버튼들 */}
              <div className="flex items-center gap-3 mb-4">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Show More
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Brainstorm
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  💬 Reply
                </Button>
                <Button variant="ghost" size="sm" className="rounded-full">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>

              {/* 비디오/상태 표시 */}
              {item.task.status === "IN_PROGRESS" ? (
                <div className="w-full aspect-video bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col items-center justify-center border-2 border-dashed border-blue-200 rounded-2xl">
                  <div className="flex items-center space-x-3 mb-4">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
                  </div>
                  <p className="text-sm text-gray-500">영상 생성 중...</p>
                  <p className="text-xs text-gray-400 mt-2">
                    주기적으로 상태를 확인하고 있습니다
                  </p>
                  <div className="text-xs text-gray-300 mt-1">
                    Task ID: {item.task.id} | LoRA: {item.task.lora}
                  </div>
                </div>
              ) : item.task.status === "COMPLETED" && item.image?.url ? (
                <div
                  className="relative rounded-2xl overflow-hidden shadow-lg cursor-pointer group"
                  onClick={() => handleMediaClick(item)}
                >
                  <ModernVideoCard
                    videoUrl={item.image.url}
                    prompt={item.task.prompt}
                    taskId={item.task.id}
                    createdAt={item.task.createdAt}
                    isNew={true}
                    variant="cinematic"
                  />
                  {/* 호버 효과 */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                </div>
              ) : item.task.status === "FAILED" ? (
                <div className="w-full aspect-video bg-gradient-to-br from-red-50 to-orange-50 flex flex-col items-center justify-center border-2 border-dashed border-red-200 rounded-2xl">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✕</span>
                    </div>
                  </div>
                  <p className="text-sm text-red-600 font-medium">
                    영상 생성 실패
                  </p>
                  <p className="text-xs text-red-400 mt-2">다시 시도해주세요</p>
                  <div className="text-xs text-red-300 mt-1">
                    Task ID: {item.task.id}
                  </div>
                </div>
              ) : (
                <div className="text-red-500 p-4 bg-red-50 rounded-2xl">
                  <p>❌ 상태: {item.task.status}</p>
                  <p className="text-xs mt-1">예상하지 못한 상태입니다.</p>
                  <p className="text-xs mt-1">
                    Task ID: {item.task.id} | Type: {item.type}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 로딩 표시 */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>더 불러오는 중...</span>
          </div>
        </div>
      )}

      {/* 더 이상 데이터가 없을 때 */}
      {!hasMore && taskList.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>모든 콘텐츠를 불러왔습니다.</p>
        </div>
      )}

      {/* 하단 입력 영역 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-6 bg-transparent sm:left-64">
        <div className="max-w-4xl mx-auto">
          {/* 🔥 선택된 설정 표시 (input 위에 추가) 🔥 */}
          {showSelectedSettings && selectedModelData && (
            <div className="mb-4 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-700">
                  <span className="font-medium">{selectedModelData.name}</span>
                  <span className="text-gray-500">•</span>
                  <span>
                    {selectedResolution} {selectedAspectRatio}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span>{selectedFrames === 81 ? "4s" : "8s"}</span>
                </div>
                <button
                  onClick={() => setShowSelectedSettings(false)}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          <div className="relative">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePromptSubmit()}
              placeholder="What do you want to see..."
              className="w-full bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl px-6 py-4 text-gray-700 placeholder-gray-500 pr-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg transition-all"
              disabled={isGenerating}
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              {/* 모델 선택 버튼 */}
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/90 backdrop-blur-sm border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    모델
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[800px] max-h-[600px] p-0"
                  align="end"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xl font-semibold">Choose a Model</h4>
                      <Button variant="ghost" size="sm">
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* 탭바 */}
                    <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
                      <button
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          selectedTab === "STYLE"
                            ? "bg-white text-black shadow-sm"
                            : "text-gray-600 hover:text-black"
                        }`}
                        onClick={() => setSelectedTab("STYLE")}
                      >
                        Style
                      </button>
                      <button
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          selectedTab === "CHARACTER"
                            ? "bg-white text-black shadow-sm"
                            : "text-gray-600 hover:text-black"
                        }`}
                        onClick={() => setSelectedTab("CHARACTER")}
                      >
                        Character
                      </button>
                    </div>

                    {/* 모델 그리드 */}
                    <div className="grid grid-cols-5 gap-4 max-h-80 overflow-y-auto">
                      {availableModels.map((model) => (
                        <div
                          key={model.modelName}
                          className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                            tempSelectedModel?.modelName === model.modelName
                              ? "border-blue-500 ring-2 ring-blue-200"
                              : "border-transparent hover:border-gray-300"
                          }`}
                          onClick={() => setTempSelectedModel(model)}
                        >
                          <div className="aspect-[3/4] relative">
                            <img
                              src={model.image}
                              alt={model.name}
                              className="w-full h-full object-cover"
                            />
                            {/* 모델 타입 뱃지 */}
                            <div className="absolute top-2 left-2">
                              <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                                {selectedTab}
                              </span>
                            </div>
                            {/* New 뱃지 */}
                            {model.isNew && (
                              <div className="absolute top-2 right-2">
                                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                                  New
                                </span>
                              </div>
                            )}
                            {/* 선택 체크마크 */}
                            {tempSelectedModel?.modelName ===
                              model.modelName && (
                              <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                <div className="bg-blue-500 text-white rounded-full p-1">
                                  <Check className="w-4 h-4" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="p-3 bg-white">
                            <h3 className="font-medium text-sm truncate">
                              {model.name}
                            </h3>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* 🔥 바로 여기에 추가 🔥 */}
                    <div className="mt-6 pt-6 border-t">
                      <h5 className="text-lg font-medium mb-4">
                        Video Settings
                      </h5>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Resolution
                          </label>
                          <select
                            value={selectedResolution}
                            onChange={(e) =>
                              setSelectedResolution(e.target.value)
                            }
                            className="w-full border rounded-md px-3 py-2"
                          >
                            <option value="720p">720p</option>
                            <option value="480p">480p</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Aspect Ratio
                          </label>
                          <select
                            value={selectedAspectRatio}
                            onChange={(e) =>
                              setSelectedAspectRatio(e.target.value)
                            }
                            className="w-full border rounded-md px-3 py-2"
                          >
                            <option value="1:1">1:1 (Square)</option>
                            <option value="16:9">16:9 (Landscape)</option>
                            <option value="9:16">9:16 (Portrait)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Frames
                          </label>
                          <select
                            value={selectedFrames}
                            onChange={(e) =>
                              setSelectedFrames(Number(e.target.value))
                            }
                            className="w-full border rounded-md px-3 py-2"
                          >
                            <option value={81}>81</option>
                            <option value={161}>161</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 하단 버튼들 */}
                  <div className="border-t p-4 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      {tempSelectedModel?.name || "No model selected"}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleConfirm}
                        disabled={!tempSelectedModel}
                      >
                        Use Model
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* 전송 버튼 */}
              <button
                onClick={handlePromptSubmit}
                disabled={isGenerating || !prompt.trim()}
                className="bg-black text-white p-2 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ArrowUp className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 전체화면 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center">
          {/* 상단 헤더 */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
            {/* 썸네일 네비게이션 */}
            <div className="flex gap-2">
              {allMediaItems.map((item, index) => (
                <button
                  key={item.task.id}
                  onClick={() => setSelectedMediaIndex(index)}
                  className={`w-12 h-8 rounded overflow-hidden border-2 transition-colors ${
                    selectedMediaIndex === index
                      ? "border-white"
                      : "border-gray-500 hover:border-gray-300"
                  }`}
                >
                  <video
                    src={item.image.url}
                    className="w-full h-full object-cover"
                    muted
                  />
                </button>
              ))}
            </div>

            {/* 액션 버튼들 */}
            <div className="flex gap-3 text-white">
              <button className="hover:bg-white/20 p-2 rounded-full transition-colors">
                <Heart className="w-5 h-5" />
              </button>
              <button className="hover:bg-white/20 p-2 rounded-full transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="hover:bg-white/20 p-2 rounded-full transition-colors">
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 메인 미디어 */}
          <div className="w-full h-full flex items-center justify-center p-16">
            {allMediaItems[selectedMediaIndex] && (
              <div className="max-w-5xl w-full">
                <video
                  src={allMediaItems[selectedMediaIndex].image.url}
                  controls
                  autoPlay
                  className="w-full rounded-xl shadow-2xl"
                  style={{ maxHeight: "70vh" }}
                />
              </div>
            )}
          </div>

          {/* 하단 액션 버튼들 */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="flex gap-4">
              <Button
                variant="secondary"
                className="rounded-full bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20"
              >
                💬 Modify...
              </Button>
              <Button
                variant="secondary"
                className="rounded-full bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20"
              >
                📽️ Extend Video...
              </Button>
              <Button
                variant="secondary"
                className="rounded-full bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20"
              >
                ⭐ More Like This
              </Button>
              <Button
                variant="secondary"
                className="rounded-full bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20"
              >
                🖼️ Reframe
              </Button>
              <Button
                variant="secondary"
                className="rounded-full bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20"
              >
                📈 Upscale...
              </Button>
              <Button
                variant="secondary"
                className="rounded-full bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20"
              >
                🎵 Audio...
              </Button>
            </div>
          </div>

          {/* ESC 키로 닫기 */}
          <div
            className="absolute inset-0"
            onClick={() => setIsModalOpen(false)}
          />
        </div>
      )}
    </>
  );
}
