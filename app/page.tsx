'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Mic, Copy, Loader2, Key, X, Plus, Upload, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Note {
  id: string;
  date: string;
  transcription: string;
  clinicalNote: string;
  cost: number;
}

export default function MedicalScribe() {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isGeneratingNote, setIsGeneratingNote] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [savedApiKey, setSavedApiKey] = useState('')
  const [viewMode, setViewMode] = useState<'transcription' | 'clinical-note'>('clinical-note')
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
  const [processingSource, setProcessingSource] = useState<'upload' | 'record' | null>(null)
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number | null>(null)

  const handleRecord = async () => {
    try {
      if (isRecording) {
        setIsRecording(false)
        setIsProcessing(true)
        setProcessingSource('record')
        mediaRecorderRef.current?.stop()
      } else {
        if (!savedApiKey) {
          setErrorMessage('Please enter and save a valid OpenAI API key before recording.')
          setIsApiKeyError(true)
          return
        }
        setIsRecording(true)
        setIsProcessing(true)
        setProcessingSource('record')
        // Clear the current transcription and clinical note
        setTranscription('')
        setClinicalNote('')
        setErrorMessage('')
        setIsApiKeyError(false)
        audioChunksRef.current = []

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data)
        }

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          await processAudio(audioBlob)
        }

        mediaRecorder.start()
      }
    } catch (error) {
      console.error('Error in recording process:', error)
      setIsRecording(false)
      setIsProcessing(false)
      setProcessingSource(null)
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.')
    }
  }

  const processAudio = async (audioFile: Blob | File) => {
    try {
      const result = await transcribeAudio(audioFile)
      if (result) {
        const { transcription, clinicalNote, cost } = result
        // Always create a new note
        saveNote(transcription, clinicalNote, cost)
        // Update the current display
        setTranscription(transcription)
        setClinicalNote(clinicalNote)
        setNoteCost(cost)
      }
    } catch (error) {
      console.error('Error processing audio:', error)
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.')
    } finally {
      setIsProcessing(false)
      setProcessingSource(null)
      setIsRecording(false)
    }
  }

  const transcribeAudio = async (audioFile: Blob | File): Promise<{ transcription: string, clinicalNote: string, cost: number } | null> => {
    if (!savedApiKey) {
      setErrorMessage('Please enter and save a valid OpenAI API key before transcribing.')
      setIsProcessing(false)
      setIsApiKeyError(true)
      return null
    }

    const formData = new FormData()
    formData.append('file', audioFile, 'audio.webm')
    formData.append('model', 'whisper-1')

    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${savedApiKey}`,
        },
        body: formData,
      })

      if (!response.ok) {
        if (response.status === 401) {
          setErrorMessage('Invalid API key. Please check your OpenAI API key and try again.')
          setIsApiKeyError(true)
          setSavedApiKey('')
        } else {
          setErrorMessage(`HTTP error! status: ${response.status}`)
        }
        return null
      }

      const data = await response.json()
      setErrorMessage('')
      const transcription = data.text
      const clinicalNote = await generateClinicalNote(transcription)
      const cost = calculateOpenAIApiCost(transcription.split(/\s+/).length, clinicalNote.split(/\s+/).length, "gpt-4o")
      
      return { transcription, clinicalNote, cost }
    } catch (error) {
      console.error('Error in transcription:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Error processing audio. Please try again.')
      setIsApiKeyError(true)
      setSavedApiKey('')
      return null
    }
  }

  const generateClinicalNote = async (transcriptionText: string): Promise<string> => {
    if (!savedApiKey || !transcriptionText) {
      setErrorMessage('API key or transcription is missing')
      return ''
    }

    setIsGeneratingNote(true)

    const systemPrompt = `
      Format transcribed patient-provider conversations into a structured clinical note.

      The input will be a transcription of a patient-provider conversation. Your goal is to extract and format relevant clinical information from the transcription into a clear and structured clinical note. Ensure accuracy and completeness, capturing pertinent details while adhering to standard medical documentation practices.

      # Steps

      1. **Identify Key Components:**
        - Extract important information such as Chief Complaint, History of Present Illness, Past Medical History, Medications, Allergies, Physical Examination findings, Assessment, and Plan.
        
      2. **Clinical Note Structure:**
        - Format the extracted information succinctly and accurately into the following sections:
          - **Subjective:** Include Chief Complaint, History of Present Illness, Past Medical History, Medications, and Allergies.
          - **Objective:** Present Physical Examination findings and any relevant test results.
          - **Assessment:** Summarize the provider’s assessment or diagnosis of the patient’s condition.
          - **Plan:** Outline the proposed treatment plan or follow-up actions.

      3. **Ensure Clarity and Accuracy:**
        - Use medical terminology appropriately.
        - Maintain patient confidentiality by anonymizing data where necessary.

      # Output Format

      The output should be a structured clinical note containing the following sections:
      - **Subjective:** [Details in complete sentences or bullet points]
      - **Objective:** [Findings in complete sentences or bullet points]
      - **Assessment:** [A concise summary of the diagnosis]
      - **Plan:** [A clear outline of next steps or treatments]

      # Examples

      **Example 1:**

      **Input:**
      "Patient states they have been experiencing a persistent cough for two weeks. Reports no fever but has wheezing. Denies any known allergies. Takes lisinopril for hypertension."

      **Output:**
      - **Subjective:** 
        - Chief Complaint: Persistent cough for two weeks.
        - History of Present Illness: No fever, presence of wheezing.
        - Past Medical History: Hypertension.
        - Medications: Lisinopril.
        - Allergies: Denied.
      - **Objective:** [Placeholder for Physical Examination findings]
      - **Assessment:** [Placeholder for Assessment]
      - **Plan:** [Placeholder for Plan]

      (Real examples should contain additional details and specific information based on the actual transcription content.)

      # Notes

      - Pay attention to ambiguities in spoken language and clarify where possible.
      - Handle omitted information thoughtfully, noting where details are unavailable or not provided in the conversation.
    `
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${savedApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o-2024-08-06",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: transcriptionText }
          ],
          temperature: 0.2,
        }),
      })

      if (!response.ok) {
        setErrorMessage(`Error generating clinical note. Status: ${response.status}`)
        return ''
      }

      const data = await response.json()
      setErrorMessage('')
      return data.choices[0].message.content
    } catch (error) {
      console.error('Error generating clinical note:', error)
      setErrorMessage('Error generating clinical note. Please try again.')
      return ''
    } finally {
      setIsGeneratingNote(false)
    }
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

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const calculateOpenAIApiCost = (inputWords: number, outputWords: number, model: string = 'gpt-4o') => {
    const tokenCosts: {[key: string]: {input: number, output: number}} = {
      'gpt-4o': { input: 0.0025 / 1000, output: 0.01 / 1000 },
      // You can add other models here if needed
    };

    if (!(model in tokenCosts)) {
      throw new Error(`Unsupported model: ${model}`);
    }

    // Convert words to tokens (1 word ≈ 1.3 tokens)
    const inputTokens = inputWords * 1.3;
    const outputTokens = outputWords * 1.3;

    const inputCost = inputTokens * tokenCosts[model].input;
    const outputCost = outputTokens * tokenCosts[model].output;
    const totalCost = inputCost + outputCost;

    return totalCost;
  };

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
    // Clear the file input so the same file can be uploaded again
    e.target.value = ''
  }

  const handleUploadedFile = async (file: File) => {
    if (!savedApiKey) {
      setErrorMessage('Please enter and save a valid OpenAI API key before uploading.')
      setIsApiKeyError(true)
      return
    }

    // Always clear the current note and start processing
    setIsProcessing(true)
    setProcessingSource('upload')
    setTranscription('')
    setClinicalNote('')
    setNoteCost(null)
    setErrorMessage('')
    setIsApiKeyError(false)

    // Process the new file
    await processAudio(file)
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
              <div className="flex-grow overflow-auto p-4">
                <h2 className="text-xl font-semibold mb-4">Previous Notes</h2>
                {notes.map(note => (
                  <div 
                    key={note.id} 
                    className="mb-2 p-2 bg-gray-50 rounded shadow cursor-pointer hover:bg-gray-100"
                    onClick={() => openNotePopup(note)}
                  >
                    {note.date}
                  </div>
                ))}
              </div>
            </div>
            <div className="w-2/3 flex flex-col">
              <div className="flex-grow flex flex-col justify-center items-center p-6 space-y-8">
                <div className="flex space-x-8">
                  <div 
                    className={cn(
                      "w-48 h-48 rounded-full flex flex-col justify-center items-center cursor-pointer transition-all duration-300 ease-in-out",
                      isDragging 
                        ? "bg-blue-500 text-white" 
                        : isProcessing || isRecording
                          ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                    )}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => !isProcessing && !isRecording && document.getElementById('file-input')?.click()}
                  >
                    {isProcessing && processingSource === 'upload' ? (
                      <Loader2 className="h-24 w-24 animate-spin" />
                    ) : (
                      <Upload className="h-24 w-24" />
                    )}
                    <input 
                      id="file-input"
                      type="file" 
                      accept="audio/*" 
                      className="hidden" 
                      onChange={handleFileInput}
                      disabled={isProcessing || isRecording}
                    />
                  </div>
                  <div className="relative w-48 h-48">
                    <Button
                      onClick={handleRecord}
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
                        <Loader2 className="h-24 w-24 animate-spin" />
                      ) : isProcessing && processingSource === 'record' ? (
                        <Loader2 className="h-24 w-24 animate-spin" />
                      ) : (
                        <Mic className="h-24 w-24" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-2xl font-medium text-gray-600 text-center">
                  {isRecording ? 'Recording...' : isProcessing ? 'Transcribing...' : 'Upload an audio file or start recording'}
                </p>
              </div>
            </div>
          </div>
          <footer className="p-6 border-t border-gray-300 bg-gray-50">
            <p className="text-sm text-gray-500 text-center">
              Record your medical notes or upload an audio file. The AI will transcribe and format them for you.
            </p>
          </footer>
        </div>
        <div className="w-1/2 flex flex-col bg-white">
          <div className="p-6 border-b border-gray-300">
            <h2 className="text-xl font-semibold text-gray-900">
              {viewMode === 'transcription' ? 'Transcription' : 'Clinical Note'}
            </h2>
          </div>
          <div className="flex-grow p-6 flex flex-col relative">
            <div className="flex-grow overflow-auto mb-16">
              {errorMessage ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                  <span className="block sm:inline">{errorMessage}</span>
                </div>
              ) : (
                <Textarea
                  value={viewMode === 'transcription' ? transcription : clinicalNote}
                  readOnly
                  className="w-full h-full resize-none bg-gray-50 border-gray-300 text-gray-800 p-4"
                  placeholder={viewMode === 'transcription' ? "Transcription will appear here..." : "Clinical note will appear here..."}
                />
              )}
            </div>
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center">
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
                      onClick={clearApiKey}
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKeyInput(e.target.value)}
                      className={cn(
                        "w-48 p-2 border rounded transition-all duration-300",
                        isApiKeyError
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300"
                      )}
                    />
                    <Button
                      onClick={saveApiKey}
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
              <div className="flex space-x-2">
                <Button 
                  onClick={toggleView}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                >
                  {viewMode === 'transcription' ? 'Clinical Note' : 'Transcription'}
                </Button>
                <Button 
                  onClick={copyToClipboard}
                  disabled={!transcription && !clinicalNote}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                >
                  <Copy className="mr-2 h-4 w-4" /> Copy to Clipboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isPopupOpen && selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-3/4 h-3/4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">{selectedNote.date}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Estimated cost: ${selectedNote.cost.toFixed(4)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={goToPreviousNote}
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
                  onClick={goToNextNote}
                  disabled={currentNoteIndex === notes.length - 1}
                  className={cn(
                    "p-2 rounded-full transition-colors duration-200",
                    currentNoteIndex === notes.length - 1
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button onClick={closeNotePopup} className="bg-gray-200 hover:bg-gray-300 text-gray-800 p-2 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-grow flex space-x-4">
              <Textarea
                value={selectedNote.transcription}
                readOnly
                className="flex-1 resize-none bg-white border-gray-300 text-gray-800 p-4"
              />
              <Textarea
                value={selectedNote.clinicalNote}
                readOnly
                className="flex-1 resize-none bg-white border-gray-300 text-gray-800 p-4"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
