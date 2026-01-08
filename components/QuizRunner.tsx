import React, { useState, useEffect } from 'react';
import { QuestionBank, Question, UserResponse, QuizSession, AISettings } from '../types';
import { QuestionRenderer } from './QuestionRenderer';
import { gradeQuestionLocally } from '../services/gradingLogic';
import { gradeWithAI } from '../services/geminiService';
import { QuizReviewer } from './QuizReviewer';

interface Props {
  bank: QuestionBank;
  onComplete: (session: QuizSession) => void;
  onExit: () => void;
  themeColor: string;
  batchSize?: number;
  aiSettings?: AISettings;
  onAnnotationUpdate?: (sessionId: string, questionId: string, text: string) => void;
}

export const QuizRunner: React.FC<Props> = ({ bank, onComplete, onExit, themeColor, batchSize, aiSettings, onAnnotationUpdate }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, UserResponse>>({});
  const [currentAnswer, setCurrentAnswer] = useState<any>(null);
  const [isCurrentFlagged, setIsCurrentFlagged] = useState(false);
  const [startTime] = useState(Date.now());
  const [isGradingAI, setIsGradingAI] = useState(false);
  const [tempSessionId] = useState(crypto.randomUUID()); // Temporary session ID for interim updates

  // Interim Summary State
  const [showInterim, setShowInterim] = useState(false);
  const [interimQuestions, setInterimQuestions] = useState<Question[]>([]);
  const [interimSession, setInterimSession] = useState<QuizSession | null>(null);

  // Load saved progress on mount
  useEffect(() => {
    setQuestions([...bank.questions]);
    
    // Try to load saved progress for this bank
    const savedProgressKey = `qb_progress_${bank.id}`;
    const savedProgress = localStorage.getItem(savedProgressKey);
    
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setCurrentIndex(progress.currentIndex || 0);
        setAnswers(progress.answers || {});
      } catch (e) {
        console.error("Failed to load progress", e);
      }
    }
  }, [bank]);

  // Save progress whenever answers or currentIndex changes
  useEffect(() => {
    if (questions.length === 0) return;
    
    const savedProgressKey = `qb_progress_${bank.id}`;
    const progress = {
      currentIndex,
      answers,
      lastUpdated: Date.now()
    };
    
    localStorage.setItem(savedProgressKey, JSON.stringify(progress));
  }, [answers, currentIndex, bank.id, questions.length]);

  useEffect(() => {
    // Restore answer when navigating
    const qId = questions[currentIndex]?.id;
    if (qId && answers[qId]) {
      setCurrentAnswer(answers[qId].userAnswer);
      setIsCurrentFlagged(!!answers[qId].isFlagged);
    } else {
      setCurrentAnswer(null);
      setIsCurrentFlagged(false);
    }
  }, [currentIndex, questions]);

  const goToQuestion = (index: number) => {
      saveCurrentAnswer();
      setCurrentIndex(index);
  }

  const handleNext = async () => {
    if (!hasAnswered()) return;
    
    // 1. Save current answer logic
    const q = questions[currentIndex];
    let grade = { isCorrect: false, score: 0 };
    if (hasAnswered()) {
        grade = gradeQuestionLocally(q, currentAnswer);
    }
    const currentResponse: UserResponse = {
      questionId: q.id,
      userAnswer: currentAnswer,
      isCorrect: grade.isCorrect,
      score: grade.score,
      timestamp: Date.now(),
      isAiGraded: q.type === 'fill_blank' && q.answer.llm_grading && grade.score === 0,
      isFlagged: isCurrentFlagged,
      questionIndex: currentIndex // 保存题目在题库中的索引
    };
    
    // 2. Update state synchronously to ensure we have the latest data for grading
    const updatedAnswers = { ...answers, [q.id]: currentResponse };
    setAnswers(updatedAnswers);

    // 3. Check for Interim Batch
    const nextIndex = currentIndex + 1;
    const shouldShowInterim = batchSize && nextIndex > 0 && nextIndex % batchSize === 0 && nextIndex < questions.length;

    if (shouldShowInterim) {
        // Trigger Interim Summary
        await processGradingAndShowSummary(updatedAnswers, nextIndex - batchSize, nextIndex);
    } else if (currentIndex < questions.length - 1) {
       // Normal Next
       setCurrentIndex(prev => prev + 1);
    }
  };

  const processGradingAndShowSummary = async (currentAnswersMap: Record<string, UserResponse>, startIndex: number, endIndex: number) => {
     setIsGradingAI(true);
     
     const batchQuestions = questions.slice(startIndex, endIndex);
     const finalAnswers = { ...currentAnswersMap };

     // 确保所有响应都有 questionIndex（兼容旧数据）
     batchQuestions.forEach((q, batchIdx) => {
       const resp = finalAnswers[q.id];
       if (resp && resp.questionIndex === undefined) {
         // 从 questions 数组查找索引
         const questionIdx = questions.findIndex(q2 => q2.id === q.id);
         if (questionIdx >= 0) {
           finalAnswers[q.id] = {
             ...resp,
             questionIndex: questionIdx
           };
         }
       }
     });

     // Identify AI Grading needs within this batch
     const needsAi = batchQuestions.filter(q => {
        const resp = finalAnswers[q.id];
        return resp && resp.isAiGraded;
     });

     if (needsAi.length > 0) {
        for (const q of needsAi) {
            const resp = finalAnswers[q.id];
            if (resp) {
                const aiResult = await gradeWithAI(q, String(resp.userAnswer));
                finalAnswers[q.id] = {
                    ...resp,
                    isCorrect: aiResult.isCorrect,
                    score: aiResult.score,
                    feedback: aiResult.feedback
                };
            }
        }
     }

     setAnswers(finalAnswers);
     setInterimQuestions(batchQuestions);
     setInterimSession({
        id: tempSessionId,
        bankId: bank.id,
        startTime: startTime,
        endTime: Date.now(),
        responses: finalAnswers,
        totalScore: 0 // Not relevant for interim
     });
     
     setIsGradingAI(false);
     setShowInterim(true);
  };

  const handleInterimContinue = () => {
      setShowInterim(false);
      setCurrentIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    saveCurrentAnswer();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const hasAnswered = () => {
      if (currentAnswer === null || currentAnswer === undefined || currentAnswer === '') return false;
      if (Array.isArray(currentAnswer) && currentAnswer.length === 0) return false;
      return true;
  }

  const saveCurrentAnswer = () => {
    const q = questions[currentIndex];
    if (!q) return;
    
    let grade = { isCorrect: false, score: 0 };
    if (hasAnswered()) {
        grade = gradeQuestionLocally(q, currentAnswer);
    }
    
    const response: UserResponse = {
      questionId: q.id,
      userAnswer: currentAnswer,
      isCorrect: grade.isCorrect,
      score: grade.score,
      timestamp: Date.now(),
      isAiGraded: q.type === 'fill_blank' && q.answer.llm_grading && grade.score === 0,
      isFlagged: isCurrentFlagged
    };
    
    setAnswers(prev => ({ ...prev, [q.id]: response }));
  };

  const finishQuiz = async () => {
    if (!hasAnswered()) return; 
    
    // Manually constructing final state logic similar to handleNext but for the end
    const q = questions[currentIndex];
    let grade = { isCorrect: false, score: 0 };
    if (hasAnswered()) {
         grade = gradeQuestionLocally(q, currentAnswer);
    }
    const currentResponse: UserResponse = {
        questionId: q.id,
        userAnswer: currentAnswer,
        isCorrect: grade.isCorrect,
        score: grade.score,
        timestamp: Date.now(),
        isAiGraded: q.type === 'fill_blank' && q.answer.llm_grading && grade.score === 0,
        isFlagged: isCurrentFlagged,
        questionIndex: currentIndex // 保存题目在题库中的索引
    };

    let finalAnswers: Record<string, UserResponse> = { ...answers, [q.id]: currentResponse };
    
    // 确保所有响应都有 questionIndex（兼容旧数据，迁移）
    questions.forEach((question, idx) => {
      const resp = finalAnswers[question.id];
      if (resp && resp.questionIndex === undefined) {
        finalAnswers[question.id] = {
          ...resp,
          questionIndex: idx
        };
      }
    });
    
    // Check AI Grading for ALL questions (in case user skipped around or we are at the end)
    const needsAi = questions.filter(q => {
      const resp = finalAnswers[q.id];
      return resp && resp.isAiGraded && !resp.feedback; // Only grade if not already graded (e.g. in interim)
    });

    if (needsAi.length > 0) {
      setIsGradingAI(true);
      for (const q of needsAi) {
        const resp = finalAnswers[q.id];
        if (resp) {
            const aiResult = await gradeWithAI(q, String(resp.userAnswer));
            finalAnswers[q.id] = {
                ...resp,
                isCorrect: aiResult.isCorrect,
                score: aiResult.score,
                feedback: aiResult.feedback
            };
        }
      }
      setIsGradingAI(false);
    }

    const totalScore = Math.round((Object.values(finalAnswers).reduce((acc: number, curr: UserResponse) => acc + curr.score, 0) / questions.length) * 100);
    
    const session: QuizSession = {
        id: tempSessionId, // Use the same temp session ID for consistency
        bankId: bank.id,
        startTime: startTime,
        endTime: Date.now(),
        responses: finalAnswers,
        totalScore: totalScore
    };

    // Clear saved progress after completing the quiz
    const savedProgressKey = `qb_progress_${bank.id}`;
    localStorage.removeItem(savedProgressKey);

    onComplete(session);
  };

  const handleInterimAnnotationUpdate = (sessionId: string, questionId: string, text: string) => {
      // Update the answers state with the annotation
      const updatedAnswers = {
          ...answers,
          [questionId]: {
              ...answers[questionId],
              annotation: text
          }
      };
      
      setAnswers(updatedAnswers);
      
      // Also update interimSession to reflect changes immediately
      setInterimSession(prevSession => {
          if (!prevSession) return prevSession;
          return {
              ...prevSession,
              responses: updatedAnswers
          };
      });
  };

  const handleInterimChatHistoryUpdate = (sessionId: string, questionId: string, history: any[]) => {
      // Update the answers state with the chat history
      const updatedAnswers = {
          ...answers,
          [questionId]: {
              ...answers[questionId],
              chatHistory: history
          }
      };
      
      setAnswers(updatedAnswers);
      
      // Also update interimSession to reflect changes immediately
      setInterimSession(prevSession => {
          if (!prevSession) return prevSession;
          return {
              ...prevSession,
              responses: updatedAnswers
          };
      });
  };

  if (showInterim && interimSession) {
      return (
          <QuizReviewer 
            bank={bank}
            session={interimSession}
            onAnnotationUpdate={handleInterimAnnotationUpdate}
            onChatHistoryUpdate={handleInterimChatHistoryUpdate}
            onRetake={() => {}} // Not used
            onExit={onExit} // Allow exit
            onContinue={handleInterimContinue}
            themeColor={themeColor}
            aiSettings={aiSettings}
            customQuestions={interimQuestions}
            isInterim={true}
          />
      );
  }

  if (questions.length === 0) return <div>加载中...</div>;

  const currentQ = questions[currentIndex];

  const isQuestionAnswered = (qId: string) => {
      const ans = answers[qId];
      if (!ans) return false;
      const val = ans.userAnswer;
      if (val === null || val === undefined || val === '') return false;
      if (Array.isArray(val) && val.length === 0) return false;
      return true;
  };

  return (
    <div className="w-full h-[calc(100vh-100px)] flex gap-6 mt-2">
       {/* Left Sidebar: Question Map */}
       <div className="hidden md:flex flex-col w-80 max-w-xs bg-white/45 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/10 shadow-sm overflow-hidden shrink-0 transition-colors backdrop-blur-md">
          <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
             <h3 className="font-bold text-slate-800 dark:text-slate-100">题目列表</h3>
             <p className="text-xs text-slate-400 mt-1 truncate">{bank.title}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
             <div className="grid grid-cols-5 gap-3">
                {questions.map((q, idx) => {
                    const answered = isQuestionAnswered(q.id);
                    const isCurrent = idx === currentIndex;
                    const flag = answers[q.id]?.isFlagged;
                    
                    return (
                        <button
                            key={q.id}
                            onClick={() => goToQuestion(idx)}
                            className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all relative
                                ${isCurrent 
                                    ? `bg-${themeColor}-600 text-white shadow-lg shadow-${themeColor}-200 dark:shadow-none scale-105 z-10` 
                                    : answered 
                                        ? `bg-${themeColor}-50 dark:bg-${themeColor}-500/20 text-${themeColor}-600 dark:text-${themeColor}-300 border border-${themeColor}-200 dark:border-${themeColor}-500/20`
                                        : 'bg-slate-50 dark:bg-black/20 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-black/30'
                                }
                            `}
                        >
                            {idx + 1}
                            {flag && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-orange-400 rounded-full border-2 border-white dark:border-slate-900 -mt-1 -mr-1"></span>}
                        </button>
                    )
                })}
             </div>
          </div>
          <div className="p-4 bg-slate-50/50 dark:bg-black/20 border-t border-slate-100 dark:border-white/5 text-center">
             <div className="text-xs font-medium text-slate-400">
                进度: {Object.keys(answers).filter(k => isQuestionAnswered(k)).length} / {questions.length}
             </div>
             <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                    className={`bg-${themeColor}-500 h-full rounded-full transition-all duration-500`} 
                    style={{ width: `${(Object.keys(answers).filter(k => isQuestionAnswered(k)).length / questions.length) * 100}%` }}
                ></div>
             </div>
          </div>
       </div>

       {/* Center: Main Question Card with Glassmorphism Header */}
       <div className="flex-1 flex flex-col bg-white dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden relative transition-colors">
           {/* Scrollable Content Area - Content goes first so it can scroll behind header */}
           <div className="flex-1 overflow-y-auto glass-content-area">
              {/* Glass Header - Sticky positioned inside scroll container */}
              <div className="sticky top-0 z-50 glass-header">
                 <div className="px-6 py-4 border-b border-slate-100/50 dark:border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-4 relative z-10">
                       <button onClick={onExit} className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                       </button>
                       <div>
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 mb-1`}>
                              {currentQ.type.replace('_', ' ')}
                          </span>
                          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-baseline gap-2">
                          第 {currentIndex + 1} 题 <span className="text-sm font-normal text-slate-400 hidden sm:inline">/ {questions.length}</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-2 relative z-10">
                       <button onClick={onExit} className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          退出
                       </button>
                       <div className="text-right lg:hidden">
                          <div className="text-sm font-bold text-slate-600 dark:text-slate-300">{currentIndex + 1} / {questions.length}</div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Question Content - Can scroll under the header */}
              <div className="p-6 pb-32 lg:px-12 relative">
              {isGradingAI ? (
                <div className="flex flex-col items-center justify-center min-h-full space-y-6 animate-fade-in">
                    <div className="relative">
                        <div className={`w-16 h-16 border-4 border-${themeColor}-100 dark:border-${themeColor}-900 border-t-${themeColor}-600 rounded-full animate-spin`}></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg">🤖</span>
                        </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 font-medium">AI 正在批改答案并生成阶段小结...</p>
                </div>
              ) : (
                <div className="min-h-[150vh] pb-20">
                  <QuestionRenderer 
                      question={currentQ}
                      currentAnswer={currentAnswer}
                      onChange={setCurrentAnswer}
                      disabled={false}
                      showFeedback={false}
                      themeColor={themeColor}
                  />
                </div>
              )}
              </div>
           </div>

           {/* Footer Controls - Outside scroll container */}
           <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 flex justify-between items-center relative z-20">
              <button 
                onClick={handlePrev} 
                disabled={currentIndex === 0 || isGradingAI}
                className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-white/5 hover:shadow-sm disabled:opacity-30 disabled:hover:shadow-none transition-all"
              >
                上一题
              </button>

              <div className="flex items-center gap-4">
                  {/* Flag as Confusing Button */}
                  <button 
                    onClick={() => setIsCurrentFlagged(!isCurrentFlagged)}
                    title="标记存疑"
                    className={`p-3 rounded-xl transition-all ${
                        isCurrentFlagged 
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 shadow-inner ring-2 ring-orange-200 dark:ring-orange-800' 
                            : 'bg-white dark:bg-white/5 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                     <svg className="w-6 h-6" fill={isCurrentFlagged ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8l-2 2h-14l-2-2zm2-10V7a2 2 0 012-2h10.5a2.5 2.5 0 010 5H5z" />
                     </svg>
                  </button>

                  {currentIndex === questions.length - 1 ? (
                    <button 
                      onClick={finishQuiz}
                      disabled={isGradingAI || !hasAnswered()}
                      className="px-8 py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 dark:shadow-none disabled:opacity-50 disabled:bg-slate-400 disabled:shadow-none transition transform active:scale-95"
                    >
                      交卷
                    </button>
                  ) : (
                    <button 
                      onClick={handleNext}
                      disabled={!hasAnswered()}
                      className={`px-8 py-3 rounded-xl font-bold text-white bg-${themeColor}-600 hover:bg-${themeColor}-700 shadow-lg shadow-${themeColor}-200 dark:shadow-none disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:shadow-none disabled:cursor-not-allowed transition transform active:scale-95`}
                    >
                      {batchSize && (currentIndex + 1) % batchSize === 0 ? '提交小结' : '下一题'}
                    </button>
                  )}
              </div>
           </div>
       </div>
    </div>
  );
};