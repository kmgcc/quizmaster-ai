# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **完整的数据导入导出功能（Backup v1 格式）**
  - 新增 `utils/backup.ts` 模块，统一管理备份导入导出逻辑
  - 支持导出所有数据：题库、答题记录、答题进度、每题笔记、每题 AI 问答记录、API Key、AI 角色设定、主题模式
  - 支持两种导入模式：
    - **覆盖模式**：清空现有数据后导入（默认）
    - **合并模式**：合并数据，相同 ID 则替换
  - 备份文件格式：`quiz-backup-YYYYMMDD-HHMMSS.json`
  - 导入前显示备份内容统计和确认对话框
  - 兼容旧格式备份文件（直接是 localStorage 键值对格式）
  - 导出时提示用户备份包含 API Key，需妥善保管

### Changed
- **QuizReviewer 页面 UI 优化**
  - 修复长文本（如 URL）撑宽布局问题
    - 添加 `min-w-0` 到所有 flex 容器
    - 添加 `break-words` 和 `overflow-wrap: anywhere` 到文本显示区域
    - 确保笔记、解析、AI 点评等文本内容正确换行
  - 低分颜色从红色改为橙色（amber）
    - 分数显示、进度条、状态标签、选项显示、答案显示等统一使用 amber 色系
    - 保持高分绿色、中分黄色不变

### Removed
- **QuizReviewer 页面中的 AI 对话记录折叠面板**
  - 移除了每道题卡片上的"AI 对话记录/查看聊天"UI 入口
  - 移除了 `ChatHistoryViewer` 组件及其相关代码
  - 移除了不再使用的 `ReactMarkdown` 和 `remarkGfm` 导入
  - **注意**：AI 聊天记录功能依然保留，通过"问 AI"按钮打开 ChatDrawer 时自动加载历史记录

- **独立备份工具页面**
  - 删除了 `backup-restore.html` 文件
  - 更新了 `README.md` 和 `DATA_STORAGE_GUIDE.md`，移除了对备份工具文件的引用
  - 现在只保留两种备份方式：应用内一键备份（推荐）和浏览器开发者工具

### Fixed
- 修复了 QuizReviewer 页面中长文本导致布局溢出的问题
- 修复了低分颜色显示不一致的问题（统一改为橙色）

### Technical Details

#### 数据备份格式（Backup v1）
```typescript
{
  schema_version: 'backup.v1',
  exported_at: string, // ISO 8601 timestamp
  data: {
    banks: QuestionBank[],
    sessions: QuizSession[],
    progress: Record<string, any>,
    chats: Record<string, Record<string, ChatMessage[]>>,
    ai: {
      apiKey?: string,
      settings?: AISettings,
      provider?: string,
      model?: string
    },
    theme?: string
  }
}
```

#### 存储键名规范
- `qb_banks` - 题库列表
- `qb_sessions` - 答题记录（包含笔记 annotation）
- `qb_progress_{bankId}` - 答题进度
- `qb_chat_{bankId}_{questionId}` - AI 聊天记录
- `qb_ai_settings` - AI 设置
- `qb_api_key` - API Key
- `qb_theme_mode` - 主题模式

#### 导入导出功能位置
- **导出**：右上角设置 → "数据管理" → "💾 导出所有数据"
- **导入**：右上角设置 → "数据管理" → "📥 导入备份数据"

---

## Previous Changes

### AI 聊天功能增强
- 实现了 AI 流式输出（字符级流式显示）
- 支持 GitHub Flavored Markdown（GFM）表格渲染
- 修复了单行代码与粗体的冲突问题
- 实现了每题独立的对话上下文和连续对话
- 用户消息纯文本渲染，AI 消息 Markdown 渲染

### 语法高亮重构
- 从正则表达式 HTML 字符串方案迁移到 tokenize + React 节点渲染
- 移除了 `dangerouslySetInnerHTML`，使用安全的 React 节点渲染
- 创建了共享的 `utils/codeHighlighter.tsx` 模块
- 支持关键字、字符串、注释、数字、函数名的高亮

### 阶段小结功能
- 实现了阶段小结界面的笔记框自适应高度
- 保留了每题 AI 对话记录，在最终复盘可见
- 修复了阶段小结的题号显示错误问题

