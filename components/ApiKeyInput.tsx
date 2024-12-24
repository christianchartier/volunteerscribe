import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Key, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiKeyInputProps {
  savedApiKey: string;
  apiKeyInput: string;
  isApiKeyError: boolean;
  onApiKeyInputChange: (value: string) => void;
  onSaveApiKey: () => void;
  onClearApiKey: () => void;
}

export function ApiKeyInput({
  savedApiKey,
  apiKeyInput,
  isApiKeyError,
  onApiKeyInputChange,
  onSaveApiKey,
  onClearApiKey,
}: ApiKeyInputProps) {
  return (
    <div className="flex items-center space-x-2">
      {savedApiKey ? (
        <>
          <Input
            type="password"
            value="••••••••••••••••"
            readOnly
            className="w-40 p-1.5 border border-gray-300 rounded bg-gray-100 text-sm"
          />
          <Button
            onClick={onClearApiKey}
            className="h-8 rounded-full bg-gray-200 hover:bg-gray-400 text-gray-800 text-sm"
          >
            <X className="mr-1.5 h-3.5 w-3.5" /> Clear Key
          </Button>
        </>
      ) : (
        <>
          <Input
            type="password"
            placeholder="Enter OpenAI API Key"
            value={apiKeyInput}
            onChange={(e) => onApiKeyInputChange(e.target.value)}
            className={cn(
              "w-40 p-1.5 border rounded transition-all duration-300 text-sm",
              isApiKeyError
                ? "border-red-500 bg-red-50"
                : "border-gray-300"
            )}
          />
          <Button
            onClick={onSaveApiKey}
            disabled={!apiKeyInput}
            className={cn(
              "h-8 rounded-full transition-all duration-300 ease-in-out text-sm",
              isApiKeyError && apiKeyInput
                ? "bg-red-500 hover:bg-red-600 text-white"
                : apiKeyInput
                  ? "bg-gray-200 hover:bg-gray-400 text-gray-800"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            <Key className="mr-1.5 h-3.5 w-3.5" /> Save Key
          </Button>
        </>
      )}
    </div>
  );
} 