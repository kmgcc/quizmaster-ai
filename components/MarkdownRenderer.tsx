import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { highlightCode } from '../utils/codeHighlighter';

interface Props {
  content: string;
  className?: string;
  /** 是否启用完整 Markdown 渲染（默认 true） */
  fullMarkdown?: boolean;
}

/**
 * 统一的 Markdown 和代码块渲染组件
 * 
 * 支持：
 * - 完整的 Markdown 渲染（GFM 表格、列表、标题等）
 * - 代码块语法高亮
 * - 行内代码样式
 * - 粗体文本
 * 
 * 使用方式：
 * <MarkdownRenderer content={text} /> - 完整 Markdown
 * <MarkdownRenderer content={text} fullMarkdown={false} /> - 仅代码块和行内样式
 */
export const MarkdownRenderer: React.FC<Props> = ({ 
  content, 
  className = '',
  fullMarkdown = true 
}) => {
  // 简化的渲染模式（仅代码块、行内代码、粗体）
  if (!fullMarkdown) {
    return <div className={className}>{renderSimplifiedMarkdown(content)}</div>;
  }

  // 完整 Markdown 渲染
  return (
    <div className={`prose prose-slate dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

// 代码块组件
const CodeBlock: React.FC<{ code: string; lang: string }> = ({ code, lang }) => {
  return (
    <div className="my-3 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-[#1e1e1e] shadow-md">
      <div className="px-3 py-1.5 bg-[#252526] text-xs text-slate-400 border-b border-slate-700 font-bold uppercase flex justify-between items-center">
        <span>{lang || 'CODE'}</span>
        <div className="flex gap-1.5 opacity-50">
          <span className="w-2 h-2 rounded-full bg-[#ff5f56]"></span>
          <span className="w-2 h-2 rounded-full bg-[#ffbd2e]"></span>
          <span className="w-2 h-2 rounded-full bg-[#27c93f]"></span>
        </div>
      </div>
      <pre className="p-3 overflow-x-auto text-[#d4d4d4] text-sm leading-relaxed">
        <code>{highlightCode(code, lang)}</code>
      </pre>
    </div>
  );
};

// 简化的 Markdown 渲染（仅支持代码块、行内代码、粗体）
const renderSimplifiedMarkdown = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  
  // Match code blocks first (``` ```)
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let match;
  const codeBlocks: { start: number; end: number; lang: string; code: string }[] = [];
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    codeBlocks.push({
      start: match.index,
      end: match.index + match[0].length,
      lang: match[1] || 'code',
      code: match[2]
    });
  }
  
  // Process text with inline code and bold
  const processInline = (str: string, key: string) => {
    const inlineParts = str.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return inlineParts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code 
            key={`${key}-${i}`} 
            className="px-1.5 py-0.5 rounded text-xs font-mono border"
            style={{
              backgroundColor: 'var(--tertiary-container)',
              color: 'var(--on-tertiary-container)',
              borderColor: 'var(--outline)',
            }}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={`${key}-${i}`} className="font-bold" style={{ color: 'var(--text)' }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };
  
  let lastIndex = 0;
  codeBlocks.forEach((block, blockIdx) => {
    // Add text before code block
    if (block.start > lastIndex) {
      const textBefore = text.substring(lastIndex, block.start);
      parts.push(<span key={`text-${blockIdx}`}>{processInline(textBefore, `inline-${blockIdx}`)}</span>);
    }
    
    // Add code block with syntax highlighting
    parts.push(<CodeBlock key={`code-${blockIdx}`} code={block.code} lang={block.lang} />);
    
    lastIndex = block.end;
  });
  
  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    parts.push(<span key="text-end">{processInline(remainingText, 'inline-end')}</span>);
  }
  
  return <>{parts}</>;
};

// Markdown 组件配置
const markdownComponents = {
  // 代码块
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const lang = match ? match[1] : '';
    const codeString = String(children).replace(/\n$/, '');
    
    if (!inline && lang) {
      return <CodeBlock code={codeString} lang={lang} />;
    }
    
    return (
      <code 
        className="px-1.5 py-0.5 rounded border font-mono text-xs mx-0.5" 
        style={{
          backgroundColor: 'var(--surface2)',
          color: 'var(--tertiary)',
          borderColor: 'var(--outline)',
        }}
        {...props}
      >
        {children}
      </code>
    );
  },
  
  // 表格样式 - 支持 GitHub 风格表格（GFM）
  table({ node, ...props }: any) {
    return (
      <div className="my-3 overflow-x-auto">
        <table 
          className="min-w-full text-sm border rounded-lg overflow-hidden" 
          style={{ borderColor: 'var(--outline)' }}
          {...props} 
        />
      </div>
    );
  },
  thead({ ...props }: any) {
    return <thead style={{ backgroundColor: 'var(--surface2)' }} {...props} />;
  },
  tbody({ ...props }: any) {
    return <tbody {...props} />;
  },
  tr({ children, ...props }: any) {
    return (
      <tr 
        className="border-t"
        style={{
          borderColor: 'var(--outline)',
          backgroundColor: 'var(--surface)',
        }}
        {...props}
      >
        {children}
      </tr>
    );
  },
  th({ children, ...props }: any) {
    return (
      <th 
        className="px-3 py-2 text-left font-semibold border-b whitespace-nowrap"
        style={{
          borderColor: 'var(--outline)',
          color: 'var(--text)',
        }}
        {...props}
      >
        {children}
      </th>
    );
  },
  td({ children, ...props }: any) {
    return (
      <td 
        className="px-3 py-2 border-t align-top"
        style={{
          borderColor: 'var(--outline)',
          color: 'var(--text)',
        }}
        {...props}
      >
        {children}
      </td>
    );
  },
  
  // 其他元素保持默认样式
  p({ children }: any) {
    return <p className="mb-2 leading-relaxed">{children}</p>;
  },
  h1({ children }: any) {
    return <h1 className="text-2xl font-bold mt-4 mb-2 pb-2 border-b" style={{ borderColor: 'var(--outline)', color: 'var(--text)' }}>{children}</h1>;
  },
  h2({ children }: any) {
    return <h2 className="text-xl font-bold mt-4 mb-2">{children}</h2>;
  },
  h3({ children }: any) {
    return <h3 className="text-lg font-bold mt-3 mb-2">{children}</h3>;
  },
  strong({ children }: any) {
    return <strong className="font-bold text-slate-900 dark:text-white">{children}</strong>;
  },
  blockquote({ children }: any) {
    return (
      <blockquote 
        className="border-l-4 pl-4 py-1 my-2 italic rounded-r"
        style={{
          borderColor: 'var(--outline)',
          color: 'var(--muted)',
          backgroundColor: 'var(--surface2)',
        }}
      >
        {children}
      </blockquote>
    );
  },
  ul({ children }: any) {
    return <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>;
  },
  ol({ children }: any) {
    return <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>;
  },
  li({ children }: any) {
    return <li className="leading-relaxed">{children}</li>;
  },
  hr() {
    return <hr className="my-6" style={{ borderColor: 'var(--outline)' }} />;
  }
};

export default MarkdownRenderer;
