import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Question, UserResponse, ChatMessage, AISettings } from '../types';
import { streamChat, mockStreamChat, QuestionContext, BankMeta } from '../services/aiClient';
import { highlightCode } from '../utils/codeHighlighter';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  question: Question;
  userResponse: UserResponse;
  themeColor: string;
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

// 用户消息组件（纯文本）
const UserMessage: React.FC<{ text: string }> = ({ text }) => {
  return (
    <pre className="whitespace-pre-wrap text-sm leading-relaxed font-normal">
      {text}
    </pre>
  );
};

// AI 消息组件（Markdown 渲染）
const AIMessage: React.FC<{ text: string; status?: 'streaming' | 'done' | 'error' }> = ({ text, status }) => {
  if (status === 'error') {
    return (
      <div className="text-sm text-red-600 dark:text-red-400">
        {text || 'AI 回复失败'}
      </div>
    );
  }

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
              <code className="bg-slate-100 dark:bg-slate-700 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 font-mono text-xs mx-0.5" {...props}>
                {children}
              </code>
            );
          },
          // 表格样式
          table({ children }: any) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse border border-slate-300 dark:border-slate-700">
                  {children}
                </table>
            </div>
         );
          },
          thead({ children }: any) {
            return <thead className="bg-slate-50 dark:bg-slate-800">{children}</thead>;
          },
          tbody({ children }: any) {
            return <tbody>{children}</tbody>;
          },
          tr({ children }: any) {
            return <tr className="border-b border-slate-200 dark:border-slate-700">{children}</tr>;
          },
          th({ children }: any) {
            return (
              <th className="px-4 py-2 text-left font-bold text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700">
                {children}
              </th>
            );
          },
          td({ children }: any) {
            return (
              <td className="px-4 py-2 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                {children}
              </td>
            );
          },
          // 其他元素保持默认样式
          p({ children }: any) {
            return <p className="mb-2 leading-relaxed">{children}</p>;
          },
          h1({ children }: any) {
            return <h1 className="text-2xl font-bold mt-4 mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">{children}</h1>;
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
              <blockquote className="border-l-4 border-slate-300 dark:border-slate-600 pl-4 py-1 my-2 text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800 rounded-r">
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
            return <hr className="my-6 border-slate-200 dark:border-slate-700" />;
          }
        }}
      >
        {text}
      </ReactMarkdown>
            </div>
        );
};

