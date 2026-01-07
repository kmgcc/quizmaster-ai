import React from 'react';

/**
 * Token 类型定义
 */
type TokenType = 'plain' | 'keyword' | 'string' | 'comment' | 'number' | 'function';

interface Token {
  type: TokenType;
  text: string;
}

/**
 * 关键词表
 */
const KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'class', 'import', 'from', 'export', 'default', 'async', 'await', 'try', 'catch',
  'def', 'print', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is',
  'public', 'private', 'protected', 'static', 'void', 'int', 'string', 'boolean'
]);

/**
 * 颜色配置
 */
const COLORS: Record<TokenType, string | undefined> = {
  keyword: '#569cd6',
  string: '#ce9178',
  comment: '#6a9955',
  number: '#b5cea8',
  function: '#dcdcaa',
  plain: undefined, // 继承父元素颜色
};

/**
 * 解码 HTML 实体（只做一次，避免循环）
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

/**
 * 移除所有 HTML 标签，只保留纯文本
 */
function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

/**
 * 判断是否为数字字符
 */
function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

/**
 * 判断是否为标识符起始字符
 */
function isIdentifierStart(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_' || ch === '$';
}

/**
 * 判断是否为标识符字符
 */
function isIdentifierChar(ch: string): boolean {
  return isIdentifierStart(ch) || isDigit(ch);
}

/**
 * Tokenize 一行代码
 */
function tokenizeLine(line: string, lang: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = line.length;
  
  // 判断是否为注释风格语言
  const isHashComment = ['python', 'shell', 'bash', 'sh', 'ruby', 'perl'].includes(lang.toLowerCase());
  
  while (i < len) {
    const ch = line[i];
    
    // 处理字符串（优先级最高，避免字符串内的字符被误判）
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      let str = quote;
      i++;
      let escaped = false;
      
      while (i < len) {
        const nextCh = line[i];
        str += nextCh;
        
        if (escaped) {
          escaped = false;
        } else if (nextCh === '\\') {
          escaped = true;
        } else if (nextCh === quote) {
          i++;
          break;
        }
        
        i++;
      }
      
      tokens.push({ type: 'string', text: str });
      continue;
    }
    
    // 处理注释（在字符串之后，避免字符串内的 // 或 # 被误判）
    if (ch === '/' && i + 1 < len && line[i + 1] === '/') {
      // JS/TS/Java/C/C++ 风格注释：// 到行末
      const commentText = line.substring(i);
      tokens.push({ type: 'comment', text: commentText });
      break; // 注释到行末，结束
    }
    
    if (ch === '#' && isHashComment) {
      // Python/Shell 风格注释：# 到行末
      const commentText = line.substring(i);
      tokens.push({ type: 'comment', text: commentText });
      break; // 注释到行末，结束
    }
    
    // 处理数字
    if (isDigit(ch) || (ch === '.' && i + 1 < len && isDigit(line[i + 1]))) {
      let num = ch;
      i++;
      let hasDot = ch === '.';
      
      while (i < len) {
        const nextCh = line[i];
        if (isDigit(nextCh)) {
          num += nextCh;
          i++;
        } else if (nextCh === '.' && !hasDot) {
          num += nextCh;
          hasDot = true;
          i++;
        } else {
          break;
        }
      }
      
      tokens.push({ type: 'number', text: num });
      continue;
    }
    
    // 处理标识符（可能是关键词或函数名）
    if (isIdentifierStart(ch)) {
      let ident = ch;
      i++;
      
      while (i < len && isIdentifierChar(line[i])) {
        ident += line[i];
        i++;
      }
      
      // 检查是否为关键词
      if (KEYWORDS.has(ident)) {
        tokens.push({ type: 'keyword', text: ident });
      } else {
        // 检查后面是否紧跟 '('，如果是则认为是函数
        let j = i;
        while (j < len && (line[j] === ' ' || line[j] === '\t')) {
          j++;
        }
        
        if (j < len && line[j] === '(') {
          tokens.push({ type: 'function', text: ident });
        } else {
          tokens.push({ type: 'plain', text: ident });
        }
      }
      continue;
    }
    
    // 其他字符作为普通文本
    tokens.push({ type: 'plain', text: ch });
    i++;
  }
  
  return tokens;
}

/**
 * 渲染一个 token 为 React 节点
 */
function renderToken(token: Token, key: number): React.ReactNode {
  const color = COLORS[token.type];
  
  if (color) {
    return (
      <span key={key} style={{ color }}>
        {token.text}
      </span>
    );
  }
  
  return <React.Fragment key={key}>{token.text}</React.Fragment>;
}

/**
 * 高亮代码块
 * @param code 代码文本
 * @param lang 语言类型（如 'javascript', 'python'）
 * @returns React 节点
 */
export function highlightCode(code: string, lang: string): React.ReactNode {
  // 1. 解码 HTML 实体
  let cleaned = decodeHtmlEntities(code);
  
  // 2. 移除所有 HTML 标签
  cleaned = stripHtmlTags(cleaned);
  
  // 3. 按行分割
  const lines = cleaned.split('\n');
  
  // 4. 每行 tokenize 并渲染
  return (
    <>
      {lines.map((line, lineIdx) => {
        const tokens = tokenizeLine(line, lang);
        
        return (
          <div key={lineIdx}>
            {tokens.map((token, tokenIdx) => renderToken(token, tokenIdx))}
          </div>
        );
      })}
    </>
  );
}

