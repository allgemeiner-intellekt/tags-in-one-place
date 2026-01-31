---
tags:
  - 工具/obsidian/插件
---
# Tags in One Place 开发追踪与计划 (Living Doc)

本文件用于持续追踪仓库当前状态、已修复问题、遗留问题与后续计划；不是一次性的“性能报告”。

**最后核对日期**: 2026-01-31  
**核对范围**: 静态代码阅读（不含运行时性能实测）  
**仓库快照**: `52a5d95`（短 SHA）  
**插件版本号 (manifest.json)**: 1.0.0

---

## 1. 当前功能与行为 (以仓库代码为准)

### 1.1 插件目的
收集 vault 内所有 Markdown 文件的标签，并写入一个统一的索引文件（默认 `Tags.md`）。

### 1.2 当前实现的功能
- **手动触发**: 命令面板运行 "Update tag index"（`src/main.ts`）
- **标签收集**: 基于 `metadataCache.getFileCache` + `getAllTags`（`src/tag-collector.ts`）
- **排除输出文件**: 收集时显式排除目标索引文件，避免“自污染”（`src/main.ts` -> `src/tag-collector.ts`）
- **分批异步扫描**: 每批处理后 `await` 让出一帧，降低 UI 卡顿风险（`src/tag-collector.ts`）
- **进度提示**: 更新中持续显示 `processed/total`，结束后显示耗时和结果（`src/main.ts`）
- **写入优化**: 写入前比较内容，忽略时间戳行差异；无变化则跳过写盘（`src/file-writer.ts`）
- **设置保存防抖**: 输入目标路径后 400ms 防抖保存，降低频繁写盘（`src/settings.ts`）

### 1.3 当前输出格式（概览）
```markdown
# Tag Index

Last updated: 01/31/2026, 10:00 PM

## All Tags (N)

- #tag1
- #tag2
```

---

## 2. 代码结构快照

### 2.1 项目结构
```
src/
├── main.ts           # 插件入口：命令注册、设置加载/保存、串联模块、进度/结果通知
├── settings.ts       # 设置 UI：目标路径；保存防抖
├── tag-collector.ts  # 异步分批扫描：从 metadata cache 提取 tags；支持排除路径 + 进度回调
├── file-writer.ts    # 写入器：创建/修改；内容相同则跳过写盘（忽略时间戳行）
└── formatter.ts      # 输出格式化：标题 + 时间戳 + tag 列表
```

### 2.2 数据流 (当前实现)
```
用户触发命令
    ↓
main.updateTagIndex()
    ↓
TagCollector.collectAllTags({ excludePaths, onProgress })
    ↓ 返回 { tags, totalFiles, excludedFiles, filesWithCache, ... }
Formatter.formatTagIndex(tags)
    ↓ 返回 markdown string
FileWriter.writeToFile(path, content)
    ↓ 返回 "created" | "modified" | "skipped"
Notice 展示：进度 → 结果/耗时 + cache 缺失提示
```

---

## 3. 已修复/已缓解的问题（对照上一阶段报告）

### 3.1 P0.1 索引文件自污染（正确性问题）- 已修复
上一阶段风险：扫描范围包含索引文件本身，导致标签“无法被移除”。  
当前实现：`main.updateTagIndex()` 传入 `excludePaths: [targetPath]`，收集器跳过该文件路径。

### 3.2 P1.1 同步阻塞导致 UI 卡顿 - 已修复
上一阶段风险：`collectAllTags()` 同步遍历全库，可能卡死 UI。  
当前实现：`collectAllTags()` 为 `async`，并按 `batchSize` 分批处理，批次间 `await requestAnimationFrame(...)` 让出事件循环。

### 3.3 P3.3 缺少运行中反馈 - 已修复
当前实现：更新过程中持续更新 Notice（带节流），结束后展示耗时与结果（created/updated/skipped）。

### 3.4 P3.1 设置保存频率过高 - 已修复
当前实现：设置输入采用 400ms debounce 后才调用 `saveSettings()`，减少频繁写盘。

