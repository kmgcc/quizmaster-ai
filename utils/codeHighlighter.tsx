import React from 'react';

// ============================================================================
// Token 类型定义
// ============================================================================

type TokenType =
  | 'plain'      // 普通文本
  | 'keyword'    // SQL关键字 (蓝色)
  | 'type'       // 数据类型 (粉色)
  | 'function'   // 函数名 (黄色)
  | 'operator'   // 运算符 (紫色)
  | 'string'     // 字符串 (橙色)
  | 'number'     // 数字 (青色)
  | 'comment'    // 注释 (绿色)
  | 'variable'   // 变量 @xxx (浅蓝)
  | 'attribute'; // 属性关键字 (浅紫)

interface Token {
  type: TokenType;
  text: string;
}

// ============================================================================
// MySQL 8.4 常量定义
// ============================================================================

// MySQL 8.4 关键字和保留字 (按官方文档整理)
const MYSQL_KEYWORDS = new Set([
  // A
  'ACCESSIBLE', 'ACCOUNT', 'ACTION', 'ACTIVE', 'ADD', 'ADMIN', 'AFTER', 'AGAINST', 'AGGREGATE', 'ALGORITHM', 'ALL', 'ALTER', 'ALWAYS', 'ANALYZE', 'AND', 'ANY', 'ARRAY', 'AS', 'ASC', 'ASCII', 'ASENSITIVE', 'AT', 'ATTRIBUTE', 'AUTHENTICATION', 'AUTO', 'AUTOEXTEND_SIZE', 'AUTO_INCREMENT', 'AVG', 'AVG_ROW_LENGTH',
  // B
  'BACKUP', 'BEFORE', 'BEGIN', 'BERNOULLI', 'BETWEEN', 'BIGINT', 'BINARY', 'BINLOG', 'BIT', 'BLOB', 'BLOCK', 'BOOL', 'BOOLEAN', 'BOTH', 'BTREE', 'BUCKETS', 'BULK', 'BY', 'BYTE',
  // C
  'CACHE', 'CALL', 'CASCADE', 'CASCADED', 'CASE', 'CATALOG_NAME', 'CHAIN', 'CHALLENGE_RESPONSE', 'CHANGE', 'CHANGED', 'CHANNEL', 'CHAR', 'CHARACTER', 'CHARSET', 'CHECK', 'CHECKSUM', 'CIPHER', 'CLASS_ORIGIN', 'CLIENT', 'CLONE', 'CLOSE', 'COALESCE', 'CODE', 'COLLATE', 'COLLATION', 'COLUMN', 'COLUMNS', 'COLUMN_FORMAT', 'COLUMN_NAME', 'COMMENT', 'COMMIT', 'COMMITTED', 'COMPACT', 'COMPLETION', 'COMPONENT', 'COMPRESSED', 'COMPRESSION', 'CONCURRENT', 'CONDITION', 'CONNECTION', 'CONSISTENT', 'CONSTRAINT', 'CONSTRAINT_CATALOG', 'CONSTRAINT_NAME', 'CONSTRAINT_SCHEMA', 'CONTAINS', 'CONTEXT', 'CONTINUE', 'CONVERT', 'CPU', 'CREATE', 'CROSS', 'CUBE', 'CUME_DIST', 'CURRENT', 'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'CURRENT_USER', 'CURSOR', 'CURSOR_NAME',
  // D
  'DATA', 'DATABASE', 'DATABASES', 'DATAFILE', 'DATE', 'DATETIME', 'DAY', 'DAY_HOUR', 'DAY_MICROSECOND', 'DAY_MINUTE', 'DAY_SECOND', 'DEALLOCATE', 'DEC', 'DECIMAL', 'DECLARE', 'DEFAULT', 'DEFAULT_AUTH', 'DEFINER', 'DEFINITION', 'DELAYED', 'DELAY_KEY_WRITE', 'DELETE', 'DENSE_RANK', 'DESC', 'DESCRIBE', 'DESCRIPTION', 'DETERMINISTIC', 'DIAGNOSTICS', 'DIRECTORY', 'DISABLE', 'DISCARD', 'DISK', 'DISTINCT', 'DISTINCTROW', 'DIV', 'DO', 'DOUBLE', 'DROP', 'DUAL', 'DUMPFILE', 'DUPLICATE', 'DYNAMIC',
  // E
  'EACH', 'ELSE', 'ELSEIF', 'EMPTY', 'ENABLE', 'ENCLOSED', 'ENCRYPTION', 'END', 'ENDS', 'ENFORCED', 'ENGINE', 'ENGINES', 'ENGINE_ATTRIBUTE', 'ENUM', 'ERROR', 'ERRORS', 'ESCAPE', 'ESCAPED', 'EVENT', 'EVENTS', 'EVERY', 'EXCEPT', 'EXCHANGE', 'EXCLUDE', 'EXECUTE', 'EXISTS', 'EXIT', 'EXPANSION', 'EXPIRE', 'EXPLAIN', 'EXPORT', 'EXTENDED', 'EXTENT_SIZE',
  // F
  'FACTOR', 'FAILED_LOGIN_ATTEMPTS', 'FALSE', 'FAST', 'FAULTS', 'FETCH', 'FIELDS', 'FILE', 'FILE_BLOCK_SIZE', 'FILTER', 'FINISH', 'FIRST', 'FIRST_VALUE', 'FIXED', 'FLOAT', 'FLOAT4', 'FLOAT8', 'FLUSH', 'FOLLOWING', 'FOLLOWS', 'FOR', 'FORCE', 'FOREIGN', 'FORMAT', 'FOUND', 'FROM', 'FULL', 'FULLTEXT', 'FUNCTION',
  // G
  'GENERAL', 'GENERATE', 'GENERATED', 'GEOMCOLLECTION', 'GEOMETRY', 'GEOMETRYCOLLECTION', 'GET', 'GET_FORMAT', 'GET_SOURCE_PUBLIC_KEY', 'GLOBAL', 'GRANT', 'GRANTS', 'GROUP', 'GROUPING', 'GROUPS', 'GROUP_REPLICATION', 'GTIDS', 'GTID_ONLY',
  // H
  'HANDLER', 'HASH', 'HAVING', 'HELP', 'HIGH_PRIORITY', 'HISTOGRAM', 'HISTORY', 'HOST', 'HOSTS', 'HOUR', 'HOUR_MICROSECOND', 'HOUR_MINUTE', 'HOUR_SECOND',
  // I
  'IDENTIFIED', 'IF', 'IGNORE', 'IGNORE_SERVER_IDS', 'IMPORT', 'IN', 'INACTIVE', 'INDEX', 'INDEXES', 'INFILE', 'INITIAL', 'INITIAL_SIZE', 'INITIATE', 'INNER', 'INOUT', 'INSENSITIVE', 'INSERT', 'INSERT_METHOD', 'INSTALL', 'INSTANCE', 'INT', 'INT1', 'INT2', 'INT3', 'INT4', 'INT8', 'INTEGER', 'INTERSECT', 'INTERVAL', 'INTO', 'INVISIBLE', 'INVOKER', 'IO', 'IO_AFTER_GTIDS', 'IO_BEFORE_GTIDS', 'IO_THREAD', 'IPC', 'IS', 'ISOLATION', 'ISSUER', 'ITERATE',
  // J
  'JOIN', 'JSON', 'JSON_TABLE', 'JSON_VALUE',
  // K
  'KEY', 'KEYRING', 'KEYS', 'KEY_BLOCK_SIZE', 'KILL',
  // L
  'LAG', 'LANGUAGE', 'LAST', 'LAST_VALUE', 'LATERAL', 'LEAD', 'LEADING', 'LEAVE', 'LEAVES', 'LEFT', 'LESS', 'LEVEL', 'LIKE', 'LIMIT', 'LINEAR', 'LINES', 'LINESTRING', 'LIST', 'LOAD', 'LOCAL', 'LOCALTIME', 'LOCALTIMESTAMP', 'LOCK', 'LOCKED', 'LOCKS', 'LOG', 'LOGFILE', 'LOGS', 'LONG', 'LONGBLOB', 'LONGTEXT', 'LOOP', 'LOW_PRIORITY',
  // M
  'MANUAL', 'MASTER', 'MATCH', 'MAXVALUE', 'MAX_CONNECTIONS_PER_HOUR', 'MAX_QUERIES_PER_HOUR', 'MAX_ROWS', 'MAX_SIZE', 'MAX_UPDATES_PER_HOUR', 'MAX_USER_CONNECTIONS', 'MEDIUM', 'MEDIUMBLOB', 'MEDIUMINT', 'MEDIUMTEXT', 'MEMBER', 'MEMORY', 'MERGE', 'MESSAGE_TEXT', 'MICROSECOND', 'MIDDLEINT', 'MIGRATE', 'MINUTE', 'MINUTE_MICROSECOND', 'MINUTE_SECOND', 'MIN_ROWS', 'MOD', 'MODE', 'MODIFIES', 'MODIFY', 'MONTH', 'MULTILINESTRING', 'MULTIPOINT', 'MULTIPOLYGON', 'MUTEX', 'MYSQL_ERRNO',
  // N
  'NAME', 'NAMES', 'NATIONAL', 'NATURAL', 'NCHAR', 'NDB', 'NDBCLUSTER', 'NESTED', 'NETWORK_NAMESPACE', 'NEVER', 'NEW', 'NEXT', 'NO', 'NODEGROUP', 'NONE', 'NOT', 'NOWAIT', 'NO_WAIT', 'NO_WRITE_TO_BINLOG', 'NTH_VALUE', 'NTILE', 'NULL', 'NULLS', 'NUMBER', 'NUMERIC', 'NVARCHAR',
  // O
  'OF', 'OFF', 'OFFSET', 'OJ', 'OLD', 'ON', 'ONE', 'ONLY', 'OPEN', 'OPTIMIZE', 'OPTIMIZER_COSTS', 'OPTION', 'OPTIONAL', 'OPTIONALLY', 'OPTIONS', 'OR', 'ORDER', 'ORDINALITY', 'ORGANIZATION', 'OTHERS', 'OUT', 'OUTER', 'OUTFILE', 'OVER', 'OWNER',
  // P
  'PACK_KEYS', 'PAGE', 'PARALLEL', 'PARSER', 'PARSE_TREE', 'PARTIAL', 'PARTITION', 'PARTITIONING', 'PARTITIONS', 'PASSWORD', 'PASSWORD_LOCK_TIME', 'PATH', 'PERCENT_RANK', 'PERSIST', 'PERSIST_ONLY', 'PHASE', 'PLUGIN', 'PLUGINS', 'PLUGIN_DIR', 'POINT', 'POLYGON', 'PORT', 'PRECEDES', 'PRECEDING', 'PRECISION', 'PREPARE', 'PRESERVE', 'PREV', 'PRIMARY', 'PRIVILEGES', 'PRIVILEGE_CHECKS_USER', 'PROCEDURE', 'PROCESS', 'PROCESSLIST', 'PROFILE', 'PROFILES', 'PROXY', 'PURGE',
  // Q
  'QUALIFY', 'QUARTER', 'QUERY', 'QUICK',
  // R
  'RANDOM', 'RANGE', 'RANK', 'READ', 'READS', 'READ_ONLY', 'READ_WRITE', 'REAL', 'REBUILD', 'RECOVER', 'RECURSIVE', 'REDO_BUFFER_SIZE', 'REDUNDANT', 'REFERENCE', 'REFERENCES', 'REGEXP', 'REGISTRATION', 'RELAY', 'RELAYLOG', 'RELAY_LOG_FILE', 'RELAY_LOG_POS', 'RELAY_THREAD', 'RELEASE', 'RELOAD', 'REMOVE', 'RENAME', 'REORGANIZE', 'REPAIR', 'REPEAT', 'REPEATABLE', 'REPLACE', 'REPLICA', 'REPLICAS', 'REPLICATE_DO_DB', 'REPLICATE_DO_TABLE', 'REPLICATE_IGNORE_DB', 'REPLICATE_IGNORE_TABLE', 'REPLICATE_REWRITE_DB', 'REPLICATE_WILD_DO_TABLE', 'REPLICATE_WILD_IGNORE_TABLE', 'REPLICATION', 'REQUIRE', 'REQUIRE_ROW_FORMAT', 'RESET', 'RESIGNAL', 'RESOURCE', 'RESPECT', 'RESTART', 'RESTORE', 'RESTRICT', 'RESUME', 'RETAIN', 'RETURN', 'RETURNED_SQLSTATE', 'RETURNING', 'RETURNS', 'REUSE', 'REVERSE', 'REVOKE', 'RIGHT', 'RLIKE', 'ROLE', 'ROLLBACK', 'ROLLUP', 'ROTATE', 'ROUTINE', 'ROW', 'ROWS', 'ROW_COUNT', 'ROW_FORMAT', 'ROW_NUMBER', 'RTREE',
  // S
  'S3', 'SAVEPOINT', 'SCHEDULE', 'SCHEMA', 'SCHEMAS', 'SCHEMA_NAME', 'SECOND', 'SECONDARY', 'SECONDARY_ENGINE', 'SECONDARY_ENGINE_ATTRIBUTE', 'SECONDARY_LOAD', 'SECONDARY_UNLOAD', 'SECOND_MICROSECOND', 'SECURITY', 'SELECT', 'SENSITIVE', 'SEPARATOR', 'SERIAL', 'SERIALIZABLE', 'SERVER', 'SESSION', 'SET', 'SHARE', 'SHOW', 'SHUTDOWN', 'SIGNAL', 'SIGNED', 'SIMPLE', 'SKIP', 'SLAVE', 'SLOW', 'SMALLINT', 'SNAPSHOT', 'SOCKET', 'SOME', 'SONAME', 'SOUNDS', 'SOURCE', 'SOURCE_AUTO_POSITION', 'SOURCE_BIND', 'SOURCE_COMPRESSION_ALGORITHMS', 'SOURCE_CONNECT_RETRY', 'SOURCE_DELAY', 'SOURCE_HEARTBEAT_PERIOD', 'SOURCE_HOST', 'SOURCE_LOG_FILE', 'SOURCE_LOG_POS', 'SOURCE_PASSWORD', 'SOURCE_PORT', 'SOURCE_PUBLIC_KEY_PATH', 'SOURCE_RETRY_COUNT', 'SOURCE_SSL', 'SOURCE_SSL_CA', 'SOURCE_SSL_CAPATH', 'SOURCE_SSL_CERT', 'SOURCE_SSL_CIPHER', 'SOURCE_SSL_CRL', 'SOURCE_SSL_CRLPATH', 'SOURCE_SSL_KEY', 'SOURCE_SSL_VERIFY_SERVER_CERT', 'SOURCE_TLS_CIPHERSUITES', 'SOURCE_TLS_VERSION', 'SOURCE_USER', 'SOURCE_ZSTD_COMPRESSION_LEVEL', 'SPATIAL', 'SPECIFIC', 'SQL', 'SQLEXCEPTION', 'SQLSTATE', 'SQLWARNING', 'SQL_AFTER_GTIDS', 'SQL_AFTER_MTS_GAPS', 'SQL_BEFORE_GTIDS', 'SQL_BIG_RESULT', 'SQL_BUFFER_RESULT', 'SQL_CALC_FOUND_ROWS', 'SQL_NO_CACHE', 'SQL_SMALL_RESULT', 'SQL_THREAD', 'SQL_TSI_DAY', 'SQL_TSI_HOUR', 'SQL_TSI_MINUTE', 'SQL_TSI_MONTH', 'SQL_TSI_QUARTER', 'SQL_TSI_SECOND', 'SQL_TSI_WEEK', 'SQL_TSI_YEAR', 'SRID', 'SSL', 'STACKED', 'START', 'STARTING', 'STARTS', 'STATS_AUTO_RECALC', 'STATS_PERSISTENT', 'STATS_SAMPLE_PAGES', 'STATUS', 'STOP', 'STORAGE', 'STORED', 'STRAIGHT_JOIN', 'STREAM', 'STRING', 'SUBCLASS_ORIGIN', 'SUBJECT', 'SUBPARTITION', 'SUBPARTITIONS', 'SUPER', 'SUSPEND', 'SWAPS', 'SWITCHES', 'SYSTEM',
  // T
  'TABLE', 'TABLES', 'TABLESAMPLE', 'TABLESPACE', 'TABLE_CHECKSUM', 'TABLE_NAME', 'TEMPORARY', 'TEMPTABLE', 'TERMINATED', 'TEXT', 'THAN', 'THEN', 'THREAD_PRIORITY', 'TIES', 'TIME', 'TIMESTAMP', 'TIMESTAMPADD', 'TIMESTAMPDIFF', 'TINYBLOB', 'TINYINT', 'TINYTEXT', 'TLS', 'TO', 'TRAILING', 'TRANSACTION', 'TRIGGER', 'TRIGGERS', 'TRUE', 'TRUNCATE', 'TYPE', 'TYPES',
  // U
  'UNBOUNDED', 'UNCOMMITTED', 'UNDEFINED', 'UNDO', 'UNDOFILE', 'UNDO_BUFFER_SIZE', 'UNICODE', 'UNINSTALL', 'UNION', 'UNIQUE', 'UNKNOWN', 'UNLOCK', 'UNREGISTER', 'UNSIGNED', 'UNTIL', 'UPDATE', 'UPGRADE', 'URL', 'USAGE', 'USE', 'USER', 'USER_RESOURCES', 'USE_FRM', 'USING', 'UTC_DATE', 'UTC_TIME', 'UTC_TIMESTAMP',
  // V
  'VALIDATION', 'VALUE', 'VALUES', 'VARBINARY', 'VARCHAR', 'VARCHARACTER', 'VARIABLES', 'VARYING', 'VCPU', 'VIEW', 'VIRTUAL', 'VISIBLE',
  // W
  'WAIT', 'WARNINGS', 'WEEK', 'WEIGHT_STRING', 'WHEN', 'WHERE', 'WHILE', 'WINDOW', 'WITH', 'WITHOUT', 'WORK', 'WRAPPER', 'WRITE',
  // X
  'X509', 'XA', 'XID', 'XML', 'XOR',
  // Y
  'YEAR', 'YEAR_MONTH',
  // Z
  'ZEROFILL', 'ZONE'
]);

