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
            className="w-48 p-2 border border-gray-300 rounded bg-gray-100"
          />
          <Button
            onClick={onClearApiKey}
            className="h-10 rounded-full bg-gray-200 hover:bg-gray-400 text-gray-800"
          >
            <X className="mr-2 h-4 w-4" /> Clear Key
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
              "w-48 p-2 border rounded transition-all duration-300",
              isApiKeyError
                ? "border-red-500 bg-red-50"
                : "border-gray-300"
            )}
          />
          <Button
            onClick={onSaveApiKey}
            disabled={!apiKeyInput}
            className={cn(
              "h-10 rounded-full transition-all duration-300 ease-in-out",
              isApiKeyError && apiKeyInput
                ? "bg-red-500 hover:bg-red-600 text-white"
                : apiKeyInput
                  ? "bg-gray-200 hover:bg-gray-400 text-gray-800"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            <Key className="mr-2 h-4 w-4" /> Save Key
          </Button>
        </>
      )}
    </div>
  );
} 