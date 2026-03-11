# 轻量化顶栏/底栏设计指南

## 目录
1. [设计系统分析](#设计系统分析)
2. [现代轻量栏体设计模式](#现代轻量栏体设计模式)
3. [高度优化标准](#高度优化标准)
4. [视觉层次技巧](#视觉层次技巧)
5. [响应式考虑](#响应式考虑)
6. [Tailwind CSS 实现示例](#tailwind-css-实现示例)
7. [悬浮按钮定位方案](#悬浮按钮定位方案)

---

## 设计系统分析

### 现有 CSS 变量（来自 theme.ts）

```css
/* 基础色 */
--bg              /* 页面背景 */
--surface         /* 卡片背景 */
--surface2        /* 次级表面 */
--outline         /* 边框/分割线 */
--text            /* 主文本 */
--muted           /* 弱化文本 */

/* 主题色 */
--primary         /* 主色 */
--on-primary      /* 主色上的文本 */
--primary-container
--on-primary-container

/* RGB 变体（用于 rgba 半透明） */
--surface-rgb     /* 例: 255, 255, 255 */
--warning-rgb
--danger-rgb
--success-rgb
```

### 现有玻璃态类（index.html）

```css
.glass-header, .glass {
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  backdrop-filter: blur(12px) saturate(150%);
  background-color: rgba(255, 255, 255, 0.08);  /* light */
}

.dark .glass-header, .dark .glass {
  background-color: rgba(20, 20, 20, 0.18);  /* dark */
}
```

---

## 现代轻量栏体设计模式

### 1. 半透明效果

#### 方案 A: 极简玻璃态（推荐）
```jsx
// Tailwind CSS CDN 组合
className="backdrop-blur-md bg-white/[0.03] dark:bg-black/[0.05]"

// 使用项目 CSS 变量
style={{
  backgroundColor: 'rgba(var(--surface-rgb), 0.08)',
  backdropFilter: 'blur(16px) saturate(180%)',
}}
```

#### 方案 B: 渐变叠加玻璃态
```jsx
style={{
  background: `linear-gradient(
    to bottom,
    rgba(var(--surface-rgb), 0.12) 0%,
    rgba(var(--surface-rgb), 0.06) 100%
  )`,
  backdropFilter: 'blur(20px) saturate(150%)',
}}
```

#### 方案 C: 边缘强化玻璃态
```jsx
// 顶部带高光线的玻璃态
style={{
  background: 'rgba(var(--surface-rgb), 0.05)',
  backdropFilter: 'blur(16px)',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
}}
```

### 2. 细边框替代厚重分割线

#### 方案 A: 透明边框
```jsx
// 底部细线
className="border-b border-white/[0.08] dark:border-white/[0.05]"

// 使用项目变量
style={{ borderBottom: '1px solid var(--outline)' }}
```

#### 方案 B: 渐变边框
```jsx
// 渐变消失的边框（中间实，两端虚）
style={{
  borderBottom: '1px solid transparent',
  background: `
    linear-gradient(var(--surface), var(--surface)) padding-box,
    linear-gradient(90deg, 
      transparent 0%, 
      var(--outline) 20%, 
      var(--outline) 80%, 
      transparent 100%
    ) border-box
  `,
}}
```

#### 方案 C: 微妙阴影替代边框
```jsx
// 纯阴影，无边框（更轻盈）
className="shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)]"

// 或使用 CSS 变量
style={{
  boxShadow: '0 1px 0 0 var(--outline)',
}}
```

### 3. 渐变背景替代纯色

#### 方案 A: 顶部高光渐变
```jsx
style={{
  background: `linear-gradient(
    180deg,
    rgba(var(--surface-rgb), 0.15) 0%,
    rgba(var(--surface-rgb), 0.05) 100%
  )`,
}}
```

#### 方案 B: 微妙的垂直渐变
```jsx
// 深色模式下的渐变更明显
className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] dark:from-white/[0.06] dark:to-transparent"
```

#### 方案 C: 对角微光渐变
```jsx
style={{
  background: `linear-gradient(
    135deg,
    rgba(var(--primary), 0.03) 0%,
    transparent 50%
  ), rgba(var(--surface-rgb), 0.08)`,
}}
```

---

## 高度优化标准

### 顶栏高度推荐值

| 场景 | 高度 | Tailwind | 使用场景 |
|------|------|----------|----------|
| **极简紧凑** | 44px | `h-11` | 移动端、全屏沉浸式应用 |
| **标准紧凑** | 48px | `h-12` | 移动端标准、PWA |
| **舒适紧凑** | 52px | `[height:52px]` | 平板、轻量桌面应用 |
| **平衡型** | 56px | `h-14` | 桌面应用、内容型网站 |
| **标准型** | 64px | `h-16` | 企业应用、复杂功能 |
| **扩展型** | 72px | `h-18` | 需要大标题或更多元素 |

### 底栏高度推荐值

| 场景 | 高度 | Tailwind | 使用场景 |
|------|------|----------|----------|
| **极简操作栏** | 48px | `h-12` | 单一主要操作按钮 |
| **标准操作栏** | 56px | `h-14` | 2-3个操作按钮 |
| **舒适操作栏** | 64px | `h-16` | 带标签的导航栏 |
| **增强型** | 72px+ | `h-[72px]` | 带输入框或复杂控件 |

### 安全区域计算

```jsx
// 移动端底栏需要考虑安全区域
const bottomBarStyle = {
  height: '56px',
  paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  // 实际高度 = 56px + safe-area-inset-bottom
};

// Tailwind 写法
className="h-14 pb-[env(safe-area-inset-bottom)]"
```

---

## 视觉层次技巧

### 1. 玻璃拟态（Glassmorphism）效果

#### 标准玻璃态
```jsx
// 基础玻璃态
style={{
  background: 'rgba(var(--surface-rgb), 0.08)',
  backdropFilter: 'blur(16px) saturate(150%)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
}}
```

#### 增强玻璃态（更明显）
```jsx
style={{
  background: 'rgba(var(--surface-rgb), 0.12)',
  backdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
}}
```

#### iOS 风格玻璃态
```jsx
style={{
  background: 'rgba(var(--surface-rgb), 0.72)',
  backdropFilter: 'blur(20px) saturate(180%)',
  // 无边框，靠背景模糊区分
}}
```

### 2. 阴影的微妙使用

#### 顶栏阴影（向下投射）
```jsx
// 微妙阴影
className="shadow-sm"  // 0 1px 2px 0 rgb(0 0 0 / 0.05)

// 分层阴影（更有深度）
style={{
  boxShadow: `
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 2px 4px rgba(0, 0, 0, 0.04),
    0 4px 8px rgba(0, 0, 0, 0.02)
  `,
}}

// 边缘光晕阴影（现代感）
style={{
  boxShadow: '0 1px 0 0 var(--outline)',
}}
```

#### 底栏阴影（向上投射）
```jsx
// 向上的阴影
style={{
  boxShadow: '0 -1px 3px rgba(0, 0, 0, 0.05)',
}}

// 更明显的底栏阴影
className="shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
```

### 3. 内容区域的呼吸感留白

#### 内容安全区域 CSS 变量
```css
:root {
  --topbar-h: 56px;
  --content-safe-top: calc(var(--topbar-h) + 16px);
  --content-safe-bottom: max(16px, env(safe-area-inset-bottom, 0px));
}
```

#### 内容区域实现
```jsx
// 内容区域
<main 
  className="pt-[var(--content-safe-top)] pb-[var(--content-safe-bottom)]"
  style={{
    paddingTop: 'var(--content-safe-top)',
    paddingBottom: 'var(--content-safe-bottom)',
    scrollPaddingTop: 'var(--content-safe-top)',
  }}
>
  {/* 内容 */}
</main>
```

#### 固定栏下的滚动优化
```jsx
// 内容可滚动到栏体下方，透过玻璃态可见
<div 
  className="overflow-y-auto"
  style={{
    paddingTop: 'var(--content-safe-top)',
    // 内容滚动时，顶部内容透过栏体可见
  }}
>
```

---

## 响应式考虑

### 1. 移动端底栏的处理

#### 固定底栏 + 安全区域
```jsx
// 移动端底部导航栏
<footer 
  className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md"
  style={{
    backgroundColor: 'rgba(var(--surface-rgb), 0.9)',
    borderTop: '1px solid var(--outline)',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  }}
>
  <nav className="h-14 px-4 flex items-center justify-around">
    {/* 导航项 */}
  </nav>
</footer>
```

#### 底栏隐藏/显示逻辑
```jsx
// 滚动时隐藏底栏（类似 iOS Safari）
const [isVisible, setIsVisible] = useState(true);
const lastScrollY = useRef(0);

useEffect(() => {
  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    setIsVisible(currentScrollY < lastScrollY.current || currentScrollY < 10);
    lastScrollY.current = currentScrollY;
  };
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

// 底栏样式
style={{
  transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
  transition: 'transform 0.3s ease',
}}
```

### 2. 悬浮按钮的安全区域

#### 底部悬浮按钮（FAB）
```jsx
// 右下角悬浮按钮
<button 
  className="fixed z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center"
  style={{
    right: '16px',
    bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
    backgroundColor: 'var(--primary)',
    color: 'var(--on-primary)',
    boxShadow: '0 4px 12px rgba(var(--primary), 0.3)',
  }}
>
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
</button>
```

#### 避免与底栏冲突
```jsx
// 有底栏时的悬浮按钮位置
const FAB_BOTTOM_WITH_NAV = 'calc(64px + 16px + env(safe-area-inset-bottom, 0px))';

<button 
  className="fixed z-50"
  style={{
    right: '16px',
    bottom: FAB_BOTTOM_WITH_NAV,
  }}
>
```

---

## Tailwind CSS 实现示例

### 示例 1: 极简玻璃态顶栏 (48px)

```jsx
// 推荐用于移动端或轻量应用
<header 
  className="fixed top-0 left-0 right-0 z-50 h-12 px-4 flex items-center justify-between backdrop-blur-lg border-b"
  style={{
    backgroundColor: 'rgba(var(--surface-rgb), 0.06)',
    borderColor: 'var(--outline)',
  }}
>
  <div className="flex items-center gap-2">
    <img src={logo} className="w-7 h-7 rounded-lg" />
    <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>
      App Name
    </span>
  </div>
  
  <button 
    className="p-2 rounded-full transition"
    style={{ color: 'var(--muted)' }}
  >
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </button>
</header>
```

### 示例 2: 标准紧凑顶栏 (56px) + 微光渐变

```jsx
<header 
  className="fixed top-0 left-0 right-0 z-50 h-14 px-4 md:px-6 flex items-center justify-between border-b"
  style={{
    background: `linear-gradient(
      180deg,
      rgba(var(--surface-rgb), 0.12) 0%,
      rgba(var(--surface-rgb), 0.06) 100%
    )`,
    backdropFilter: 'blur(16px) saturate(150%)',
    borderColor: 'var(--outline)',
  }}
>
  {/* Logo 区域 */}
  <div className="flex items-center gap-3">
    <div 
      className="w-8 h-8 rounded-xl flex items-center justify-center"
      style={{ backgroundColor: 'var(--primary)' }}
    >
      <span style={{ color: 'var(--on-primary)' }} className="font-bold text-sm">Q</span>
    </div>
    <div className="hidden sm:block">
      <h1 className="font-bold" style={{ color: 'var(--text)' }}>QuizMaster</h1>
    </div>
  </div>
  
  {/* 操作区域 */}
  <div className="flex items-center gap-2">
    <button 
      className="px-4 py-1.5 rounded-full text-sm font-medium transition"
      style={{ 
        backgroundColor: 'var(--primary)',
        color: 'var(--on-primary)',
      }}
    >
      开始
    </button>
  </div>
</header>
```

### 示例 3: 玻璃态底栏 (56px) + 移动端导航

```jsx
<footer 
  className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t"
  style={{
    backgroundColor: 'rgba(var(--surface-rgb), 0.85)',
    borderColor: 'var(--outline)',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  }}
>
  <nav className="h-14 px-2 flex items-center justify-around">
    {navItems.map((item) => (
      <button
        key={item.id}
        className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition"
        style={{
          color: activeItem === item.id ? 'var(--primary)' : 'var(--muted)',
        }}
      >
        <item.icon className="w-5 h-5" />
        <span className="text-[10px] font-medium">{item.label}</span>
      </button>
    ))}
  </nav>
</footer>
```

### 示例 4: 轻量底栏 + 悬浮按钮

```jsx
{/* 轻量底栏 - 仅显示主要操作 */}
<footer 
  className="fixed bottom-0 left-0 right-0 z-40 h-14 px-4 flex items-center justify-between backdrop-blur-md border-t"
  style={{
    backgroundColor: 'rgba(var(--surface-rgb), 0.75)',
    borderColor: 'var(--outline)',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  }}
>
  <div className="text-sm" style={{ color: 'var(--muted)' }}>
    已选择 3 项
  </div>
  <div className="flex items-center gap-2">
    <button 
      className="px-4 py-2 rounded-full text-sm font-medium"
      style={{ 
        backgroundColor: 'var(--surface2)',
        color: 'var(--text)',
      }}
    >
      取消
    </button>
    <button 
      className="px-4 py-2 rounded-full text-sm font-medium"
      style={{ 
        backgroundColor: 'var(--primary)',
        color: 'var(--on-primary)',
      }}
    >
      确认
    </button>
  </div>
</footer>

{/* 悬浮按钮 - 位于底栏上方 */}
<button 
  className="fixed z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95"
  style={{
    right: '16px',
    bottom: 'calc(56px + 16px + env(safe-area-inset-bottom, 0px))',
    backgroundColor: 'var(--secondary)',
    color: 'var(--on-secondary)',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
  }}
>
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
</button>
```

### 示例 5: 完整的页面布局

```jsx
const PageLayout = ({ children }) => {
  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      {/* 顶栏 */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 h-14 px-4 flex items-center justify-between backdrop-blur-lg border-b"
        style={{
          backgroundColor: 'rgba(var(--surface-rgb), 0.08)',
          borderColor: 'var(--outline)',
        }}
      >
        {/* Header content */}
      </header>

      {/* 主内容区 */}
      <main 
        className="relative z-10"
        style={{
          paddingTop: 'calc(56px + 16px)',  // topbar-h + gap
          paddingBottom: 'calc(56px + 16px + env(safe-area-inset-bottom, 0px))',
          minHeight: '100vh',
        }}
      >
        {children}
      </main>

      {/* 底栏 */}
      <footer 
        className="fixed bottom-0 left-0 right-0 z-40 h-14 px-4 flex items-center justify-around backdrop-blur-lg border-t"
        style={{
          backgroundColor: 'rgba(var(--surface-rgb), 0.08)',
          borderColor: 'var(--outline)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Footer content */}
      </footer>
    </div>
  );
};
```

---

## 悬浮按钮定位方案

### 方案 1: 右下角 FAB（标准）

```jsx
<button 
  className="fixed z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center"
  style={{
    right: '16px',
    bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
    backgroundColor: 'var(--primary)',
    color: 'var(--on-primary)',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)',
  }}
>
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
</button>
```

### 方案 2: 底栏右侧 FAB

```jsx
// 当有底栏时，FAB 位于底栏上方
<div className="fixed bottom-0 left-0 right-0 z-40">
  {/* FAB - 绝对定位到底栏右侧 */}
  <button 
    className="absolute -top-7 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center"
    style={{
      backgroundColor: 'var(--primary)',
      color: 'var(--on-primary)',
      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
    }}
  >
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  </button>
  
  {/* 底栏 */}
  <nav 
    className="h-16 px-6 flex items-center justify-between backdrop-blur-lg border-t"
    style={{
      backgroundColor: 'rgba(var(--surface-rgb), 0.9)',
      borderColor: 'var(--outline)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}
  >
    {/* 底栏内容 */}
  </nav>
</div>
```

### 方案 3: 中心底栏 FAB

```jsx
// 底栏中央凸起的 FAB（类似 Dock 风格）
<footer className="fixed bottom-0 left-0 right-0 z-40">
  <div 
    className="relative h-16 flex items-center justify-around px-8 backdrop-blur-lg border-t"
    style={{
      backgroundColor: 'rgba(var(--surface-rgb), 0.9)',
      borderColor: 'var(--outline)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}
  >
    {/* 左侧导航 */}
    <button className="p-3" style={{ color: 'var(--muted)' }}>
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    </button>
    
    {/* 中央 FAB */}
    <button 
      className="absolute -top-7 w-16 h-16 rounded-full shadow-lg flex items-center justify-center"
      style={{
        backgroundColor: 'var(--primary)',
        color: 'var(--on-primary)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        left: '50%',
        transform: 'translateX(-50%)',
      }}
    >
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
    
    {/* 右侧导航 */}
    <button className="p-3" style={{ color: 'var(--muted)' }}>
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </button>
  </div>
</footer>
```

### 方案 4: 响应式 FAB 位置

```jsx
// 移动端：右下角
// 桌面端：内容区域右下角
const FAB_POSITION = {
  mobile: {
    right: '16px',
    bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
  },
  desktop: {
    right: 'calc((100vw - 1280px) / 2 + 16px)',  // 考虑 max-w-7xl
    bottom: '24px',
  },
};

<button 
  className="fixed z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300"
  style={{
    right: 'max(16px, calc((100vw - 1280px) / 2 + 16px))',
    bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
    backgroundColor: 'var(--primary)',
    color: 'var(--on-primary)',
  }}
>
  {/* icon */}
</button>
```

---

## 信息层级清晰度保持

### 1. 对比度管理

```jsx
// 确保文本可读性
const TEXT_STYLES = {
  primary: { color: 'var(--text)' },        // 主要信息，高对比度
  secondary: { color: 'var(--muted)' },     // 次要信息，中等对比度
  disabled: { color: 'var(--outline)' },    // 禁用状态，低对比度
};
```

### 2. 层级视觉区分

```jsx
// 通过背景透明度区分层级
const LAYER_STYLES = {
  base: 'rgba(var(--surface-rgb), 0.05)',      // 最底层
  elevated: 'rgba(var(--surface-rgb), 0.08)',  // 浮起元素
  modal: 'rgba(var(--surface-rgb), 0.12)',     // 模态层
  top: 'rgba(var(--surface-rgb), 0.15)',       // 最高层级
};
```

### 3. z-index 规划

```css
:root {
  --z-base: 0;
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-fixed: 30;
  --z-modal-backdrop: 40;
  --z-modal: 50;
  --z-popover: 60;
  --z-tooltip: 70;
  --z-toast: 80;
}
```

---

## 最佳实践总结

### 顶栏设计清单

- [ ] 高度选择：移动端 48-56px，桌面端 56-64px
- [ ] 使用 `position: fixed` + `z-index: 50`
- [ ] 玻璃态背景 + `backdrop-filter: blur(16px)`
- [ ] 细边框或微妙阴影，避免厚重分割线
- [ ] 设置 CSS 变量 `--topbar-h` 供内容区域使用
- [ ] 确保内容区域有 `padding-top` 避免被顶栏遮挡

### 底栏设计清单

- [ ] 高度选择：56-64px + 安全区域
- [ ] 使用 `env(safe-area-inset-bottom)` 适配刘海屏
- [ ] 玻璃态背景比顶栏稍强（因手指遮挡）
- [ ] 向上的阴影 `box-shadow: 0 -1px 3px rgba(0,0,0,0.05)`
- [ ] 考虑滚动时的隐藏/显示行为

### 悬浮按钮清单

- [ ] 最小触摸区域 44x44px
- [ ] 阴影增强浮起感
- [ ] 避免与底栏重叠，计算安全距离
- [ ] 响应式位置适配
- [ ] 交互动画 `active:scale-95`