// MySQL 8.4 数据类型 (按官方文档整理)
const MYSQL_TYPES = new Set([
  // 整数类型
  'BIT', 'TINYINT', 'SMALLINT', 'MEDIUMINT', 'INT', 'INTEGER', 'BIGINT',
  // 定点/浮点类型
  'FLOAT', 'DOUBLE', 'DECIMAL', 'DEC', 'NUMERIC', 'REAL',
  // 日期时间类型
  'DATE', 'DATETIME', 'TIMESTAMP', 'TIME', 'YEAR',
  // 字符串类型 - 字符
  'CHAR', 'VARCHAR', 'TEXT', 'TINYTEXT', 'MEDIUMTEXT', 'LONGTEXT',
  // 字符串类型 - 二进制
  'BINARY', 'VARBINARY', 'BLOB', 'TINYBLOB', 'MEDIUMBLOB', 'LONGBLOB',
  // 特殊字符串类型
  'ENUM', 'SET', 'JSON',
  // 空间数据类型
  'GEOMETRY', 'POINT', 'LINESTRING', 'POLYGON', 'MULTIPOINT', 'MULTILINESTRING', 'MULTIPOLYGON', 'GEOMETRYCOLLECTION', 'GEOMCOLLECTION'
]);

// MySQL 8.4 内置函数 (按官方 Built-In Function and Operator Reference 整理)
const MYSQL_BUILTIN_FUNCTIONS = new Set([
  // 聚合函数
  'AVG', 'BIT_AND', 'BIT_OR', 'BIT_XOR', 'COUNT', 'GROUP_CONCAT', 'JSON_ARRAYAGG', 'JSON_OBJECTAGG', 'MAX', 'MIN', 'STD', 'STDDEV', 'STDDEV_POP', 'STDDEV_SAMP', 'SUM', 'VAR_POP', 'VAR_SAMP', 'VARIANCE',
  // 位函数
  'BIT_COUNT', 'BIT_LENGTH',
  // 类型转换函数
  'BINARY', 'CAST', 'CONVERT',
  // 加密函数
  'AES_DECRYPT', 'AES_ENCRYPT', 'COMPRESS', 'MD5', 'PASSWORD', 'SHA', 'SHA1', 'SHA2', 'UNCOMPRESS', 'UNCOMPRESSED_LENGTH',
  // 日期时间函数
  'ADDDATE', 'ADDTIME', 'CONVERT_TZ', 'CURDATE', 'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'CURTIME', 'DATE', 'DATEDIFF', 'DATE_ADD', 'DATE_FORMAT', 'DATE_SUB', 'DAY', 'DAYNAME', 'DAYOFMONTH', 'DAYOFWEEK', 'DAYOFYEAR', 'EXTRACT', 'FROM_DAYS', 'FROM_UNIXTIME', 'GET_FORMAT', 'HOUR', 'LAST_DAY', 'LOCALTIME', 'LOCALTIMESTAMP', 'MAKEDATE', 'MAKETIME', 'MICROSECOND', 'MINUTE', 'MONTH', 'MONTHNAME', 'NOW', 'PERIOD_ADD', 'PERIOD_DIFF', 'QUARTER', 'SECOND', 'SEC_TO_TIME', 'STR_TO_DATE', 'SUBDATE', 'SUBTIME', 'SYSDATE', 'TIME', 'TIMEDIFF', 'TIMESTAMP', 'TIMESTAMPADD', 'TIMESTAMPDIFF', 'TIME_FORMAT', 'TIME_TO_SEC', 'TO_DAYS', 'TO_SECONDS', 'UNIX_TIMESTAMP', 'UTC_DATE', 'UTC_TIME', 'UTC_TIMESTAMP', 'WEEK', 'WEEKDAY', 'WEEKOFYEAR', 'YEAR', 'YEARWEEK',
  // 流程控制函数
  'CASE', 'IF', 'IFNULL', 'NULLIF',
  // 分组操作函数
  'GROUPING',
  // 数学函数
  'ABS', 'ACOS', 'ASIN', 'ATAN', 'ATAN2', 'CEIL', 'CEILING', 'COS', 'COT', 'CRC32', 'DEGREES', 'DIV', 'EXP', 'FLOOR', 'LN', 'LOG', 'LOG10', 'LOG2', 'MOD', 'PI', 'POW', 'POWER', 'RADIANS', 'RAND', 'ROUND', 'SIGN', 'SIN', 'SQRT', 'TAN', 'TRUNCATE',
  // 比较函数
  'COALESCE', 'GREATEST', 'IN', 'ISNULL', 'LEAST',
  // JSON 函数
  'JSON_ARRAY', 'JSON_ARRAY_APPEND', 'JSON_ARRAY_INSERT', 'JSON_CONTAINS', 'JSON_CONTAINS_PATH', 'JSON_DEPTH', 'JSON_EXTRACT', 'JSON_INSERT', 'JSON_KEYS', 'JSON_LENGTH', 'JSON_MERGE', 'JSON_MERGE_PATCH', 'JSON_MERGE_PRESERVE', 'JSON_OBJECT', 'JSON_OVERLAPS', 'JSON_PRETTY', 'JSON_QUOTE', 'JSON_REMOVE', 'JSON_REPLACE', 'JSON_SEARCH', 'JSON_SET', 'JSON_STORAGE_FREE', 'JSON_STORAGE_SIZE', 'JSON_TABLE', 'JSON_TYPE', 'JSON_UNQUOTE', 'JSON_VALID', 'JSON_VALUE', 'MEMBER OF',
  // 窗口函数
  'CUME_DIST', 'DENSE_RANK', 'FIRST_VALUE', 'LAG', 'LAST_VALUE', 'LEAD', 'NTH_VALUE', 'NTILE', 'PERCENT_RANK', 'RANK', 'ROW_NUMBER',
  // 正则表达式函数
  'REGEXP_INSTR', 'REGEXP_LIKE', 'REGEXP_REPLACE', 'REGEXP_SUBSTR',
  // 字符串函数
  'ASCII', 'BIN', 'BIT_LENGTH', 'CHAR', 'CHAR_LENGTH', 'CHARACTER_LENGTH', 'CONCAT', 'CONCAT_WS', 'ELT', 'EXPORT_SET', 'FIELD', 'FIND_IN_SET', 'FORMAT', 'FROM_BASE64', 'HEX', 'INSERT', 'INSTR', 'LCASE', 'LEFT', 'LENGTH', 'LIKE', 'LOAD_FILE', 'LOCATE', 'LOWER', 'LPAD', 'LTRIM', 'MAKE_SET', 'MATCH', 'MID', 'OCT', 'OCTET_LENGTH', 'ORD', 'POSITION', 'QUOTE', 'REPEAT', 'REPLACE', 'REVERSE', 'RIGHT', 'RLIKE', 'RPAD', 'RTRIM', 'SOUNDEX', 'SPACE', 'STRCMP', 'SUBSTR', 'SUBSTRING', 'SUBSTRING_INDEX', 'TO_BASE64', 'TRIM', 'UCASE', 'UNHEX', 'UPPER', 'WEIGHT_STRING',
  // 锁函数
  'GET_LOCK', 'IS_FREE_LOCK', 'IS_USED_LOCK', 'RELEASE_ALL_LOCKS', 'RELEASE_LOCK',
  // 信息函数
  'BENCHMARK', 'CHARSET', 'COERCIBILITY', 'COLLATION', 'CONNECTION_ID', 'CURRENT_ROLE', 'CURRENT_USER', 'DATABASE', 'FOUND_ROWS', 'LAST_INSERT_ID', 'LAST_QUERY_ID', 'ROW_COUNT', 'SCHEMA', 'SESSION_USER', 'SYSTEM_USER', 'USER', 'VERSION',
  // XML 函数
  'ExtractValue', 'UpdateXML',
  // 空间函数 (部分常用)
  'ST_AsBinary', 'ST_AsGeoJSON', 'ST_AsText', 'ST_Buffer', 'ST_Centroid', 'ST_Contains', 'ST_ConvexHull', 'ST_Crosses', 'ST_Difference', 'ST_Dimension', 'ST_Disjoint', 'ST_Distance', 'ST_EndPoint', 'ST_Envelope', 'ST_Equals', 'ST_ExteriorRing', 'ST_GeoHash', 'ST_GeomCollFromText', 'ST_GeometryFromText', 'ST_GeometryN', 'ST_GeometryType', 'ST_InteriorRingN', 'ST_Intersection', 'ST_Intersects', 'ST_IsClosed', 'ST_IsEmpty', 'ST_IsSimple', 'ST_IsValid', 'ST_LatFromGeoHash', 'ST_Length', 'ST_LineFromText', 'ST_LongFromGeoHash', 'ST_MakeEnvelope', 'ST_MLineFromText', 'ST_MPointFromText', 'ST_MPolyFromText', 'ST_NumGeometries', 'ST_NumInteriorRings', 'ST_NumPoints', 'ST_Overlaps', 'ST_PointFromGeoHash', 'ST_PointFromText', 'ST_PointN', 'ST_PolyFromText', 'ST_Simplify', 'ST_StartPoint', 'ST_SymDifference', 'ST_Touches', 'ST_Union', 'ST_Within', 'ST_X', 'ST_Y',
  // 其他实用函数
  'ANY_VALUE', 'DEFAULT', 'INET_ATON', 'INET_NTOA', 'INET6_ATON', 'INET6_NTOA', 'IS_IPV4', 'IS_IPV6', 'IS_UUID', 'NAME_CONST', 'SLEEP', 'UUID', 'UUID_TO_BIN', 'BIN_TO_UUID', 'VALUES'
]);

