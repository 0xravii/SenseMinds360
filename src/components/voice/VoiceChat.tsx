import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Square, Volume2, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface VoiceChatProps {
  sessionId: string;
  language?: string;
  onTranscription?: (text: string) => void;
  onResponse?: (response: any) => void;
}

export default function VoiceChat({ 
  sessionId, 
  language = 'en-IN',
  onTranscription,
  onResponse 
}: VoiceChatProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [demoMode, setDemoMode] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      if (typeof window !== 'undefined' && window.navigator) {
        if ('permissions' in navigator) {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');
        } else {
          // Fallback for browsers without permissions API
          try {
            if (window.navigator.mediaDevices) {
              await window.navigator.mediaDevices.getUserMedia({ audio: true });
              setPermissionStatus('granted');
            } else {
              setPermissionStatus('denied');
              setError('Media devices not supported in this browser.');
            }
          } catch (err) {
            setPermissionStatus('denied');
            if ((err as DOMException).name === 'NotAllowedError') {
              setError('Microphone access blocked. Please check browser settings or use HTTPS.');
            } else if ((err as DOMException).name === 'NotFoundError') {
              setError('No microphone found. Please connect a microphone device.');
            } else {
              setError('Microphone access denied. Please enable microphone access in your browser settings.');
            }
          }
        }
      } else {
        setPermissionStatus('denied');
        setError('This browser does not support microphone access.');
      }
    } catch (err) {
      console.error('Error checking microphone permission:', err);
      setPermissionStatus('denied');
      setError('Unable to check microphone permissions. Please ensure you\'re using a modern browser.');
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      if (typeof window !== 'undefined' && window.navigator && window.navigator.mediaDevices) {
        const stream = await window.navigator.mediaDevices.getUserMedia({ audio: true });
        setPermissionStatus('granted');
        setError(null);
        stream.getTracks().forEach(track => track.stop()); // Close the test stream
      } else {
        setPermissionStatus('denied');
        setError('Microphone access denied. Please enable microphone access in your browser settings.');
      }
    } catch (err) {
      setPermissionStatus('denied');
      setError('Microphone access denied. Please enable microphone access in your browser settings.');
    }
  };

  const resetMicrophonePermission = async () => {
    setPermissionStatus('prompt');
    setError(null);
    
    // Try to re-check permissions without forcing a reload
    try {
      await checkMicrophonePermission();
      if (permissionStatus === 'denied') {
        setError('Permission still denied. You may need to manually reset permissions in your browser settings, then refresh this page.');
      }
    } catch (err) {
      setError('Unable to check permissions. Please refresh the page and try again.');
    }
  };

  const showBrowserInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    let instruction = 'Please check your browser\'s microphone settings manually.';
    
    if (userAgent.includes('chrome')) {
      instruction = 'Chrome: Go to Settings → Privacy and security → Site Settings → Microphone';
    } else if (userAgent.includes('firefox')) {
      instruction = 'Firefox: Go to Settings → Privacy & Security → Permissions → Microphone';
    } else if (userAgent.includes('safari')) {
      instruction = 'Safari: Go to Safari → Settings → Websites → Microphone';
    } else if (userAgent.includes('edge')) {
      instruction = 'Edge: Go to Settings → Cookies and site permissions → Microphone';
    }
    
    setError(`Browser Settings: ${instruction}`);
  };

  const startRecording = async () => {
    try {
      let currentPermission = permissionStatus;
      
      if (currentPermission !== 'granted') {
        await requestMicrophonePermission();
        await checkMicrophonePermission();
        currentPermission = permissionStatus;
      }
      
      if (currentPermission !== 'granted') {
        return;
      }

      if (typeof window !== 'undefined' && window.navigator && window.navigator.mediaDevices) {
        const stream = await window.navigator.mediaDevices.getUserMedia({ audio: true });
        
        const options = { mimeType: 'audio/webm' };
        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await processAudio(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        setError(null);
      }
    } catch (err) {
      setError('Failed to start recording. Please check microphone permissions.');
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setTranscription('');
    setAssistantResponse('');
    setAudioUrl(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('sessionId', sessionId);
      formData.append('language', language);

      const response = await fetch('/api/v1/chat/voice', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.transcription) {
        setTranscription(data.transcription);
        if (onTranscription) {
          onTranscription(data.transcription);
        }
      }

      if (data.response) {
        setAssistantResponse(data.response);
        if (onResponse) {
          onResponse(data);
        }
      }

      if (data.audioUrl) {
        setAudioUrl(data.audioUrl);
      }

    } catch (err) {
      setError('Failed to process audio. Please try again.');
      console.error('Error processing audio:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(err => {
        setError('Failed to play audio.');
        console.error('Error playing audio:', err);
      });
    }
  };

  const runDemo = async () => {
    setDemoMode(true);
    setIsProcessing(true);
    setTranscription('');
    setAssistantResponse('');
    setAudioUrl(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const sampleTranscription = "What's the current system status?";
      setTranscription(sampleTranscription);
      if (onTranscription) {
        onTranscription(sampleTranscription);
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const sampleResponse = "All systems are operational. CPU usage is at 45%, memory usage at 60%, and all sensors are reporting normal values.";
      setAssistantResponse(sampleResponse);
      
      if (onResponse) {
        onResponse({
          transcription: sampleTranscription,
          response: sampleResponse,
          confidence: 0.95
        });
      }

    } catch (err) {
      setError('Demo failed. Please try again.');
      console.error('Demo error:', err);
    } finally {
      setIsProcessing(false);
      setDemoMode(false);
    }
  };

  const renderErrorAlert = (title: string, message: string) => (
    <Card className="bg-[#0B0F19]/50 border-[#23263B]">
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-[#E5E7EB]">{title}</h3>
            <p className="text-sm text-[#9CA3AF] mt-2">{message}</p>
          </div>
          <div className="space-y-2">
            <Button
              onClick={showBrowserInstructions}
              variant="outline"
              className="w-full border-[#23263B] text-[#9CA3AF] hover:bg-[#23263B] hover:text-[#E5E7EB]"
            >
              Show Settings Instructions
            </Button>
            <Button
              onClick={resetMicrophonePermission}
              variant="outline"
              className="w-full border-[#23263B] text-[#9CA3AF] hover:bg-[#23263B] hover:text-[#E5E7EB]"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Permissions
            </Button>
            <Button
              onClick={runDemo}
              variant="secondary"
              className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
            >
              Try Demo Mode
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (permissionStatus === 'denied') {
    return renderErrorAlert(
      "Microphone Access Denied",
      "Please enable microphone access in your browser settings."
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Card className="bg-red-900/20 border-red-900">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-[#0B0F19]/50 border-[#23263B]">
        <CardHeader>
          <CardTitle className="text-lg text-[#E5E7EB]">Voice Chat</CardTitle>
          <CardDescription className="text-[#9CA3AF]">
            Click the microphone to start recording
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing || permissionStatus !== 'granted'}
              size="lg"
              className={`rounded-full w-20 h-20 ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-[#8B5CF6] hover:bg-[#7C3AED]'
              }`}
              aria-label={isRecording ? 'Stop recording voice message' : 'Start recording voice message'}
              aria-pressed={isRecording}
              role="button"
            >
              {isRecording ? (
                <Square className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </Button>
          </div>

          {isProcessing && (
            <div className="text-center">
              <Badge variant="secondary" className="bg-[#8B5CF6]/20 text-[#8B5CF6]">
                Processing...
              </Badge>
            </div>
          )}

          {transcription && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-[#E5E7EB]">Transcription:</h4>
              <div className="bg-[#1A1F2E]/50 p-3 rounded-lg">
                <p className="text-sm text-[#E5E7EB]">{transcription}</p>
              </div>
            </div>
          )}

          {assistantResponse && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-[#E5E7EB]">Assistant Response:</h4>
              <div className="bg-[#1A1F2E]/50 p-3 rounded-lg">
                <p className="text-sm text-[#E5E7EB]">{assistantResponse}</p>
              </div>
            </div>
          )}

          {audioUrl && (
            <div className="flex justify-center">
              <Button
                onClick={playAudio}
                variant="outline"
                className="border-[#23263B] text-[#9CA3AF] hover:bg-[#23263B] hover:text-[#E5E7EB]"
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Play Response
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}