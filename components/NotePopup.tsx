import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Note } from './types';

interface NotePopupProps {
  note: Note;
  currentNoteIndex: number;
  totalNotes: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function NotePopup({
  note,
  currentNoteIndex,
  totalNotes,
  onClose,
  onPrevious,
  onNext,
}: NotePopupProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-3/4 h-3/4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">{note.date}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Estimated cost: ${note.cost.toFixed(4)}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={onPrevious}
              disabled={currentNoteIndex === 0}
              className={cn(
                "p-2 rounded-full transition-colors duration-200",
                currentNoteIndex === 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={onNext}
              disabled={currentNoteIndex === totalNotes - 1}
              className={cn(
                "p-2 rounded-full transition-colors duration-200",
                currentNoteIndex === totalNotes - 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button 
              onClick={onClose} 
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 p-2 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-grow flex space-x-4">
          <Textarea
            value={note.transcription}
            readOnly
            className="flex-1 resize-none bg-white border-gray-300 text-gray-800 p-4"
          />
          <Textarea
            value={note.clinicalNote}
            readOnly
            className="flex-1 resize-none bg-white border-gray-300 text-gray-800 p-4"
          />
        </div>
      </div>
    </div>
  );
} 