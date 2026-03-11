import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Question, UserResponse, ChatMessage, AISettings } from '../types';
import { streamChat, mockStreamChat, QuestionContext, BankMeta } from '../services/aiClient';
import { highlightCode } from '../utils/codeHighlighter';

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
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // Fallback for older browsers
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
  bankMeta?: BankMeta; // 题库元信息
  questionContext?: QuestionContext; // 题目上下文（可选，会自动构建）
  bankId?: string; // 题库ID，用于存储聊天历史
}

// 扩展 ChatMessage 类型，支持流式状态
interface ExtendedChatMessage extends ChatMessage {
  status?: 'streaming' | 'done' | 'error';
}

// 代码块组件（使用现有的 highlightCode）
const CodeBlock: React.FC<{ code: string; lang: string }> = ({ code, lang }) => {
  return (
    <div className="my-3 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-[#1e1e1e] shadow-md">
      <div className="px-3 py-1.5 bg-[#252526] text-xs text-slate-400 border-b border-slate-700 font-bold uppercase flex justify-between items-center">
        <span>{lang || 'CODE'}</span>
        <div className="flex gap-1.5 opacity-50">
          <span className="w-2 h-2 rounded-full bg-[#ff5f56]"></span>
          <span className="w-2 h-2 rounded-full bg-[#ffbd2e]"></span>
          <span className="w-2 h-2 rounded-full bg-[#27c93f]"></span>
        </div>
      </div>
      <pre className="p-3 overflow-x-auto text-[#d4d4d4] text-sm leading-relaxed">
        <code>{highlightCode(code, lang)}</code>
      </pre>
    </div>
  );
};

// 用户消息组件（纯文本，不走 Markdown）
const UserMessage: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
      {text}
    </div>
  );
};

// AI 消息 Markdown 渲染组件（成熟稳定实现）
const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="text-sm leading-relaxed prose prose-slate dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 代码块
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');
            
            if (!inline && lang) {
              return <CodeBlock code={codeString} lang={lang} />;
            }
            
            return (
              <code 
                className="px-1.5 py-0.5 rounded border font-mono text-xs mx-0.5" 
                style={{
                  backgroundColor: 'var(--surface2)',
                  color: 'var(--tertiary)',
                  borderColor: 'var(--outline)',
                }}
                {...props}
              >
                {children}
              </code>
            );
          },
          // 表格样式 - 支持 GitHub 风格表格（GFM）
          table({ node, ...props }: any) {
            return (
              <div className="my-3 overflow-x-auto">
                <table 
                  className="min-w-full text-sm border rounded-lg overflow-hidden" 
                  style={{ borderColor: 'var(--outline)' }}
                  {...props} 
                />
              </div>
            );
          },
          thead({ ...props }: any) {
            return <thead style={{ backgroundColor: 'var(--surface2)' }} {...props} />;
          },
          tbody({ ...props }: any) {
            return <tbody {...props} />;
          },
          tr({ children, ...props }: any) {
            return (
              <tr 
                className="border-t"
                style={{
                  borderColor: 'var(--outline)',
                  backgroundColor: 'var(--surface)',
                }}
                {...props}
              >
                {children}
              </tr>
            );
          },
          th({ children, ...props }: any) {
            return (
              <th 
                className="px-3 py-2 text-left font-semibold border-b whitespace-nowrap"
                style={{
                  borderColor: 'var(--outline)',
                  color: 'var(--text)',
                }}
                {...props}
              >
                {children}
              </th>
            );
          },
          td({ children, ...props }: any) {
            return (
              <td 
                className="px-3 py-2 border-t align-top"
                style={{
                  borderColor: 'var(--outline)',
                  color: 'var(--text)',
                }}
                {...props}
              >
                {children}
              </td>
            );
          },
          // 其他元素保持默认样式
          p({ children }: any) {
            return <p className="mb-2 leading-relaxed">{children}</p>;
          },
          h1({ children }: any) {
            return <h1 className="text-2xl font-bold mt-4 mb-2 pb-2 border-b" style={{ borderColor: 'var(--outline)', color: 'var(--text)' }}>{children}</h1>;
          },
          h2({ children }: any) {
            return <h2 className="text-xl font-bold mt-4 mb-2">{children}</h2>;
          },
          h3({ children }: any) {
            return <h3 className="text-lg font-bold mt-3 mb-2">{children}</h3>;
          },
          strong({ children }: any) {
            return <strong className="font-bold text-slate-900 dark:text-white">{children}</strong>;
          },
          blockquote({ children }: any) {
            return (
              <blockquote 
                className="border-l-4 pl-4 py-1 my-2 italic rounded-r"
                style={{
                  borderColor: 'var(--outline)',
                  color: 'var(--muted)',
                  backgroundColor: 'var(--surface2)',
                }}
              >
                {children}
              </blockquote>
            );
          },
          ul({ children }: any) {
            return <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>;
          },
          ol({ children }: any) {
            return <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>;
          },
          li({ children }: any) {
            return <li className="leading-relaxed">{children}</li>;
          },
          hr() {
            return <hr className="my-6" style={{ borderColor: 'var(--outline)' }} />;
          }
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};

