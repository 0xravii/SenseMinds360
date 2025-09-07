// src/components/assistant/CollapsibleChatInterface.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, MessageSquare, Bot, Mic, Plus, History, X, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/services/api';
import VoiceChat from '@/components/voice/VoiceChat';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
};

interface CollapsibleChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CollapsibleChatInterface({ isOpen, onClose }: CollapsibleChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('text');
  const [sessionId, setSessionId] = useState<string>('demo');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleVoiceTranscription = (text: string) => {
    const newUserMessage: Message = { 
      id: Date.now().toString(), 
      text: `🎤 ${text}`, 
      sender: 'user' 
    };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
  };

  const handleVoiceResponse = (response: any) => {
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
      const response = await apiService.sendChatQuery(input, sessionId);
      
      let responseText = 'No response received';
      
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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Chat Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`fixed z-50 ${
              isMinimized 
                ? 'bottom-4 right-16 sm:bottom-6 sm:right-20 w-72 sm:w-80 h-16' 
                : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 max-w-md h-[70vh] sm:h-[600px]'
            } transition-all duration-300`}
          >
            <Card className={`h-full flex flex-col bg-[#0B0F19]/95 backdrop-blur-xl border-2 border-[#8B5CF6]/30 rounded-2xl shadow-2xl overflow-hidden ${
              isMinimized ? '' : 'shadow-[0_0_50px_rgba(139,92,246,0.3)]'
            }`}>
              {/* Gradient border effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#8B5CF6]/20 to-[#EC4899]/20 p-[1px]">
                <div className="w-full h-full bg-[#0B0F19]/95 rounded-2xl" />
              </div>
              
              {/* Header */}
              <CardHeader className="relative pb-3 px-4 border-b border-[#23263B]/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] rounded-full flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-white" />
                      </div>
                      {/* AI status indicator */}
                      <div className="absolute -top-1 -right-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping" />
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                        AI Assistant
                        <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" />
                      </CardTitle>
                      {!isMinimized && (
                        <p className="text-xs text-[#9CA3AF] mt-0.5">Session: {sessionId}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {!isMinimized && (
                      <>
                        <Button
                          onClick={createNewSession}
                          variant="ghost"
                          size="sm"
                          className="text-[#9CA3AF] hover:bg-[#23263B] hover:text-white h-8 w-8 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => loadChatHistory(sessionId)}
                          variant="ghost"
                          size="sm"
                          disabled={isLoadingHistory}
                          className="text-[#9CA3AF] hover:bg-[#23263B] hover:text-white h-8 w-8 p-0"
                        >
                          <History className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    <Button
                      onClick={() => setIsMinimized(!isMinimized)}
                      variant="ghost"
                      size="sm"
                      className="text-[#9CA3AF] hover:bg-[#23263B] hover:text-white h-8 w-8 p-0"
                    >
                      {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                    </Button>
                    <Button
                      onClick={onClose}
                      variant="ghost"
                      size="sm"
                      className="text-[#9CA3AF] hover:bg-red-500 hover:text-white h-8 w-8 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {/* Content - only show when not minimized */}
              {!isMinimized && (
                <CardContent className="relative flex-1 overflow-hidden p-0">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 bg-[#1A1D29]/50 border-b border-[#23263B]/50 rounded-none">
                      <TabsTrigger 
                        value="text" 
                        className="data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white text-[#9CA3AF] text-sm"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Text Chat
                      </TabsTrigger>
                      <TabsTrigger 
                        value="voice" 
                        className="data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white text-[#9CA3AF] text-sm"
                      >
                        <Mic className="h-4 w-4 mr-2" />
                        Voice Chat
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="text" className="mt-0 flex-1 flex flex-col">
                      <ScrollArea className="flex-1 p-4">
                        {messages.length === 0 ? (
                          <div className="text-center py-8">
                            <Bot className="w-8 h-8 text-[#9CA3AF] mx-auto mb-3" />
                            <p className="text-sm text-[#9CA3AF]">Ask me anything about your system</p>
                            <div className="flex justify-center mt-2">
                              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {messages.map((message) => (
                              <motion.div 
                                key={message.id} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                                    message.sender === 'user'
                                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white rounded-br-none shadow-lg'
                                      : 'bg-[#1A1F2E]/80 text-[#E5E7EB] border border-[#23263B] rounded-bl-none backdrop-blur-sm'
                                  }`}
                                >
                                  <div className="break-words">{message.text}</div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                      <div className="flex gap-2 p-4 border-t border-[#23263B]/50">
                        <Input
                          placeholder="Ask about alerts, sensors, or system status..."
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSendMessage();
                            }
                          }}
                          className="bg-[#1A1F2E]/50 border-[#23263B] text-white placeholder-[#9CA3AF] focus:border-[#8B5CF6] text-sm backdrop-blur-sm"
                        />
                        <Button 
                          onClick={handleSendMessage}
                          className="bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] hover:from-[#7C3AED] hover:to-[#DB2777] text-white px-4 shadow-lg"
                          size="sm"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="voice" className="mt-0 p-4 flex-1">
                      <VoiceChat
                        sessionId={sessionId}
                        language="en-IN"
                        onTranscription={handleVoiceTranscription}
                        onResponse={handleVoiceResponse}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              )}
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}