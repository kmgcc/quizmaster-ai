import { QuestionBank, QuizSession, AISettings, ChatMessage } from '../types';

/**
 * Backup JSON v1 格式定义
 */
export interface BackupV1 {
  schema_version: 'backup.v1';
  exported_at: string; // ISO 8601 timestamp
  app_version?: string;
  data: {
    banks: QuestionBank[];
    sessions: QuizSession[];
    progress: Record<string, any>; // bankId -> progress object
    chats: Record<string, Record<string, ChatMessage[]>>; // bankId -> questionId -> messages[]
    ai: {
      apiKey?: string;
      settings?: AISettings;
      provider?: string;
      model?: string;
    };
    theme?: string; // theme mode
  };
}

/**
 * 扩展的聊天消息类型（包含状态字段）
 */
interface ExtendedChatMessage extends ChatMessage {
  status?: 'streaming' | 'done' | 'error';
}

/**
 * 导出所有数据为 BackupV1 格式
 */
export async function exportBackup(): Promise<BackupV1> {
  // 1. 收集题库
  const banksStr = localStorage.getItem('qb_banks');
  const banks: QuestionBank[] = banksStr ? JSON.parse(banksStr) : [];

  // 2. 收集答题记录
  const sessionsStr = localStorage.getItem('qb_sessions');
  const sessions: QuizSession[] = sessionsStr ? JSON.parse(sessionsStr) : [];

  // 3. 收集所有答题进度（qb_progress_{bankId}）
  const progress: Record<string, any> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('qb_progress_')) {
      const bankId = key.replace('qb_progress_', '');
      const value = localStorage.getItem(key);
      if (value) {
        try {
          progress[bankId] = JSON.parse(value);
        } catch (e) {
          console.warn(`Failed to parse progress for ${bankId}:`, e);
        }
      }
    }
  }

  // 4. 收集所有 AI 聊天记录（qb_chat_{bankId}_{questionId} 或 qb_chat_{questionId}）
  const chats: Record<string, Record<string, ChatMessage[]>> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('qb_chat_')) {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          const messages = JSON.parse(value) as ExtendedChatMessage[];
          // 清理消息：移除流式指示符和状态字段
          const cleanedMessages: ChatMessage[] = messages.map(m => ({
            role: m.role,
            text: (m.text || '').replace(/●/g, '').trim(),
            timestamp: m.timestamp
          })).filter(m => m.text.length > 0); // 过滤空消息

          if (cleanedMessages.length > 0) {
            // 解析 key 格式：qb_chat_{bankId}_{questionId} 或 qb_chat_{questionId}
            const parts = key.replace('qb_chat_', '').split('_');
            if (parts.length >= 2) {
              // 有 bankId 的情况
              const bankId = parts[0];
              const questionId = parts.slice(1).join('_'); // 支持 questionId 中包含下划线
              if (!chats[bankId]) {
                chats[bankId] = {};
              }
              chats[bankId][questionId] = cleanedMessages;
            } else if (parts.length === 1) {
              // 没有 bankId 的情况（旧格式兼容）
              const questionId = parts[0];
              if (!chats['_legacy']) {
                chats['_legacy'] = {};
              }
              chats['_legacy'][questionId] = cleanedMessages;
            }
          }
        } catch (e) {
          console.warn(`Failed to parse chat for ${key}:`, e);
        }
      }
    }
  }

  // 5. 收集 AI 设置
  const aiSettingsStr = localStorage.getItem('qb_ai_settings');
  const aiSettings: AISettings | undefined = aiSettingsStr 
    ? JSON.parse(aiSettingsStr) 
    : undefined;

  // 6. 收集 API Key
  const apiKey = localStorage.getItem('qb_api_key') || undefined;

  // 7. 收集主题模式
  const theme = localStorage.getItem('qb_theme_mode') || undefined;

  // 组装备份数据
  const backup: BackupV1 = {
    schema_version: 'backup.v1',
    exported_at: new Date().toISOString(),
    data: {
      banks,
      sessions,
      progress,
      chats,
      ai: {
        apiKey,
        settings: aiSettings,
        provider: 'deepseek', // 根据项目实际情况设置
        model: undefined
      },
      theme
    }
  };

  return backup;
}

/**
 * 下载备份 JSON 文件
 */