// AI 消息组件（Markdown 渲染）
const AIMessage: React.FC<{ text: string; status?: 'streaming' | 'done' | 'error' }> = ({ text, status }) => {
  if (status === 'error') {
    return (
      <div className="text-sm" style={{ color: 'var(--danger)' }}>
        {text || 'AI 回复失败'}
      </div>
    );
  }

  // 直接使用原始文本，不做任何预处理
  return <MarkdownRenderer text={text} />;
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
  // Media query for dock mode detection
  const isWide = useMediaQuery('(min-width: 1100px)');
  const isDocked = isOpen && isWide && !inline;

  const [history, setHistory] = useState<ExtendedChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMultiline, setIsMultiline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 构建题目上下文
  const questionContext: QuestionContext = providedContext || {
    questionId: question.id,
    stem: question.content,
    options: question.options,
    userAnswer: userResponse.userAnswer,
    isCorrect: userResponse.isCorrect,
    analysis: question.explanation
  };

  // 根据题目类型构建正确答案
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

  // 加载聊天历史（按 questionId 独立存储）
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
      // 如果没有历史记录，初始化欢迎消息
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

  // 保存聊天历史
  const saveChatHistory = (newHistory: ExtendedChatMessage[]) => {
    const storageKey = bankId 
      ? `qb_chat_${bankId}_${question.id}`
      : `qb_chat_${question.id}`;
    
    localStorage.setItem(storageKey, JSON.stringify(newHistory));
    
    // 同时调用回调（兼容旧接口）
      if (onChatHistoryUpdate) {
      onChatHistoryUpdate(question.id, newHistory.map(m => ({
        role: m.role,
        text: m.text,
        timestamp: m.timestamp
      })));
    }
  };

  // 自动滚动到底部（仅在用户未手动上滚时）
  useEffect(() => {
    if (shouldAutoScroll.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);

  // 监听滚动，判断用户是否手动上滚
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      shouldAutoScroll.current = isNearBottom;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);


  // 发送消息
  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    
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
    shouldAutoScroll.current = true;

    // 创建流式 AI 消息（初始为空，末尾会显示●）
    const aiMsg: ExtendedChatMessage = {
      role: 'model',
      text: '●',
      timestamp: Date.now(),
      status: 'streaming'
    };
    
    const streamingHistory = [...newHistory, aiMsg];
    setHistory(streamingHistory);

    try {
      // 构建消息历史（只包含 user/assistant，不包含 system）
      // 清理消息内容，移除流式指示符●和所有可能导致 JSON 错误的字符
      const apiHistory = history
        .filter(m => m.status !== 'streaming') // 排除正在流式中的消息
        .map(m => {
          let content = m.text || '';
          // 移除流式指示符●
          content = content.replace(/●/g, '');
          // 移除孤立的代理对字符
          content = content.replace(/[\uD800-\uDFFF]/g, '');
          return {
            role: m.role === 'model' ? 'assistant' as const : 'user' as const,
            content: content
          };
        });

      // 使用流式 API
      const apiKey = localStorage.getItem('qb_api_key');
      const useStream = !!apiKey; // 如果有 API Key 就用真实流式，否则用 Mock

      if (useStream) {
        await streamChat(
          {
            bankMeta,
            questionContext,
            messages: [...apiHistory, { role: 'user', content: text.trim() }],
            aiSettings
          },
          (snapshot: string) => {
            // snapshot 覆盖更新：直接覆盖最后一条 streaming 消息的文本
            setHistory(prev => {
              const updated = [...prev];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg && lastMsg.role === 'model' && lastMsg.status === 'streaming') {
                lastMsg.text = snapshot + '●';
              }
              return updated;
            });
          }
        );
      } else {
        // Mock 流式输出（用于测试）
        await mockStreamChat(
          {
            bankMeta,
            questionContext,
            messages: [...apiHistory, { role: 'user', content: text.trim() }],
            aiSettings
          },
          (snapshot: string) => {
            // snapshot 覆盖更新：直接覆盖最后一条 streaming 消息的文本
            setHistory(prev => {
              const updated = [...prev];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg && lastMsg.role === 'model' && lastMsg.status === 'streaming') {
                lastMsg.text = snapshot + '●';
              }
              return updated;
            });
          }
        );
      }

      // 流式完成，移除末尾的●并更新状态
      setHistory(prev => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.role === 'model') {
          // 移除末尾的●
          if (lastMsg.text.endsWith('●')) {
            lastMsg.text = lastMsg.text.slice(0, -1);
          }
          lastMsg.status = 'done';
        }
        return updated;
      });

      // 保存最终历史
      setHistory(prev => {
        saveChatHistory(prev);
        return prev;
      });

    } catch (e) {
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
    } finally {
      setLoading(false);
    }
  };

  // 重试最后一条 AI 消息
  const retryLastMessage = () => {
    const lastUserMsg = [...history].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      // 移除最后一条 AI 消息（如果有）
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

  // 清除聊天历史
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

  // 处理键盘事件（Enter发送，Shift+Enter换行）
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !(e.nativeEvent as any).isComposing) {
      e.preventDefault();
      if (!loading && input.trim()) {
        sendMessage(input);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }
  };

  // 自动调整 textarea 高度
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${newHeight}px`;
      // 判断是否多行（超过单行高度40px）
      setIsMultiline(newHeight > 44);
    }
  };

  // 当输入内容变化时调整高度
  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  if (!isOpen) return null;

  // Shared panel content structure (used by both Dock and Overlay modes)
  const renderPanelContent = () => (
    <>
      {/* Header - Absolute overlay with glassmorphism */}
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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages - Scrollable area with padding to avoid header/footer */}
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
                <UserMessage text={msg.text} />
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

      {/* Footer - Absolute overlay with glassmorphism (includes preset prompts and input) */}
      <div 
        className="absolute bottom-0 left-0 right-0 z-20 p-4 border-t backdrop-blur-md"
        style={{
          borderColor: 'var(--outline)',
          backgroundColor: 'rgba(var(--surface-rgb, 255, 255, 255), 0.3)',
        }}
      >
        {/* Preset Prompts */}
        {!loading && (
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
            placeholder="问问你想知道的"
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
        </div>
      </div>
    </>
  );

  // Render Dock mode (>=1100px): fixed right, no overlay
  // Protection: if isOpen && isWide && !inline, MUST use dock mode
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

  // Render Overlay mode (<1100px): bottom-centered with backdrop (bottom-sheet style)
  // Only allowed when NOT wide (width < 1100px)
  // Panel positioned at bottom center, leaving top content visible
  const overlayPanel = (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/25"
        onClick={onClose}
      />
      {/* Panel - Bottom centered, width and height limited */}
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
