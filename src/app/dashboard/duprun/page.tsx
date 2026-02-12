'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Download, Trash2, Upload, Plus, RotateCcw, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import Link from "next/link";


interface ZoomPoint {
  id: number;
  x: number;
  y: number;
  isDragging: boolean;
  text: string;
}

interface Slide {
  id: number;
  image: string;
  zoomPoints: ZoomPoint[];
  title: string;
  audio: string | null;
}

interface PlanLimits {
  hasAccess: boolean;
  videosUsed: number;
  videosLimit: number;
  videosRemaining: number;
  watermark: boolean;
  noWatermark: boolean;
  planName?: string;
}

const ZoomVideoApp = () => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [slideTransition, setSlideTransition] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1.5);
  const [zoomDuration, setZoomDuration] = useState(3000);
  const [transitionDuration, setTransitionDuration] = useState(1000);
  const [transitionType, setTransitionType] = useState('fade');
  const [cursorType, setCursorType] = useState('arrow');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textBgColor, setTextBgColor] = useState('transparent');
  const [textAnimation, setTextAnimation] = useState('none');
  const [textFontFamily, setTextFontFamily] = useState('Poppins');
  const [textPadding, setTextPadding] = useState(10);
  const [textBorderRadius, setTextBorderRadius] = useState(5);
  const [backgroundType, setBackgroundType] = useState('none');
  const [backgroundValue, setBackgroundValue] = useState('');
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null);
  const [showLimitError, setShowLimitError] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRefs = useRef<Record<string, HTMLImageElement>>({});
  const animationRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const isRecordingRef = useRef<boolean>(false);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const fontFamilies = [
    'Arial', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
    'Poppins', 'Raleway', 'Inter', 'Noto Sans', 'Source Sans Pro'
  ];

  const gradientOptions = [
    { value: 'none', label: 'None' },
    { value: 'gradient1', label: 'Black to Gray' },
    { value: 'gradient2', label: 'Blue to Purple' },
    { value: 'gradient3', label: 'Green to Blue' },
    { value: 'gradient4', label: 'Red to Orange' },
    { value: 'custom', label: 'Custom Image' },
  ];

  useEffect(() => {
    fetchPlanLimits();
  }, []);

  const fetchPlanLimits = async () => {
    try {
      const res = await fetch('/api/user/check-export-limit');
      const data = await res.json();
      if (data.success) {
        setPlanLimits(data);
      } else {
        setPlanLimits({
          hasAccess: false,
          videosUsed: 0,
          videosLimit: 0,
          videosRemaining: 0,
          watermark: true,
          noWatermark: false,
        });
      }
    } catch (err) {
      console.error('Failed to fetch plan limits:', err);
    }
  };

  const addSlide = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    files.forEach(file => {
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newSlide: Slide = {
            id: Date.now() + Math.random(),
            image: e.target?.result as string,
            zoomPoints: [],
            title: file.name,
            audio: null
          };
          setSlides(prev => [...prev, newSlide]);
        };
        reader.readAsDataURL(file);
      }
    });
    event.target.value = '';
  };

  const addSlideMusic = (event: React.ChangeEvent<HTMLInputElement>, slideId: number) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSlides(prev => prev.map(slide => 
          slide.id === slideId ? { ...slide, audio: e.target?.result as string } : slide
        ));
        if (!audioRefs.current[slideId]) {
          audioRefs.current[slideId] = new Audio();
        }
        audioRefs.current[slideId].src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const handleBackgroundChange = (type: string) => {
    setBackgroundType(type);
    if (type !== 'custom') {
      setBackgroundValue('');
      backgroundImageRef.current = null;
    }
  };

  const handleCustomBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundValue(e.target?.result as string);
        const img = new Image();
        img.src = e.target?.result as string;
        backgroundImageRef.current = img;
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const currentSlide = slides[currentSlideIndex];

  const addZoomPoint = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentSlide || isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const newPoint: ZoomPoint = {
      id: Date.now(),
      x: x / canvas.width,
      y: y / canvas.height,
      isDragging: false,
      text: ''
    };
    setSlides(prev => prev.map(slide => 
      slide.id === currentSlide.id 
        ? { ...slide, zoomPoints: [...slide.zoomPoints, newPoint] }
        : slide
    ));
  };

  const updatePointText = (pointId: number, newText: string) => {
    setSlides(prev => prev.map(slide =>
      slide.id === currentSlide?.id
        ? {
            ...slide,
            zoomPoints: slide.zoomPoints.map(point =>
              point.id === pointId ? { ...point, text: newText } : point
            )
          }
        : slide
    ));
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>, pointId: number) => {
    event.stopPropagation();
    event.preventDefault();
    setSlides(prev => prev.map(slide =>
      slide.id === currentSlide?.id
        ? {
            ...slide,
            zoomPoints: slide.zoomPoints.map(point =>
              point.id === pointId
                ? { ...point, isDragging: true }
                : { ...point, isDragging: false }
            )
          }
        : slide
    ));
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentSlide || isPlaying) return;
    const draggingPoint = currentSlide.zoomPoints.find(point => point.isDragging);
    if (!draggingPoint) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    setSlides(prev => prev.map(slide =>
      slide.id === currentSlide.id
        ? {
            ...slide,
            zoomPoints: slide.zoomPoints.map(point =>
              point.id === draggingPoint.id
                ? {
                    ...point,
                    x: Math.max(0, Math.min(1, x / canvas.width)),
                    y: Math.max(0, Math.min(1, y / canvas.height))
                  }
                : point
            )
          }
        : slide
    ));
  };

  const handleMouseUp = () => {
    setSlides(prev => prev.map(slide =>
      slide.id === currentSlide?.id
        ? {
            ...slide,
            zoomPoints: slide.zoomPoints.map(point => ({ ...point, isDragging: false }))
          }
        : slide
    ));
  };

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (backgroundType === 'none') return;

    if (backgroundType === 'custom' && backgroundImageRef.current) {
      ctx.drawImage(backgroundImageRef.current, 0, 0, width, height);
    } else {
      let gradient;
      switch (backgroundType) {
        case 'gradient1':
          gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, '#000000');
          gradient.addColorStop(1, '#434343');
          break;
        case 'gradient2':
          gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, '#0000ff');
          gradient.addColorStop(1, '#800080');
          break;
        case 'gradient3':
          gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, '#008000');
          gradient.addColorStop(1, '#0000ff');
          break;
        case 'gradient4':
          gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, '#ff0000');
          gradient.addColorStop(1, '#ffa500');
          break;
        default:
          return;
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
  };

  const drawCursor = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
    ctx.beginPath();
    switch (cursorType) {
      case 'arrow':
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX - 10, centerY + 15);
        ctx.lineTo(centerX - 4, centerY + 12);
        ctx.lineTo(centerX, centerY + 24);
        ctx.lineTo(centerX + 4, centerY + 12);
        ctx.lineTo(centerX + 10, centerY + 15);
        ctx.lineTo(centerX, centerY);
        break;
      case 'pointer':
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + 10, centerY + 10);
        ctx.lineTo(centerX + 5, centerY + 15);
        ctx.lineTo(centerX, centerY + 10);
        ctx.lineTo(centerX - 5, centerY + 15);
        ctx.lineTo(centerX - 10, centerY + 10);
        ctx.lineTo(centerX, centerY);
        break;
      case 'hand':
        ctx.arc(centerX, centerY + 10, 8, 0, Math.PI * 2);
        ctx.moveTo(centerX - 4, centerY + 10);
        ctx.lineTo(centerX - 4, centerY - 5);
        ctx.lineTo(centerX, centerY - 10);
        ctx.lineTo(centerX + 4, centerY - 5);
        ctx.lineTo(centerX + 4, centerY + 10);
        break;
      case 'crosshair':
        ctx.moveTo(centerX - 10, centerY);
        ctx.lineTo(centerX + 10, centerY);
        ctx.moveTo(centerX, centerY - 10);
        ctx.lineTo(centerX, centerY + 10);
        break;
      default:
        break;
    }
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const drawFrame = useCallback((ctx: CanvasRenderingContext2D, slideIndex: number, pointIndex: number, progress: number, transitionProgress: number = 0) => {
    const canvas = canvasRef.current;
    if (!canvas || !slides[slideIndex]) return;

    const slide = slides[slideIndex];
    const img = imageRefs.current[slide.id];
    if (!img) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBackground(ctx, canvas.width, canvas.height);
    
    let currentZoom = 1;
    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;
    
    if (isPlaying || transitionProgress > 0) {
      if (slide.zoomPoints.length > 0) {
        if (pointIndex === 0) {
          currentZoom = lerp(1, zoomLevel, easeInOutCubic(progress));
          const firstPoint = slide.zoomPoints[0];
          centerX = lerp(canvas.width / 2, firstPoint.x * canvas.width, easeInOutCubic(progress));
          centerY = lerp(canvas.height / 2, firstPoint.y * canvas.height, easeInOutCubic(progress));
        } else if (pointIndex < slide.zoomPoints.length) {
          currentZoom = zoomLevel;
          const prevPoint = slide.zoomPoints[pointIndex - 1];
          const currentPoint = slide.zoomPoints[pointIndex];
          const smoothProgress = easeInOutCubic(progress);
          centerX = lerp(prevPoint.x * canvas.width, currentPoint.x * canvas.width, smoothProgress);
          centerY = lerp(prevPoint.y * canvas.height, currentPoint.y * canvas.height, smoothProgress);
        } else {
          currentZoom = lerp(zoomLevel, 1, easeInOutCubic(progress));
          const lastPoint = slide.zoomPoints[slide.zoomPoints.length - 1];
          centerX = lerp(lastPoint.x * canvas.width, canvas.width / 2, easeInOutCubic(progress));
          centerY = lerp(lastPoint.y * canvas.height, canvas.height / 2, easeInOutCubic(progress));
        }
      }
    }
    
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;
    const offsetX = (canvas.width - drawWidth) / 2;
    const offsetY = (canvas.height - drawHeight) / 2;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(currentZoom, currentZoom);
    ctx.translate(-centerX, -centerY);
    
    if (transitionProgress > 0 && slideIndex > 0) {
      const prevSlide = slides[slideIndex - 1];
      const prevImg = imageRefs.current[prevSlide.id];
      
      if (prevImg) {
        const prevScale = Math.min(canvas.width / prevImg.width, canvas.height / prevImg.height);
        const prevDrawWidth = prevImg.width * prevScale;
        const prevDrawHeight = prevImg.height * prevScale;
        const prevOffsetX = (canvas.width - prevDrawWidth) / 2;
        const prevOffsetY = (canvas.height - prevDrawHeight) / 2;
        
        if (transitionType === 'fade') {
          ctx.globalAlpha = 1 - transitionProgress;
          ctx.drawImage(prevImg, prevOffsetX, prevOffsetY, prevDrawWidth, prevDrawHeight);
          ctx.globalAlpha = transitionProgress;
          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          ctx.globalAlpha = 1;
        } else if (transitionType === 'slide') {
          ctx.drawImage(prevImg, prevOffsetX - canvas.width * transitionProgress, prevOffsetY, prevDrawWidth, prevDrawHeight);
          ctx.drawImage(img, offsetX + canvas.width * (1 - transitionProgress), offsetY, drawWidth, drawHeight);
        } else {
          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        }
      } else {
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      }
    } else {
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }
    
    ctx.restore();
  
    
    if (isPlaying && pointIndex < slide.zoomPoints.length) {
      const text = slide.zoomPoints[pointIndex].text;
      if (text) {
        ctx.font = `bold 30px ${textFontFamily}`;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        if (textBgColor !== 'transparent') {
          const textWidth = ctx.measureText(text).width;
          ctx.fillStyle = textBgColor;
          ctx.beginPath();
          ctx.roundRect(
            canvas.width / 2 - textWidth / 2 - textPadding,
            canvas.height - 70,
            textWidth + textPadding * 2,
            40,
            textBorderRadius
          );
          ctx.fill();
          ctx.fillStyle = textColor;
        }
        let textOpacity = 1;
        let textY = canvas.height - 50;
        if (textAnimation === 'fade-in' && progress < 0.5) {
          textOpacity = progress / 0.5;
        } else if (textAnimation === 'slide-in' && progress < 0.5) {
          textY = canvas.height - 50 + (50 * (0.5 - progress) / 0.5);
        }
        ctx.globalAlpha = textOpacity;
        ctx.fillText(text, canvas.width / 2, textY);
        ctx.globalAlpha = 1;
      }
    }
    
    if (!isPlaying && transitionProgress === 0) {
      slide.zoomPoints.forEach((point: ZoomPoint, index: number) => {
        const x = point.x * canvas.width;
        const y = point.y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = index === currentPointIndex ? '#ef4444' : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 14px Poppins';
        ctx.textAlign = 'center';
        ctx.fillText((index + 1).toString(), x, y + 5);
      });
    }
    
    if (!isPlaying && slides.length > 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(10, 10, 200, 30);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Poppins';
      ctx.textAlign = 'left';
      ctx.fillText(`Slide ${slideIndex + 1} of ${slides.length}`, 20, 30);
    }

    if (isPlaying && transitionProgress === 0 && slide.zoomPoints.length > 0) {
      if (progress < 0.2 && pointIndex < slide.zoomPoints.length) {
        const clickP = progress / 0.2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 15 * clickP, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(255, 255, 255, ${1 - clickP})`;
        ctx.lineWidth = 3 * (1 - clickP) + 1;
        ctx.stroke();
      }

      drawCursor(ctx, centerX, centerY);
    }
  }, [slides, isPlaying, zoomLevel, cursorType, textColor, textBgColor, textAnimation, textFontFamily, textPadding, textBorderRadius, backgroundType, backgroundValue, planLimits]);

  const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

  const easeInOutCubic = (t: number) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const getTotalAnimationTime = () => {
    let totalTime = 0;
    slides.forEach((slide, index) => {
      if (index > 0) totalTime += transitionDuration;
      const numSegments = slide.zoomPoints.length > 0 ? slide.zoomPoints.length + 1 : 0;
      totalTime += numSegments * zoomDuration;
    });
    return totalTime;
  };

  const animate = useCallback(() => {
    if (slides.length === 0) {
      setIsPlaying(false);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const startTime = Date.now();
    const totalDuration = getTotalAnimationTime();
    let currentAudio: HTMLAudioElement | null = null;

    const step = () => {
      const elapsed = Date.now() - startTime;
      const totalProgress = elapsed / totalDuration;
      
      if (totalProgress >= 1) {
        setProgress(1);
        setCurrentPointIndex(slides[slides.length - 1]?.zoomPoints.length - 1 || 0);
        setCurrentSlideIndex(slides.length - 1);
        setSlideTransition(0);
        setIsPlaying(false);
        if (isRecordingRef.current) {
          stopRecording();
        }
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
        return;
      }
      
      let accumulatedTime = 0;
      let currentSlideIdx = 0;
      let currentPoint = 0;
      let pointProgress = 0;
      let slideTransitionProg = 0;

      for (let slideIdx = 0; slideIdx < slides.length; slideIdx++) {
        const slide = slides[slideIdx];
        
        if (slideIdx > 0) {
          if (elapsed <= accumulatedTime + transitionDuration) {
            currentSlideIdx = slideIdx;
            slideTransitionProg = (elapsed - accumulatedTime) / transitionDuration;
            break;
          }
          accumulatedTime += transitionDuration;
        }
        
        const numSegments = slide.zoomPoints.length > 0 ? slide.zoomPoints.length + 1 : 0;
        const slideZoomTime = numSegments * zoomDuration;
        if (elapsed <= accumulatedTime + slideZoomTime) {
          currentSlideIdx = slideIdx;
          const slideElapsed = elapsed - accumulatedTime;
          currentPoint = Math.floor(slideElapsed / zoomDuration);
          pointProgress = (slideElapsed % zoomDuration) / zoomDuration;
          break;
        }
        accumulatedTime += slideZoomTime;
      }
      
      setCurrentSlideIndex(currentSlideIdx);
      setCurrentPointIndex(currentPoint);
      setProgress(pointProgress);
      setSlideTransition(slideTransitionProg);
      
      drawFrame(ctx, currentSlideIdx, currentPoint, pointProgress, slideTransitionProg);
      
      const newAudio = audioRefs.current[slides[currentSlideIdx].id];
      if (newAudio && newAudio !== currentAudio) {
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
        newAudio.currentTime = 0;
        newAudio.play().catch(err => console.error('Audio play error:', err));
        currentAudio = newAudio;
      }
      
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(step);
      }
    };

    step();
  }, [slides, isPlaying, drawFrame, zoomDuration, transitionDuration]);

  const startAnimation = () => {
    const hasAnyZoomPoints = slides.some(slide => slide.zoomPoints.length > 0);
    if (!hasAnyZoomPoints) return;
    
    setIsPlaying(true);
    setCurrentSlideIndex(0);
    setCurrentPointIndex(0);
    setProgress(0);
    setSlideTransition(0);
  };

  const stopAnimation = () => {
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    Object.values(audioRefs.current).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  };

  const resetAnimation = () => {
    stopAnimation();
    setCurrentSlideIndex(0);
    setCurrentPointIndex(0);
    setProgress(0);
    setSlideTransition(0);
    Object.values(audioRefs.current).forEach(audio => audio.currentTime = 0);
    
    if (slides.length > 0 && imageRefs.current[slides[0].id]) {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) drawFrame(ctx, 0, 0, 0, 0);
    }
  };

  const startRecording = () => {
    if (isRecordingRef.current) return;
    isRecordingRef.current = true;
    setIsRecording(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasStream = canvas.captureStream(30);
    const audioStreams: MediaStream[] = [];

    audioContextRef.current = new AudioContext();
    const audioContext = audioContextRef.current;

    slides.forEach((slide) => {
      if (slide.audio && audioRefs.current[slide.id]) {
        const audio = audioRefs.current[slide.id];
        audio.currentTime = 0;
        const source = audioContext.createMediaElementSource(audio);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioContext.destination);
        audioStreams.push(destination.stream);
      }
    });

    const stream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioStreams.flatMap(audioStream => audioStream.getAudioTracks())
    ]);

    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    recordedChunks.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'duprun-video.webm';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      isRecordingRef.current = false;
      setIsRecording(false);

      try {
        const res = await fetch('/api/user/record-export', {
          method: 'POST',
        });
        const data = await res.json();
        if (data.success) {
          await fetchPlanLimits();
        }
      } catch (err) {
        console.error('Failed to record export:', err);
      }
    };

    mediaRecorderRef.current.start();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecordingRef.current) {
      mediaRecorderRef.current.stop();
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  };

  const createAndDownloadVideo = async () => {
    const hasAnyZoomPoints = slides.some(slide => slide.zoomPoints.length > 0);
    if (!hasAnyZoomPoints || isRecordingRef.current) return;
    
    if (!planLimits || !planLimits.hasAccess) {
      setShowLimitError(true);
      setTimeout(() => setShowLimitError(false), 5000);
      return;
    }

    startRecording();
    startAnimation();
  };

  const removeZoomPoint = (pointId: number) => {
    if (!currentSlide) return;
    
    setSlides(prev => prev.map(slide =>
      slide.id === currentSlide.id
        ? { ...slide, zoomPoints: slide.zoomPoints.filter(point => point.id !== pointId) }
        : slide
    ));
  };

  const clearAllPoints = () => {
    if (!currentSlide) return;
    
    setSlides(prev => prev.map(slide =>
      slide.id === currentSlide.id
        ? { ...slide, zoomPoints: [] }
        : slide
    ));
    resetAnimation();
  };

  const removeSlide = (slideId: number) => {
    setSlides(prev => {
      const newSlides = prev.filter(slide => slide.id !== slideId);
      const newIndex = currentSlideIndex >= newSlides.length ? Math.max(0, newSlides.length - 1) : currentSlideIndex;
      setCurrentSlideIndex(newIndex);
      return newSlides;
    });
    delete imageRefs.current[slideId];
    delete audioRefs.current[slideId];
  };

  const navigateSlide = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    } else if (direction === 'next' && currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  useEffect(() => {
    const savedSlides = localStorage.getItem('duprunSlides');
    if (savedSlides) {
      setSlides(JSON.parse(savedSlides));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('duprunSlides', JSON.stringify(slides));
  }, [slides]);

  useEffect(() => {
    if (isPlaying) {
      animate();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animate]);

  useEffect(() => {
    slides.forEach(slide => {
      if (slide.image && !imageRefs.current[slide.id]) {
        const img = new Image();
        img.onload = () => {
          imageRefs.current[slide.id] = img;
          if (slide.id === currentSlide?.id) {
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                canvas.width = 1440;
                canvas.height = 810;
                drawFrame(ctx, currentSlideIndex, currentPointIndex, progress, slideTransition);
              }
            }
          }
        };
        img.src = slide.image;
      }
    });
  }, [slides, currentSlide, drawFrame]);

  useEffect(() => {
    setCurrentPointIndex(0);
    setProgress(0);
    setSlideTransition(0);
  }, [currentSlideIndex]);

  useEffect(() => {
    if (currentSlide && imageRefs.current[currentSlide?.id] && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        canvasRef.current.width = 1440;
        canvasRef.current.height = 810;
        drawFrame(ctx, currentSlideIndex, currentPointIndex, progress, slideTransition);
      }
    }
  }, [currentSlideIndex, currentPointIndex, progress, slideTransition, slides, drawFrame, textColor, textBgColor, textAnimation, textFontFamily, textPadding, textBorderRadius, backgroundType, backgroundValue]);

  const totalZoomPoints = slides.reduce((sum, slide) => sum + slide.zoomPoints.length, 0);

  return (
    <div className="min-h-screen bg-black p-4 font-[Poppins] text-white">
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      {/* Cute Header */}
  <header className="border-b border-gray-800 pb-6 mb-10">
    <div className="max-w-full mx-auto flex justify-between items-center">
      <div className="text-3xl font-extrabold tracking-tight">
  <Link href="/" className="cursor-pointer">
    🌙 DUPRUN
  </Link>
</div>

    </div>
  </header>
      <div className="max-w-full mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-5xl font-bold tracking-tight mb-2">
  Turn your plain screenshots into eye-catching videos.
</h2>
          {planLimits && (
            <div className="mt-4 inline-block bg-gray-900 px-6 py-3 rounded-2xl border border-gray-800">
              <p className="text-sm text-gray-300">
                {planLimits.planName && <span className="font-semibold text-white">{planLimits.planName} Plan</span>}
                {planLimits.hasAccess ? (
                  <span className="ml-2">
                    📹 <span className="font-bold text-white">{planLimits.videosRemaining}</span> / {planLimits.videosLimit} videos remaining this month
                  </span>
                ) : (
                  <span className="ml-2 text-red-400 font-semibold">⚠️ No active plan or limit reached</span>
                )}
              </p>
            </div>
          )}
        </div>

        {showLimitError && (
          <div className="mb-6 bg-red-900/30 border border-red-500 rounded-2xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <div>
              <p className="font-semibold text-red-400">Export Limit Reached</p>
              <p className="text-sm text-gray-300">
                {planLimits?.videosLimit === 0 
                  ? 'Please purchase a plan to export videos.' 
                  : `You've reached your monthly limit of ${planLimits?.videosLimit} videos. Upgrade your plan or wait for next month.`}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="col-span-1 space-y-6">
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4">Animation Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-300 block mb-1 font-medium">
                    Zoom Level (1-10):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={zoomLevel}
                    onChange={(e) => setZoomLevel(Math.max(1, Math.min(10, parseFloat(e.target.value))))}
                    className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-xl focus:outline-none focus:border-white transition"
                  />
                </div>

                <div>
                  <label className="text-gray-300 block mb-1 font-medium">
                    Zoom Duration (ms):
                  </label>
                  <input
                    type="number"
                    min="1000"
                    max="10000"
                    value={zoomDuration}
                    onChange={(e) => setZoomDuration(parseInt(e.target.value))}
                    className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-xl focus:outline-none focus:border-white transition"
                  />
                </div>

                <div>
                  <label className="text-gray-300 block mb-1 font-medium">
                    Transition Duration (ms):
                  </label>
                  <input
                    type="number"
                    min="500"
                    max="5000"
                    value={transitionDuration}
                    onChange={(e) => setTransitionDuration(parseInt(e.target.value))}
                    className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-xl focus:outline-none focus:border-white transition"
                  />
                </div>

                <div>
                  <label className="text-gray-300 block mb-1 font-medium">
                    Transition Type:
                  </label>
                  <select
                    value={transitionType}
                    onChange={(e) => setTransitionType(e.target.value)}
                    className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-xl focus:outline-none focus:border-white transition"
                  >
                    <option value="fade">Fade</option>
                    <option value="slide">Slide</option>
                    <option value="none">None</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-300 block mb-1 font-medium">
                    Cursor Type:
                  </label>
                  <select
                    value={cursorType}
                    onChange={(e) => setCursorType(e.target.value)}
                    className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-xl focus:outline-none focus:border-white transition"
                  >
                    <option value="arrow">Arrow</option>
                    <option value="pointer">Pointer</option>
                    <option value="hand">Hand</option>
                    <option value="crosshair">Crosshair</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4">Style Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-300 block mb-1 font-medium">
                    Text Color:
                  </label>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-white transition"
                  />
                </div>

                <div>
                  <label className="text-gray-300 block mb-1 font-medium">
                    Text Background Color:
                  </label>
                  <input
                    type="color"
                    value={textBgColor}
                    onChange={(e) => setTextBgColor(e.target.value)}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-white transition"
                  />
                </div>

                <div>
                  <label className="text-gray-300 block mb-1 font-medium">
                    Text Animation:
                  </label>
                  <select
                    value={textAnimation}
                    onChange={(e) => setTextAnimation(e.target.value)}
                    className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-xl focus:outline-none focus:border-white transition"
                  >
                    <option value="none">None</option>
                    <option value="fade-in">Fade In</option>
                    <option value="slide-in">Slide In</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-300 block mb-1 font-medium">
                    Text Font Family:
                  </label>
                  <select
                    value={textFontFamily}
                    onChange={(e) => setTextFontFamily(e.target.value)}
                    className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-xl focus:outline-none focus:border-white transition"
                  >
                    {fontFamilies.map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-gray-300 block mb-1 font-medium">
                    Text Padding (px):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={textPadding}
                    onChange={(e) => setTextPadding(parseInt(e.target.value))}
                    className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-xl focus:outline-none focus:border-white transition"
                  />
                </div>

                <div>
                  <label className="text-gray-300 block mb-1 font-medium">
                    Text Border Radius (px):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={textBorderRadius}
                    onChange={(e) => setTextBorderRadius(parseInt(e.target.value))}
                    className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-xl focus:outline-none focus:border-white transition"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4">Background Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-300 block mb-1 font-medium">
                    Background Type:
                  </label>
                  <select
                    value={backgroundType}
                    onChange={(e) => handleBackgroundChange(e.target.value)}
                    className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-xl focus:outline-none focus:border-white transition"
                  >
                    {gradientOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                {backgroundType === 'custom' && (
                  <div>
                    <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-gray-700 rounded-2xl cursor-pointer hover:border-white transition">
                      <Upload className="w-5 h-5 text-gray-400 mb-1" />
                      <span className="text-sm text-gray-300 font-medium">Upload Custom Background Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCustomBackgroundUpload}
                        className="hidden"
                      />
                    </label>
                    {backgroundValue && <p className="text-xs text-gray-500 mt-2">Custom background added</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4">Controls</h2>
              
              <div className="mb-4">
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-700 rounded-2xl cursor-pointer hover:border-white transition">
                  <Plus className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-base text-gray-300 font-medium">Add Images</span>
                  <span className="text-sm text-gray-500">Multiple selection supported</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={addSlide}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">
                    Slides ({slides.length})
                  </h3>
                </div>
                
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2">
                  {slides.map((slide, index) => (
                    <div
                      key={slide.id}
                      className={`flex items-center justify-between rounded-2xl p-3 cursor-pointer transition ${index === currentSlideIndex ? 'bg-gray-800' : 'bg-gray-800/50 hover:bg-gray-800'}`}
                      onClick={() => setCurrentSlideIndex(index)}
                    >
                      <div className="flex items-center gap-2">
                        <img src={slide.image} alt="thumbnail" className="w-10 h-6 object-cover rounded-lg border border-gray-700" />
                        <div>
                          <span className="text-sm font-medium text-white block">
                            Slide {index + 1}
                          </span>
                          <span className="text-xs text-gray-500">
                            {slide.zoomPoints.length} points {slide.audio ? ' - Music Added' : ''}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSlide(slide.id);
                        }}
                        className="text-red-500 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {currentSlide && (
                <div className="mb-4">
                  <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-gray-700 rounded-2xl cursor-pointer hover:border-white transition">
                    <Upload className="w-5 h-5 text-gray-400 mb-1" />
                    <span className="text-sm text-gray-300 font-medium">Add Music to Current Slide</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => addSlideMusic(e, currentSlide.id)}
                      className="hidden"
                    />
                  </label>
                  {currentSlide.audio && <p className="text-xs text-gray-500 mt-2">Music added to this slide</p>}
                </div>
              )}

              {currentSlide && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">
                      Zoom Points ({currentSlide.zoomPoints.length})
                    </h3>
                    {currentSlide.zoomPoints.length > 0 && (
                      <button
                        onClick={clearAllPoints}
                        className="text-red-500 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 mb-3">
                    Click on the image to add zoom points
                  </p>
                  
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2">
                    {currentSlide.zoomPoints.map((point, index) => (
                      <div
                        key={point.id}
                        className="flex items-center justify-between bg-gray-800/50 rounded-2xl p-3"
                      >
                        <span className="text-sm font-medium text-white">
                          Point {index + 1}
                        </span>
                        <input
                          type="text"
                          value={point.text}
                          onChange={(e) => updatePointText(point.id, e.target.value)}
                          placeholder="Add text"
                          className="w-1/2 p-2 bg-gray-800 text-white border border-gray-700 rounded-xl focus:outline-none focus:border-white transition"
                        />
                        <button
                          onClick={() => removeZoomPoint(point.id)}
                          className="text-red-500 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={isPlaying ? stopAnimation : startAnimation}
                    disabled={totalZoomPoints === 0}
                    className={`flex-1 ${totalZoomPoints === 0 ? 'bg-gray-800 cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200'} py-2 px-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition shadow-md`}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isPlaying ? 'Pause' : 'Play'}
                  </button>
                  
                  <button
                    onClick={resetAnimation}
                    disabled={totalZoomPoints === 0}
                    className={`${totalZoomPoints === 0 ? 'bg-gray-800 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-700'} text-white py-2 px-4 rounded-2xl transition shadow-md`}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={createAndDownloadVideo}
                  disabled={totalZoomPoints === 0 || isPlaying || isRecording || !planLimits?.hasAccess}
                  className={`w-full ${totalZoomPoints === 0 || isPlaying || isRecording || !planLimits?.hasAccess ? 'bg-gray-800 cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200'} py-2 px-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition shadow-md`}
                >
                  <Download className="w-4 h-4" />
                  {isRecording ? 'Recording...' : 'Create & Download Full Video'}
                </button>
                
                {planLimits && !planLimits.noWatermark && (
                  <p className="text-xs text-gray-500 text-center">
                    ⚠️ Exported videos will include DUPRUN watermark
                  </p>
                )}
              </div>

              {(isPlaying || progress > 0) && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-300 mb-2 font-medium">
                    <span>Progress</span>
                    <span>
                      Slide {currentSlideIndex + 1} of {slides.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentSlideIndex * 100) + (progress * 100)) / slides.length}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Total Duration: ~{Math.round(getTotalAnimationTime() / 1000)}s
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-3 sticky top-0 h-[calc(100vh-2rem)] overflow-hidden">
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 shadow-2xl h-full">
              {slides.length > 1 && (
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => navigateSlide('prev')}
                    disabled={currentSlideIndex === 0}
                    className={`${currentSlideIndex === 0 ? 'bg-gray-800 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-700'} text-white py-2 px-4 rounded-2xl flex items-center gap-2 transition shadow-md`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  
                  <span className="text-lg font-semibold text-white">
                    Slide {currentSlideIndex + 1} of {slides.length}
                  </span>
                  
                  <button
                    onClick={() => navigateSlide('next')}
                    disabled={currentSlideIndex === slides.length - 1}
                    className={`${currentSlideIndex === slides.length - 1 ? 'bg-gray-800 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-700'} text-white py-2 px-4 rounded-2xl flex items-center gap-2 transition shadow-md`}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex justify-center h-[calc(100%-4rem)]">
                <div className="relative w-full h-full">
                  <canvas
                    ref={canvasRef}
                    onClick={addZoomPoint}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="border border-gray-700 rounded-2xl cursor-crosshair w-full h-auto max-h-full bg-black shadow-xl"
                    width={1440}
                    height={810}
                  />
                  
                  {!isPlaying && currentSlide && slideTransition === 0 && currentSlide.zoomPoints.map((point: ZoomPoint, index: number) => (
                    <div
                      key={point.id}
                      onMouseDown={(e) => handleMouseDown(e, point.id)}
                      className={`absolute w-6 h-6 ${index === currentPointIndex ? 'bg-red-500' : 'bg-white'} border-2 border-gray-900 rounded-full cursor-move flex items-center justify-center text-black text-sm font-bold shadow-md hover:scale-110 transition`}
                      style={{
                        left: `${point.x * 100}%`,
                        top: `${point.y * 100}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      {index + 1}
                    </div>
                  ))}
                  
                  {slides.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <Upload className="w-14 h-14 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">Add images to get started</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoomVideoApp;
