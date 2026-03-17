import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Question, UserResponse, ChatMessage, AISettings } from '../types';
import { streamChat, mockStreamChat, QuestionContext, BankMeta } from '../services/aiClient';
import { MarkdownRenderer } from './MarkdownRenderer';

// 统一聊天窗口宽度常量
const DOCK_W = 480;

// Media query hook for dock mode detection
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  question: Question;
  userResponse: UserResponse;
  aiSettings?: AISettings;
  inline?: boolean;
  onChatHistoryUpdate?: (questionId: string, history: ChatMessage[]) => void;
  bankMeta?: BankMeta;
  questionContext?: QuestionContext;
  bankId?: string;
}

interface ExtendedChatMessage extends ChatMessage {
  status?: 'streaming' | 'done' | 'error';
}

// AI 消息组件
const AIMessage: React.FC<{ text: string; status?: 'streaming' | 'done' | 'error' }> = ({ text, status }) => {
  if (status === 'error') {
    return (
      <div className="text-sm" style={{ color: 'var(--danger)' }}>
        {text || 'AI 回复失败'}
      </div>
    );
  }
  return <MarkdownRenderer content={text} className="text-sm leading-relaxed" />;
};

export const ChatDrawer: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  question, 
  userResponse, 
  aiSettings, 
  inline = false, 
  onChatHistoryUpdate,
  bankMeta,
  questionContext: providedContext,
  bankId
}) => {
  const isWide = useMediaQuery('(min-width: 1100px)');

  const [history, setHistory] = useState<ExtendedChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMultiline, setIsMultiline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);
  const isUserScrolling = useRef(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const questionContext: QuestionContext = providedContext || {
    questionId: question.id,
    stem: question.content,
    options: question.options,
    userAnswer: userResponse.userAnswer,
    isCorrect: userResponse.isCorrect,
    analysis: question.explanation
  };

  if (!providedContext) {
    if (question.type === 'single_choice') {
      questionContext.correctAnswer = question.answer.correct_option_key;
    } else if (question.type === 'multiple_choice') {
      questionContext.correctAnswer = question.answer.correct_option_keys;
    } else if (question.type === 'true_false') {
      questionContext.correctAnswer = question.answer.correct_boolean;
    } else if (question.type === 'fill_blank') {
      questionContext.correctAnswer = question.answer.expected_answers;
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    const storageKey = bankId 
      ? `qb_chat_${bankId}_${question.id}`
      : `qb_chat_${question.id}`;
    
    const savedHistory = localStorage.getItem(storageKey);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory) as ExtendedChatMessage[];
        setHistory(parsed);
      } catch (e) {
        console.error('Failed to load chat history', e);
        setHistory([]);
      }
    } else {
      const welcomeMsg: ExtendedChatMessage = {
        role: 'model',
        text: `你好！我是你的${aiSettings?.roleName || 'AI 助教'}。我看这道题你答${userResponse.isCorrect ? '对了，真棒！' : '错了'}。关于这道题的 **${question.explanation ? '知识点' : '内容'}**，你有什么想问的吗？`,
        timestamp: Date.now(),
        status: 'done'
      };
      setHistory([welcomeMsg]);
      saveChatHistory([welcomeMsg]);
    }
  }, [isOpen, question.id, bankId]);

  const saveChatHistory = (newHistory: ExtendedChatMessage[]) => {
    const storageKey = bankId 
      ? `qb_chat_${bankId}_${question.id}`
      : `qb_chat_${question.id}`;
    
    localStorage.setItem(storageKey, JSON.stringify(newHistory));
    
    if (onChatHistoryUpdate) {
      onChatHistoryUpdate(question.id, newHistory.map(m => ({
        role: m.role,
        text: m.text,
        timestamp: m.timestamp
      })));
    }
  };

  // 自动滚动到底部（仅在用户未手动滚动时）
  useEffect(() => {
    if (shouldAutoScroll.current && !isUserScrolling.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);

  // 监听滚动，用户滚动时停止自动跟随
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let scrollTimeout: number | null = null;
    
    const handleScroll = () => {
      isUserScrolling.current = true;
      
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      shouldAutoScroll.current = isNearBottom;
      
      if (scrollTimeout !== null) {
        clearTimeout(scrollTimeout);
      }
      
      scrollTimeout = window.setTimeout(() => {
        isUserScrolling.current = false;
      }, 500);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeout !== null) {
        clearTimeout(scrollTimeout);
      }
    };
  }, []);

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    
    abortControllerRef.current = new AbortController();
    
    const userMsg: ExtendedChatMessage = { 
      role: 'user', 
      text: text.trim(), 
      timestamp: Date.now(),
      status: 'done'
    };
    
    const newHistory = [...history, userMsg];
    setHistory(newHistory);
    saveChatHistory(newHistory);
    setInput('');
    setLoading(true);
    setIsStreaming(true);
    shouldAutoScroll.current = true;
    isUserScrolling.current = false;

    const aiMsg: ExtendedChatMessage = {
      role: 'model',
      text: '●',
      timestamp: Date.now(),
      status: 'streaming'
    };
    
    const streamingHistory = [...newHistory, aiMsg];
    setHistory(streamingHistory);

    try {
      const apiHistory: Array<{ role: 'user' | 'assistant'; content: string }> = history
        .filter(m => m.status !== 'streaming')
        .map(m => {
          let content = m.text || '';
          content = content.replace(/●/g, '');
          content = content.replace(/[\uD800-\uDFFF]/g, '');
          return {
            role: m.role === 'model' ? 'assistant' : 'user',
            content: content
          };
        });

      const apiKey = localStorage.getItem('qb_api_key');
      const useStream = !!apiKey;

      const commonParams: import('../services/aiClient').StreamChatPayload = {
        bankMeta,
        questionContext,
        messages: [...apiHistory, { role: 'user' as const, content: text.trim() }],
        aiSettings
      };

      const onSnapshot = (snapshot: string) => {
        setHistory(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === 'model' && lastMsg.status === 'streaming') {
            lastMsg.text = snapshot + '●';
          }
          return updated;
        });
      };

      const options = { signal: abortControllerRef.current.signal };

      if (useStream) {
        await streamChat(commonParams, onSnapshot, options);
      } else {
        await mockStreamChat(commonParams, onSnapshot, options);
      }

      setHistory(prev => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.role === 'model') {
          if (lastMsg.text.endsWith('●')) {
            lastMsg.text = lastMsg.text.slice(0, -1);
          }
          lastMsg.status = 'done';
        }
        return updated;
      });

      setHistory(prev => {
        saveChatHistory(prev);
        return prev;
      });

    } catch (e) {
      if ((e as Error).message === '用户已取消') {
        setHistory(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === 'model' && lastMsg.status === 'streaming') {
            if (lastMsg.text.endsWith('●')) {
              lastMsg.text = lastMsg.text.slice(0, -1);
            }
            if (!lastMsg.text.trim()) {
              lastMsg.text = '（已停止生成）';
            }
            lastMsg.status = 'done';
          }
          return updated;
        });
        setHistory(prev => {
          saveChatHistory(prev);
          return prev;
        });
      } else {
        console.error('Chat Error', e);
        const errorMsg: ExtendedChatMessage = {
          role: 'model',
          text: `连接 AI 失败：${e instanceof Error ? e.message : '未知错误'}`,
          timestamp: Date.now(),
          status: 'error'
        };
        const updatedHistory = [...newHistory, errorMsg];
        setHistory(updatedHistory);
        saveChatHistory(updatedHistory);
      }
    } finally {
      setLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const retryLastMessage = () => {
    const lastUserMsg = [...history].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      const newHistory = history.filter((m, idx) => {
        if (m.role === 'model' && idx > history.indexOf(lastUserMsg)) {
          return false;
        }
        return true;
      });
      setHistory(newHistory);
      saveChatHistory(newHistory);
      sendMessage(lastUserMsg.text);
    }
  };

  const clearChatHistory = () => {
    if (window.confirm('确定要清除当前题目的聊天记录吗？')) {
      setHistory([]);
      const storageKey = bankId 
        ? `qb_chat_${bankId}_${question.id}`
        : `qb_chat_${question.id}`;
      localStorage.removeItem(storageKey);
      if (onChatHistoryUpdate) {
        onChatHistoryUpdate(question.id, []);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && e.keyCode !== 229) {
      e.preventDefault();
      if (!loading && input.trim()) {
        sendMessage(input);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${newHeight}px`;
      setIsMultiline(newHeight > 44);
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  if (!isOpen) return null;

  const renderPanelContent = () => (
    <>
      {/* Header */}
      <div 
        className="absolute top-0 left-0 right-0 z-20 p-4 border-b flex justify-between items-center backdrop-blur-md"
        style={{
          borderColor: 'var(--outline)',
          backgroundColor: 'rgba(var(--surface-rgb, 255, 255, 255), 0.3)',
        }}
      >
        <div>
          <h3 className="font-bold" style={{ color: 'var(--text)' }}>
            {aiSettings?.roleName || 'AI 助教'}
          </h3>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            正在讨论第 {question.id} 题
          </p>
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button 
              onClick={clearChatHistory} 
              className="p-2 rounded-full transition"
              style={{ color: 'var(--muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--danger)';
                e.currentTarget.style.backgroundColor = 'var(--surface2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--muted)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="清除聊天记录"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <button 
            onClick={onClose} 
            className="p-2 rounded-full transition"
            style={{ color: 'var(--muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text)';
              e.currentTarget.style.backgroundColor = 'var(--surface2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--muted)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 transition-colors z-0"
        style={{
          paddingTop: '72px',
          paddingBottom: '180px',
          backgroundColor: 'var(--surface2)',
        }}
      >
        {history.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[92%] rounded-2xl p-3 text-sm shadow-sm ${
                msg.role === 'user' 
                  ? 'rounded-br-none' 
                  : 'rounded-bl-none'
              }`}
              style={msg.role === 'user' ? {
                backgroundColor: 'var(--primary)',
                color: 'var(--on-primary)',
              } : {
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
                borderColor: 'var(--outline)',
                borderWidth: '1px',
                borderStyle: 'solid',
              }}
            >
              {msg.role === 'user' ? (
                <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{msg.text}</div>
              ) : (
                <>
                  <AIMessage text={msg.text} status={msg.status} />
                  {msg.status === 'error' && (
                    <button
                      onClick={retryLastMessage}
                      className="mt-2 text-xs hover:underline transition"
                      style={{ color: 'var(--danger)' }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      重试
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        {loading && history.length > 0 && history[history.length - 1].status !== 'streaming' && (
          <div className="flex justify-start">
            <div 
              className="p-3 rounded-2xl rounded-bl-none border shadow-sm flex gap-1"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--outline)',
              }}
            >
              <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--muted)' }}></span>
              <span className="w-2 h-2 rounded-full animate-bounce delay-100" style={{ backgroundColor: 'var(--muted)' }}></span>
              <span className="w-2 h-2 rounded-full animate-bounce delay-200" style={{ backgroundColor: 'var(--muted)' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer */}
      <div 
        className="absolute bottom-0 left-0 right-0 z-20 p-4 border-t backdrop-blur-md"
        style={{
          borderColor: 'var(--outline)',
          backgroundColor: 'rgba(var(--surface-rgb, 255, 255, 255), 0.3)',
        }}
      >
        {/* Preset Prompts - 只在非流式状态时显示 */}
        {!isStreaming && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
            <button 
              onClick={() => sendMessage("这题怎么做？")}
              className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition"
              style={{
                backgroundColor: 'var(--primary-container)',
                color: 'var(--on-primary-container)',
                borderColor: 'var(--primary)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-container)'}
            >
              🐾 这题怎么做？
            </button>
            <button 
              onClick={() => sendMessage("请解释一下这个知识点")}
              className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition"
              style={{
                backgroundColor: 'var(--surface2)',
                color: 'var(--text)',
                borderColor: 'var(--outline)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface2)';
                e.currentTarget.style.borderColor = 'var(--outline)';
              }}
            >
            解释知识点
            </button>
            <button 
              onClick={() => sendMessage("给一个相关的代码示例")}
              className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition"
              style={{
                backgroundColor: 'var(--surface2)',
                color: 'var(--text)',
                borderColor: 'var(--outline)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface2)';
                e.currentTarget.style.borderColor = 'var(--outline)';
              }}
            >
              代码示例
            </button>
          </div>
        )}
        
        <div className="flex gap-2 items-start">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? "AI 正在回答..." : "问问你想知道的"}
            disabled={loading}
            rows={1}
            className={`flex-1 border px-4 py-2.5 text-sm focus:outline-none transition-colors disabled:opacity-50 resize-none overflow-y-auto min-h-[44px] max-h-[120px] leading-5 ${isMultiline ? 'rounded-3xl' : 'rounded-full'}`}
            style={{
              borderColor: 'var(--outline)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--ring)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--outline)'}
          />
          {/* 发送/停止按钮 */}
          {isStreaming ? (
            <button 
              onClick={stopGeneration}
              className="w-11 h-11 rounded-full transition shrink-0 flex items-center justify-center"
              style={{
                backgroundColor: '#c9a8a8',
                color: '#fff',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                <rect x="5" y="5" width="10" height="10" rx="1.5" />
              </svg>
            </button>
          ) : (
            <button 
              onClick={() => {
                sendMessage(input);
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto';
                }
              }}
              disabled={loading || !input.trim()}
              className="w-11 h-11 rounded-full transition shrink-0 flex items-center justify-center"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--on-primary)',
                opacity: (loading || !input.trim()) ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading && input.trim()) {
                  e.currentTarget.style.opacity = '0.9';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && input.trim()) {
                  e.currentTarget.style.opacity = '1';
                }
              }}
            >
              <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </>
  );

  if (isOpen && isWide && !inline) {
    const dockPanel = (
      <div 
        className="relative w-[480px] flex flex-col overflow-hidden rounded-3xl shadow-2xl border transition-colors"
        style={{
          position: 'fixed',
          right: '16px',
          top: 'calc(var(--topbar-h, 48px) + 12px)',
          bottom: '16px',
          zIndex: 100,
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--outline)',
        }}
      >
        {renderPanelContent()}
      </div>
    );
    return createPortal(dockPanel, document.body);
  }

  const overlayPanel = (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3">
      <div 
        className="absolute inset-0 bg-black/25"
        onClick={onClose}
      />
      <div 
        className="relative flex flex-col overflow-hidden rounded-3xl shadow-2xl border transition-colors mb-3"
        style={{
          width: `min(${DOCK_W}px, calc(100vw - 24px))`,
          maxHeight: `min(70vh, calc(100vh - var(--topbar-h, 64px) - 24px))`,
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--outline)',
        }}
      >
        {renderPanelContent()}
      </div>
    </div>
  );
  return createPortal(overlayPanel, document.body);
};