// MySQL 8.4 属性关键字
const MYSQL_ATTRIBUTES = new Set([
  // 列属性
  'UNSIGNED', 'ZEROFILL', 'BINARY', 'CHARACTER', 'CHARSET', 'COLLATE',
  // 约束属性
  'DEFAULT', 'AUTO_INCREMENT', 'UNIQUE', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CHECK', 'CONSTRAINT',
  // 生成列属性
  'GENERATED', 'ALWAYS', 'VIRTUAL', 'STORED',
  // 可见性属性
  'INVISIBLE', 'VISIBLE',
  // 索引属性
  'INDEX', 'COMMENT', 'ASC', 'DESC',
  // 其他
  'NULL', 'NOT', 'ON', 'DELETE', 'UPDATE', 'CASCADE', 'RESTRICT', 'SET', 'NO', 'ACTION'
]);

// MySQL 8.4 特殊字面量
const MYSQL_LITERALS = new Set([
  'NULL', 'TRUE', 'FALSE', 'UNKNOWN',
  'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'LOCALTIME', 'LOCALTIMESTAMP',
  'CURRENT_USER', 'CURRENT_ROLE'
]);

// ============================================================================
// 颜色配置 - 丰富多彩的颜色方案 (VS Code 风格)
// ============================================================================

const COLORS: Record<TokenType, string | undefined> = {
  plain: undefined,       // 继承父元素颜色
  keyword: '#569cd6',     // 蓝色 - 关键字 (SELECT, FROM, WHERE)
  type: '#ff79c6',        // 粉色 - 数据类型 (INT, VARCHAR)
  function: '#dcdcaa',    // 黄色 - 函数 (COUNT, MAX)
  operator: '#c586c0',    // 紫色 - 运算符 (=, AND, OR)
  string: '#ce9178',      // 橙色 - 字符串
  number: '#4ec9b0',      // 青色 - 数字
  comment: '#6a9955',     // 绿色 - 注释
  variable: '#9cdcfe',    // 浅蓝 - 变量 (@var)
  attribute: '#d4a5a5',   // 浅紫 - 属性 (UNSIGNED, AUTO_INCREMENT)
};

