export interface Note {
  id: string;
  date: string;
  transcription: string;
  clinicalNote: string;
  cost: number;
}

export type ViewMode = 'transcription' | 'clinical-note';
export type ProcessingSource = 'upload' | 'record' | null; 