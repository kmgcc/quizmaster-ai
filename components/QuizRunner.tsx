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
  batchSize?: number;
  aiSettings?: AISettings;
  onAnnotationUpdate?: (sessionId: string, questionId: string, text: string) => void;
}

export const QuizRunner: React.FC<Props> = ({ bank, onComplete, onExit, batchSize, aiSettings, onAnnotationUpdate }) => {
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
    <div className="w-full h-full flex gap-6 pt-2 min-h-0">
       {/* Left Sidebar: Question Map */}
       <div 
         className="hidden md:flex flex-col w-80 max-w-xs rounded-3xl border shadow-sm overflow-hidden shrink-0 transition-colors backdrop-blur-md"
         style={{ 
           backgroundColor: 'var(--surface)',
           borderColor: 'var(--outline)',
         }}
       >
          <div 
            className="p-5 border-b"
            style={{ 
              borderColor: 'var(--outline)',
              backgroundColor: 'var(--surface2)',
            }}
          >
             <h3 className="font-bold" style={{ color: 'var(--text)' }}>题目列表</h3>
             <p className="text-xs mt-1 truncate" style={{ color: 'var(--muted)' }}>{bank.title}</p>
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
                            className="aspect-square rounded-full flex items-center justify-center text-sm font-bold transition-all relative"
                            style={{
                              backgroundColor: isCurrent 
                                ? 'var(--primary)' 
                                : answered 
                                  ? 'var(--primary-container)' 
                                  : 'var(--surface2)',
                              color: isCurrent 
                                ? 'var(--on-primary)' 
                                : answered 
                                  ? 'var(--on-primary-container)' 
                                  : 'var(--muted)',
                              border: answered && !isCurrent ? `1px solid var(--primary)` : 'none',
                              transform: isCurrent ? 'scale(1.05)' : 'scale(1)',
                              zIndex: isCurrent ? 10 : 1,
                            }}
                        >
                            {idx + 1}
                            {flag && <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-2 -mt-1 -mr-1" style={{ backgroundColor: 'var(--warning)', borderColor: 'var(--surface)' }}></span>}
                        </button>
                    )
                })}
             </div>
          </div>
          <div 
            className="p-4 border-t text-center"
            style={{ 
              borderColor: 'var(--outline)',
              backgroundColor: 'var(--surface2)',
            }}
          >
             <div className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                进度: {Object.keys(answers).filter(k => isQuestionAnswered(k)).length} / {questions.length}
             </div>
             <div className="w-full rounded-full h-1.5 mt-2 overflow-hidden" style={{ backgroundColor: 'var(--surface2)' }}>
                <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${(Object.keys(answers).filter(k => isQuestionAnswered(k)).length / questions.length) * 100}%`,
                      backgroundColor: 'var(--primary)',
                    }}
                ></div>
             </div>
          </div>
       </div>

        {/* Center: Main Question Card */}
        <div 
          className="flex-1 flex flex-col rounded-3xl border shadow-sm overflow-hidden relative transition-colors"
          style={{ 
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--outline)',
          }}
        >
            {/* Header with blur */}
            <div 
              className="px-4 py-2 flex justify-between items-center shrink-0"
              style={{ 
                borderBottom: '1px solid rgba(var(--surface-rgb, 255, 255, 255), 0.06)',
                backgroundColor: 'rgba(var(--surface-rgb, 255, 255, 255), 0.03)',
                WebkitBackdropFilter: 'blur(16px) saturate(150%)',
                backdropFilter: 'blur(16px) saturate(150%)',
              }}
            >
              <div className="flex items-center gap-3">
                 <button 
                   onClick={onExit} 
                   className="md:hidden transition p-1 rounded-full"
                   style={{ color: 'var(--muted)' }}
                   onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
                   onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
                 >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                 </button>
                 <div className="flex items-center gap-2">
                    <span 
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                      style={{ color: 'var(--muted)' }}
                    >
                      {currentQ.type.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      {currentIndex + 1}/{questions.length}
                    </span>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <button
                   onClick={onExit} 
                   className="hidden md:flex items-center gap-1 text-xs font-medium transition px-2 py-1 rounded-full"
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
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                   退出
                </button>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto">
               <div className="p-6 lg:px-12">
               {isGradingAI ? (
                 <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 animate-fade-in">
                     <div className="relative">
                         <div 
                           className="w-16 h-16 border-4 rounded-full animate-spin"
                           style={{ 
                             borderColor: 'var(--primary-container)',
                             borderTopColor: 'var(--primary)',
                           }}
                         ></div>
                         <div className="absolute inset-0 flex items-center justify-center">
                             <span className="text-lg">🤖</span>
                         </div>
                     </div>
                     <p className="font-medium" style={{ color: 'var(--text)' }}>AI 正在批改答案并生成阶段小结...</p>
                 </div>
               ) : (
                 <div className="pb-20">
                   <QuestionRenderer 
                       question={currentQ}
                       currentAnswer={currentAnswer}
                       onChange={setCurrentAnswer}
                       disabled={false}
                       showFeedback={false}
                   />
                 </div>
               )}
               </div>
            </div>

             {/* Bottom Control Bar with blur */}
             <div 
               className="sticky bottom-0 px-4 py-2 flex justify-between items-center shrink-0"
               style={{ 
                 borderTop: '1px solid rgba(var(--surface-rgb, 255, 255, 255), 0.06)',
                 backgroundColor: 'rgba(var(--surface-rgb, 255, 255, 255), 0.03)',
                 WebkitBackdropFilter: 'blur(16px) saturate(150%)',
                 backdropFilter: 'blur(16px) saturate(150%)',
               }}
             >
<button 
                 onClick={handlePrev} 
                 disabled={currentIndex === 0 || isGradingAI}
                 className="px-6 py-3 rounded-full font-bold transition-all"
                style={{ 
                  color: 'var(--text)',
                  opacity: (currentIndex === 0 || isGradingAI) ? 0.3 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!(currentIndex === 0 || isGradingAI)) {
                    e.currentTarget.style.backgroundColor = 'var(--surface)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                上一题
              </button>

              <div className="flex items-center gap-4">
                  {/* Flag as Confusing Button */}
<button 
                     onClick={() => setIsCurrentFlagged(!isCurrentFlagged)}
                     title="标记存疑"
                     className="p-3 rounded-full transition-all"
                    style={{
                      backgroundColor: isCurrentFlagged 
                        ? 'rgba(var(--warning-rgb, 251, 191, 36), 0.2)' 
                        : 'var(--surface)',
                      color: isCurrentFlagged 
                        ? 'var(--warning)' 
                        : 'var(--muted)',
                      border: isCurrentFlagged ? `2px solid var(--warning)` : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrentFlagged) {
                        e.currentTarget.style.backgroundColor = 'var(--surface2)';
                        e.currentTarget.style.color = 'var(--text)';
                      } else {
                        e.currentTarget.style.backgroundColor = 'rgba(var(--warning-rgb, 251, 191, 36), 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrentFlagged) {
                        e.currentTarget.style.backgroundColor = 'var(--surface)';
                        e.currentTarget.style.color = 'var(--muted)';
                      } else {
                        e.currentTarget.style.backgroundColor = 'rgba(var(--warning-rgb, 251, 191, 36), 0.2)';
                      }
                    }}
                  >
                     <svg className="w-6 h-6" fill={isCurrentFlagged ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8l-2 2h-14l-2-2zm2-10V7a2 2 0 012-2h10.5a2.5 2.5 0 010 5H5z" />
                     </svg>
                  </button>

                  {currentIndex === questions.length - 1 ? (
<button 
                       onClick={finishQuiz}
                       disabled={isGradingAI || !hasAnswered()}
                       className="px-8 py-3 rounded-full font-bold transition transform active:scale-95"
                      style={{ 
                        backgroundColor: 'var(--success)',
                        color: 'var(--on-primary)',
                        opacity: (isGradingAI || !hasAnswered()) ? 0.5 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!(isGradingAI || !hasAnswered())) {
                          e.currentTarget.style.opacity = '0.9';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!(isGradingAI || !hasAnswered())) {
                          e.currentTarget.style.opacity = '1';
                        }
                      }}
                    >
                      交卷
                    </button>
                  ) : (
<button 
                       onClick={handleNext}
                       disabled={!hasAnswered()}
                       className="px-8 py-3 rounded-full font-bold transition transform active:scale-95"
                      style={{ 
                        backgroundColor: 'var(--primary)',
                        color: 'var(--on-primary)',
                        opacity: !hasAnswered() ? 0.5 : 1,
                        cursor: !hasAnswered() ? 'not-allowed' : 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        if (hasAnswered()) {
                          e.currentTarget.style.opacity = '0.9';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (hasAnswered()) {
                          e.currentTarget.style.opacity = '1';
                        }
                      }}
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