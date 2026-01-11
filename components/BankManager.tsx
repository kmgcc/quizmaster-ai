import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QuestionBank, QuizSession } from '../types';
import { validateQuestionBank } from '../services/validator';
import { SAMPLE_BANK } from '../constants';

interface Props {
  banks: QuestionBank[];
  sessions: QuizSession[];
  onImport: (bank: QuestionBank) => void;
  onDelete: (id: string) => void;
  onSelect: (bank: QuestionBank, batchSize?: number) => void;
  onViewHistory: (session: QuizSession) => void;
}

export const BankManager: React.FC<Props> = ({ banks, sessions, onImport, onDelete, onSelect, onViewHistory }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [historyModalBankId, setHistoryModalBankId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title?: string } | null>(null);
  const [pasteContent, setPasteContent] = useState('');
  
  // Clear Incomplete Progress State
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [targetBankId, setTargetBankId] = useState<string | null>(null);
  
  // Batch Mode State
  const [enableBatchMode, setEnableBatchMode] = useState(false);
  const [batchSize, setBatchSize] = useState<number>(5);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedStageSummary = localStorage.getItem('qb_pref_stage_summary_enabled');
      if (savedStageSummary !== null) {
        const value = savedStageSummary === 'true' || savedStageSummary === '1';
        setEnableBatchMode(value);
      }
      const savedBatchSize = localStorage.getItem('qb_pref_stage_summary_batch_size');
      if (savedBatchSize !== null) {
        const parsedSize = parseInt(savedBatchSize, 10);
        if (!isNaN(parsedSize) && parsedSize >= 1 && parsedSize <= 50) {
          setBatchSize(parsedSize);
        }
      }
    } catch (e) {
      console.error('Failed to load stage summary preference', e);
    }
  }, []);

  // Save preference when toggle changes
  const handleStageSummaryToggle = (enabled: boolean) => {
    setEnableBatchMode(enabled);
    try {
      localStorage.setItem('qb_pref_stage_summary_enabled', enabled ? '1' : '0');
    } catch (e) {
      console.error('Failed to save stage summary preference', e);
    }
  };

  // Save batchSize when it changes
  const handleBatchSizeChange = (value: number) => {
    const clampedValue = Math.max(1, Math.min(50, value));
    setBatchSize(clampedValue);
    try {
      localStorage.setItem('qb_pref_stage_summary_batch_size', String(clampedValue));
    } catch (e) {
      console.error('Failed to save batch size preference', e);
    }
  };

  // 清除未完成的答题记录
  const handleClearIncompleteProgress = (bankId: string) => {
    const savedProgressKey = `qb_progress_${bankId}`;
    localStorage.removeItem(savedProgressKey);
    setClearConfirmOpen(false);
    setTargetBankId(null);
    // 触发重新渲染（通过强制更新或页面刷新）
    window.location.reload();
  };

  // ESC 键关闭确认弹窗
  useEffect(() => {
    if (!clearConfirmOpen && !deleteConfirmOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (clearConfirmOpen) {
          setClearConfirmOpen(false);
          setTargetBankId(null);
        }
        if (deleteConfirmOpen) {
          setDeleteConfirmOpen(false);
          setDeleteTarget(null);
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [clearConfirmOpen, deleteConfirmOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const result = validateQuestionBank(json);
        if (result.valid && result.data) {
          onImport(result.data);
          setError(null);
        } else {
          setError(`文件无效: ${result.error}`);
        }
      } catch (err) {
        setError("JSON 格式错误。");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePasteImport = () => {
    if (!pasteContent.trim()) return;
    try {
      const json = JSON.parse(pasteContent);
      const result = validateQuestionBank(json);
      if (result.valid && result.data) {
        onImport(result.data);
        setError(null);
        setShowPasteModal(false);
        setPasteContent('');
      } else {
        setError(`文本内容无效: ${result.error}`);
      }
    } catch (err) {
      setError("JSON 格式错误。请检查语法。");
    }
  };

  const loadSample = () => {
    onImport(SAMPLE_BANK);
  };

  const getBankSessions = (bankId: string) => {
    return sessions.filter(s => s.bankId === bankId).sort((a, b) => b.startTime - a.startTime);
  };

  // JSON Format Spec Content (V2 with Markdown support)
  const formatSpec = `{
  "schema_version": "2.0",    // V2 版本，支持 Markdown
  "id": "unique_id_001",      // 必须，全局唯一字符串
  "title": "题库标题",         // 必须
  "description": "描述文本...",
  "tags": ["tag1", "tag2"],
  "questions": [
    {
      "id": "q1",
      "type": "single_choice", // single_choice | multiple_choice | true_false | fill_blank
      "content": "在 JavaScript 中，\`const\` 和 \`let\` 的**区别**是什么？\\n\\n\`\`\`javascript\\nconst x = 1;\\nlet y = 2;\\n\`\`\`",
      "options": [            // 选择题必须
        {"key": "A", "text": "const 不可重新赋值"},
        {"key": "B", "text": "let 不可重新赋值"}
      ],
      "answer": {
        "correct_option_key": "A",      // 单选答案
        "correct_option_keys": ["A"],   // 多选答案
        "correct_boolean": true,        // 判断答案
        "expected_answers": ["ans1"],   // 填空参考答案
        "llm_grading": false            // 是否启用 AI 评分 (填空题)
      },
      "explanation": "使用 \`const\` 声明的变量不能重新赋值，而 \`let\` 可以。",
      "tags": ["JavaScript", "ES6"]
    }
  ],
  "created_at": 1704441600000
}

// V2 新特性：支持 Markdown 语法
// - 行内代码: \`code\`
// - 代码块: \`\`\`language\\ncode\\n\`\`\`
// - 加粗: **bold**
// 详见: SCHEMA_V2_GUIDE.md`;

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Left Sidebar: Actions Panel */}
      <div className="w-full lg:w-80 shrink-0 space-y-6 lg:sticky lg:top-24">
        {/* Changed structure: padding is now on the inner div */}
        <div 
          className="rounded-2xl shadow-sm border overflow-hidden relative transition-colors backdrop-blur-md"
          style={{ 
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--outline)',
          }}
        >
          <div className="absolute top-0 left-0 w-full h-1 z-10" style={{ backgroundColor: 'var(--primary)' }}></div>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>题库管理</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>导入 JSON 题库，开始智能刷题之旅。</p>
            
            <div className="space-y-3">
              <button 
                onClick={loadSample}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl transition border"
                style={{ 
                  color: 'var(--on-primary-container)',
                  backgroundColor: 'var(--primary-container)',
                  borderColor: 'transparent',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-container)'}
              >
                <span className="text-lg">⚡</span> 加载示例题库
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowPasteModal(true)}
                  className="flex flex-col items-center justify-center gap-2 px-4 py-4 text-sm font-medium border rounded-xl transition shadow-sm"
                  style={{ 
                    color: 'var(--text)',
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--outline)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.backgroundColor = 'var(--surface2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--outline)';
                    e.currentTarget.style.backgroundColor = 'var(--surface)';
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--muted)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  粘贴 JSON
                </button>

                <div className="relative h-full">
                  <input 
                    type="file" 
                    accept=".json" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileUpload} 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-full flex flex-col items-center justify-center gap-2 px-4 py-4 text-sm font-medium rounded-xl transition"
                    style={{ 
                      color: 'var(--on-primary)',
                      backgroundColor: 'var(--primary)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--on-primary)', opacity: 0.8 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    导入文件
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setShowFormatModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium transition mt-4"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                查看 JSON 格式规范 (Schema V2)
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div 
            className="border p-4 rounded-xl flex justify-between items-start gap-2 shadow-sm animate-pulse"
            style={{ 
              backgroundColor: 'rgba(var(--danger-rgb, 239, 68, 68), 0.15)',
              borderColor: 'var(--danger)',
              color: 'var(--danger)',
            }}
          >
            <div>
              <p className="font-bold text-sm">导入失败</p>
              <p className="text-xs mt-1" style={{ opacity: 0.9 }}>{error}</p>
            </div>
            <button 
              onClick={() => setError(null)} 
              style={{ color: 'var(--danger)' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Right Content: Bank Grid */}
      <div className="flex-1 w-full space-y-6">
        
        {/* Batch Mode Configuration */}
        {banks.length > 0 && (
          <div 
            className="p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors shadow-sm backdrop-blur-md"
            style={{ 
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--outline)',
            }}
          >
             <div className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ 
                    backgroundColor: 'var(--primary-container)',
                    color: 'var(--on-primary-container)',
                  }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>阶段小结模式</h3>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>开启后，答题过程中将定期进入小结界面，及时复盘。</p>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={enableBatchMode} onChange={e => handleStageSummaryToggle(e.target.checked)} />
                    <div 
                      className="block w-10 h-6 rounded-full transition-colors"
                      style={{ backgroundColor: enableBatchMode ? 'var(--primary)' : 'var(--outline)' }}
                    ></div>
                    <div 
                      className="dot absolute left-1 top-1 w-4 h-4 rounded-full transition transform"
                      style={{ 
                        backgroundColor: 'var(--on-primary)',
                        transform: enableBatchMode ? 'translateX(16px)' : 'translateX(0)',
                      }}
                    ></div>
                  </div>
                </label>
                {enableBatchMode && (
                   <div className="flex items-center gap-2 animate-fade-in-right">
                      <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>每</span>
                      <input 
                        type="number" 
                        min="1" 
                        max="50"
                        value={batchSize} 
                        onChange={e => handleBatchSizeChange(parseInt(e.target.value) || 1)}
                        className="w-14 px-2 py-1 text-center text-sm font-bold border rounded-lg focus:outline-none"
                        style={{ 
                          borderColor: 'var(--outline)',
                          backgroundColor: 'var(--surface2)',
                          color: 'var(--text)',
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--ring)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--outline)'}
                      />
                      <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>题一结</span>
                   </div>
                )}
             </div>
          </div>
        )}

        {banks.length === 0 ? (
          <div 
            className="flex flex-col items-center justify-center py-24 rounded-3xl border-2 border-dashed text-center transition-colors backdrop-blur-md"
            style={{ 
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--outline)',
            }}
          >
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ 
                backgroundColor: 'var(--primary-container)',
                color: 'var(--on-primary-container)',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>暂无题库</h3>
            <p className="text-sm mt-1 max-w-xs mx-auto" style={{ color: 'var(--muted)' }}>左侧选择导入方式，开始你的学习。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {banks.map((bank) => {
              const bankSessions = getBankSessions(bank.id);
              const lastScore = bankSessions.length > 0 ? bankSessions[0].totalScore : null;

              return (
                <div 
                  key={bank.id} 
                  className="group relative rounded-2xl shadow-sm border transition-all duration-300 flex flex-col h-full overflow-hidden backdrop-blur-md"
                  style={{ 
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--outline)',
                  }}
                >
                   {/* Spotlight Overlay */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"
                    style={{
                      background: `radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(var(--theme-rgb), 0.1), transparent 100%)`,
                      backgroundAttachment: 'fixed'
                    }}
                  />
                  {/* Border Spotlight Overlay (Masked) */}
                  <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 pointer-events-none"
                    style={{
                        background: `radial-gradient(250px circle at var(--mouse-x) var(--mouse-y), rgba(var(--theme-rgb), 0.6), transparent 100%)`,
                        backgroundAttachment: 'fixed',
                        padding: '1px',
                        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        maskComposite: 'exclude',
                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor',
                    }}
                   />
                  
                  <div className="p-6 flex-1 cursor-pointer relative z-20" onClick={() => onSelect(bank, enableBatchMode ? batchSize : undefined)}>
                    <div className="flex justify-between items-start mb-3">
                      <span 
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border"
                        style={{ 
                          backgroundColor: 'var(--primary-container)',
                          color: 'var(--on-primary-container)',
                          borderColor: 'transparent',
                        }}
                      >
                        {bank.questions.length} 题
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget({ id: bank.id, title: bank.title });
                          setDeleteConfirmOpen(true);
                        }}
                        className="transition p-1 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 pointer-events-auto"
                        style={{ color: 'var(--danger)', backgroundColor: 'var(--surface2)' }}
                        title="删除题库"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <h3 
                      className="text-lg font-bold mb-2 truncate transition-colors"
                      style={{ color: 'var(--text)' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text)'}
                    >
                      {bank.title}
                    </h3>
                    <p className="text-sm line-clamp-3 mb-4 leading-relaxed" style={{ color: 'var(--muted)' }}>{bank.description || "暂无描述。"}</p>
                    
                    {bank.tags && bank.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {bank.tags.slice(0, 3).map(tag => (
                          <span 
                            key={tag} 
                            className="px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium rounded"
                            style={{ 
                              backgroundColor: 'var(--surface2)',
                              color: 'var(--muted)',
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {lastScore !== null && (
                      <div className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                        上次得分: <span style={{ color: lastScore >= 60 ? 'var(--success)' : 'var(--warning)' }}>{lastScore}分</span>
                      </div>
                    )}
                  </div>
                  
                  <div 
                    className="px-6 py-4 border-t flex flex-col gap-2 relative z-20"
                    style={{ 
                      borderColor: 'var(--outline)',
                      backgroundColor: 'var(--surface2)',
                    }}
                  >
                    {(() => {
                      const savedProgressKey = `qb_progress_${bank.id}`;
                      const savedProgress = localStorage.getItem(savedProgressKey);
                      const hasProgress = savedProgress !== null;
                      
                      return hasProgress ? (
                        <div 
                          className="group flex items-center gap-2 text-xs px-3 py-2 rounded-lg border"
                          style={{ 
                            color: 'var(--warning)',
                            backgroundColor: 'rgba(var(--warning-rgb, 251, 191, 36), 0.15)',
                            borderColor: 'var(--warning)',
                          }}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">有未完成的答题记录</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTargetBankId(bank.id);
                              setClearConfirmOpen(true);
                            }}
                            className="ml-auto opacity-0 group-hover:opacity-100 transition p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10"
                            aria-label="清除未完成记录"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : null;
                    })()}
                    <div className="flex items-center gap-3">
                    <button 
                      onClick={() => onSelect(bank, enableBatchMode ? batchSize : undefined)}
                      className="flex-1 font-bold py-2 px-4 rounded-lg text-sm transition"
                      style={{ 
                        backgroundColor: 'var(--primary)',
                        color: 'var(--on-primary)',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                        {(() => {
                          const savedProgressKey = `qb_progress_${bank.id}`;
                          const savedProgress = localStorage.getItem(savedProgressKey);
                          return savedProgress ? '继续答题' : '开始练习';
                        })()}
                    </button>
                    {bankSessions.length > 0 && (
                       <button 
                        onClick={() => setHistoryModalBankId(bank.id)}
                        className="p-2 rounded-lg border border-transparent transition"
                        style={{ color: 'var(--muted)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--text)';
                          e.currentTarget.style.backgroundColor = 'var(--surface)';
                          e.currentTarget.style.borderColor = 'var(--outline)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--muted)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.borderColor = 'transparent';
                        }}
                        title="查看历史记录"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
          <div 
            className="backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden transition-colors border"
            style={{ 
              backgroundColor: 'rgba(var(--surface-rgb, 255, 255, 255), 0.45)',
              borderColor: 'var(--outline)',
            }}
          >
            <div 
              className="p-5 border-b flex justify-between items-center"
              style={{ 
                borderColor: 'var(--outline)',
                backgroundColor: 'var(--surface2)',
              }}
            >
              <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>粘贴 JSON 内容</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>支持 V1 和 V2 格式（推荐使用 V2）</p>
              </div>
              <button 
                onClick={() => setShowPasteModal(false)} 
                className="p-1 rounded transition"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text)';
                  e.currentTarget.style.backgroundColor = 'var(--surface)';
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
            <div className="p-0 flex-1 overflow-hidden relative group">
              <textarea 
                className="w-full h-full p-5 font-mono text-xs leading-relaxed focus:outline-none resize-none"
                style={{
                  backgroundColor: 'var(--surface2)',
                  color: 'var(--text)',
                }}
                placeholder='在此粘贴 Schema V2 JSON 内容（也兼容 V1 格式）...'
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--ring)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--outline)'}
              ></textarea>
            </div>
            <div 
              className="p-5 border-t flex justify-end gap-3"
              style={{ 
                borderColor: 'var(--outline)',
                backgroundColor: 'var(--surface2)',
              }}
            >
              <button 
                onClick={() => setShowPasteModal(false)}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl transition"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text)';
                  e.currentTarget.style.backgroundColor = 'var(--surface)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--muted)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                取消
              </button>
              <button 
                onClick={handlePasteImport}
                disabled={!pasteContent.trim()}
                className="px-6 py-2.5 text-sm font-bold rounded-xl transition transform active:scale-95"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--on-primary)',
                  opacity: !pasteContent.trim() ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (pasteContent.trim()) {
                    e.currentTarget.style.opacity = '0.9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (pasteContent.trim()) {
                    e.currentTarget.style.opacity = '1';
                  }
                }}
              >
                确认导入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Format Spec Modal */}
      {showFormatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
          <div 
            className="backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] overflow-hidden transition-colors border"
            style={{ 
              backgroundColor: 'rgba(var(--surface-rgb, 255, 255, 255), 0.45)',
              borderColor: 'var(--outline)',
            }}
          >
             <div 
               className="p-5 border-b flex justify-between items-center"
               style={{ 
                 borderColor: 'var(--outline)',
                 backgroundColor: 'var(--surface2)',
               }}
             >
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>题库格式规范 (Schema V2)</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>支持 Markdown 格式的题干内容</p>
              </div>
              <button 
                onClick={() => setShowFormatModal(false)} 
                className="p-1 rounded transition"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text)';
                  e.currentTarget.style.backgroundColor = 'var(--surface)';
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
            <div 
              className="flex-1 overflow-y-auto p-6"
              style={{ backgroundColor: 'var(--surface2)' }}
            >
              <pre 
                className="text-xs font-mono p-4 rounded-xl overflow-x-auto shadow-inner border"
                style={{ 
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  borderColor: 'var(--outline)',
                }}
              >
                {formatSpec}
              </pre>
            </div>
             <div 
               className="p-5 border-t flex justify-end"
               style={{ 
                 borderColor: 'var(--outline)',
                 backgroundColor: 'var(--surface)',
               }}
             >
              <button 
                onClick={() => setShowFormatModal(false)}
                className="px-6 py-2.5 text-sm font-bold rounded-xl transition"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--on-primary)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History List Modal */}
      {historyModalBankId && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
           <div 
             className="backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh] overflow-hidden transition-colors border"
             style={{ 
               backgroundColor: 'rgba(var(--surface-rgb, 255, 255, 255), 0.45)',
               borderColor: 'var(--outline)',
             }}
           >
             <div 
               className="p-5 border-b flex justify-between items-center"
               style={{ 
                 borderColor: 'var(--outline)',
                 backgroundColor: 'var(--surface2)',
               }}
             >
               <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>练习记录</h3>
               <button 
                 onClick={() => setHistoryModalBankId(null)} 
                 className="transition"
                 style={{ color: 'var(--muted)' }}
                 onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
                 onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
               >
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>
             <div 
               className="flex-1 overflow-y-auto p-2 space-y-2"
               style={{ backgroundColor: 'var(--surface2)' }}
             >
                {getBankSessions(historyModalBankId).length === 0 ? (
                    <div className="text-center py-8 text-sm" style={{ color: 'var(--muted)' }}>暂无练习记录</div>
                ) : (
                    getBankSessions(historyModalBankId).map((session, idx) => (
                        <div 
                            key={session.id} 
                            onClick={() => { onViewHistory(session); setHistoryModalBankId(null); }}
                            className="p-4 rounded-xl border hover:shadow-md cursor-pointer transition flex justify-between items-center group"
                            style={{
                              backgroundColor: 'var(--surface)',
                              borderColor: 'var(--outline)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--primary)';
                              e.currentTarget.style.backgroundColor = 'var(--surface2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--outline)';
                              e.currentTarget.style.backgroundColor = 'var(--surface)';
                            }}
                        >
                           <div>
                              <div className="text-xs font-mono mb-1" style={{ color: 'var(--muted)' }}>
                                {new Date(session.startTime).toLocaleString()}
                              </div>
                              <div 
                                className="font-bold"
                                style={{ color: session.totalScore >= 60 ? 'var(--success)' : 'var(--warning)' }}
                              >
                                {session.totalScore} 分
                              </div>
                           </div>
                           <div 
                             className="transition"
                             style={{ color: 'var(--muted)' }}
                             onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                             onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
                           >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                           </div>
                        </div>
                    ))
                )}
             </div>
           </div>
         </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && deleteTarget && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[9999] animate-fade-in"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)' }}
            onClick={() => {
              setDeleteConfirmOpen(false);
              setDeleteTarget(null);
            }}
          />
          
          {/* Dialog */}
          <div 
            className="fixed left-1/2 top-1/2 z-[10000] -translate-x-1/2 -translate-y-1/2 w-[min(92vw,420px)] rounded-2xl border shadow-2xl ring-1 ring-white/10 p-5 animate-fade-in-down supports-[backdrop-filter]:bg-white/25 supports-[backdrop-filter]:dark:bg-zinc-900/25 bg-white/40 dark:bg-zinc-900/40"
            style={{
              WebkitBackdropFilter: 'blur(18px) saturate(160%)',
              backdropFilter: 'blur(18px) saturate(160%)',
              borderColor: 'rgba(255,255,255,0.18)',
            } as React.CSSProperties}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>
              确认删除题库？
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
              此操作会删除题库及其所有相关的练习记录，不可撤销。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeleteTarget(null);
                }}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl transition"
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
                取消
              </button>
              <button
                onClick={() => {
                  onDelete(deleteTarget.id);
                  setDeleteConfirmOpen(false);
                  setDeleteTarget(null);
                }}
                className="px-5 py-2.5 text-sm font-bold rounded-xl transition"
                style={{
                  backgroundColor: 'var(--danger)',
                  color: 'var(--on-primary)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                删除
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Clear Incomplete Progress Confirmation Modal */}
      {clearConfirmOpen && targetBankId && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[9998] animate-fade-in"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
            onClick={() => {
              setClearConfirmOpen(false);
              setTargetBankId(null);
            }}
          />
          
          {/* Dialog */}
          <div 
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,420px)] z-[9999] rounded-2xl border shadow-2xl p-5 ring-1 ring-white/10 animate-fade-in-down supports-[backdrop-filter]:bg-white/25 supports-[backdrop-filter]:dark:bg-zinc-900/25 bg-white/40 dark:bg-zinc-900/40"
            style={{
              WebkitBackdropFilter: 'blur(18px) saturate(160%)',
              backdropFilter: 'blur(18px) saturate(160%)',
              borderColor: 'var(--outline)',
            } as React.CSSProperties}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>
              清除未完成记录
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
              确定要清除该题库的未完成答题记录吗？此操作只会清除未完成的进度，已完成的答题记录不会受到影响。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setClearConfirmOpen(false);
                  setTargetBankId(null);
                }}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl transition"
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
                取消
              </button>
              <button
                onClick={() => handleClearIncompleteProgress(targetBankId)}
                className="px-5 py-2.5 text-sm font-bold rounded-xl transition"
                style={{
                  backgroundColor: 'var(--warning)',
                  color: 'var(--on-primary)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                清除
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};