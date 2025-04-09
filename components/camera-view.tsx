"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Maximize2 } from "lucide-react";
import type { CameraViewProps } from "../types";

export function CameraView({ isEditing, onSave, currentDeadzone }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const [originalImage, setOriginalImage] = useState<string>("");
  const [modifiedImage, setModifiedImage] = useState<string>("");

  const selectionDimensions = {
    x: Math.min(startPos.x, currentPos.x),
    y: Math.min(startPos.y, currentPos.y),
    width: Math.abs(currentPos.x - startPos.x),
    height: Math.abs(currentPos.y - startPos.y),
  };

  useEffect(() => {
    if (isEditing) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isEditing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 640;
      canvas.height = 480;
    }
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEditing) return;

    const coords = getCanvasCoordinates(e);
    setIsDrawing(true);
    setStartPos(coords);
    setCurrentPos(coords);

    if (!originalImage) {
      captureFrame();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isEditing) return;

    const coords = getCanvasCoordinates(e);
    setCurrentPos(coords);
    drawDeadzone();
  };

  const handleMouseUp = () => {
    if (!isEditing) return;
    setIsDrawing(false);
    setShowPreview(true);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (canvas && ctx && originalImage) {
      const img = new Image();
      img.src = originalImage;

      img.onload = () => {
        const modifiedCanvas = document.createElement("canvas");
        const modifiedCtx = modifiedCanvas.getContext("2d");

        if (!modifiedCtx) return;

        modifiedCanvas.width = canvas.width;
        modifiedCanvas.height = canvas.height;

        modifiedCtx.drawImage(img, 0, 0);

        const { x, y, width, height } = selectionDimensions;
        modifiedCtx.clearRect(x, y, width, height);

        setModifiedImage(modifiedCanvas.toDataURL("image/jpeg"));
      };
    }
  };

  const drawDeadzone = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      selectionDimensions.x,
      selectionDimensions.y,
      selectionDimensions.width,
      selectionDimensions.height
    );
  };

  const handleSave = () => {
    const deadzone = {
      coordinates: selectionDimensions,
      originalImage,
      modifiedImage,
    };
    onSave(deadzone);
    setShowPreview(false);
    setOriginalImage("");
    setModifiedImage("");
  };

  const handleReset = () => {
    setShowPreview(false);
    setOriginalImage("");
    setModifiedImage("");
    setStartPos({ x: 0, y: 0 });
    setCurrentPos({ x: 0, y: 0 });

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (video && canvas && ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setOriginalImage(canvas.toDataURL("image/jpeg"));
    }
  };

  const DeadzoneInfo = ({ coordinates }: { coordinates: { x: number; y: number; width: number; height: number } }) => (
    <div className="mt-4 grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Position:</span>
          <span className="text-sm text-muted-foreground">
            X: {coordinates.x}, Y: {coordinates.y}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Dimensions:</span>
          <span className="text-sm text-muted-foreground">
            {coordinates.width} × {coordinates.height}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Area:</span>
          <span className="text-sm text-muted-foreground">
            {coordinates.width * coordinates.height}px²
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Coverage:</span>
          <span className="text-sm text-muted-foreground">
            {Math.round((coordinates.width * coordinates.height) / (640 * 480) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="relative aspect-video">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-contain"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-contain"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
        </div>
        {isEditing && (
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button onClick={handleSave}>Save Deadzone</Button>
          </div>
        )}

        {/* Show current selection info while editing */}
        {isEditing && (startPos.x !== 0 || startPos.y !== 0 || currentPos.x !== 0 || currentPos.y !== 0) && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Maximize2 className="h-4 w-4" />
              <span className="font-medium">Current Selection</span>
            </div>
            <DeadzoneInfo coordinates={selectionDimensions} />
          </div>
        )}

        {/* Show saved deadzone info when not editing */}
        {!isEditing && currentDeadzone && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Maximize2 className="h-4 w-4" />
              <span className="font-medium">Saved Deadzone</span>
            </div>
            <DeadzoneInfo coordinates={currentDeadzone.coordinates} />
          </div>
        )}
      </Card>

      {showPreview && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Preview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              {originalImage ? (
                <img src={originalImage} alt="Original" className="w-full" />
              ) : (
                <p className="text-center mt-2">No Original Image</p>
              )}
              <p className="text-center mt-2">Original Image</p>
            </div>
            <div>
              {modifiedImage ? (
                <img src={modifiedImage} alt="With Deadzone" className="w-full" />
              ) : (
                <p className="text-center mt-2">No Modified Image</p>
              )}
              <p className="text-center mt-2">With Deadzone</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}