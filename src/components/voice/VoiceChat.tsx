// src/components/voice/VoiceChat.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { apiService } from '@/services/api';

interface VoiceChatProps {
  sessionId?: string;
  language?: string;
  onTranscription?: (text: string) => void;
  onResponse?: (response: any) => void;
}

export function VoiceChat({ 
  sessionId = 'demo', 
  language = 'en-IN',
  onTranscription,
  onResponse 
}: VoiceChatProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Cleanup audio URL on unmount
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendVoiceMessage(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Failed to access microphone. Please check permissions.');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const sendVoiceMessage = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('session_id', sessionId);
      formData.append('lang', language);
      
      console.log('Sending voice message:', { sessionId, language });
      const response = await apiService.sendVoiceMessage(formData);
      console.log('Voice API response:', response);
      
      // Extract transcription and response
      let transcribedText = '';
      let responseText = '';
      
      if (response && response.data) {
        transcribedText = response.data.transcription || response.data.user_message || '';
        
        if (response.data.findings && Array.isArray(response.data.findings)) {
          responseText = response.data.findings.join('\n');
        } else if (response.data.response) {
          responseText = response.data.response;
        }
      }
      
      setTranscription(transcribedText);
      setResponse(responseText);
      
      // Call callbacks
      if (onTranscription && transcribedText) {
        onTranscription(transcribedText);
      }
      if (onResponse && response) {
        onResponse(response);
      }
      
      // Generate TTS for the response
      if (responseText) {
        await generateTTS(responseText);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Voice processing failed';
      setError(errorMessage);
      console.error('Voice message error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateTTS = async (text: string) => {
    try {
      const ttsResponse = await apiService.generateTTS(text, language);
      
      if (ttsResponse && typeof ttsResponse === 'object' && 'audio_url' in ttsResponse) {
        setAudioUrl(ttsResponse.audio_url as string);
      } else if (ttsResponse instanceof Blob) {
        const url = URL.createObjectURL(ttsResponse);
        setAudioUrl(url);
      }
    } catch (err) {
      console.error('TTS generation error:', err);
      // Don't set error for TTS failu res, just log them
    }
  };

  const playAudio = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-[#0B0F19]/80 border-[#23263B]">
      <CardHeader>
        <CardTitle className="text-[#E5E7EB] flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Voice Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording Controls */}
        <div className="flex justify-center">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              disabled={isProcessing}
              className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-6 py-3 rounded-full"
              size="lg"
            >
              <Mic className="h-5 w-5 mr-2" />
              {isProcessing ? 'Processing...' : 'Start Recording'}
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full animate-pulse"
              size="lg"
            >
              <MicOff className="h-5 w-5 mr-2" />
              Stop Recording
            </Button>
          )}
        </div>

        {/* Transcription */}
        {transcription && (
          <div className="bg-[#1A1D29]/50 p-3 rounded-lg border border-[#23263B]">
            <p className="text-sm text-[#9CA3AF] mb-1">You said:</p>
            <p className="text-[#E5E7EB]">{transcription}</p>
          </div>
        )}

        {/* Response */}
        {response && (
          <div className="bg-[#1A1D29]/50 p-3 rounded-lg border border-[#23263B]">
            <p className="text-sm text-[#9CA3AF] mb-1">Assistant:</p>
            <p className="text-[#E5E7EB] whitespace-pre-line">{response}</p>
          </div>
        )}

        {/* Audio Playback */}
        {audioUrl && (
          <div className="flex justify-center gap-2">
            <Button
              onClick={isPlaying ? pauseAudio : playAudio}
              variant="outline"
              size="sm"
              className="border-[#23263B] text-[#E5E7EB] hover:bg-[#23263B]"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isPlaying ? 'Pause' : 'Play Response'}
            </Button>
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              onPause={() => setIsPlaying(false)}
            />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 p-3 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Status Indicator */}
        <div className="text-center">
          <p className="text-xs text-[#9CA3AF]">
            {isRecording && 'Recording... Speak now'}
            {isProcessing && 'Processing your message...'}
            {!isRecording && !isProcessing && 'Ready to record'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default VoiceChat;