export const ChatDrawer: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  question, 
  userResponse, 
  themeColor, 
  aiSettings, 
  inline = false, 
  onChatHistoryUpdate,
  bankMeta,
  questionContext: providedContext,
  bankId
}) => {
  const [history, setHistory] = useState<ExtendedChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const streamBufferRef = useRef<string>(''); // 流式输出缓冲区
  const streamUpdateTimerRef = useRef<number | null>(null); // 批量更新定时器
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

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (streamUpdateTimerRef.current) {
        cancelAnimationFrame(streamUpdateTimerRef.current);
        streamUpdateTimerRef.current = null;
      }
    };
  }, []);

  // 批量更新流式消息（优化性能，减少重渲染）
  const flushStreamBuffer = () => {
    if (streamBufferRef.current) {
      const delta = streamBufferRef.current;
      streamBufferRef.current = '';
      
      setHistory(prev => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.role === 'model' && lastMsg.status === 'streaming') {
          // 移除之前的●，添加新内容，再在末尾添加●
          const currentText = lastMsg.text.endsWith('●') 
            ? lastMsg.text.slice(0, -1) 
            : lastMsg.text;
          lastMsg.text = currentText + delta + '●';
        }
        return updated;
      });
    }
    
    if (streamUpdateTimerRef.current) {
      cancelAnimationFrame(streamUpdateTimerRef.current);
      streamUpdateTimerRef.current = null;
    }
  };

  // 添加流式 delta 到缓冲区
  const appendStreamDelta = (delta: string) => {
    streamBufferRef.current += delta;
    
    // 使用 requestAnimationFrame 批量更新，减少重渲染
    if (!streamUpdateTimerRef.current) {
      streamUpdateTimerRef.current = requestAnimationFrame(() => {
        flushStreamBuffer();
        streamUpdateTimerRef.current = null;
      });
    }
  };

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
    streamBufferRef.current = ''; // 清空缓冲区

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
          (delta: string) => {
            // 使用批量更新优化性能
            appendStreamDelta(delta);
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
          (delta: string) => {
            // 使用批量更新优化性能
            appendStreamDelta(delta);
          }
        );
      }
      
      // 流式完成前，确保缓冲区内容已刷新
      flushStreamBuffer();

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

  // 处理键盘事件（只允许换行，不允许回车发送）
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter 键不发送，只允许换行（Shift+Enter）
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // 阻止默认行为，不发送消息
    }
    // Shift+Enter 允许换行（不阻止）
  };

  // 自动调整 textarea 高度
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`; // 最大高度 120px
    }
  };

  // 当输入内容变化时调整高度
  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  if (!isOpen) return null;

  // Inline vs Modal Mode
  const wrapper = (children: React.ReactNode) => {
    if (inline) {
      return (
        <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 transition-colors">
           {children}
        </div>
      );
    }
      return (
          <div className="fixed inset-0 z-50 flex justify-end">
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>
              <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-slide-in-right transition-colors">
                {children}
              </div>
          </div>
      );
  };

  return wrapper(
      <>
        {/* Header */}
        <div className={`p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center ${inline ? 'bg-white dark:bg-slate-900' : `bg-${themeColor}-600 text-white`}`}>
          <div>
          <h3 className={`font-bold ${inline ? 'text-slate-800 dark:text-slate-100' : ''}`}>
            {aiSettings?.roleName || 'AI 助教'}
          </h3>
          <p className={`text-xs ${inline ? 'text-slate-400' : `text-${themeColor}-100`}`}>
            正在讨论第 {question.id} 题
          </p>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button 
                onClick={clearChatHistory} 
                className={`p-2 rounded-full transition ${inline ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500' : `hover:bg-${themeColor}-700`}`}
                title="清除聊天记录"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          <button 
            onClick={onClose} 
            className={`p-2 rounded-full transition ${inline ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400' : `hover:bg-${themeColor}-700`}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          </div>
        </div>

        {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950 transition-colors"
      >
          {history.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[92%] rounded-2xl p-3 text-sm shadow-sm ${
                msg.role === 'user' 
                  ? `bg-${themeColor}-600 text-white rounded-br-none` 
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'
              }`}>
              {msg.role === 'user' ? (
                <UserMessage text={msg.text} />
              ) : (
                <>
                  <AIMessage text={msg.text} status={msg.status} />
                  {msg.status === 'error' && (
                    <button
                      onClick={retryLastMessage}
                      className="mt-2 text-xs text-red-600 dark:text-red-400 hover:underline"
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
               <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-sm flex gap-1">
                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                 <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
        {/* Preset Prompts */}
          {!loading && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                  <button 
                    onClick={() => sendMessage("这题怎么做？")}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium bg-${themeColor}-50 dark:bg-${themeColor}-900/30 text-${themeColor}-600 dark:text-${themeColor}-300 border border-${themeColor}-100 dark:border-${themeColor}-800 hover:bg-${themeColor}-100 dark:hover:bg-${themeColor}-900/50 transition`}
                  >
                    ✨ 这题怎么做？
                  </button>
                  <button 
                    onClick={() => sendMessage("请解释一下这个知识点")}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    📖 解释知识点
                  </button>
                  <button 
                    onClick={() => sendMessage("给一个相关的代码示例")}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    💻 代码示例
                  </button>
              </div>
          )}
          
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
              value={input}
            onChange={e => {
              setInput(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (点击按钮发送，Shift+Enter 换行)"
            disabled={loading}
            rows={1}
            className={`flex-1 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-${themeColor}-500 transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50 resize-none overflow-y-auto min-h-[40px] max-h-[120px]`}
            style={{ height: 'auto' }}
            />
            <button 
            onClick={() => {
              sendMessage(input);
              // 发送后重置 textarea 高度
              if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
              }
            }}
              disabled={loading || !input.trim()}
            className={`bg-${themeColor}-600 hover:bg-${themeColor}-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white p-2 rounded-lg transition shrink-0`}
            >
              <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </div>
      </>
  );
};