### 3.5 P1.2 全量重写文件 - 部分缓解
当前实现：写入前会读取旧内容并比较（忽略 `Last updated:` 行），无变化则返回 `skipped`。  
限制：一旦内容变化，仍然是整文件 `modify`（非增量 patch）。

### 3.6 Q2 loadData 类型断言风险 - 已改善
当前实现：`loadSettings()` 对 `loadData()` 返回值做 `unknown` + 类型判断，避免直接断言导致的运行时崩溃。

---

## 4. 仍然存在的问题与风险（按优先级）

### 4.1 P0/P1：可能影响正确性或导致用户明显失败

#### 4.1.1 多级父目录创建不确定（可能导致写入失败）
`FileWriter` 只对 `folderPath` 调用一次 `createFolder(folderPath)`。  
如果 Obsidian API 不支持自动递归创建中间目录，则路径如 `a/b/c/Tags.md` 在 `a`、`a/b` 不存在时可能失败。

#### 4.1.2 目标路径缺少严格校验/规范化策略（健壮性）
目前仅做了 `trim + normalizePath`（主逻辑）与 `trim + normalizePath`（excludePaths）。  
仍缺少对以下输入的明确策略：`..`、非法字符、以 `/` 结尾、Windows 反斜杠输入、空路径等。

#### 4.1.3 metadata cache 缺失导致标签“少收集”仍未根治
收集仍然依赖 `metadataCache.getFileCache(file)`。  
当前已有“缺失数量提示”，但没有等待 cache 就绪、重试、或提供“可能不完整”的显式确认流程。

### 4.2 P2/P3：体验与一致性问题

#### 4.2.1 缺少 `onunload()`
当前没有实现 `onunload()`。现阶段没有显式注册事件监听/定时器，风险不高；但未来如果增加监听/定时任务，需要确保清理逻辑。

#### 4.2.2 时间戳固定为 `en-US`
格式化器使用 `toLocaleString("en-US", ...)`，未跟随系统语言/用户设置。

#### 4.2.3 排序规则仍为默认 `.sort()`
仍然是 JS 默认字典序排序（大小写敏感、非 locale-aware），可能出现不符合直觉的顺序。

#### 4.2.4 标签行未生成显式链接格式
当前输出为 `- #tag` 文本行；如果希望“强制可点击/可跳转”的一致行为，可能需要输出 `[[#tag]]` 或搜索链接等格式（取决于产品设计）。

### 4.3 Q：仓库元数据一致性

#### 4.3.1 package.json 仍为 sample 元数据
`package.json` 的 `name` / `description` 仍是 Obsidian sample plugin 的默认值，与 `manifest.json` 的插件信息不一致。

---

## 5. 后续计划（建议路线图）

### P0（避免失败/正确性）
- 明确并实现“递归创建父目录”的策略（或在文档中声明不支持多级目录）
- 补齐目标路径校验：空值、非法字符、`..`、尾随 `/`、反斜杠等

### P1（可靠性/性能）
- 针对 metadata cache 缺失：提供可选“等待 cache 构建完成后再运行”或“重试 N 次”的策略
- 评估 `batchSize` 是否需要暴露为设置项（大 vault 适配）
- 新增设置：排除特定文件夹（不扫描这些文件夹内的 markdown 文件；基于路径前缀/父目录判断）

### P2/P3（体验）
- 时间戳本地化（默认跟随系统语言，或提供设置项）
- 排序改为 `localeCompare`（可选忽略大小写）
- 标签显示策略：明确是否需要 `[[#tag]]` 或搜索链接
- 新增设置：多层 tag 显示优化（将 `#a/b/c` 渲染为树状/缩进列表；可选开关保持平铺模式）

### Q（维护性）
- 更新 `package.json` 元数据，与插件实际名称/描述一致

---

## 6. 手动验证清单（行为改动时必做）
1) `npm run dev`  
2) 在 Obsidian 中 reload 插件或重启 Obsidian  
3) 运行命令："Update tag index"  
4) 验证输出文件是否更新；删除某个标签后再次运行，确认索引可收敛（不再“自污染回收”）
