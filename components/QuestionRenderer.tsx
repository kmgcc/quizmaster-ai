import React from 'react';
import { Question, QuestionType } from '../types';
import { highlightCode } from '../utils/codeHighlighter';

interface Props {
  question: Question;
  currentAnswer: any;
  onChange?: (val: any) => void;
  disabled: boolean;
  showFeedback: boolean;
  isCorrect?: boolean;
}

// Markdown rendering helper
const renderMarkdownText = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;
  
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
          <code key={`${key}-${i}`} className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded text-sm font-mono border border-amber-200 dark:border-amber-800">
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
      <div key={`code-${blockIdx}`} className="my-3 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-[#1e1e1e] shadow-md">
        <div className="px-3 py-1.5 bg-[#252526] text-xs text-slate-400 border-b border-slate-700 font-bold uppercase flex justify-between items-center">
          <span>{block.lang || 'CODE'}</span>
          <div className="flex gap-1.5 opacity-50">
            <span className="w-2 h-2 rounded-full bg-[#ff5f56]"></span>
            <span className="w-2 h-2 rounded-full bg-[#ffbd2e]"></span>
            <span className="w-2 h-2 rounded-full bg-[#27c93f]"></span>
          </div>
        </div>
        <pre className="p-3 overflow-x-auto text-[#d4d4d4] text-sm leading-relaxed">
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