// ============================================================================
// 工具函数
// ============================================================================

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

function isIdentifierStart(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_' || ch === '$';
}

function isIdentifierChar(ch: string): boolean {
  return isIdentifierStart(ch) || isDigit(ch);
}

// ============================================================================
// Tokenizer
// ============================================================================

function tokenizeLine(line: string, lang: string): Token[] {
  const isSQL = ['sql', 'mysql', 'postgresql', 'postgres', 'sqlite', 'oracle', 'mssql', 'tsql'].includes(lang.toLowerCase());
  return isSQL ? tokenizeSQLLine(line) : tokenizeGenericLine(line, lang);
}

function tokenizeSQLLine(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = line.length;

  while (i < len) {
    const ch = line[i];

    // 处理 # 风格注释 (MySQL 支持)
    if (ch === '#') {
      const commentText = line.substring(i);
      tokens.push({ type: 'comment', text: commentText });
      break;
    }

    // 处理 -- 风格注释 (-- 后必须跟空格才是注释)
    if (ch === '-' && i + 1 < len && line[i + 1] === '-') {
      // 检查 -- 后是否是空白字符
      if (i + 2 >= len || line[i + 2] === ' ' || line[i + 2] === '\t') {
        const commentText = line.substring(i);
        tokens.push({ type: 'comment', text: commentText });
        break;
      }
    }

    // 处理 /* */ 风格块注释
    if (ch === '/' && i + 1 < len && line[i + 1] === '*') {
      let comment = '/*';
      i += 2;
      while (i < len - 1) {
        if (line[i] === '*' && line[i + 1] === '/') {
          comment += '*/';
          i += 2;
          break;
        }
        comment += line[i];
        i++;
      }
      tokens.push({ type: 'comment', text: comment });
      continue;
    }

    // 处理单引号字符串
    if (ch === "'") {
      let str = ch;
      i++;
      let escaped = false;
      while (i < len) {
        const nextCh = line[i];
        str += nextCh;
        if (escaped) {
          escaped = false;
        } else if (nextCh === "'") {
          // SQL 中使用两个单引号表示转义
          if (i + 1 < len && line[i + 1] === "'") {
            escaped = true;
          } else {
            i++;
            break;
          }
        }
        i++;
      }
      tokens.push({ type: 'string', text: str });
      continue;
    }

    // 处理双引号字符串 (某些 SQL 方言)
    if (ch === '"') {
      let str = ch;
      i++;
      while (i < len) {
        const nextCh = line[i];
        str += nextCh;
        if (nextCh === '"') {
          i++;
          break;
        }
        i++;
      }
      tokens.push({ type: 'string', text: str });
      continue;
    }

    // 处理反引号标识符 (MySQL 风格)
    if (ch === '`') {
      let ident = ch;
      i++;
      while (i < len) {
        const nextCh = line[i];
        ident += nextCh;
        if (nextCh === '`') {
          i++;
          break;
        }
        i++;
      }
      tokens.push({ type: 'plain', text: ident });
      continue;
    }

    // 处理 MySQL 变量 (@var 和 @@var)
    if (ch === '@') {
      let varName = ch;
      i++;
      // 支持 @@session.var 或 @@global.var 格式
      if (i < len && line[i] === '@') {
        varName += line[i];
        i++;
      }
      // 继续读取变量名
      while (i < len && (isIdentifierChar(line[i]) || line[i] === '.')) {
        varName += line[i];
        i++;
      }
      tokens.push({ type: 'variable', text: varName });
      continue;
    }

    // 处理问号占位符 (预处理语句)
    if (ch === '?') {
      tokens.push({ type: 'variable', text: ch });
      i++;
      continue;
    }

    // 处理标识符 (关键字、类型、函数、属性)
    if (isIdentifierStart(ch)) {
      let ident = ch;
      i++;
      while (i < len && isIdentifierChar(line[i])) {
        ident += line[i];
        i++;
      }

      const upperIdent = ident.toUpperCase();

      // 检查是否为特殊字面量
      if (MYSQL_LITERALS.has(upperIdent)) {
        tokens.push({ type: 'keyword', text: ident });
        continue;
      }

      // 检查是否为关键字
      if (MYSQL_KEYWORDS.has(upperIdent)) {
        tokens.push({ type: 'keyword', text: ident });
        continue;
      }

      // 检查是否为数据类型
      if (MYSQL_TYPES.has(upperIdent)) {
        tokens.push({ type: 'type', text: ident });
        continue;
      }

      // 检查是否为属性关键字
      if (MYSQL_ATTRIBUTES.has(upperIdent)) {
        tokens.push({ type: 'attribute', text: ident });
        continue;
      }

      // 检查是否为函数 (需要检查后面是否跟 '(')
      if (MYSQL_BUILTIN_FUNCTIONS.has(upperIdent)) {
        // 向后查找，跳过空白字符
        let j = i;
        while (j < len && (line[j] === ' ' || line[j] === '\t')) {
          j++;
        }
        if (j < len && line[j] === '(') {
          tokens.push({ type: 'function', text: ident });
        } else {
          tokens.push({ type: 'plain', text: ident });
        }
        continue;
      }

      // 普通标识符
      tokens.push({ type: 'plain', text: ident });
      continue;
    }

    // 处理数字 (包括小数和科学计数法)
    if (isDigit(ch) || (ch === '.' && i + 1 < len && isDigit(line[i + 1]))) {
      let num = ch;
      i++;
      let hasDot = ch === '.';
      let hasExp = false;

      while (i < len) {
        const nextCh = line[i];
        if (isDigit(nextCh)) {
          num += nextCh;
          i++;
        } else if (nextCh === '.' && !hasDot && !hasExp) {
          num += nextCh;
          hasDot = true;
          i++;
        } else if ((nextCh === 'e' || nextCh === 'E') && !hasExp) {
          // 科学计数法
          const nextNextCh = line[i + 1];
          if (nextNextCh && (isDigit(nextNextCh) || nextNextCh === '+' || nextNextCh === '-')) {
            num += nextCh;
            i++;
            if (line[i] === '+' || line[i] === '-') {
              num += line[i];
              i++;
            }
            hasExp = true;
          } else {
            break;
          }
        } else {
          break;
        }
      }
      tokens.push({ type: 'number', text: num });
      continue;
    }

    // 处理多字符运算符 (优先匹配长的)
    const threeChar = line.substring(i, i + 3);
    const twoChar = line.substring(i, i + 2);

    if (threeChar === '<=>' || threeChar === '<<=' || threeChar === '>>=') {
      tokens.push({ type: 'operator', text: threeChar });
      i += 3;
      continue;
    }

    if (twoChar === '<=' || twoChar === '>=' || twoChar === '<>' || twoChar === '!=' ||
        twoChar === '||' || twoChar === ':=' || twoChar === '->' || twoChar === '>>' ||
        twoChar === '<<' || twoChar === '&=' || twoChar === '|=' || twoChar === '^=' ||
        twoChar ==='+=' || twoChar === '-=' || twoChar === '*=' || twoChar === '/=' ||
        twoChar === '%=') {
      tokens.push({ type: 'operator', text: twoChar });
      i += 2;
      continue;
    }

    // 处理单字符运算符
    if ('=<>!+-*/%&|^~:;.,()[]{}'.includes(ch)) {
      tokens.push({ type: 'operator', text: ch });
      i++;
      continue;
    }

    // 其他字符作为普通文本
    tokens.push({ type: 'plain', text: ch });
    i++;
  }

  return tokens;
}

