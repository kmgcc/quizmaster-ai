import React, { useState, useRef, useEffect } from 'react';
import { QuestionBank, QuizSession, Question, UserResponse, AISettings, ChatMessage } from '../types';
import { ChatDrawer } from './ChatDrawer';
import { highlightCode } from '../utils/codeHighlighter';
import { BankMeta, QuestionContext } from '../services/aiClient';

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

// Markdown rendering helper (simplified for review)
const renderMarkdownText = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  
  // Match code blocks first (``` ```)
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let match;
  const codeBlocks: { start: number; end: number; lang: string; code: string }[] = [];
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    codeBlocks.push({
      start: match.index,
      end: match.index + match[0].length,
      lang: match[1] || 'code',
      code: match[2]
    });
  }
  
  // Process text with inline code and bold
  const processInline = (str: string, key: string) => {
    const inlineParts = str.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return inlineParts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code 
            key={`${key}-${i}`} 
            className="px-1.5 py-0.5 rounded text-xs font-mono border"
            style={{
              backgroundColor: 'var(--tertiary-container)',
              color: 'var(--on-tertiary-container)',
              borderColor: 'var(--outline)',
            }}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={`${key}-${i}`} className="font-bold" style={{ color: 'var(--text)' }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };
  
  let lastIndex = 0;
  codeBlocks.forEach((block, blockIdx) => {
    // Add text before code block
    if (block.start > lastIndex) {
      const textBefore = text.substring(lastIndex, block.start);
      parts.push(<span key={`text-${blockIdx}`}>{processInline(textBefore, `inline-${blockIdx}`)}</span>);
    }
    
    // Add code block with syntax highlighting
    parts.push(
      <div 
        key={`code-${blockIdx}`} 
        className="my-2 rounded-lg overflow-hidden border shadow-sm"
        style={{
          borderColor: 'var(--outline)',
          backgroundColor: '#1e1e1e',
        }}
      >
        <div 
          className="px-2 py-1 text-[10px] border-b font-bold uppercase flex justify-between items-center"
          style={{
            backgroundColor: '#252526',
            color: 'var(--muted)',
            borderColor: 'var(--outline)',
          }}
        >
          <span>{block.lang || 'CODE'}</span>
          <div className="flex gap-1 opacity-40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff5f56]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffbd2e]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#27c93f]"></span>
          </div>
        </div>
        <pre className="p-2 overflow-x-auto text-[#d4d4d4] text-xs leading-relaxed">
          <code>{highlightCode(block.code, block.lang)}</code>
        </pre>
      </div>
    );
    
    lastIndex = block.end;
  });
  
  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    parts.push(<span key="text-end">{processInline(remainingText, 'inline-end')}</span>);
  }
  
  return <>{parts}</>;
};

