# 🏰 Wasteland Castle (荒原城堡)

**"吸血鬼幸存者的塔防版"** - 一款结合Roguelike、策略和战斗爽快感的横版卷轴游戏

[![游戏状态](https://img.shields.io/badge/状态-开发中-yellow)](https://github.com/h2038766617-del/Wasteland-Castle)
[![质量标准](https://img.shields.io/badge/质量-发布级别-green)](./docs/GUIDING_PRINCIPLES.md)

---

## 🎮 游戏概念

在荒原中驾驶你的移动城堡，通过**随机生成的组件**构建防御系统，击败一波又一波的敌人。

### 核心玩法
- 🎲 **Roguelike组件系统** - 每次游戏都有不同的组件选择
- 🧩 **策略性摆放** - 网格系统和邻接加成，布局决定胜负
- ⚔️ **爽快自动战斗** - 炮塔自动攻击，观赏性强

### 核心循环
```
安全屋 → 购买随机组件 → 策略摆放 → 进入战斗 → 获得奖励 → 回到安全屋 → ...
```

---

## ⚡ 快速开始

### 运行游戏

```bash
# 克隆仓库
git clone https://github.com/h2038766617-del/Wasteland-Castle.git
cd Wasteland-Castle

# 启动本地服务器（任选其一）
python -m http.server 8000
# 或
./START_SERVER.sh

# 打开浏览器访问
http://localhost:8000
```

**详细运行指南**: 参见 [README_如何运行.md](./README_如何运行.md)

### 操作说明

| 操作 | 说明 |
|------|------|
| **鼠标移动** | 在安全屋状态可点击UI；战斗状态移动光标采集资源 |
| **左键点击** | 购买商品、拖拽组件 |
| **右键点击** | 锁定商店商品（刷新时保留） |
| **Space** | 从安全屋出发 / 暂停战斗 |
| **D** | 切换调试信息 |
| **H** | 显示帮助 |
| **R** | 重启游戏 |

---

## 📚 文档导航

### 🎯 核心文档
- **[核心指导思想](./docs/GUIDING_PRINCIPLES.md)** ⭐ 必读 - 项目的"宪法"
- **[游戏设计文档](./docs/DESIGN_DOC.md)** - 游戏机制和玩法设计
- **[开发指南](./docs/DEV_GUIDE.md)** - 开发流程和规范
- **[测试清单](./docs/TESTING_CHECKLIST.md)** - 质量保证清单
- **[架构文档](./docs/ARCHITECTURE.md)** - 代码结构和技术架构

### 📖 其他文档
- **[文档索引](./docs/DOCUMENTATION_INDEX.md)** - 完整文档列表
- **[已知问题](./docs/issues/KNOWN_ISSUES.md)** - 当前已知问题和计划
- **[修复历史](./docs/issues/FIX_HISTORY.md)** - 重要修复记录

---

## 🎯 游戏特色

### 1. Roguelike组件系统
- 每次游戏商店随机生成组件
- 4种品质：普通(70%) / 罕见(20%) / 稀有(8%) / 史诗(2%)
- 4种类型：核心(CORE) / 武器(WEAPON) / 护甲(ARMOR) / 增幅(BOOSTER)
- 不同组合产生不同玩法

### 2. 策略摆放与邻接加成
- 5×5网格系统
- 组件邻接产生额外加成
- 核心组件必须存活才能继续战斗
- 布局决定强度

### 3. 横版卷轴战斗
- 载具自动向右前进
- 炮塔自动攻击敌人
- 光标采集资源和障碍物
- 爽快的打击反馈

### 4. 安全屋整备
- 战斗间隙回到安全屋
- 商店购买新组件（Roguelike随机性）
- 修复受损组件
- 调整载具布局

---

## 🛠️ 技术栈

- **引擎**: 纯JavaScript + HTML5 Canvas
- **架构**: 组件-系统架构(Component-System)
- **模块化**: ES6 Modules
- **无依赖**: 不使用任何外部库

### 项目结构

```
Wasteland-Castle/
├── index.html              # 游戏入口
├── src/
│   ├── main.js            # 游戏主循环
│   ├── entities/          # 实体类（组件、敌人等）
│   ├── systems/           # 系统类（战斗、商店等）
│   ├── ui/                # UI系统（拖拽、Canvas等）
│   ├── config/            # 配置和常量
│   └── factories/         # 工厂类
├── docs/                  # 文档目录
└── README.md             # 本文件
```

**详细架构**: 参见 [ARCHITECTURE.md](./docs/ARCHITECTURE.md)

---

## 🎮 当前游戏状态

### ✅ 已完成功能
- [x] 基础Canvas渲染系统
- [x] 组件系统和网格管理
- [x] 商店系统（随机生成、购买、刷新、锁定）
- [x] 拖拽系统（组件放置、仓库管理）
- [x] 修复系统（组件维修）
- [x] 战斗系统（敌人生成、碰撞检测、波次管理）
- [x] 武器系统（自动攻击、子弹系统）
- [x] 资源系统（采集、掉落）
- [x] 障碍物系统
- [x] 光标显示和状态切换（SAFEHOUSE/JOURNEY）
- [x] 邻接加成系统
- [x] 视觉效果（粒子、伤害数字）

### 🚧 待完善功能
参见 [已知问题列表](./docs/issues/KNOWN_ISSUES.md)

### 🎯 MVP目标
玩家能完成完整游戏循环：
```
启动游戏 → 购买组件 → 摆放组件 → 进入战斗 → 击败敌人 → 回到安全屋 → 继续游戏
```

---

## 🤝 开发规范

### 核心原则

1. **质量至上** - 每次提交都是发布级别的质量
2. **谨慎迭代** - 只改少量问题，充分测试
3. **问题即停** - 发现问题立即停止并修复
4. **冒烟测试强制** - 每次提交前必须通过测试清单

详见 [核心指导思想](./docs/GUIDING_PRINCIPLES.md)

### 提交前检查清单

```
✅ 游戏能正常启动？
✅ 光标可见且能点击？
✅ 核心功能能正常使用？
✅ 能完成一轮完整游戏流程？
✅ 没有引入新的bug？
✅ 代码有适当注释？
```

---

## 📊 项目状态

- **开发阶段**: Alpha（核心功能开发）
- **代码质量**: 高质量标准
- **测试状态**: 手动测试
- **发布计划**: TBD

---

## 📝 版本历史

### v0.15 - 当前版本
- 修复光标显示问题（SAFEHOUSE/JOURNEY状态切换）
- 优化商店经济平衡（初始金币150，价格降低40%）
- 完善文档体系

### 历史版本
参见 [修复历史](./docs/issues/FIX_HISTORY.md)

---

## 🔗 相关链接

- **GitHub仓库**: https://github.com/h2038766617-del/Wasteland-Castle
- **核心指导思想**: [docs/GUIDING_PRINCIPLES.md](./docs/GUIDING_PRINCIPLES.md)
- **完整文档**: [docs/DOCUMENTATION_INDEX.md](./docs/DOCUMENTATION_INDEX.md)

---

## 📄 License

TBD

---

## 🙏 致谢

灵感来源：
- 《吸血鬼幸存者》 - Roguelike核心循环
- 经典塔防游戏 - 策略摆放和自动战斗

---

**Enjoy the game! 🎮**

如有问题或建议，请查看 [文档索引](./docs/DOCUMENTATION_INDEX.md) 或提交 Issue。
