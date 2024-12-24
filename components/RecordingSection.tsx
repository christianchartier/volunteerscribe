import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadButton } from './UploadButton';

interface RecordingSectionProps {
  isProcessing: boolean;
  isRecording: boolean;
  isDragging: boolean;
  processingSource: 'upload' | 'record' | null;
  onRecord: () => void;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function RecordingSection({
  isProcessing,
  isRecording,
  isDragging,
  processingSource,
  onRecord,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileSelect,
}: RecordingSectionProps) {
  return (
    <div className="w-2/3 flex flex-col">
      <div className="flex-grow flex flex-col justify-center items-center p-4 space-y-6">
        <div className="flex space-x-8">
          <UploadButton
            isProcessing={isProcessing}
            isRecording={isRecording}
            isDragging={isDragging}
            processingSource={processingSource}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onFileSelect={onFileSelect}
          />
          <div className="relative w-40 h-40">
            <Button
              onClick={onRecord}
              size="lg"
              className={cn(
                "w-full h-full rounded-full transition-all duration-300 ease-in-out",
                isRecording 
                  ? "bg-red-500 hover:bg-red-600 text-white" 
                  : isProcessing
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              )}
              disabled={isProcessing && !isRecording}
            >
              {isRecording ? (
                <Loader2 className="h-16 w-16 animate-spin" />
              ) : isProcessing && processingSource === 'record' ? (
                <Loader2 className="h-16 w-16 animate-spin" />
              ) : (
                <Mic className="h-16 w-16" />
              )}
            </Button>
          </div>
        </div>
        <p className="text-lg font-medium text-gray-600 text-center">
          {isRecording ? 'Recording...' : isProcessing ? 'Transcribing...' : 'Upload an audio file or start recording'}
        </p>
      </div>
    </div>
  );
} 