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
          <code key={`${key}-${i}`} className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-200 dark:border-amber-800">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={`${key}-${i}`} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
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
      <div key={`code-${blockIdx}`} className="my-2 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-[#1e1e1e] shadow-sm">
        <div className="px-2 py-1 bg-[#252526] text-[10px] text-slate-400 border-b border-slate-700 font-bold uppercase flex justify-between items-center">
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
    <textarea
      ref={textareaRef}
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
  );
};

interface Props {
  bank: QuestionBank;
  session: QuizSession;
  onAnnotationUpdate: (sessionId: string, questionId: string, text: string) => void;
  onRetake: () => void;
  onExit: () => void;
  onContinue?: () => void; // For interim mode
  themeColor: string;
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
  themeColor, 
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
    <div className="flex gap-4 pb-4 w-full min-h-screen transition-all duration-500 min-w-0">
      {/* Left Column: Summary */}
      {/* Logic: Hide this column completely when chat is open OR if in Interim Mode */}
      {!isChatOpen && !isInterim && (
        <div className="w-full md:w-72 lg:w-80 shrink-0 space-y-6 md:mr-8 md:sticky md:top-[calc(var(--topbar-h,64px)+16px)] md:self-start animate-fade-in mt-2">
            <div className="bg-white/45 dark:bg-white/5 p-8 rounded-3xl shadow-sm border border-black/5 dark:border-white/10 text-center relative overflow-hidden transition-colors backdrop-blur-md">
                <div className={`absolute top-0 left-0 w-full h-2 bg-${themeColor}-500`}></div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">练习回顾</h2>
                <p className="text-xs text-slate-400 mb-6">{new Date(session.startTime).toLocaleString()}</p>
                
                <div className="relative w-40 h-40 mx-auto flex items-center justify-center rounded-full border-[12px] border-slate-100 dark:border-white/5">
                    <svg className={`absolute top-0 left-0 w-full h-full transform -rotate-90 text-${score >= 60 ? (score >= 80 ? 'green' : 'yellow') : 'amber'}-500`} viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="12" fill="none" strokeDasharray={`${score * 2.76} 276`} />
                    </svg>
                    <div className="text-center">
                        <div className={`text-4xl font-black ${score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-amber-500'}`}>
                        {score}
                        </div>
                        <div className="text-xs text-slate-400 font-bold uppercase mt-1">分数</div>
                    </div>
                </div>

                <div className="mt-8 flex justify-center gap-8 text-center">
                    <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{correctCount}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">答对</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalQuestions}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">总题数</div>
                    </div>
                </div>
                
                {notesCount > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/10">
                    <div className="flex items-center justify-center gap-2 text-yellow-600 dark:text-yellow-400">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      <span className="text-sm font-bold">{notesCount} 条笔记</span>
                    </div>
                  </div>
                )}
            </div>

            <div className="space-y-3">
                <button onClick={onRetake} className={`w-full px-6 py-3 bg-${themeColor}-600 text-white font-bold rounded-2xl hover:bg-${themeColor}-700 shadow-lg shadow-${themeColor}-200 dark:shadow-none transition`}>
                    再做一次
                </button>
                <button onClick={onExit} className="w-full px-6 py-3 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold rounded-2xl border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition">
                    返回题库
                </button>
            </div>
        </div>
      )}

      {/* Middle Column: Details List */}
      {/* Logic: Takes full width available. If chat open, it shares space with spacer. */}
      <div className="flex-1 min-w-0 flex flex-col relative overflow-x-hidden">
        {/* Interim Header */}
        {isInterim && (
           <div className="mb-4 flex items-center justify-between">
              <div>
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">阶段小结</h2>
                 <p className="text-slate-500 dark:text-slate-400 text-sm">本组共 {totalQuestions} 题，答对 {correctCount} 题。</p>
              </div>
           </div>
        )}

        <div className={`space-y-4 ${isChatOpen ? 'md:pr-0' : 'md:pr-2'} pt-4 pb-24 transition-all duration-500 min-w-0 overflow-x-hidden ${isDocked ? 'break-words' : ''}`}>
          {/* Notes Summary Section - Only show in final review (not interim) if there are notes */}
          {!isInterim && notesCount > 0 && (
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10 p-6 rounded-2xl border-2 border-yellow-200 dark:border-yellow-800/30 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-400 dark:bg-yellow-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">📝 笔记汇总</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">你在本次练习中记录了 {notesCount} 条笔记</p>
                </div>
              </div>
              <div className="space-y-3">
                {questionsToRender.map((q, idx) => {
                  const resp = session.responses[q.id];
                  if (!resp?.annotation) return null;
                  
                  return (
                    <div key={q.id} className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800/30">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold shrink-0 mt-0.5">
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
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 truncate break-words">{q.content}</p>
                          <p className="text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap break-words overflow-wrap-anywhere overflow-x-hidden">{resp.annotation}</p>
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

            return (
              <div 
                  key={q.id} 
                  className={`bg-white dark:bg-white/5 p-6 rounded-2xl border-l-[6px] shadow-sm transition-all hover:shadow-md min-w-0 overflow-hidden
                      ${isCorrect ? 'border-green-500' : isFlagged ? 'border-orange-400' : 'border-red-500'}
                      ${isActive ? `ring-2 ring-${themeColor}-400 ring-offset-2 dark:ring-offset-gray-950` : ''}
                  `}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-slate-400 text-xs font-bold">
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
                        <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold rounded-full flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M3 6a1 1 0 011-1h15a1 1 0 011 1v9a1 1 0 01-1 1h-6.101l-2.424 2.424A1 1 0 019 18V16H4a1 1 0 01-1-1V6z" /></svg>
                            存疑
                        </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setChatQuestion({ q, r: resp })}
                      className={`flex items-center gap-1 text-xs font-bold ${isActive ? `bg-${themeColor}-600 text-white` : `text-${themeColor}-600 dark:text-${themeColor}-400 hover:bg-${themeColor}-50 dark:hover:bg-${themeColor}-900/30`} px-3 py-1.5 rounded-lg transition ${highlightFlag ? 'animate-pulse ring-2 ring-orange-200 dark:ring-orange-800' : ''}`}
                    >
                      <span>{isActive ? '正在讨论...' : '✨ 问 AI'}</span>
                    </button>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${isCorrect ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                      {isCorrect ? '正确' : '错误'}
                    </span>
                  </div>
                </div>
                <div className="text-slate-900 dark:text-slate-100 font-medium mb-3 text-sm leading-relaxed break-words overflow-x-hidden">
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
                          className={`px-3 py-2 rounded-lg text-sm border ${
                            isCorrectOption 
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-900 dark:text-green-100'
                              : isUserAnswer
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="font-bold mr-2">{opt.key}.</span>
                          {opt.text}
                          {isCorrectOption && <span className="ml-2 text-green-600 dark:text-green-400">✓</span>}
                          {isUserAnswer && !isCorrectOption && <span className="ml-2 text-red-600 dark:text-red-400">✗</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
                
                <div className="bg-slate-50 dark:bg-black/20 p-4 rounded-xl text-sm text-slate-600 dark:text-slate-300 space-y-2 break-words overflow-x-hidden">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-8">
                      <div>
                          <span className="font-bold shrink-0 block sm:inline text-xs text-slate-400 dark:text-slate-500 uppercase mb-1 sm:mb-0">你的回答</span> 
                          <span className={isCorrect ? 'text-green-700 dark:text-green-400 font-medium' : 'text-red-700 dark:text-red-400 font-medium line-through break-words overflow-wrap-anywhere'}>{JSON.stringify(resp?.userAnswer)}</span>
                      </div>
                      {!isCorrect && (
                          <div>
                              <span className="font-bold shrink-0 block sm:inline text-xs text-slate-400 dark:text-slate-500 uppercase mb-1 sm:mb-0">参考答案</span>
                              <span className="text-green-700 dark:text-green-400 font-medium">
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
                    <div className="pt-2 border-t border-slate-200 dark:border-white/10 mt-2 break-words overflow-x-hidden">
                      <span className="font-bold text-xs uppercase text-purple-600 dark:text-purple-400 block mb-1">AI 智能点评</span>
                      <p className="text-purple-800 dark:text-purple-300 break-words overflow-wrap-anywhere">{resp.feedback}</p>
                    </div>
                  )}
                  
                  {(!isCorrect || isFlagged) && !resp?.feedback && (
                    <div className="pt-2 border-t border-slate-200 dark:border-white/10 mt-2 break-words overflow-x-hidden">
                        <span className="font-bold text-xs uppercase text-slate-400 block mb-1">解析</span>
                        <p className="italic break-words overflow-wrap-anywhere">{q.explanation || "暂无解析。"}</p>
                    </div>
                  )}
                </div>

                {/* Annotation Input */}
                <div className="mt-3 relative min-w-0 overflow-hidden">
                    <AutoResizeTextarea
                      value={resp?.annotation || ''}
                      onChange={(value) => onAnnotationUpdate(session.id, q.id, value)}
                      placeholder="在此记录你的感想或笔记..."
                      className="w-full text-xs p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/50 rounded-lg text-slate-600 dark:text-slate-300 placeholder-yellow-300/70 focus:outline-none focus:ring-1 focus:ring-yellow-400 whitespace-pre-wrap"
                      maxHeight={280}
                    />
                    {!resp?.annotation && (
                      <div className="absolute right-3 top-2 pointer-events-none text-yellow-400 dark:text-yellow-600">
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
                className={`px-12 py-3 bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white text-lg font-bold rounded-xl shadow-lg shadow-${themeColor}-200 dark:shadow-none transition transform active:scale-95 flex items-center gap-2`}
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
            themeColor={themeColor}
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