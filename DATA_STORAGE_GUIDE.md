# QuizMaster AI - 数据存储说明

## 📦 数据存储位置

所有数据都存储在**浏览器的 localStorage** 中，这是一个持久化的本地存储机制。

### 存储位置
- **Chrome/Edge**: `chrome://settings/content/all?searchSubpage=localhost`
- **Firefox**: `about:preferences#privacy` → Cookies and Site Data
- **Safari**: Preferences → Privacy → Manage Website Data

## 🗂️ 存储的数据键名

### 1. `qb_banks` - 题库数据
**内容**：所有导入的题库（JSON 数组）

**包含**：
- 题库 ID、标题、描述
- 所有题目内容（包括 Markdown 格式）
- 题目选项、答案、解析
- 题库标签

**示例**：
```json
[
  {
    "schema_version": "2.0",
    "id": "bank_001",
    "title": "前端开发基础",
    "questions": [...]
  }
]
```

### 2. `qb_sessions` - 答题记录
**内容**：所有完成的答题会话（JSON 数组）

**包含**：
- 每次答题的完整记录
- 每道题的用户答案
- 每道题的正确性和得分
- **用户笔记** (`annotation` 字段)
- **AI 聊天记录** (`chatHistory` 字段)
- AI 评分反馈
- 答题时间戳

**示例**：
```json
[
  {
    "id": "session_001",
    "bankId": "bank_001",
    "startTime": 1704441600000,
    "endTime": 1704442200000,
    "totalScore": 85,
    "responses": {
      "q1": {
        "questionId": "q1",
        "userAnswer": "A",
        "isCorrect": true,
        "score": 1,
        "annotation": "这题我记住了！",
        "chatHistory": [
          {
            "role": "model",
            "text": "你好！我是你的AI助教...",
            "timestamp": 1704441700000
          },
          {
            "role": "user",
            "text": "这题怎么做？",
            "timestamp": 1704441750000
          }
        ]
      }
    }
  }
]
```

### 3. `qb_progress_{bankId}` - 答题进度
**内容**：每个题库的未完成答题进度（JSON 对象）

**包含**：
- 当前答到第几题
- 已回答的题目和答案
- 最后更新时间

**示例**：
```json
{
  "currentIndex": 3,
  "answers": {
    "q1": { "userAnswer": "A", "isCorrect": true, ... },
    "q2": { "userAnswer": "B", "isCorrect": false, ... }
  },
  "lastUpdated": 1704441800000
}
```

**注意**：完成答题后会自动清除该进度记录。

### 4. `qb_ai_settings` - AI 设置
**内容**：AI 助教的配置（JSON 对象）

**包含**：
- AI 角色名称
- 自定义系统提示词

**示例**：
```json
{
  "roleName": "AI 助教",
  "customPrompt": "请用苏格拉底式教学法..."
}
```

### 5. `qb_theme_mode` - 主题模式
**内容**：显示模式设置（字符串）

**可能的值**：`"light"`, `"dark"`, `"system"`

## 💾 数据持久化特性

### ✅ 优点
1. **自动保存**：所有操作自动保存，无需手动
2. **离线可用**：不需要网络连接即可访问数据
3. **快速加载**：本地存储，加载速度快
4. **隐私保护**：数据只存在本地，不上传服务器

### ⚠️ 注意事项
1. **浏览器绑定**：数据存储在特定浏览器中
   - Chrome 的数据在 Firefox 中看不到
   - 不同浏览器需要分别导入题库

2. **域名绑定**：数据绑定到访问的域名/端口
   - `localhost:3000` 和 `localhost:5000` 的数据是分离的
   - `127.0.0.1` 和 `localhost` 的数据也是分离的

3. **容量限制**：localStorage 通常有 5-10MB 的限制
   - 对于题库应用来说通常足够
   - 可存储数千道题目

4. **清除风险**：
   - 清除浏览器数据会删除所有记录
   - 隐私模式/无痕模式关闭后会清除数据

## 🔄 重新构建后保留数据

### 好消息：数据会自动保留！

**原因**：
- 数据存储在浏览器中，不在应用代码中
- 重新构建只是更新应用代码
- localStorage 数据不受影响

**步骤**：
1. 运行 `npm run build` 重新构建
2. 刷新浏览器页面
3. 所有数据自动加载：
   - ✅ 题库列表
   - ✅ 答题记录
   - ✅ 用户笔记
   - ✅ AI 聊天记录
   - ✅ 答题进度
   - ✅ AI 设置
   - ✅ 主题设置

## 📤 数据导出和备份

### 方法 1：应用内一键备份（推荐）⭐

**最简单的方式**：直接在应用界面操作！

#### 导出数据
1. 点击右上角的 **⚙️ 设置** 图标
2. 在下拉菜单中找到 **"数据管理"** 部分
3. 点击 **"💾 导出所有数据"**
4. 备份文件会自动下载到你的电脑（文件名格式：`quizmaster-backup-YYYY-MM-DD.json`）

