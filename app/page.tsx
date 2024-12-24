'use client'

import { useState, useRef, useEffect } from 'react'
import { Note, ViewMode, ProcessingSource } from '@/components/types'
import { ApiKeyInput } from '@/components/ApiKeyInput'
import { NotesList } from '@/components/NotesList'
import { NotePopup } from '@/components/NotePopup'
import { RecordingSection } from '@/components/RecordingSection'
import { TranscriptionView } from '@/components/TranscriptionView'
import { startRecording, stopRecording, getAudioBlob } from '@/components/audioUtils'
import { generateClinicalNote, calculateOpenAIApiCost } from '@/components/openaiUtils'

export default function MedicalScribe() {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isGeneratingNote, setIsGeneratingNote] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [savedApiKey, setSavedApiKey] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('clinical-note')
  const [clinicalNote, setClinicalNote] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [isApiKeyError, setIsApiKeyError] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [noteCost, setNoteCost] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingSource, setProcessingSource] = useState<ProcessingSource>(null)
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number | null>(null)

  const handleRecord = async () => {
    if (isRecording) {
      setIsRecording(false)
      setIsProcessing(true)
      setProcessingSource('record')
      await stopRecording(mediaRecorderRef)
      const audioBlob = getAudioBlob(audioChunksRef)
      if (audioBlob) {
        await processAudio(audioBlob)
      }
    } else {
      try {
        await startRecording(mediaRecorderRef, audioChunksRef)
        setIsRecording(true)
        setErrorMessage('')
      } catch (error) {
        console.error('Error starting recording:', error)
        setErrorMessage('Error starting recording. Please check your microphone permissions.')
      }
    }
  }

  const processAudio = async (audioData: Blob | File) => {
    if (!savedApiKey) {
      setErrorMessage('Please enter and save a valid OpenAI API key before recording.')
      setIsApiKeyError(true)
      setIsProcessing(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', audioData)
      formData.append('model', 'whisper-1')

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${savedApiKey}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Error transcribing audio. Status: ${response.status}`)
      }

      const data = await response.json()
      setTranscription(data.text)
      
      const clinicalNoteText = await generateClinicalNote(data.text, savedApiKey)
      setClinicalNote(clinicalNoteText)

      const cost = calculateOpenAIApiCost(
        data.text.split(' ').length,
        clinicalNoteText.split(' ').length
      )
      setNoteCost(cost)

      saveNote(data.text, clinicalNoteText, cost)
      setErrorMessage('')
      setIsApiKeyError(false)
    } catch (error) {
      console.error('Error processing audio:', error)
      setErrorMessage('Error processing audio. Please try again.')
    } finally {
      setIsProcessing(false)
      setProcessingSource(null)
    }
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('audio/')) {
        setUploadedFile(file)
        handleUploadedFile(file)
      } else {
        setErrorMessage('Please upload an audio file.')
      }
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('audio/')) {
        setUploadedFile(file)
        handleUploadedFile(file)
      } else {
        setErrorMessage('Please upload an audio file.')
      }
    }
    e.target.value = ''
  }

  const handleUploadedFile = async (file: File) => {
    if (!savedApiKey) {
      setErrorMessage('Please enter and save a valid OpenAI API key before uploading.')
      setIsApiKeyError(true)
      return
    }

    setIsProcessing(true)
    setProcessingSource('upload')
    setTranscription('')
    setClinicalNote('')
    setNoteCost(null)
    setErrorMessage('')
    setIsApiKeyError(false)

    await processAudio(file)
  }

  const saveNote = (newTranscription: string, newClinicalNote: string, newNoteCost: number) => {
    const newNote: Note = {
      id: Date.now().toString(),
      date: new Date().toLocaleString(),
      transcription: newTranscription,
      clinicalNote: newClinicalNote,
      cost: newNoteCost
    }
    setNotes(prevNotes => [newNote, ...prevNotes])
  }

  const copyToClipboard = () => {
    const textToCopy = viewMode === 'transcription' ? transcription : clinicalNote
    navigator.clipboard.writeText(textToCopy)
      .then(() => console.log('Copied to clipboard!'))
      .catch(err => console.error('Failed to copy: ', err))
  }

  const saveApiKey = () => {
    if (apiKeyInput) {
      setSavedApiKey(apiKeyInput)
      setApiKeyInput('')
      setErrorMessage('')
      setIsApiKeyError(false)
    }
  }

  const clearApiKey = () => {
    setSavedApiKey('')
    setApiKeyInput('')
  }

  const toggleView = () => {
    setViewMode(prevMode => prevMode === 'transcription' ? 'clinical-note' : 'transcription')
  }

  const openNotePopup = (note: Note) => {
    const index = notes.findIndex(n => n.id === note.id)
    setSelectedNote(note)
    setCurrentNoteIndex(index)
    setIsPopupOpen(true)
  }

  const closeNotePopup = () => {
    setSelectedNote(null)
    setIsPopupOpen(false)
  }

  const goToPreviousNote = () => {
    if (currentNoteIndex !== null && currentNoteIndex > 0) {
      const newIndex = currentNoteIndex - 1
      setSelectedNote(notes[newIndex])
      setCurrentNoteIndex(newIndex)
    }
  }

  const goToNextNote = () => {
    if (currentNoteIndex !== null && currentNoteIndex < notes.length - 1) {
      const newIndex = currentNoteIndex + 1
      setSelectedNote(notes[newIndex])
      setCurrentNoteIndex(newIndex)
    }
  }

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  return (
    <div className="flex flex-col h-screen bg-gray-200 text-gray-800">
      <header className="w-full p-6 border-b border-gray-300 bg-white flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-4xl mr-3" role="img" aria-label="Volunteer Medical Scribe Logo">🦸🏻‍⚕️</span>
          <h1 className="text-2xl font-semibold text-gray-900">Volunteer Medical Scribe</h1>
        </div>
      </header>
      <div className="flex flex-grow">
        <div className="w-1/2 flex flex-col border-r border-gray-300 bg-white">
          <div className="flex flex-grow">
            <div className="w-1/3 border-r border-gray-300 flex flex-col">
              <NotesList notes={notes} onNoteSelect={openNotePopup} />
            </div>
            <RecordingSection
              isProcessing={isProcessing}
              isRecording={isRecording}
              isDragging={isDragging}
              processingSource={processingSource}
              onRecord={handleRecord}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onFileSelect={handleFileInput}
            />
          </div>
          <footer className="p-6 border-t border-gray-300 bg-gray-50">
            <p className="text-sm text-gray-500 text-center">
              Record your medical notes or upload an audio file. The AI will transcribe and format them for you.
            </p>
          </footer>
        </div>
        <TranscriptionView
          viewMode={viewMode}
          transcription={transcription}
          clinicalNote={clinicalNote}
          errorMessage={errorMessage}
          onToggleView={toggleView}
          onCopyToClipboard={copyToClipboard}
          savedApiKey={savedApiKey}
          apiKeyInput={apiKeyInput}
          isApiKeyError={isApiKeyError}
          onApiKeyInputChange={setApiKeyInput}
          onSaveApiKey={saveApiKey}
          onClearApiKey={clearApiKey}
        />
      </div>
      {isPopupOpen && selectedNote && (
        <NotePopup
          note={selectedNote}
          currentNoteIndex={currentNoteIndex ?? 0}
          totalNotes={notes.length}
          onClose={closeNotePopup}
          onPrevious={goToPreviousNote}
          onNext={goToNextNote}
        />
      )}
    </div>
  )
}
