import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy } from "lucide-react";
import { ViewMode } from './types';
import { ApiKeyInput } from './ApiKeyInput';

interface TranscriptionViewProps {
  viewMode: ViewMode;
  transcription: string;
  clinicalNote: string;
  errorMessage: string;
  onToggleView: () => void;
  onCopyToClipboard: () => void;
  savedApiKey: string;
  apiKeyInput: string;
  isApiKeyError: boolean;
  onApiKeyInputChange: (value: string) => void;
  onSaveApiKey: () => void;
  onClearApiKey: () => void;
}

export function TranscriptionView({
  viewMode,
  transcription,
  clinicalNote,
  errorMessage,
  onToggleView,
  onCopyToClipboard,
  savedApiKey,
  apiKeyInput,
  isApiKeyError,
  onApiKeyInputChange,
  onSaveApiKey,
  onClearApiKey,
}: TranscriptionViewProps) {
  const currentText = viewMode === 'transcription' ? transcription : clinicalNote;

  return (
    <div className="w-1/2 flex flex-col bg-white">
      <div className="p-4 border-b border-gray-300">
        <h2 className="text-lg font-semibold text-gray-900">
          {viewMode === 'transcription' ? 'Transcription' : 'Clinical Note'}
        </h2>
      </div>
      <div className="flex-grow p-4 flex flex-col relative">
        <div className="flex-grow overflow-auto mb-16">
          {errorMessage ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block text-sm sm:inline">{errorMessage}</span>
            </div>
          ) : (
            <Textarea
              value={currentText}
              readOnly
              className="w-full h-full resize-none bg-gray-50 border-gray-300 text-gray-800 p-3 text-sm"
              placeholder={viewMode === 'transcription' ? "Transcription will appear here..." : "Clinical note will appear here..."}
            />
          )}
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
          <ApiKeyInput
            savedApiKey={savedApiKey}
            apiKeyInput={apiKeyInput}
            isApiKeyError={isApiKeyError}
            onApiKeyInputChange={onApiKeyInputChange}
            onSaveApiKey={onSaveApiKey}
            onClearApiKey={onClearApiKey}
          />
          <div className="flex space-x-2">
            <Button 
              onClick={onToggleView}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              {viewMode === 'transcription' ? 'Clinical Note' : 'Transcription'}
            </Button>
            <Button 
              onClick={onCopyToClipboard}
              disabled={!currentText}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              <Copy className="mr-2 h-4 w-4" /> Copy to Clipboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 