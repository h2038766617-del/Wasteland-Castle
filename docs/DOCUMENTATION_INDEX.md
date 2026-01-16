# 📚 Wasteland Castle - 文档索引

**最后更新**: 2026-01-12

---

## 📖 文档分类

### 🎯 核心文档（必读）

| 文档 | 描述 | 状态 |
|------|------|------|
| [README.md](../README.md) | 项目概述、快速开始 | ✅ 已完成 |
| [GUIDING_PRINCIPLES.md](./GUIDING_PRINCIPLES.md) | 核心指导思想（项目"宪法"）| ✅ 已完成 ⭐ |
| [DESIGN_DOC.md](./DESIGN_DOC.md) | 游戏设计文档（不涉及代码）| ✅ 已完成 |
| [DEV_GUIDE.md](./DEV_GUIDE.md) | 开发指南和规范 | ✅ 已完成 |
| [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) | 测试清单 | ✅ 已完成 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 系统架构和代码结构 | ✅ 已完成 |

### 🎮 用户文档

| 文档 | 描述 | 状态 |
|------|------|------|
| [../README_如何运行.md](../README_如何运行.md) | 运行指南 | ✅ 已存在 |
| [DESIGN_DOC.md](./DESIGN_DOC.md) | 游戏玩法和机制（设计文档）| ✅ 已完成 |

### 🔧 技术文档

| 文档 | 描述 | 状态 |
|------|------|------|
| [API_REFERENCE.md](./API_REFERENCE.md) | API参考文档 | ⏰ 待定 |
| [COMPONENT_SYSTEM.md](./COMPONENT_SYSTEM.md) | 组件系统详解 | ⏰ 待定 |
| [GAME_LOOP.md](./GAME_LOOP.md) | 游戏循环和更新机制 | ⏰ 待定 |

### 🐛 问题和修复

| 文档 | 描述 | 状态 |
|------|------|------|
| [KNOWN_ISSUES.md](./issues/KNOWN_ISSUES.md) | 已知问题汇总 | ✅ 已完成 |
| [FIX_HISTORY.md](./issues/FIX_HISTORY.md) | 修复历史 | ✅ 已完成 |
| [../CRITICAL_FIX_CURSOR.md](../CRITICAL_FIX_CURSOR.md) | 光标修复分析 | ✅ 已存在 |
| [../SHOP_ANALYSIS.md](../SHOP_ANALYSIS.md) | 商店系统分析 | ✅ 已存在 |

### 📋 检查报告（历史）

以下文档为历史检查记录，已归档：

- CHECK_STEP1.md ~ CHECK_STEP13.md
- STEP10_CODE_CHECK.md ~ STEP13_CODE_CHECK.md
- BASIC_FUNCTION_CHECK.md
- CODE_CHECK_REPORT.md
- FINAL_VERIFICATION.md

**归档位置**: `docs/archive/`

### 📝 规划文档（历史）

以下文档为历史规划记录，已归档：

- DEVELOPMENT_PLAN.md
- ITERATION_PLAN_V2.md
- IMPROVEMENT_PLAN.md
- VISUAL_FIX_PLAN.md
- MasterPlan.txt

**归档位置**: `docs/archive/plans/`

### 🔍 分析文档（历史）

以下文档为历史分析记录，已归档：

- CORE_FLOW_ANALYSIS.md
- CORE_ISSUES.md
- CORE_PROBLEM_FOUND.md
- CRITICAL_BUG_FOUND.md
- FOUND_ISSUES.md
- GAMEPLAY_PROBLEMS.md
- GAMEPLAY_SIMULATION.md
- MISSING_CORE_LOOP.md

**归档位置**: `docs/archive/analysis/`

---

## 🗂️ 文档目录结构

```
Wasteland-Castle/
├── README.md                          # 项目主文档
├── README_如何运行.md                  # 快速运行指南
├── docs/                              # 文档根目录
│   ├── DOCUMENTATION_INDEX.md         # 📍 当前文件
│   ├── ARCHITECTURE.md                # 架构文档
│   ├── DEV_GUIDE.md                   # 开发指南
│   ├── TESTING_CHECKLIST.md           # 测试清单
│   ├── WORKFLOW.md                    # 工作流程
│   ├── USER_MANUAL.md                 # 用户手册
│   ├── GAMEPLAY.md                    # 游戏玩法
│   ├── issues/                        # 问题追踪
│   │   ├── KNOWN_ISSUES.md            # 已知问题
│   │   ├── FIX_HISTORY.md             # 修复历史
│   │   └── ...                        # 其他问题文档
│   ├── archive/                       # 历史文档归档
│   │   ├── checks/                    # 检查报告
│   │   ├── plans/                     # 规划文档
│   │   └── analysis/                  # 分析文档
│   └── technical/                     # 深度技术文档
│       ├── API_REFERENCE.md
│       ├── COMPONENT_SYSTEM.md
│       └── GAME_LOOP.md
├── CRITICAL_FIX_CURSOR.md             # 重要修复文档（保留在根目录）
└── SHOP_ANALYSIS.md                   # 商店分析文档（保留在根目录）
```

---

## 📚 文档使用指南

### 🆕 新开发者

1. 阅读 `README.md` - 了解项目概况
2. 阅读 `ARCHITECTURE.md` - 理解代码结构
3. 阅读 `DEV_GUIDE.md` - 学习开发规范
4. 阅读 `TESTING_CHECKLIST.md` - 掌握测试流程
5. 阅读 `WORKFLOW.md` - 学习工作流程

### 🐛 修复问题

1. 查看 `KNOWN_ISSUES.md` - 确认问题是否已知
2. 查看 `FIX_HISTORY.md` - 参考类似问题的修复方法
3. 遵循 `WORKFLOW.md` - 按照规范流程修复
4. 更新 `TESTING_CHECKLIST.md` - 验证修复

### 🎮 游戏设计

1. 阅读 `USER_MANUAL.md` - 了解当前游戏体验
2. 阅读 `GAMEPLAY.md` - 理解游戏机制
3. 查看 `issues/KNOWN_ISSUES.md` - 了解待改进点

### 📖 查找文档

使用本文档顶部的**分类表格**或**目录结构**快速定位所需文档。

---

## ✅ 文档质量标准

所有新文档必须满足：

- ✅ 有清晰的标题和目录
- ✅ 有"最后更新"日期
- ✅ 有实例和代码示例
- ✅ 有清晰的分类和结构
- ✅ 使用Markdown格式
- ✅ 包含emoji增强可读性
- ✅ 避免过时信息

---

## 🔄 文档维护

### 更新频率

- **核心文档**: 每次重大修改后更新
- **问题文档**: 发现问题后立即更新
- **历史文档**: 不再更新，保持归档

### 归档原则

当文档满足以下条件时应归档：

- 内容已过时且不再适用
- 已被新文档替代
- 属于历史记录（检查报告、旧规划等）

### 删除原则

**不轻易删除文档**，优先选择归档。只删除：

- 重复的文档
- 完全无价值的临时文件
- 错误创建的文档

---

## 📞 文档问题反馈

如果发现文档问题：

1. 检查 `KNOWN_ISSUES.md` 中的文档问题
2. 提交Issue说明问题
3. 或直接修改文档并提交PR

---

**文档即代码 - 好的文档让开发更高效！**
