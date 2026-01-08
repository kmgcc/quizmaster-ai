import React, { useRef, useState, useEffect } from 'react';
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
  themeColor: string;
}

export const BankManager: React.FC<Props> = ({ banks, sessions, onImport, onDelete, onSelect, onViewHistory, themeColor }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [historyModalBankId, setHistoryModalBankId] = useState<string | null>(null);
  const [deleteConfirmBankId, setDeleteConfirmBankId] = useState<string | null>(null);
  const [pasteContent, setPasteContent] = useState('');
  
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
        <div className="bg-white/45 dark:bg-white/5 rounded-2xl shadow-sm border border-black/5 dark:border-white/10 overflow-hidden relative transition-colors backdrop-blur-md">
          <div className={`absolute top-0 left-0 w-full h-1 bg-${themeColor}-500 z-10`}></div>
          <div className="p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">题库管理</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">导入 JSON 题库，开始智能刷题之旅。</p>
            
            <div className="space-y-3">
              <button 
                onClick={loadSample}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-${themeColor}-700 dark:text-${themeColor}-200 bg-${themeColor}-50 dark:bg-${themeColor}-500/20 hover:bg-${themeColor}-100 dark:hover:bg-${themeColor}-500/30 rounded-xl transition border border-transparent dark:border-${themeColor}-500/30`}
              >
                <span className="text-lg">⚡</span> 加载示例题库
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowPasteModal(true)}
                  className="flex flex-col items-center justify-center gap-2 px-4 py-4 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-transparent border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/30 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    className={`w-full h-full flex flex-col items-center justify-center gap-2 px-4 py-4 text-sm font-medium text-white bg-${themeColor}-600 hover:bg-${themeColor}-700 rounded-xl shadow-lg shadow-${themeColor}-200 dark:shadow-none transition`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    导入文件
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setShowFormatModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition mt-4"
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
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 p-4 rounded-xl flex justify-between items-start gap-2 shadow-sm animate-pulse">
            <div>
              <p className="font-bold text-sm">导入失败</p>
              <p className="text-xs mt-1 opacity-90">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 dark:hover:text-red-200">×</button>
          </div>
        )}
      </div>

      {/* Right Content: Bank Grid */}
      <div className="flex-1 w-full space-y-6">
        
        {/* Batch Mode Configuration */}
        {banks.length > 0 && (
          <div className="bg-white/45 dark:bg-white/5 p-4 rounded-2xl border border-black/5 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors shadow-sm backdrop-blur-md">
             <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${themeColor}-50 dark:bg-${themeColor}-500/20 text-${themeColor}-600 dark:text-${themeColor}-300`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">阶段小结模式</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">开启后，答题过程中将定期进入小结界面，及时复盘。</p>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={enableBatchMode} onChange={e => handleStageSummaryToggle(e.target.checked)} />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${enableBatchMode ? `bg-${themeColor}-500` : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${enableBatchMode ? 'translate-x-4' : ''}`}></div>
                  </div>
                </label>
                {enableBatchMode && (
                   <div className="flex items-center gap-2 animate-fade-in-right">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">每</span>
                      <input 
                        type="number" 
                        min="1" 
                        max="50"
                        value={batchSize} 
                        onChange={e => handleBatchSizeChange(parseInt(e.target.value) || 1)}
                        className={`w-14 px-2 py-1 text-center text-sm font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 bg-white dark:bg-black/20 text-slate-900 dark:text-white border-slate-200 dark:border-white/10`}
                      />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">题一结</span>
                   </div>
                )}
             </div>
          </div>
        )}

        {banks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white/45 dark:bg-white/5 rounded-3xl border-2 border-dashed border-black/5 dark:border-white/10 text-center transition-colors backdrop-blur-md">
            <div className={`w-16 h-16 bg-${themeColor}-50 dark:bg-${themeColor}-500/20 text-${themeColor}-200 dark:text-${themeColor}-300 rounded-full flex items-center justify-center mb-4`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">暂无题库</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xs mx-auto">左侧选择导入方式，开始你的学习。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {banks.map((bank) => {
              const bankSessions = getBankSessions(bank.id);
              const lastScore = bankSessions.length > 0 ? bankSessions[0].totalScore : null;

              return (
                <div key={bank.id} className="group relative bg-white/45 dark:bg-white/5 rounded-2xl shadow-sm border border-black/5 dark:border-white/10 transition-all duration-300 flex flex-col h-full overflow-hidden backdrop-blur-md">
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
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-${themeColor}-50 dark:bg-${themeColor}-500/20 text-${themeColor}-700 dark:text-${themeColor}-300 border border-transparent dark:border-${themeColor}-500/20`}>
                        {bank.questions.length} 题
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmBankId(bank.id); }}
                        className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        title="删除题库"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 truncate group-hover:text-${themeColor}-600 dark:group-hover:text-${themeColor}-400 transition-colors">{bank.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 mb-4 leading-relaxed">{bank.description || "暂无描述。"}</p>
                    
                    {bank.tags && bank.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {bank.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300 text-[10px] uppercase tracking-wide font-medium rounded">#{tag}</span>
                        ))}
                      </div>
                    )}
                    
                    {lastScore !== null && (
                      <div className="text-xs text-slate-400 font-medium">
                        上次得分: <span className={lastScore >= 60 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>{lastScore}分</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="px-6 py-4 border-t border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex flex-col gap-2 relative z-20">
                    {(() => {
                      const savedProgressKey = `qb_progress_${bank.id}`;
                      const savedProgress = localStorage.getItem(savedProgressKey);
                      const hasProgress = savedProgress !== null;
                      
                      return hasProgress ? (
                        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">有未完成的答题记录</span>
                        </div>
                      ) : null;
                    })()}
                    <div className="flex items-center gap-3">
                    <button 
                      onClick={() => onSelect(bank, enableBatchMode ? batchSize : undefined)}
                      className={`flex-1 bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition shadow-sm group-hover:shadow-${themeColor}-500/25`}
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
                        className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-white/10 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition"
                        title="查看历史记录"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}
                      <button 
                        onClick={() => setDeleteConfirmBankId(bank.id)}
                        className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-transparent hover:border-red-200 dark:hover:border-red-800 transition"
                        title="删除题库"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 animate-fade-in">
          <div className="bg-white/45 dark:bg-zinc-900/40 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden transition-colors border border-black/10 dark:border-white/10">
            <div className="p-5 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50/50 dark:bg-black/20">
              <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">粘贴 JSON 内容</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">支持 V1 和 V2 格式（推荐使用 V2）</p>
              </div>
              <button onClick={() => setShowPasteModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-0 flex-1 overflow-hidden relative group">
              <textarea 
                className={`w-full h-full p-5 font-mono text-xs leading-relaxed bg-white dark:bg-[#1e1e2e] text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-${themeColor}-100 dark:focus:ring-${themeColor}-500/20 resize-none`}
                placeholder='在此粘贴 Schema V2 JSON 内容（也兼容 V1 格式）...'
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
              ></textarea>
            </div>
            <div className="p-5 border-t border-slate-100 dark:border-white/10 flex justify-end gap-3 bg-slate-50/50 dark:bg-black/20">
              <button 
                onClick={() => setShowPasteModal(false)}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5 rounded-xl transition"
              >
                取消
              </button>
              <button 
                onClick={handlePasteImport}
                disabled={!pasteContent.trim()}
                className={`px-6 py-2.5 text-sm font-bold bg-${themeColor}-600 text-white rounded-xl hover:bg-${themeColor}-700 disabled:opacity-50 shadow-lg shadow-${themeColor}-200 dark:shadow-none transition transform active:scale-95`}
              >
                确认导入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Format Spec Modal */}
      {showFormatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 animate-fade-in">
          <div className="bg-white/45 dark:bg-zinc-900/40 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] overflow-hidden transition-colors border border-black/10 dark:border-white/10">
             <div className="p-5 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50/50 dark:bg-black/20">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">题库格式规范 (Schema V2)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">支持 Markdown 格式的题干内容</p>
              </div>
              <button onClick={() => setShowFormatModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#1e1e2e]">
              <pre className="text-xs font-mono bg-slate-900 text-slate-300 p-4 rounded-xl overflow-x-auto shadow-inner border border-slate-700 dark:border-white/10">
                {formatSpec}
              </pre>
            </div>
             <div className="p-5 border-t border-slate-100 dark:border-white/10 flex justify-end bg-white dark:bg-[#1e1e2e]">
              <button 
                onClick={() => setShowFormatModal(false)}
                className={`px-6 py-2.5 text-sm font-bold bg-${themeColor}-600 text-white rounded-xl hover:bg-${themeColor}-700 shadow-lg shadow-${themeColor}-200 dark:shadow-none transition`}
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History List Modal */}
      {historyModalBankId && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 animate-fade-in">
           <div className="bg-white/45 dark:bg-zinc-900/40 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh] overflow-hidden transition-colors border border-black/10 dark:border-white/10">
             <div className="p-5 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50/50 dark:bg-black/20">
               <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">练习记录</h3>
               <button onClick={() => setHistoryModalBankId(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>
             <div className="flex-1 overflow-y-auto p-2 bg-slate-50 dark:bg-[#1e1e2e] space-y-2">
                {getBankSessions(historyModalBankId).length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">暂无练习记录</div>
                ) : (
                    getBankSessions(historyModalBankId).map((session, idx) => (
                        <div 
                            key={session.id} 
                            onClick={() => { onViewHistory(session); setHistoryModalBankId(null); }}
                            className="bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-md cursor-pointer transition flex justify-between items-center group"
                        >
                           <div>
                              <div className="text-xs text-slate-400 font-mono mb-1">
                                {new Date(session.startTime).toLocaleString()}
                              </div>
                              <div className={`font-bold ${session.totalScore >= 60 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                {session.totalScore} 分
                              </div>
                           </div>
                           <div className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400">
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
      {deleteConfirmBankId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 animate-fade-in">
            <div className="bg-white/45 dark:bg-zinc-900/40 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-sm flex flex-col transition-colors border border-black/10 dark:border-white/10 p-6 text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                 </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">确认删除?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">此操作无法撤销。该题库及所有相关的练习记录将被永久删除。</p>
              <div className="flex gap-3 justify-center">
                  <button 
                    onClick={() => setDeleteConfirmBankId(null)}
                    className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => { onDelete(deleteConfirmBankId); setDeleteConfirmBankId(null); }}
                    className="px-5 py-2.5 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none transition"
                  >
                    确认删除
                  </button>
              </div>
            </div>
          </div>
      )}
    </div>
  );
};