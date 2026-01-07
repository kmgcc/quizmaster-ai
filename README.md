# QuizMaster AI

一个智能刷题应用，支持 Markdown 格式题干、AI 辅助答疑、答题进度保存等功能。

## ✨ 主要特性

- 📚 **题库管理**：导入 JSON 格式题库，支持 V1 和 V2 格式
- 🎨 **Markdown 支持**：题干支持代码块、行内代码、加粗等格式
- 🤖 **AI 助教**：每道题都可以向 AI 提问，获得个性化解答
- 📝 **笔记功能**：为每道题记录感想和笔记
- 💾 **自动保存**：答题进度自动保存，随时继续
- 🌓 **深色模式**：支持浅色/深色/跟随系统
- 📊 **答题统计**：详细的答题记录和成绩分析

## 🚀 快速开始

### 前置要求
- Node.js (推荐 v18+)
- DeepSeek API Key（用于 AI 功能）

### 安装步骤

1. 安装依赖：
   ```bash
   npm install
   ```

2. 设置 API Key：
   - 创建 `.env.local` 文件
   - 添加：`API_KEY=your_deepseek_api_key`

3. 启动开发服务器：
   ```bash
   npm run dev
   ```

4. 打开浏览器访问：`http://localhost:3000`

### 构建生产版本

```bash
npm run build
npm run preview
```

## 📦 数据存储

### 存储位置
所有数据存储在**浏览器 localStorage** 中，包括：
- 📚 题库数据
- 📝 答题记录
- 💬 AI 聊天记录
- 📖 用户笔记
- ⚙️ 设置和进度

### 重新构建后数据保留
✅ **好消息**：重新构建应用（`npm run build`）**不会丢失任何数据**！

数据存储在浏览器中，与应用代码分离，因此：
- 更新代码不影响数据
- 刷新页面自动加载数据
- 所有笔记和聊天记录都会保留

### 数据备份与恢复
为了安全，建议定期备份数据。应用提供了三种备份方式：

**方法 1：应用内一键备份（推荐）** ⭐
1. 点击右上角设置图标 ⚙️
2. 在"数据管理"部分：
   - 点击"💾 导出所有数据"下载备份文件
   - 点击"📥 导入备份数据"恢复数据
3. 备份文件包含所有题库、答题记录、笔记、AI 聊天记录等

**方法 2：浏览器控制台**
```javascript
// 在浏览器控制台运行
const backup = {
  banks: localStorage.getItem('qb_banks'),
  sessions: localStorage.getItem('qb_sessions'),
  // ... 其他数据
};
console.log(JSON.stringify(backup));
```

详细说明请查看：[DATA_STORAGE_GUIDE.md](DATA_STORAGE_GUIDE.md)

## 📚 题库格式

### Schema V2（推荐）
支持 Markdown 格式，让题目更美观易读：

```json
{
  "schema_version": "2.0",
  "id": "bank_001",
  "title": "示例题库",
  "questions": [
    {
      "id": "q1",
      "type": "single_choice",
      "content": "在 **JavaScript** 中，`const` 的作用是？\n\n```javascript\nconst x = 1;\n```",
      "options": [
        {"key": "A", "text": "声明常量"},
        {"key": "B", "text": "声明变量"}
      ],
      "answer": {"correct_option_key": "A"},
      "explanation": "`const` 用于声明**不可重新赋值**的常量。"
    }
  ]
}
```

支持的 Markdown 语法：
- `` `code` `` - 行内代码
- ` ```language\ncode\n``` ` - 代码块（带语法高亮）
- `**bold**` - 加粗文本

详细说明请查看：[SCHEMA_V2_GUIDE.md](SCHEMA_V2_GUIDE.md)

### 示例文件
- `schema-v2-example.json` - 完整的 V2 格式示例
- 应用内置示例题库（点击"加载示例题库"）

## 🛠️ 工具文件

- `DATA_STORAGE_GUIDE.md` - 数据存储详细说明
- `SCHEMA_V2_GUIDE.md` - Schema V2 使用指南

## 🎯 使用流程

1. **导入题库**：
   - 点击"导入文件"或"粘贴 JSON"
   - 或点击"加载示例题库"体验

2. **开始答题**：
   - 选择题库，点击"开始练习"
   - 支持分批答题（阶段性小结）

3. **AI 辅助**：
   - 答题时可随时询问 AI
   - 在总结界面查看每题的 AI 聊天记录

4. **记录笔记**：
   - 在总结界面为每题添加笔记
   - 笔记会自动保存

5. **查看记录**：
   - 点击题库卡片的"历史记录"按钮
   - 查看所有答题记录和笔记

## 🔧 技术栈

- **前端框架**：React 19
- **构建工具**：Vite 6
- **样式**：Tailwind CSS
- **AI 服务**：DeepSeek API
- **类型检查**：TypeScript

## 📝 开发说明

### 项目结构
```
quizmaster-ai-3/
├── components/          # React 组件
│   ├── BankManager.tsx  # 题库管理
│   ├── QuizRunner.tsx   # 答题界面
│   ├── QuizReviewer.tsx # 总结界面
│   └── ...
├── services/            # 服务层
│   ├── geminiService.ts # AI 服务
│   ├── validator.ts     # 题库验证
│   └── ...
├── types.ts             # TypeScript 类型定义
├── constants.ts         # 常量和示例数据
└── ...
```

### 添加新功能
1. 修改相关组件
2. 运行 `npm run build` 测试
3. 数据会自动保留

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