function tokenizeGenericLine(line: string, lang: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = line.length;
  const isHashComment = ['python', 'shell', 'bash', 'sh', 'ruby', 'perl'].includes(lang.toLowerCase());

  while (i < len) {
    const ch = line[i];

    // 处理字符串
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

    // 处理 // 注释
    if (ch === '/' && i + 1 < len && line[i + 1] === '/') {
      const commentText = line.substring(i);
      tokens.push({ type: 'comment', text: commentText });
      break;
    }

    // 处理 # 注释
    if (ch === '#' && isHashComment) {
      const commentText = line.substring(i);
      tokens.push({ type: 'comment', text: commentText });
      break;
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

    // 处理标识符
    if (isIdentifierStart(ch)) {
      let ident = ch;
      i++;
      while (i < len && isIdentifierChar(line[i])) {
        ident += line[i];
        i++;
      }
      // 检查是否为函数
      let j = i;
      while (j < len && (line[j] === ' ' || line[j] === '\t')) {
        j++;
      }
      if (j < len && line[j] === '(') {
        tokens.push({ type: 'function', text: ident });
      } else {
        tokens.push({ type: 'plain', text: ident });
      }
      continue;
    }

    // 其他字符
    tokens.push({ type: 'plain', text: ch });
    i++;
  }

  return tokens;
}

// ============================================================================
// 渲染函数
// ============================================================================

function renderToken(token: Token, key: number): React.ReactNode {
  const color = COLORS[token.type];
  if (color) {
    return <span key={key} style={{ color }}>{token.text}</span>;
  }
  return <React.Fragment key={key}>{token.text}</React.Fragment>;
}

export function highlightCode(code: string, lang: string): React.ReactNode {
  let cleaned = decodeHtmlEntities(code);
  cleaned = stripHtmlTags(cleaned);
  const lines = cleaned.split('\n');

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