export function downloadBackupJson(backup: BackupV1): void {
  const dataStr = JSON.stringify(backup, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  
  // 生成文件名：quiz-backup-YYYYMMDD-HHMMSS.json
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
  link.download = `quiz-backup-${dateStr}-${timeStr}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 导入备份数据
 * @param backup 备份数据
 * @param mode 'replace' 覆盖模式（清空现有数据后导入）| 'merge' 合并模式（合并数据）
 */
export async function importBackup(
  backup: BackupV1,
  mode: 'replace' | 'merge' = 'replace'
): Promise<void> {
  // 验证备份格式
  if (backup.schema_version !== 'backup.v1') {
    throw new Error(`不支持的备份格式: ${backup.schema_version}`);
  }

  if (!backup.data) {
    throw new Error('备份数据格式无效：缺少 data 字段');
  }

  const { data } = backup;

  if (mode === 'replace') {
    // 覆盖模式：清空所有 qb_ 前缀的数据
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('qb_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // 导入题库
  if (data.banks && Array.isArray(data.banks)) {
    if (mode === 'merge') {
      // 合并模式：按 id 合并，相同 id 则替换
      const existingBanksStr = localStorage.getItem('qb_banks');
      const existingBanks: QuestionBank[] = existingBanksStr 
        ? JSON.parse(existingBanksStr) 
        : [];
      
      const bankMap = new Map<string, QuestionBank>();
      existingBanks.forEach(bank => bankMap.set(bank.id, bank));
      data.banks.forEach(bank => bankMap.set(bank.id, bank));
      
      localStorage.setItem('qb_banks', JSON.stringify(Array.from(bankMap.values())));
    } else {
      // 覆盖模式
      localStorage.setItem('qb_banks', JSON.stringify(data.banks));
    }
  }

  // 导入答题记录
  if (data.sessions && Array.isArray(data.sessions)) {
    if (mode === 'merge') {
      // 合并模式：按 id 合并，相同 id 则替换
      const existingSessionsStr = localStorage.getItem('qb_sessions');
      const existingSessions: QuizSession[] = existingSessionsStr 
        ? JSON.parse(existingSessionsStr) 
        : [];
      
      const sessionMap = new Map<string, QuizSession>();
      existingSessions.forEach(session => sessionMap.set(session.id, session));
      data.sessions.forEach(session => sessionMap.set(session.id, session));
      
      localStorage.setItem('qb_sessions', JSON.stringify(Array.from(sessionMap.values())));
    } else {
      // 覆盖模式
      localStorage.setItem('qb_sessions', JSON.stringify(data.sessions));
    }
  }

  // 导入答题进度
  if (data.progress && typeof data.progress === 'object') {
    Object.entries(data.progress).forEach(([bankId, progressData]) => {
      const progressKey = `qb_progress_${bankId}`;
      if (mode === 'merge') {
        // 合并模式：如果已存在，比较时间戳，保留更新的
        const existing = localStorage.getItem(progressKey);
        if (existing) {
          try {
            const existingProgress = JSON.parse(existing);
            const newProgress = progressData as any;
            if (newProgress.lastUpdated && existingProgress.lastUpdated) {
              if (newProgress.lastUpdated > existingProgress.lastUpdated) {
                localStorage.setItem(progressKey, JSON.stringify(newProgress));
              }
            } else {
              localStorage.setItem(progressKey, JSON.stringify(newProgress));
            }
          } catch (e) {
            localStorage.setItem(progressKey, JSON.stringify(progressData));
          }
        } else {
          localStorage.setItem(progressKey, JSON.stringify(progressData));
        }
      } else {
        // 覆盖模式
        localStorage.setItem(progressKey, JSON.stringify(progressData));
      }
    });
  }

  // 导入 AI 聊天记录
  if (data.chats && typeof data.chats === 'object') {
    Object.entries(data.chats).forEach(([bankId, questionChats]) => {
      Object.entries(questionChats).forEach(([questionId, messages]) => {
        // 处理旧格式（_legacy）
        const actualBankId = bankId === '_legacy' ? '' : bankId;
        const chatKey = actualBankId 
          ? `qb_chat_${actualBankId}_${questionId}`
          : `qb_chat_${questionId}`;
        
        // 合并模式：如果已存在，合并消息（去重）
        if (mode === 'merge') {
          const existing = localStorage.getItem(chatKey);
          if (existing) {
            try {
              const existingMessages = JSON.parse(existing) as ChatMessage[];
              // 简单的去重：基于 timestamp 和 text
              const messageMap = new Map<string, ChatMessage>();
              existingMessages.forEach(m => {
                const key = `${m.timestamp}_${m.text}`;
                messageMap.set(key, m);
              });
              messages.forEach(m => {
                const key = `${m.timestamp}_${m.text}`;
                messageMap.set(key, m);
              });
              localStorage.setItem(chatKey, JSON.stringify(Array.from(messageMap.values())));
            } catch (e) {
              localStorage.setItem(chatKey, JSON.stringify(messages));
            }
          } else {
            localStorage.setItem(chatKey, JSON.stringify(messages));
          }
        } else {
          // 覆盖模式
          localStorage.setItem(chatKey, JSON.stringify(messages));
        }
      });
    });
  }

  // 导入 AI 设置
  if (data.ai) {
    if (data.ai.settings) {
      localStorage.setItem('qb_ai_settings', JSON.stringify(data.ai.settings));
    }
    if (data.ai.apiKey !== undefined) {
      localStorage.setItem('qb_api_key', data.ai.apiKey);
    }
  }

  // 导入主题模式
  if (data.theme) {
    localStorage.setItem('qb_theme_mode', data.theme);
  }
}

