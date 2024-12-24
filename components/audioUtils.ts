export const startRecording = async (
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>,
  audioChunksRef: React.MutableRefObject<Blob[]>
): Promise<void> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.start();
  } catch (error) {
    console.error('Error starting recording:', error);
    throw error;
  }
};

export const stopRecording = (
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>
): Promise<void> => {
  return new Promise((resolve) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        resolve();
      };
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    } else {
      resolve();
    }
  });
};

export const getAudioBlob = (
  audioChunksRef: React.MutableRefObject<Blob[]>
): Blob | null => {
  if (audioChunksRef.current.length === 0) return null;
  return new Blob(audioChunksRef.current, { type: 'audio/webm' });
}; 