// 自适应高度的笔记框组件
const AutoResizeTextarea: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxHeight?: number;
}> = ({ value, onChange, placeholder, className = '', maxHeight = 240 }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // 重置高度以获取准确的 scrollHeight
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    
    // 计算最终高度
    const finalHeight = Math.min(scrollHeight, maxHeight);
    textarea.style.height = `${finalHeight}px`;
    
    // 根据是否超过最大高度设置 overflow
    textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  useEffect(() => {
    adjustHeight();
  }, [value, maxHeight]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // 使用 setTimeout 确保 DOM 更新后再调整高度
    setTimeout(adjustHeight, 0);
  };

  return (
    <>
      <style>{`
        /* 浅色模式：亮黄色（高饱和度，明亮不发灰） */
        textarea[data-note-textarea],
        textarea.note-textarea-fixed {
          background-color: hsl(50, 90%, 95%) !important;
          border: none !important;
          color: hsl(35, 25%, 15%) !important;
        }
        textarea[data-note-textarea]::placeholder,
        textarea.note-textarea-fixed::placeholder {
          color: hsl(35, 15%, 45%) !important;
          opacity: 0.7;
        }
        textarea[data-note-textarea]:focus,
        textarea.note-textarea-fixed:focus {
          background-color: hsl(50, 90%, 95%) !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }
        
        /* 深色模式：暗黄色偏橙色，低饱和（典雅不刺眼） */
        .dark textarea[data-note-textarea],
        .dark textarea.note-textarea-fixed {
          background-color: hsl(38, 18%, 20%) !important;
          border: none !important;
          color: hsl(38, 16%, 85%) !important;
        }
        .dark textarea[data-note-textarea]::placeholder,
        .dark textarea.note-textarea-fixed::placeholder {
          color: hsl(38, 14%, 60%) !important;
          opacity: 0.8;
        }
        .dark textarea[data-note-textarea]:focus,
        .dark textarea.note-textarea-fixed:focus {
          background-color: hsl(38, 18%, 20%) !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>
      <textarea
        ref={textareaRef}
        data-note-textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`${className} break-words overflow-x-hidden`}
        style={{ 
          minHeight: '40px', 
          maxHeight: `${maxHeight}px`,
          overflowWrap: 'anywhere',
          wordBreak: 'break-word'
        }}
      />
    </>
  );
};

interface Props {
  bank: QuestionBank;
  session: QuizSession;
  onAnnotationUpdate: (sessionId: string, questionId: string, text: string) => void;
  onRetake: () => void;
  onExit: () => void;
  onContinue?: () => void; // For interim mode
  aiSettings?: AISettings;
  customQuestions?: Question[]; // For interim mode, only show specific questions
  isInterim?: boolean;
  onChatHistoryUpdate?: (sessionId: string, questionId: string, history: ChatMessage[]) => void;
}

export const QuizReviewer: React.FC<Props> = ({ 
  bank, 
  session, 
  onAnnotationUpdate, 
  onRetake, 
  onExit, 
  onContinue,
  aiSettings, 
  customQuestions, 
  isInterim = false,
  onChatHistoryUpdate
}) => {
  const [chatQuestion, setChatQuestion] = useState<{q: Question, r: UserResponse} | null>(null);
  
  // Media query for dock mode detection
  const isWide = useMediaQuery('(min-width: 1100px)');
  const isChatOpen = !!chatQuestion;
  const isDocked = isChatOpen && isWide;

  const handleChatHistoryUpdate = (questionId: string, history: ChatMessage[]) => {
    if (onChatHistoryUpdate) {
      onChatHistoryUpdate(session.id, questionId, history);
    }
  };

  const questionsToRender = customQuestions || bank.questions;
  
  // Recalculate stats based on visible questions for interim, or use session totals
  const relevantResponses = questionsToRender.map(q => session.responses[q.id]).filter(Boolean);
  const correctCount = relevantResponses.filter((r: UserResponse) => r.isCorrect).length;
  const totalQuestions = questionsToRender.length;
  const score = totalQuestions > 0 ? Math.round((relevantResponses.reduce((acc, curr) => acc + curr.score, 0) / totalQuestions) * 100) : 0;

  // Count notes for summary
  const notesCount = questionsToRender.filter(q => session.responses[q.id]?.annotation).length;

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full h-full min-h-0 min-w-0 overflow-hidden">
      {/* Left Column: Summary - Desktop Only (md+) */}
      {/* Logic: Hide this column completely when chat is open OR if in Interim Mode */}
      {!isChatOpen && !isInterim && (
        <div className="hidden md:block md:w-72 lg:w-80 shrink-0 space-y-6 md:mr-8 md:sticky md:self-start animate-fade-in" style={{ top: 'var(--content-safe-top)' } as React.CSSProperties}>
            <div className="bg-white/45 dark:bg-white/5 p-8 rounded-3xl shadow-sm border border-black/5 dark:border-white/10 text-center relative overflow-hidden transition-colors backdrop-blur-md">
                <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: 'var(--primary)' }}></div>
                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>练习回顾</h2>
                <p className="text-xs mb-6" style={{ color: 'var(--muted)' }}>{new Date(session.startTime).toLocaleString()}</p>
                
                <div 
                  className="relative w-40 h-40 mx-auto flex items-center justify-center rounded-full border-[12px]"
                  style={{ borderColor: 'var(--surface2)' }}
                >
                    <svg 
                      className="absolute top-0 left-0 w-full h-full transform -rotate-90" 
                      style={{ 
                        color: score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--warning)',
                      }}
                      viewBox="0 0 100 100"
                    >
                        <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="12" fill="none" strokeDasharray={`${score * 2.76} 276`} />
                    </svg>
                    <div className="text-center">
                        <div 
                          className="text-4xl font-black"
                          style={{ 
                            color: score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--warning)',
                          }}
                        >
                        {score}
                        </div>
                        <div className="text-xs font-bold uppercase mt-1" style={{ color: 'var(--muted)' }}>分数</div>
                    </div>
                </div>

                <div className="mt-8 flex justify-center gap-8 text-center">
                    <div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{correctCount}</div>
                        <div className="text-xs" style={{ color: 'var(--muted)' }}>答对</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{totalQuestions}</div>
                        <div className="text-xs" style={{ color: 'var(--muted)' }}>总题数</div>
                    </div>
                </div>
                
                {notesCount > 0 && (
                  <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--outline)' }}>
                    <div className="flex items-center justify-center gap-2" style={{ color: 'var(--warning)' }}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      <span className="text-sm font-bold">{notesCount} 条笔记</span>
                    </div>
                  </div>
                )}
            </div>

            <div className="space-y-3">
                <button 
                  onClick={onRetake} 
                  className="w-full px-6 py-3 font-bold rounded-2xl transition"
                  style={{ 
                    backgroundColor: 'var(--primary)',
                    color: 'var(--on-primary)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                    再做一次
                </button>
                <button 
                  onClick={onExit} 
                  className="w-full px-6 py-3 font-bold rounded-2xl border transition"
                  style={{
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    borderColor: 'var(--outline)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface)';
                  }}
                >
                    返回题库
                </button>
            </div>
        </div>
      )}

      {/* Middle Column: Details List */}
      {/* Logic: Takes full width available. If chat open, it shares space with spacer. */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col relative overflow-x-hidden">
        {/* Mobile Summary - Collapsible, Floating with glassmorphism (md:hidden) */}
        {!isChatOpen && !isInterim && (
          <details className="md:hidden fixed top-[calc(var(--topbar-h,64px)+8px)] left-0 right-0 z-40 mx-4">
            <summary 
              className="flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-colors list-none backdrop-blur-md shadow-lg"
              style={{
                backgroundColor: 'rgba(var(--surface-rgb, 255, 255, 255), 0.35)',
                borderColor: 'var(--outline)',
              }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div 
                  className="flex items-center justify-center w-10 h-10 rounded-full text-sm font-black shrink-0"
                  style={{
                    backgroundColor: score >= 80 ? 'var(--success)' : 'var(--warning)',
                    color: 'var(--on-primary)',
                  }}
                >
                  {score}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>练习回顾</div>
                  <div className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                    答对 {correctCount}/{totalQuestions}
                    {notesCount > 0 && <> · 笔记 {notesCount}</>}
                  </div>
                </div>
              </div>
              <svg className="w-5 h-5 shrink-0 transition-transform" style={{ color: 'var(--muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            
            <div className="mt-3 space-y-3 backdrop-blur-md rounded-xl shadow-lg border" style={{ backgroundColor: 'rgba(var(--surface-rgb, 255, 255, 255), 0.35)', borderColor: 'var(--outline)' }}>
              <div 
                className="p-5 rounded-2xl shadow-sm border text-center relative overflow-hidden transition-colors"
                style={{
                  backgroundColor: 'rgba(var(--surface-rgb, 255, 255, 255), 0.5)',
                  borderColor: 'var(--outline)',
                }}
              >
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: 'var(--primary)' }}></div>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>练习回顾</h3>
                <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>{new Date(session.startTime).toLocaleString()}</p>
                
                <div 
                  className="relative w-32 h-32 mx-auto flex items-center justify-center rounded-full border-[10px]"
                  style={{ borderColor: 'var(--surface2)' }}
                >
                  <svg 
                    className="absolute top-0 left-0 w-full h-full transform -rotate-90" 
                    style={{ 
                      color: score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--warning)',
                    }}
                    viewBox="0 0 100 100"
                  >
                    <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="12" fill="none" strokeDasharray={`${score * 2.76} 276`} />
                  </svg>
                  <div className="text-center">
                    <div 
                      className="text-3xl font-black"
                      style={{ 
                        color: score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--warning)',
                      }}
                    >
                      {score}
                    </div>
                    <div className="text-xs font-bold uppercase mt-1" style={{ color: 'var(--muted)' }}>分数</div>
                  </div>
                </div>

                <div className="mt-6 flex justify-center gap-6 text-center">
                  <div>
                    <div className="text-xl font-bold" style={{ color: 'var(--text)' }}>{correctCount}</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>答对</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold" style={{ color: 'var(--text)' }}>{totalQuestions}</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>总题数</div>
                  </div>
                </div>
                
                {notesCount > 0 && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--outline)' }}>
                    <div className="flex items-center justify-center gap-2" style={{ color: 'var(--warning)' }}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      <span className="text-xs font-bold">{notesCount} 条笔记</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <button 
                  onClick={onRetake} 
                  className="w-full px-5 py-2.5 font-bold rounded-xl transition text-sm"
                  style={{ 
                    backgroundColor: 'var(--primary)',
                    color: 'var(--on-primary)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  再做一次
                </button>
                <button 
                  onClick={onExit} 
                  className="w-full px-5 py-2.5 font-bold rounded-xl border transition text-sm"
                  style={{
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    borderColor: 'var(--outline)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface)';
                  }}
                >
                  返回题库
                </button>
              </div>
            </div>
          </details>
        )}

        {/* Interim Header */}
        {isInterim && (
           <div className="mb-4 flex items-center justify-between shrink-0">
              <div>
                 <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>阶段小结</h2>
                 <p className="text-sm" style={{ color: 'var(--muted)' }}>本组共 {totalQuestions} 题，答对 {correctCount} 题。</p>
              </div>
           </div>
        )}

        <div 
          className={`flex-1 min-h-0 space-y-4 ${isChatOpen ? 'md:pr-0' : 'md:pr-2'} transition-all duration-500 min-w-0 overflow-y-auto overflow-x-hidden ${isDocked ? 'break-words' : ''}`}
          style={{
            paddingTop: 'var(--content-safe-top)',
            paddingBottom: 'var(--content-safe-bottom)',
            scrollPaddingTop: 'var(--content-safe-top)',
          } as React.CSSProperties}
        >
          {/* Mobile top spacer - prevent content from being hidden by floating card */}
          <div className="md:hidden h-40"></div>
          
          {/* Notes Summary Section - Only show in final review (not interim) if there are notes */}
          {!isInterim && notesCount > 0 && (
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10 p-6 rounded-2xl border-2 border-yellow-200 dark:border-yellow-800/30 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--warning)' }}>
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>✎ 笔记汇总</h3>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>你在本次练习中记录了 {notesCount} 条笔记</p>
                </div>
              </div>
              <div className="space-y-3">
                {questionsToRender.map((q, idx) => {
                  const resp = session.responses[q.id];
                  if (!resp?.annotation) return null;
                  
                  return (
                    <div key={q.id} className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800/30">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 mt-0.5" style={{ backgroundColor: 'var(--warning)', color: 'var(--on-primary)', opacity: 0.2 }}>
                          {(() => {
                            // 优先使用 questionIndex
                            if (resp?.questionIndex !== undefined) {
                              return resp.questionIndex + 1;
                            }
                            // 兼容旧数据
                            const idx = bank.questions.findIndex(bq => bq.id === q.id);
                            return idx >= 0 ? idx + 1 : (isInterim ? idx + 1 : 1);
                          })()}
                        </span>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className="text-sm mb-2 truncate break-words" style={{ color: 'var(--muted)' }}>{q.content}</p>
                          <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere overflow-x-hidden" style={{ color: 'var(--text)' }}>{resp.annotation}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {questionsToRender.map((q, idx) => {
            const resp = session.responses[q.id];
            const isCorrect = resp?.isCorrect;
            const isFlagged = resp?.isFlagged;
            const highlightFlag = isFlagged && !isCorrect;
            
            const isActive = chatQuestion?.q.id === q.id;

            // 确定边框颜色：如果正在问 AI，使用主题色；否则根据正确/错误/存疑状态
            const borderColor = isActive 
              ? 'var(--primary)' 
              : isCorrect 
                ? 'var(--success)' 
                : isFlagged 
                  ? 'var(--warning)' 
                  : 'var(--danger)';

            return (
              <div 
                  key={q.id} 
                  className={`bg-white dark:bg-white/5 p-6 rounded-2xl border-l-[6px] shadow-sm transition-all hover:shadow-md min-w-0 overflow-hidden
                      ${isActive ? 'ring-2 ring-offset-2 ring-[var(--primary)]' : ''}
                  `}
                  style={{
                    borderLeftColor: borderColor,
                    ...(isActive ? {
                      '--tw-ring-offset-color': 'var(--bg)',
                    } as React.CSSProperties : {})
                  }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span 
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: 'var(--surface2)',
                        color: 'var(--muted)',
                      }}
                    >
                        {(() => {
                          // 优先使用 questionIndex，如果没有则从 bank.questions 查找
                          if (resp?.questionIndex !== undefined) {
                            return resp.questionIndex + 1;
                          }
                          // 兼容旧数据：从 bank.questions 查找索引
                          const idx = bank.questions.findIndex(bq => bq.id === q.id);
                          return idx >= 0 ? idx + 1 : (isInterim ? idx + 1 : 1);
                        })()}
                    </span>
                    {isFlagged && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full flex items-center gap-1" style={{ backgroundColor: 'var(--warning)', color: 'var(--on-primary)', opacity: 0.2 }}>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M3 6a1 1 0 011-1h15a1 1 0 011 1v9a1 1 0 01-1 1h-6.101l-2.424 2.424A1 1 0 019 18V16H4a1 1 0 01-1-1V6z" /></svg>
                            存疑
                        </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setChatQuestion({ q, r: resp })}
                      className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                      style={{
                        backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                        color: isActive ? 'var(--on-primary)' : 'var(--primary)',
                        border: highlightFlag ? '2px solid var(--warning)' : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'var(--primary-container)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <span>{isActive ? '正在讨论...' : '✨ 问 AI'}</span>
                    </button>
                    <span 
                      className="px-3 py-1 rounded-lg text-xs font-bold"
                      style={{
                        backgroundColor: isCorrect 
                          ? 'rgba(var(--success-rgb, 34, 197, 94), 0.2)'
                          : 'rgba(var(--danger-rgb, 239, 68, 68), 0.2)',
                        color: isCorrect ? 'var(--success)' : 'var(--danger)',
                      }}
                    >
                      {isCorrect ? '正确' : '错误'}
                    </span>
                  </div>
                </div>
                <div className="font-medium mb-3 text-sm leading-relaxed break-words overflow-x-hidden" style={{ color: 'var(--text)' }}>
                  {renderMarkdownText(q.content)}
                </div>
                
                {/* Display options for choice questions */}
                {(q.type === 'single_choice' || q.type === 'multiple_choice') && q.options && (
                  <div className="mb-3 space-y-2">
                    {q.options.map(opt => {
                      const isUserAnswer = q.type === 'single_choice' 
                        ? resp?.userAnswer === opt.key 
                        : (resp?.userAnswer as string[])?.includes(opt.key);
                      const isCorrectOption = q.type === 'single_choice'
                        ? q.answer.correct_option_key === opt.key
                        : q.answer.correct_option_keys?.includes(opt.key);
                      
                      return (
                        <div 
                          key={opt.key}
                          className="px-3 py-2 rounded-lg text-sm border"
                          style={
                            isCorrectOption 
                              ? {
                                  backgroundColor: 'rgba(var(--success-rgb, 34, 197, 94), 0.2)',
                                  borderColor: 'var(--success)',
                                  color: 'var(--on-primary-container)',
                                }
                              : isUserAnswer
                                ? {
                                    backgroundColor: 'rgba(var(--danger-rgb, 239, 68, 68), 0.2)',
                                    borderColor: 'var(--danger)',
                                    color: 'var(--on-primary-container)',
                                  }
                                : {
                                    backgroundColor: 'var(--surface2)',
                                    borderColor: 'var(--outline)',
                                    color: 'var(--text)',
                                  }
                          }
                        >
                          <span className="font-bold mr-2">{opt.key}.</span>
                          {opt.text}
                          {isCorrectOption && <span className="ml-2" style={{ color: 'var(--success)' }}>✓</span>}
                          {isUserAnswer && !isCorrectOption && <span className="ml-2" style={{ color: 'var(--danger)' }}>✗</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
                
                <div 
                  className="p-4 rounded-xl text-sm space-y-2 break-words overflow-x-hidden"
                  style={{
                    backgroundColor: 'var(--surface2)',
                    color: 'var(--text)',
                  }}
                >
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-8">
                      <div>
                          <span className="font-bold shrink-0 block sm:inline text-xs uppercase mb-1 sm:mb-0" style={{ color: 'var(--muted)' }}>你的回答</span> 
                          <span 
                            className="font-medium break-words overflow-wrap-anywhere"
                            style={{ 
                              color: isCorrect ? 'var(--success)' : 'var(--danger)',
                              textDecoration: isCorrect ? 'none' : 'line-through',
                            }}
                          >
                            {JSON.stringify(resp?.userAnswer)}
                          </span>
                      </div>
                      {!isCorrect && (
                          <div>
                              <span className="font-bold shrink-0 block sm:inline text-xs uppercase mb-1 sm:mb-0" style={{ color: 'var(--muted)' }}>参考答案</span>
                              <span className="font-medium" style={{ color: 'var(--success)' }}>
                                  {q.type === 'single_choice' ? q.answer.correct_option_key : 
                                  q.type === 'multiple_choice' ? q.answer.correct_option_keys?.join(', ') :
                                  q.type === 'true_false' ? (q.answer.correct_boolean ? 'True' : 'False') :
                                  q.type === 'fill_blank' ? q.answer.expected_answers?.join(' / ') : 
                                  JSON.stringify(q.answer)}
                              </span>
                          </div>
                      )}
                  </div>
                  
                  {resp?.feedback && (
                    <div className="pt-2 border-t mt-2 break-words overflow-x-hidden" style={{ borderColor: 'var(--outline)' }}>
                      <span className="font-bold text-xs uppercase block mb-1" style={{ color: 'var(--tertiary)' }}>AI 智能点评</span>
                      <p className="break-words overflow-wrap-anywhere" style={{ color: 'var(--on-tertiary-container)' }}>{resp.feedback}</p>
                    </div>
                  )}
                  
                  {(!isCorrect || isFlagged) && !resp?.feedback && (
                    <div className="pt-2 border-t mt-2 break-words overflow-x-hidden" style={{ borderColor: 'var(--outline)' }}>
                        <span className="font-bold text-xs uppercase block mb-1" style={{ color: 'var(--muted)' }}>解析</span>
                        <p className="italic break-words overflow-wrap-anywhere" style={{ color: 'var(--text)' }}>{q.explanation || "暂无解析。"}</p>
                    </div>
                  )}
                </div>

                {/* Annotation Input */}
                <div className="mt-3 relative min-w-0 overflow-hidden">
                    <AutoResizeTextarea
                      value={resp?.annotation || ''}
                      onChange={(value) => onAnnotationUpdate(session.id, q.id, value)}
                      placeholder="在此记录你的感想或笔记..."
                      className="w-full text-xs p-3 rounded-lg focus:outline-none whitespace-pre-wrap note-textarea-fixed"
                      maxHeight={280}
                    />
                    {!resp?.annotation && (
                      <div className="absolute right-3 top-2 pointer-events-none" style={{ color: 'hsl(48, 50%, 60%)' }}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                      </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Interim Continue Button */}
        {isInterim && onContinue && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/45 dark:bg-zinc-900/35 backdrop-blur-md border-t border-black/5 dark:border-white/10 flex justify-center z-10 animate-slide-up">
              <button 
                onClick={onContinue}
                className="px-12 py-3 text-white text-lg font-bold rounded-xl transition transform active:scale-95 flex items-center gap-2"
                style={{ 
                  backgroundColor: 'var(--primary)',
                  color: 'var(--on-primary)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                继续答题
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
          </div>
        )}
      </div>

      {/* Right Spacer: Reserved space for AI Chat Window - Only show when docked */}
      {isDocked && (
        <div className="w-[480px] shrink-0" />
      )}
      
      {/* AI Chat Window - Rendered via Portal in ChatDrawer */}
      {chatQuestion && (() => {
        const q = chatQuestion.q;
        const resp = chatQuestion.r;
        
        // 构建题库元信息
        const bankMeta: BankMeta = {
          title: bank.title,
          description: bank.description,
          tags: bank.tags
        };
        
        // 构建题目上下文
        const questionContext: QuestionContext = {
          questionId: q.id,
          stem: q.content,
          options: q.options,
          userAnswer: resp.userAnswer,
          isCorrect: resp.isCorrect,
          analysis: q.explanation
        };
        
        // 根据题目类型添加正确答案
        if (q.type === 'single_choice') {
          questionContext.correctAnswer = q.answer.correct_option_key;
        } else if (q.type === 'multiple_choice') {
          questionContext.correctAnswer = q.answer.correct_option_keys;
        } else if (q.type === 'true_false') {
          questionContext.correctAnswer = q.answer.correct_boolean;
        } else if (q.type === 'fill_blank') {
          questionContext.correctAnswer = q.answer.expected_answers;
        }
        
        return (
          <ChatDrawer 
            isOpen={!!chatQuestion} 
            onClose={() => setChatQuestion(null)}
            question={q}
            userResponse={resp}
            aiSettings={aiSettings}
            inline={false}
            onChatHistoryUpdate={handleChatHistoryUpdate}
            bankMeta={bankMeta}
            questionContext={questionContext}
            bankId={bank.id}
          />
        );
      })()}
    </div>
  );
};