export const QuestionRenderer: React.FC<Props> = ({ question, currentAnswer, onChange, disabled, showFeedback, isCorrect, themeColor }) => {
  
  const getOptionClass = (isSelected: boolean, isCorrectKey: boolean) => {
    return "relative group w-full text-left p-4 rounded-lg border-2 transition-all flex items-center justify-between overflow-hidden ";
  };

  const getOptionStyle = (isSelected: boolean, isCorrectKey: boolean) => {
    // Feedback Mode
    if (showFeedback) {
      if (isCorrectKey) {
        return {
          backgroundColor: 'var(--success)',
          borderColor: 'var(--success)',
          color: 'var(--on-primary)',
          opacity: 0.2,
        };
      }
      if (isSelected && !isCorrectKey) {
        return {
          backgroundColor: 'var(--danger)',
          borderColor: 'var(--danger)',
          color: 'var(--on-primary)',
          opacity: 0.2,
        };
      }
      return {
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--outline)',
        color: 'var(--muted)',
        opacity: 0.5,
      };
    }

    // Active Mode
    if (isSelected) {
      return {
        backgroundColor: 'var(--primary-container)',
        borderColor: 'var(--primary)',
        color: 'var(--on-primary-container)',
      };
    }
    
    // Default Mode
    return {
      backgroundColor: 'var(--surface)',
      borderColor: 'var(--outline)',
      color: 'var(--text)',
    };
  };

  // Helper to render spotlight overlay for interactive elements
  const renderSpotlight = () => (
    <>
        {/* Spotlight Overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"
        style={{
            background: `radial-gradient(150px circle at var(--mouse-x) var(--mouse-y), rgba(var(--theme-rgb), 0.1), transparent 100%)`,
            backgroundAttachment: 'fixed'
        }}
        />
        {/* Border Spotlight Overlay (Masked) */}
        <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 pointer-events-none"
        style={{
            background: `radial-gradient(120px circle at var(--mouse-x) var(--mouse-y), rgba(var(--theme-rgb), 0.8), transparent 100%)`,
            backgroundAttachment: 'fixed',
            padding: '2px', // Border width
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
        }}
        />
    </>
  );

  const renderContent = () => (
    <div className="mb-6 xl:mb-0">
      <div className="text-base lg:text-lg font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
        {renderMarkdownText(question.content)}
      </div>
    </div>
  );

  const renderInputs = () => {
    switch (question.type) {
      case QuestionType.SingleChoice:
        return (
          <div className="space-y-3">
            {question.options?.map(opt => {
              const isSelected = currentAnswer === opt.key;
              const isCorrectKey = question.answer.correct_option_key === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => !disabled && onChange && onChange(opt.key)}
                  disabled={disabled}
                  className={getOptionClass(isSelected, isCorrectKey)}
                  style={getOptionStyle(isSelected, isCorrectKey)}
                  onMouseEnter={(e) => {
                    if (!showFeedback && !isSelected) {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!showFeedback && !isSelected) {
                      e.currentTarget.style.borderColor = 'var(--outline)';
                    }
                  }}
                >
                  {!showFeedback && renderSpotlight()}
                  <span className="font-medium relative z-20">{opt.text}</span>
                  <div className="relative z-20">
                      {showFeedback && isCorrectKey && <span className="text-sm font-bold" style={{ color: 'var(--success)' }}>✓</span>}
                      {showFeedback && isSelected && !isCorrectKey && <span className="text-sm font-bold" style={{ color: 'var(--danger)' }}>✗</span>}
                  </div>
                </button>
              );
            })}
          </div>
        );

      case QuestionType.MultipleChoice:
        const selectedKeys = (currentAnswer as string[]) || [];
        return (
          <div>
            <div className="space-y-3">
              {question.options?.map(opt => {
                const isSelected = selectedKeys.includes(opt.key);
                const isCorrectKey = question.answer.correct_option_keys?.includes(opt.key) || false;
                
                const toggle = () => {
                  if(!onChange) return;
                  if (isSelected) onChange(selectedKeys.filter(k => k !== opt.key));
                  else onChange([...selectedKeys, opt.key]);
                };

                return (
                  <button
                    key={opt.key}
                    onClick={() => !disabled && toggle()}
                    disabled={disabled}
                    className={getOptionClass(isSelected, isCorrectKey)}
                    style={getOptionStyle(isSelected, isCorrectKey)}
                    onMouseEnter={(e) => {
                      if (!showFeedback && !isSelected) {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!showFeedback && !isSelected) {
                        e.currentTarget.style.borderColor = 'var(--outline)';
                      }
                    }}
                  >
                    {!showFeedback && renderSpotlight()}
                    <span className="font-medium relative z-20">{opt.text}</span>
                    <div className="relative z-20">
                         {showFeedback && isCorrectKey && <span className="text-sm font-bold" style={{ color: 'var(--success)' }}>✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
            {!disabled && <p className="text-xs mt-2 text-right" style={{ color: 'var(--muted)' }}>请选择所有正确选项</p>}
          </div>
        );

      case QuestionType.TrueFalse:
        return (
          <div className="grid grid-cols-2 gap-4">
            {[true, false].map(val => {
              const isSelected = currentAnswer === val;
              const isCorrectKey = question.answer.correct_boolean === val;
              
              // Custom colors for True/False
              let className = "group relative w-full p-6 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 font-bold text-lg overflow-hidden ";
              if (showFeedback) {
                  if (isCorrectKey) className += "bg-green-100 dark:bg-green-900/30 border-green-500 text-green-800 dark:text-green-400";
                  else if (isSelected) className += "bg-red-100 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-400";
                  else className += "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-40";
              } else {
                  if (isSelected) {
                      className += val 
                          ? "bg-green-100 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-400 shadow-md" 
                          : "bg-red-100 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-400 shadow-md";
                  } else {
                      className += val 
                          ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 text-green-700 dark:text-green-500 hover:bg-green-100 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-700"
                          : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-700 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700";
                  }
              }

              return (
                <button
                  key={String(val)}
                  onClick={() => !disabled && onChange && onChange(val)}
                  disabled={disabled}
                  className={className}
                >
                  <span className="text-2xl relative z-20">{val ? "✓" : "✗"}</span>
                  <span className="relative z-20">{val ? "正确" : "错误"}</span>
                </button>
              );
            })}
          </div>
        );

      case QuestionType.FillBlank:
        return (
          <div className="relative">
            <input
              type="text"
              value={currentAnswer || ''}
              onChange={(e) => onChange && onChange(e.target.value)}
              disabled={disabled}
              placeholder="请输入你的答案..."
              className="w-full p-4 border-2 rounded-lg text-lg outline-none transition-colors"
              style={{
                borderColor: showFeedback 
                  ? (isCorrect ? 'var(--success)' : 'var(--danger)')
                  : 'var(--outline)',
                backgroundColor: showFeedback
                  ? (isCorrect ? 'var(--success)' : 'var(--danger)')
                  : 'var(--surface)',
                color: showFeedback
                  ? 'var(--on-primary)'
                  : 'var(--text)',
                opacity: showFeedback ? 0.2 : 1,
              }}
              onFocus={(e) => {
                if (!showFeedback) {
                  e.currentTarget.style.borderColor = 'var(--ring)';
                }
              }}
              onBlur={(e) => {
                if (!showFeedback) {
                  e.currentTarget.style.borderColor = 'var(--outline)';
                }
              }}
            />
             {showFeedback && !isCorrect && (
              <div className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
                <span className="font-bold">参考答案:</span> {question.answer.expected_answers?.join(" / ") || "请查看解析"}
              </div>
            )}
          </div>
        );

      default:
        return <div className="text-red-500">不支持的题目类型</div>;
    }
  };

  // Split Layout for Large Screens
  return (
    <div className="grid grid-cols-1 gap-6 min-[1600px]:grid-cols-2 min-[1600px]:gap-12 h-full items-start content-start">
      <div className="min-[1600px]:sticky min-[1600px]:top-0">
         {renderContent()}
      </div>
      <div>
         {renderInputs()}
      </div>
    </div>
  );
};