#### 导入数据
1. 点击右上角的 **⚙️ 设置** 图标
2. 在下拉菜单中找到 **"数据管理"** 部分
3. 点击 **"📥 导入备份数据"**
4. 选择之前导出的备份文件
5. 确认导入（会显示备份文件包含的数据类型）
6. 页面自动刷新，所有数据恢复完成

**优点**：
- ✅ 无需打开开发者工具
- ✅ 一键操作，简单快捷
- ✅ 自动包含所有数据（题库、答题记录、笔记、AI 聊天、进度、设置）
- ✅ 导入前会显示确认信息
- ✅ 适合所有用户

### 方法 2：浏览器开发者工具
1. 按 `F12` 打开开发者工具
2. 切换到 `Console` 标签
3. 运行以下命令导出所有数据：

```javascript
// 导出所有数据
const backup = {
  banks: localStorage.getItem('qb_banks'),
  sessions: localStorage.getItem('qb_sessions'),
  aiSettings: localStorage.getItem('qb_ai_settings'),
  themeMode: localStorage.getItem('qb_theme_mode'),
  progress: {}
};

// 导出所有答题进度
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.startsWith('qb_progress_')) {
    backup.progress[key] = localStorage.getItem(key);
  }
}

// 下载备份文件
const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `quizmaster-backup-${Date.now()}.json`;
a.click();
```

### 方法 2：手动复制
1. 打开开发者工具 (`F12`)
2. 切换到 `Application` 标签（Chrome）或 `Storage` 标签（Firefox）
3. 左侧选择 `Local Storage` → 你的域名
4. 手动复制需要的数据

## 📥 数据恢复

### 从备份文件恢复
在浏览器控制台运行：

```javascript
// 1. 将备份文件内容粘贴到这里
const backup = {
  // ... 你的备份数据
};

// 2. 恢复数据
if (backup.banks) localStorage.setItem('qb_banks', backup.banks);
if (backup.sessions) localStorage.setItem('qb_sessions', backup.sessions);
if (backup.aiSettings) localStorage.setItem('qb_ai_settings', backup.aiSettings);
if (backup.themeMode) localStorage.setItem('qb_theme_mode', backup.themeMode);

// 3. 恢复答题进度
if (backup.progress) {
  Object.entries(backup.progress).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });
}

// 4. 刷新页面
location.reload();
```

## 🔒 数据安全建议

1. **定期备份**：重要的答题记录建议定期导出备份
2. **多浏览器**：可以在多个浏览器中导入相同题库
3. **云同步**：考虑使用浏览器的同步功能（如 Chrome Sync）
4. **版本控制**：题库 JSON 文件可以用 Git 管理

## 🚀 数据迁移场景

### 场景 1：更换浏览器
1. 在旧浏览器导出数据（使用上面的导出脚本）
2. 在新浏览器打开应用
3. 使用恢复脚本导入数据

### 场景 2：更换电脑
1. 导出备份文件
2. 将文件传输到新电脑
3. 在新电脑的浏览器中恢复数据

### 场景 3：清除浏览器数据后
1. 如果有备份文件，使用恢复脚本
2. 如果没有备份，需要重新导入题库
3. 答题记录和笔记将丢失

## 💡 最佳实践

1. **重要题库**：导入后建议保留原始 JSON 文件
2. **定期备份**：每周或每月导出一次数据备份
3. **测试环境**：使用不同端口（如 3000 和 5000）可以隔离测试数据
4. **笔记导出**：重要笔记建议额外保存到其他地方

## 🛠️ 开发者工具

### 查看所有存储的数据
```javascript
// 查看所有键
console.log(Object.keys(localStorage).filter(k => k.startsWith('qb_')));

// 查看题库数量
const banks = JSON.parse(localStorage.getItem('qb_banks') || '[]');
console.log(`题库数量: ${banks.length}`);

// 查看答题记录数量
const sessions = JSON.parse(localStorage.getItem('qb_sessions') || '[]');
console.log(`答题记录: ${sessions.length}`);

// 查看数据大小
let totalSize = 0;
for (let key in localStorage) {
  if (key.startsWith('qb_')) {
    totalSize += localStorage[key].length;
  }
}
console.log(`总数据大小: ${(totalSize / 1024).toFixed(2)} KB`);
```

### 清除所有数据（慎用！）
```javascript
// 清除所有 QuizMaster 数据
Object.keys(localStorage)
  .filter(key => key.startsWith('qb_'))
  .forEach(key => localStorage.removeItem(key));
  
console.log('所有数据已清除');
location.reload();
```

---

## 📝 总结

- ✅ **重新构建不会丢失数据**
- ✅ 数据存储在浏览器 localStorage 中
- ✅ 包括题库、答题记录、笔记、AI 聊天记录
- ✅ 可以随时导出备份
- ⚠️ 清除浏览器数据会删除所有记录
- 💡 建议定期备份重要数据

