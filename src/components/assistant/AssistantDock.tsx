// src/components/assistant/AssistantDock.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, MessageSquare, Bot, Mic, Plus, History } from 'lucide-react';
import { apiService } from '@/services/api';
import { VoiceChat } from '@/components/voice/VoiceChat';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
};

export function AssistantDock() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('text');
  const [sessionId, setSessionId] = useState<string>('demo');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const handleVoiceTranscription = (text: string) => {
    // Add transcribed text as user message
    const newUserMessage: Message = { 
      id: Date.now().toString(), 
      text: `🎤 ${text}`, 
      sender: 'user' 
    };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
  };

  const handleVoiceResponse = (response: any) => {
    // Handle voice response similar to text response
    let responseText = 'No response received';
    
    if (response && response.data && response.data.findings && Array.isArray(response.data.findings)) {
      responseText = response.data.findings.join('\n');
    } else if (response && response.data && response.data.response) {
      responseText = response.data.response;
    }
    
    const aiResponse: Message = { 
      id: Date.now().toString() + '-ai', 
      text: `🔊 ${responseText}`, 
      sender: 'ai' 
    };
    setMessages((prevMessages) => [...prevMessages, aiResponse]);
  };

  const createNewSession = async () => {
    try {
      const session = await apiService.createChatSession();
      if (session && session.id) {
        setSessionId(session.id);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to create new session:', error);
    }
  };

  const loadChatHistory = async (sessionId: string) => {
    try {
      setIsLoadingHistory(true);
      const history = await apiService.getChatHistory(sessionId);
      
      if (history && history.messages) {
        const formattedMessages: Message[] = history.messages.map((msg: any, index: number) => ({
          id: `${sessionId}-${index}`,
          text: msg.content,
          sender: msg.role === 'user' ? 'user' : 'ai'
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const newUserMessage: Message = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInput('');

    try {
      console.log('Sending chat message:', input);
      const response = await apiService.sendChatQuery(input, sessionId);
      console.log('Raw API response:', response);
      
      // Handle different response structures
      let responseText = 'No response received';
      
      // Handle the API response structure: {data: {findings: [...], confidence: ..., ...}}
      if (response && response.data && response.data.findings && Array.isArray(response.data.findings)) {
        responseText = response.data.findings.join('\n');
      } else if (response && response.data && response.data.response && response.data.response.content) {
        responseText = response.data.response.content;
      } else if (response && response.response) {
        responseText = response.response;
      } else if (response && response.answer) {
        responseText = response.answer;
      } else if (response && response.message) {
        responseText = response.message;
      } else if (response && response.data && typeof response.data === 'string') {
        responseText = response.data;
      } else if (typeof response === 'string') {
        responseText = response;
      } else if (response && typeof response === 'object') {
        // Try to find any string field in the response
        const stringFields = Object.values(response).filter(v => typeof v === 'string');
        if (stringFields.length > 0) {
          responseText = stringFields[0];
        } else {
          responseText = JSON.stringify(response);
        }
      }
      
      const aiResponse: Message = { 
        id: Date.now().toString() + '-ai', 
        text: responseText, 
        sender: 'ai' 
      };
      setMessages((prevMessages) => [...prevMessages, aiResponse]);
    } catch (error) {
      console.error('Chat API error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorResponse: Message = { 
        id: Date.now().toString() + '-ai', 
        text: `Sorry, I encountered an error: ${errorMessage}`, 
        sender: 'ai' 
      };
      setMessages((prevMessages) => [...prevMessages, errorResponse]);
    }
  };

  return (
    <Card className="h-full flex flex-col bg-[#1A1F2E]/90 border border-[#23263B] rounded-xl shadow-lg">
      <CardHeader className="pb-3 px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-[#E5E7EB] uppercase tracking-wide flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#8B5CF6]" />
            AI Assistant
          </CardTitle>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              onClick={createNewSession}
              variant="outline"
              size="sm"
              className="border-[#23263B] text-[#9CA3AF] hover:bg-[#23263B] hover:text-[#E5E7EB] text-xs px-2 sm:px-3"
            >
              <Plus className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">New</span>
            </Button>
            <Button
              onClick={() => loadChatHistory(sessionId)}
              variant="outline"
              size="sm"
              disabled={isLoadingHistory}
              className="border-[#23263B] text-[#9CA3AF] hover:bg-[#23263B] hover:text-[#E5E7EB] text-xs px-2 sm:px-3"
            >
              <History className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">{isLoadingHistory ? 'Loading...' : 'History'}</span>
            </Button>
          </div>
        </div>
        <p className="text-xs text-[#9CA3AF] mt-1">Session: {sessionId}</p>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 bg-[#1A1D29] border-b border-[#23263B] rounded-none">
            <TabsTrigger 
              value="text" 
              className="data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white text-[#9CA3AF] px-2 sm:px-4 text-xs sm:text-sm"
            >
              <MessageSquare className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Text Chat</span>
              <span className="xs:hidden">Text</span>
            </TabsTrigger>
            <TabsTrigger 
              value="voice" 
              className="data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white text-[#9CA3AF] px-2 sm:px-4 text-xs sm:text-sm"
            >
              <Mic className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Voice Chat</span>
              <span className="xs:hidden">Voice</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="text" className="mt-0 flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-2 sm:p-4">
              {messages.length === 0 ? (
                <div className="text-center py-4 sm:py-8">
                  <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-[#9CA3AF] mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-[#9CA3AF] px-2">Ask me anything about your system</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] sm:max-w-[80%] px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm ${
                          message.sender === 'user'
                            ? 'bg-[#8B5CF6] text-white rounded-br-none'
                            : 'bg-[#0B0F19]/50 text-[#E5E7EB] border border-[#23263B] rounded-bl-none'
                        }`}
                      >
                        <div className="break-words">{message.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="flex gap-1 sm:gap-2 p-2 sm:p-4 border-t border-[#23263B]">
              <Input
                placeholder="Ask about alerts, sensors, or system status..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
                className="bg-[#0B0F19]/50 border-[#23263B] text-[#E5E7EB] placeholder-[#9CA3AF] focus:border-[#8B5CF6] text-sm h-9 sm:h-10"
              />
              <Button 
                onClick={handleSendMessage}
                className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white h-9 sm:h-10 px-2 sm:px-3 min-w-[36px] sm:min-w-[40px]"
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="voice" className="mt-0 p-2 sm:p-4 flex-1">
            <VoiceChat
              sessionId={sessionId}
              language="en-IN"
              onTranscription={handleVoiceTranscription}
              onResponse={handleVoiceResponse}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}