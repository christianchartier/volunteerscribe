import React from 'react';
import { Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadButtonProps {
  isProcessing: boolean;
  isRecording: boolean;
  isDragging: boolean;
  processingSource: 'upload' | 'record' | null;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function UploadButton({
  isProcessing,
  isRecording,
  isDragging,
  processingSource,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileSelect,
}: UploadButtonProps) {
  return (
    <div 
      className={cn(
        "w-40 h-40 rounded-full flex flex-col justify-center items-center cursor-pointer transition-all duration-300 ease-in-out",
        isDragging 
          ? "bg-blue-500 text-white" 
          : isProcessing || isRecording
            ? "bg-gray-400 text-gray-600 cursor-not-allowed"
            : "bg-gray-200 hover:bg-gray-300 text-gray-800"
      )}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={() => !isProcessing && !isRecording && document.getElementById('file-input')?.click()}
    >
      {isProcessing && processingSource === 'upload' ? (
        <Loader2 className="h-16 w-16 animate-spin" />
      ) : (
        <Upload className="h-16 w-16" />
      )}
      <input 
        id="file-input"
        type="file" 
        accept="audio/*" 
        className="hidden" 
        onChange={onFileSelect}
        disabled={isProcessing || isRecording}
      />
    </div>
  );
} 