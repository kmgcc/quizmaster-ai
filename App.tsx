import React, { useState, useEffect, useRef } from 'react';
import { BankManager } from './components/BankManager';
import { QuizRunner } from './components/QuizRunner';
import { QuizReviewer } from './components/QuizReviewer';
import { TestRunner } from './components/TestRunner';
import { QuestionBank, QuizSession, AISettings } from './types';
import { exportBackup, downloadBackupJson, importBackup, BackupV1 } from './utils/backup';

type ThemeMode = 'light' | 'dark' | 'system';

// Mappings for "Low Saturation" dark backgrounds
// Adjusted to be very subtle, deep darks
const DARK_BG_MAP: Record<string, string> = {
  amber: '#1a1005',
};

// RGB values for the theme colors
const THEME_RGB_MAP: Record<string, string> = {
  amber: '245, 158, 11',
};

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'quiz' | 'review' | 'tests'>('home');
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  
  const [activeBank, setActiveBank] = useState<QuestionBank | null>(null);
  const [activeSession, setActiveSession] = useState<QuizSession | null>(null);
  const [quizBatchSize, setQuizBatchSize] = useState<number | undefined>(undefined);
  
  // Settings State
  const [themeColor, setThemeColor] = useState<string>('amber');
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [showSettings, setShowSettings] = useState(false);
  const [showAiConfigModal, setShowAiConfigModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings>({ roleName: 'AI 助教', customPrompt: '' });
  const [apiKey, setApiKey] = useState<string>('');
  
  const colors = ['amber'];
  const settingsRef = useRef<HTMLDivElement>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  // --- Global Mouse Tracker ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.body.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.body.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // --- Dark Mode & Theme Logic ---
  useEffect(() => {
    const applyTheme = () => {
      const isDark = 
        themeMode === 'dark' || 
        (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => { if (themeMode === 'system') applyTheme(); };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [themeMode]);

  useEffect(() => {
    const savedBanks = localStorage.getItem('qb_banks');
    if (savedBanks) { try { setBanks(JSON.parse(savedBanks)); } catch (e) { console.error("Failed to load banks"); } }
    const savedSessions = localStorage.getItem('qb_sessions');
    if (savedSessions) { try { setSessions(JSON.parse(savedSessions)); } catch (e) { console.error("Failed to load sessions"); } }
    const savedAiSettings = localStorage.getItem('qb_ai_settings');
    if (savedAiSettings) { try { setAiSettings(JSON.parse(savedAiSettings)); } catch (e) { console.error("Failed to load AI settings"); } }
    const savedThemeMode = localStorage.getItem('qb_theme_mode');
    if (savedThemeMode) { setThemeMode(savedThemeMode as ThemeMode); }
    const savedApiKey = localStorage.getItem('qb_api_key');
    if (savedApiKey) { setApiKey(savedApiKey); }

    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveBanks = (newBanks: QuestionBank[]) => {
    setBanks(newBanks);
    localStorage.setItem('qb_banks', JSON.stringify(newBanks));
  };

  const saveSessions = (newSessions: QuizSession[]) => {
    setSessions(newSessions);
    localStorage.setItem('qb_sessions', JSON.stringify(newSessions));
  };

  const saveAiSettings = (newSettings: AISettings) => {
      setAiSettings(newSettings);
      localStorage.setItem('qb_ai_settings', JSON.stringify(newSettings));
  };

  const handleSetThemeMode = (mode: ThemeMode) => {
      setThemeMode(mode);
      localStorage.setItem('qb_theme_mode', mode);
  }

  const saveApiKey = (key: string) => {
      setApiKey(key);
      localStorage.setItem('qb_api_key', key);
  };

  // Data Export/Import Functions
  const handleExportAllData = async () => {
    try {
      const backup = await exportBackup();
      downloadBackupJson(backup);
      
      // 提示用户备份包含敏感信息
      const hasApiKey = backup.data.ai?.apiKey ? '⚠️ 备份文件包含 API Key，请妥善保管！\n\n' : '';
      alert(`${hasApiKey}✅ 数据导出成功！\n\n已导出：\n- ${backup.data.banks.length} 个题库\n- ${backup.data.sessions.length} 条答题记录\n- ${Object.keys(backup.data.progress).length} 个答题进度\n- ${Object.keys(backup.data.chats).reduce((sum, bankId) => sum + Object.keys(backup.data.chats[bankId]).length, 0)} 个题目的 AI 对话记录\n- AI 设置${backup.data.ai?.apiKey ? '（含 API Key）' : ''}\n\n备份文件已下载。`);
      setShowSettings(false);
    } catch (err) {
      console.error('Export failed:', err);
      alert('❌ 导出失败，请查看控制台了解详情。');
    }
  };

  const handleImportAllData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string) as BackupV1;
        
        // 验证备份格式
        if (!importedData.schema_version || importedData.schema_version !== 'backup.v1') {
          // 兼容旧格式（直接是 localStorage 键值对）
          if (typeof importedData === 'object' && importedData !== null && !importedData.schema_version) {
            const confirmMsg = `检测到旧格式备份文件。\n\n这将覆盖当前的所有数据。\n\n此操作不可撤销！`;
            if (!window.confirm(confirmMsg)) {
              return;
            }

            // 清空现有数据
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('qb_')) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));

            // 导入旧格式数据
            let importedCount = 0;
            Object.keys(importedData).forEach(key => {
              if (key.startsWith('qb_')) {
                const value = typeof importedData[key] === 'string' 
                  ? importedData[key] 
                  : JSON.stringify(importedData[key]);
                localStorage.setItem(key, value);
                importedCount++;
              }
            });

            alert(`✅ 数据导入成功！\n已导入 ${importedCount} 项数据。\n\n页面将刷新以加载新数据。`);
            window.location.reload();
            return;
          }
          
          alert('❌ 无效的备份文件格式。请使用 QuizMaster AI 导出的备份文件。');
          return;
        }

        if (!importedData.data) {
          alert('❌ 备份文件格式无效：缺少 data 字段。');
          return;
        }

        const { data } = importedData;

        // 统计数据
        const banksCount = data.banks?.length || 0;
        const sessionsCount = data.sessions?.length || 0;
        const progressCount = Object.keys(data.progress || {}).length;
        const chatsCount = Object.keys(data.chats || {}).reduce((sum, bankId) => 
          sum + Object.keys(data.chats![bankId]).length, 0);
        const hasApiKey = !!data.ai?.apiKey;
        const hasAiSettings = !!data.ai?.settings;

        // 选择导入模式
        const modeMsg = `备份文件包含：\n- ${banksCount} 个题库\n- ${sessionsCount} 条答题记录\n- ${progressCount} 个答题进度\n- ${chatsCount} 个题目的 AI 对话记录\n- AI 设置${hasApiKey ? '（含 API Key）' : ''}\n\n请选择导入模式：\n\n点击"确定"：覆盖模式（清空现有数据后导入）\n点击"取消"：合并模式（合并数据，相同 ID 则替换）`;
        
        const useReplaceMode = window.confirm(modeMsg);
        const mode = useReplaceMode ? 'replace' : 'merge';

        // 执行导入
        await importBackup(importedData, mode);

        alert(`✅ 数据导入成功！\n\n已导入：\n- ${banksCount} 个题库\n- ${sessionsCount} 条答题记录\n- ${progressCount} 个答题进度\n- ${chatsCount} 个题目的 AI 对话记录\n- AI 设置${hasApiKey ? '（含 API Key）' : ''}\n\n页面将刷新以加载新数据。`);
        window.location.reload();
      } catch (err) {
        console.error('Import failed:', err);
        alert(`❌ 导入失败：${err instanceof Error ? err.message : '请确保文件格式正确'}`);
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (e.target) e.target.value = '';
  };

  const handleImport = (bank: QuestionBank) => {
    if (banks.find(b => b.id === bank.id)) {
      alert("已存在相同 ID 的题库。请先删除旧题库。");
      return;
    }
    saveBanks([...banks, bank]);
  };

  const handleDelete = (id: string) => {
    // Removed native confirm, UI handles confirmation now
    saveBanks(banks.filter(b => b.id !== id));
    saveSessions(sessions.filter(s => s.bankId !== id));
  };

  const startQuiz = (bank: QuestionBank, batchSize?: number) => {
    setActiveBank(bank);
    setQuizBatchSize(batchSize);
    setView('quiz');
  };

  const handleQuizComplete = (session: QuizSession) => {
    const newSessions = [session, ...sessions];
    saveSessions(newSessions);
    setActiveSession(session);
    setActiveBank(banks.find(b => b.id === session.bankId) || null);
    setView('review');
  };

  const handleViewHistory = (session: QuizSession) => {
    const bank = banks.find(b => b.id === session.bankId);
    if (!bank) return;
    setActiveBank(bank);
    setActiveSession(session);
    setView('review');
  };

  const handleUpdateAnnotation = (sessionId: string, questionId: string, text: string) => {
    const newSessions = sessions.map(s => {
        if (s.id === sessionId) {
            return {
                ...s,
                responses: { ...s.responses, [questionId]: { ...s.responses[questionId], annotation: text } }
            };
        }
        return s;
    });
    saveSessions(newSessions);
    if (activeSession && activeSession.id === sessionId) {
        const updatedSession = newSessions.find(s => s.id === sessionId);
        if (updatedSession) setActiveSession(updatedSession);
    }
  };

  const handleUpdateChatHistory = (sessionId: string, questionId: string, history: any[]) => {
    const newSessions = sessions.map(s => {
        if (s.id === sessionId) {
            return {
                ...s,
                responses: { ...s.responses, [questionId]: { ...s.responses[questionId], chatHistory: history } }
            };
        }
        return s;
    });
    saveSessions(newSessions);
    if (activeSession && activeSession.id === sessionId) {
        const updatedSession = newSessions.find(s => s.id === sessionId);
        if (updatedSession) setActiveSession(updatedSession);
    }
  };

  const currentDarkBg = DARK_BG_MAP[themeColor] || DARK_BG_MAP['blue'];
  const themeRgb = THEME_RGB_MAP[themeColor] || '59, 130, 246';
  
  const logoSrc = `${import.meta.env.BASE_URL}pwa-192.png`;

  return (
    <div 
      className="min-h-screen text-slate-900 dark:text-slate-100 font-sans transition-colors duration-500 relative selection:bg-blue-100 dark:selection:bg-blue-900/30"
      style={{ 
        backgroundColor: themeMode === 'light' ? '#f8fafc' : currentDarkBg,
        '--theme-rgb': themeRgb,
      } as React.CSSProperties}
    >
      
      {/* Header with Glassmorphism */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full glass-header backdrop-blur-sm bg-white/60 dark:bg-zinc-900/50 border-b border-black/5 dark:border-white/10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView('home')}>
            <img src={logoSrc} alt="QuizMaster AI" className="w-8 h-8 rounded-lg shadow-lg object-cover transition-all duration-300 group-hover:scale-110" />
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">QuizMaster AI</h1>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="relative" ref={settingsRef}>
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-white/5 rounded-lg transition"
                  title="设置与主题"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                
                {showSettings && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl shadow-2xl border border-black/5 dark:border-white/10 p-4 z-50 animate-fade-in-down ring-1 ring-black/5">
                    {/* Theme Mode Toggle */}
                    <div className="mb-4">
                       <p className="text-xs font-bold text-slate-400 uppercase mb-2">显示模式</p>
                       <div className="flex bg-slate-100 dark:bg-white/5 rounded-lg p-1">
                          <button onClick={() => handleSetThemeMode('light')} className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${themeMode === 'light' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                             ☀️ 浅色
                          </button>
                          <button onClick={() => handleSetThemeMode('dark')} className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${themeMode === 'dark' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                             🌙 深色
                          </button>
                          <button onClick={() => handleSetThemeMode('system')} className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${themeMode === 'system' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                             🖥️ 跟随
                          </button>
                       </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-2">主题颜色</p>
                      <div className="grid grid-cols-3 gap-2">
                        {colors.map(c => (
                          <button
                            key={c}
                            onClick={() => setThemeColor(c)}
                            className={`w-8 h-8 rounded-full bg-${c}-500 transition-transform hover:scale-110 flex items-center justify-center ${themeColor === c ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900' : ''}`}
                            title={c}
                          >
                             {themeColor === c && <span className="text-white text-xs">✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="border-t border-slate-100 dark:border-white/10 pt-3 space-y-2">
                       <button onClick={() => { setShowApiKeyModal(true); setShowSettings(false); }} className={`w-full text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-${themeColor}-600 dark:hover:text-${themeColor}-400 transition flex items-center gap-2`}>
                          <span className="text-lg">🔑</span> API Key 配置
                       </button>
                       <button onClick={() => { setShowAiConfigModal(true); setShowSettings(false); }} className={`w-full text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-${themeColor}-600 dark:hover:text-${themeColor}-400 transition flex items-center gap-2`}>
                          <span className="text-lg">🤖</span> AI 助教设置
                       </button>
                    </div>

                    <div className="border-t border-slate-100 dark:border-white/10 pt-3 space-y-2">
                       <p className="text-xs font-bold text-slate-400 uppercase mb-2">数据管理</p>
                       <button onClick={handleExportAllData} className={`w-full text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-${themeColor}-600 dark:hover:text-${themeColor}-400 transition flex items-center gap-2`}>
                          <span className="text-lg">💾</span> 导出所有数据
                       </button>
                       <input 
                         type="file" 
                         accept=".json" 
                         ref={backupFileInputRef} 
                         className="hidden" 
                         onChange={handleImportAllData} 
                       />
                       <button onClick={() => backupFileInputRef.current?.click()} className={`w-full text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-${themeColor}-600 dark:hover:text-${themeColor}-400 transition flex items-center gap-2`}>
                          <span className="text-lg">📥</span> 导入备份数据
                       </button>
                    </div>

                    <div className="border-t border-slate-100 dark:border-white/10 pt-3 space-y-2">
                       <button onClick={() => { setView('tests'); setShowSettings(false); }} className={`w-full text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-${themeColor}-600 dark:hover:text-${themeColor}-400 transition flex items-center gap-2`}>
                          <span className="text-lg">🧪</span> 开发者测试
                       </button>
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      </header>

      {/* Main Content - Allow scrolling under header */}
      <main className="max-w-7xl mx-auto px-4 py-8 pt-16 relative z-10">
        {view === 'home' && (
          <BankManager 
            banks={banks} 
            sessions={sessions}
            onImport={handleImport} 
            onDelete={handleDelete} 
            onSelect={startQuiz}
            onViewHistory={handleViewHistory}
            themeColor={themeColor}
          />
        )}

        {view === 'quiz' && activeBank && (
          <QuizRunner 
            bank={activeBank} 
            onComplete={handleQuizComplete}
            onExit={() => setView('home')} 
            themeColor={themeColor}
            batchSize={quizBatchSize}
            aiSettings={aiSettings}
            onAnnotationUpdate={handleUpdateAnnotation}
          />
        )}

        {view === 'review' && activeSession && activeBank && (
          <QuizReviewer 
            bank={activeBank}
            session={activeSession}
            onAnnotationUpdate={handleUpdateAnnotation}
            onChatHistoryUpdate={handleUpdateChatHistory}
            onRetake={() => startQuiz(activeBank, quizBatchSize)}
            onExit={() => setView('home')}
            themeColor={themeColor}
            aiSettings={aiSettings}
          />
        )}

        {view === 'tests' && (
            <div className="space-y-4">
                <button onClick={() => setView('home')} className={`text-${themeColor}-600 dark:text-${themeColor}-400 underline`}>← 返回首页</button>
                <TestRunner />
            </div>
        )}
      </main>

      {/* API Key Config Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1e1e2e] rounded-2xl shadow-2xl w-full max-w-lg flex flex-col transition-colors border border-slate-100 dark:border-white/10">
            <div className={`p-5 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-${themeColor}-600 text-white rounded-t-2xl`}>
              <h3 className="text-lg font-bold">🔑 API Key 配置</h3>
              <button onClick={() => setShowApiKeyModal(false)} className="text-white/80 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">DeepSeek API Key</label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    用于 AI 批改和智能问答功能。访问 <a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">platform.deepseek.com</a> 获取。
                  </p>
                  <input 
                    type="password" 
                    value={apiKey} 
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full p-3 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-black/20 text-slate-900 dark:text-slate-100 transition-colors font-mono text-sm"
                  />
               </div>
               {apiKey && (
                 <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-xs text-green-700 dark:text-green-300">
                   <div className="flex items-center gap-2">
                     <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                     </svg>
                     <span className="font-medium">API Key 已配置</span>
                   </div>
                 </div>
               )}
               {!apiKey && (
                 <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-300">
                   <div className="flex items-center gap-2">
                     <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                       <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                     </svg>
                     <span className="font-medium">未配置 API Key，AI 功能将无法使用</span>
                   </div>
                 </div>
               )}
            </div>
            <div className="p-5 border-t border-slate-100 dark:border-white/10 flex justify-end gap-3 bg-slate-50 dark:bg-black/20 rounded-b-2xl">
              <button 
                onClick={() => setShowApiKeyModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
              >
                取消
              </button>
              <button 
                onClick={() => { saveApiKey(apiKey); setShowApiKeyModal(false); alert('✅ API Key 已保存！'); }}
                className={`px-6 py-2.5 text-sm font-bold bg-${themeColor}-600 text-white rounded-xl hover:bg-${themeColor}-700 shadow-lg shadow-${themeColor}-200 dark:shadow-none transition`}
              >
                保存设置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Config Modal */}
      {showAiConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1e1e2e] rounded-2xl shadow-2xl w-full max-w-lg flex flex-col transition-colors border border-slate-100 dark:border-white/10">
            <div className={`p-5 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-${themeColor}-600 text-white rounded-t-2xl`}>
              <h3 className="text-lg font-bold">AI 助教设置</h3>
              <button onClick={() => setShowAiConfigModal(false)} className="text-white/80 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">AI 角色名称</label>
                  <input 
                    type="text" 
                    value={aiSettings.roleName} 
                    onChange={e => setAiSettings({...aiSettings, roleName: e.target.value})}
                    placeholder="例如：AI 助教、严厉的老师、温柔的学姐"
                    className="w-full p-3 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-black/20 text-slate-900 dark:text-slate-100 transition-colors"
                  />
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">系统提示词 (System Prompt)</label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">自定义 AI 的性格、语气或讲解重点。留空则使用默认配置。</p>
                  <textarea 
                    value={aiSettings.customPrompt}
                    onChange={e => setAiSettings({...aiSettings, customPrompt: e.target.value})}
                    placeholder="例如：请用苏格拉底式教学法，不要直接给出答案，而是通过提问引导我思考..."
                    className="w-full p-3 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none text-sm bg-white dark:bg-black/20 text-slate-900 dark:text-slate-100 transition-colors"
                  />
               </div>
            </div>
            <div className="p-5 border-t border-slate-100 dark:border-white/10 flex justify-end gap-3 bg-slate-50 dark:bg-black/20 rounded-b-2xl">
              <button 
                onClick={() => setAiSettings({roleName: 'AI 助教', customPrompt: ''})}
                className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
              >
                恢复默认
              </button>
              <button 
                onClick={() => { saveAiSettings(aiSettings); setShowAiConfigModal(false); }}
                className={`px-6 py-2.5 text-sm font-bold bg-${themeColor}-600 text-white rounded-xl hover:bg-${themeColor}-700 shadow-lg shadow-${themeColor}-200 dark:shadow-none transition`}
              >
                保存设置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;