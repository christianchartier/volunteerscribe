import React from 'react';
import { Note } from './types';

interface NotesListProps {
  notes: Note[];
  onNoteSelect: (note: Note) => void;
}

export function NotesList({ notes, onNoteSelect }: NotesListProps) {
  return (
    <div className="flex-grow overflow-auto p-3">
      <h2 className="text-lg font-semibold mb-3">Previous Notes</h2>
      {notes.map(note => (
        <div 
          key={note.id} 
          className="mb-2 p-2 bg-gray-50 rounded shadow cursor-pointer hover:bg-gray-100 text-sm"
          onClick={() => onNoteSelect(note)}
        >
          {note.date}
        </div>
      ))}
    </div>
  );
} 