# 🏗️ 架构文档

**项目**: Wasteland Castle
**最后更新**: 2026-01-12
**文档类型**: 技术架构和代码结构

---

## 📖 概述

本文档描述项目的技术架构、代码组织和主要系统的设计。

### 技术栈

- **语言**: JavaScript (ES6+)
- **渲染**: HTML5 Canvas
- **模块化**: ES6 Modules
- **依赖**: 无外部库（纯原生实现）

### 架构模式

**组件-系统架构 (Component-System Architecture)**

```
实体(Entity) = 数据容器
  ↓
组件(Component) = 具体的游戏对象
  ↓
系统(System) = 处理逻辑的模块
  ↓
主循环(Game Loop) = 协调所有系统
```

---

## 📁 项目结构

```
Wasteland-Castle/
├── index.html                 # 游戏入口
├── README.md                  # 项目说明
├── docs/                      # 文档目录
│   ├── GUIDING_PRINCIPLES.md
│   ├── DESIGN_DOC.md
│   ├── DEV_GUIDE.md
│   ├── TESTING_CHECKLIST.md
│   └── ARCHITECTURE.md (本文档)
│
├── src/                       # 源代码
│   ├── main.js               # 游戏主类和循环
│   │
│   ├── config/               # 配置和常量
│   │   ├── Constants.js      # 全局常量
│   │   └── ...
│   │
│   ├── entities/             # 实体类
│   │   ├── Component.js      # 组件实体
│   │   ├── Enemy.js          # 敌人实体
│   │   ├── SafeHouse.js      # 安全屋实体
│   │   └── DroneCursor.js    # 光标实体
│   │
│   ├── systems/              # 系统类
│   │   ├── EnemySystem.js    # 敌人系统
│   │   ├── WeaponSystem.js   # 武器系统
│   │   ├── CollisionSystem.js # 碰撞系统
│   │   ├── ShopSystem.js     # 商店系统
│   │   ├── RepairSystem.js   # 修复系统
│   │   ├── ResourceSystem.js # 资源系统
│   │   ├── ObstacleSystem.js # 障碍物系统
│   │   ├── ScrollSystem.js   # 滚动系统
│   │   ├── SafeHouseSystem.js # 安全屋系统
│   │   └── LevelSystem.js    # 等级系统
│   │
│   ├── ui/                   # UI系统
│   │   ├── Canvas.js         # Canvas封装
│   │   ├── DragSystem.js     # 拖拽系统
│   │   ├── GridManager.js    # 网格管理
│   │   └── ParticleSystem.js # 粒子系统
│   │
│   └── factories/            # 工厂类
│       └── ComponentFactory.js # 组件工厂
│
└── (历史文档已归档到 docs/archive/)
```

---

## 🎮 核心架构

### 游戏主循环 (main.js)

**Game类**是整个游戏的核心，负责：
- 初始化所有系统
- 运行游戏主循环
- 协调系统间通信
- 管理游戏状态

```javascript
class Game {
  constructor() {
    // 1. 初始化Canvas
    this.canvas = new Canvas();

    // 2. 初始化各个系统
    this.enemySystem = new EnemySystem();
    this.weaponSystem = new WeaponSystem();
    this.shopSystem = new ShopSystem();
    // ...

    // 3. 游戏状态
    this.gameState = 'SAFEHOUSE'; // SAFEHOUSE / JOURNEY
  }

  gameLoop(currentTime) {
    // 1. 计算deltaTime
    // 2. 更新所有系统
    // 3. 渲染画面
    // 4. 继续下一帧
  }
}
```

### 游戏状态机

```
SAFEHOUSE (安全屋整备)
  ├─ 显示商店UI
  ├─ 可拖拽组件
  ├─ 可修复组件
  ├─ 系统光标可见
  └─ 按Space → JOURNEY

JOURNEY (旅途战斗)
  ├─ 敌人生成和攻击
  ├─ 自动战斗
  ├─ 资源采集
  ├─ 游戏内光标
  └─ 完成旅途 → SAFEHOUSE
```

---

## 🧩 核心系统详解

### 1. 网格管理系统 (GridManager)

**职责**: 管理载具上的5×5网格

```javascript
class GridManager {
  constructor(gridSize) {
    this.gridSize = 5;
    this.cellSize = 70; // 每格70px
    this.components = []; // 放置的组件列表
  }

  // 核心方法
  placeComponent(component, gridX, gridY)
  removeComponent(component)
  isValidPosition(gridX, gridY)
  getComponentAt(gridX, gridY)
  calculateAdjacencyBonus()
}
```

**邻接加成计算**：
- 检查8个方向的相邻组件
- 根据组件类型应用加成
- 实时更新组件属性

### 2. 商店系统 (ShopSystem)

**职责**: 管理商店商品和购买

```javascript
class ShopSystem {
  constructor() {
    this.shopItems = [];
    this.refreshCost = 5; // 刷新花费
    this.componentBasePrices = {
      CORE: 60,
      WEAPON: 20,
      ARMOR: 15,
      BOOSTER: 25
    };
  }

  // 核心方法
  generateRandomItem()        // 随机生成商品
  purchase(itemId, resources) // 购买商品
  refreshShop(preserveLocked) // 刷新商店
  toggleLock(itemId)          // 锁定/解锁商品
}
```

**随机生成算法**：
1. 随机选择类型（CORE/WEAPON/ARMOR/BOOSTER）
2. 随机选择品质（common 70% / uncommon 20% / rare 8% / epic 2%）
3. 计算价格 = 基础价格 × 品质倍数
4. 使用ComponentFactory创建组件

### 3. 拖拽系统 (DragSystem)

**职责**: 处理组件的拖拽和放置

```javascript
class DragSystem {
  constructor(gridManager, canvas) {
    this.gridManager = gridManager;
    this.inventoryItems = []; // 仓库组件
    this.draggedComponent = null;
    this.isDragging = false;
  }

  // 核心方法
  startDrag(component, mousePos)
  updateDrag(mousePos)
  endDrag(mousePos)
  addToInventory(component)
  removeFromInventory(component)
}
```

**拖拽流程**：
1. 点击仓库组件 → startDrag
2. 移动鼠标 → updateDrag（显示预览）
3. 松开鼠标 → endDrag
   - 有效位置 → placeComponent
   - 无效位置 → 回到仓库

### 4. 敌人系统 (EnemySystem)

**职责**: 管理敌人生成和波次

```javascript
class EnemySystem {
  constructor() {
    this.enemies = [];
    this.currentWave = 0;
    this.waveState = 'PREPARING'; // PREPARING / SPAWNING / FIGHTING / VICTORY
  }

  // 核心方法
  startWave()
  spawnEnemy()
  update(deltaTime)
  checkWaveComplete()
}
```

**波次算法**：
- 第N波: (10 + N*2) 个敌人
- HP: 50 + N*10
- 准备期: 8秒
- 总共: 10波

### 5. 武器系统 (WeaponSystem)

**职责**: 管理武器发射和子弹

```javascript
class WeaponSystem {
  constructor() {
    this.projectiles = []; // 所有子弹
  }

  // 核心方法
  fireWeapon(weapon, target, origin)
  updateProjectiles(deltaTime)
  checkCollisions(enemies)
}
```

**自动瞄准**：
- 武器自动锁定最近敌人
- 根据射程判断是否在范围内
- 根据射速控制发射间隔
- 消耗弹药(Red资源)

### 6. 碰撞系统 (CollisionSystem)

**职责**: 检测和处理碰撞

```javascript
class CollisionSystem {
  // 核心方法
  checkEnemyVehicleCollisions(enemies, gridManager)
  checkProjectileEnemyCollisions(projectiles, enemies)
  resolveCollision(enemy, component)
}
```

**碰撞检测**：
- 矩形碰撞检测（AABB）
- 敌人 vs 组件
- 子弹 vs 敌人

### 7. 资源系统 (ResourceSystem)

**职责**: 管理资源节点和采集

```javascript
class ResourceSystem {
  constructor() {
    this.resourceNodes = [];
    this.spawnInterval = 10.0; // 每10秒生成
    this.maxActiveNodes = 5;
  }

  // 核心方法
  spawnResourceNode()
  harvestResource(node, mousePos, deltaTime)
  updateResourceNodes(deltaTime, scrollSpeed)
}
```

**采集机制**：
- 光标悬停3秒自动采集
- 采集完成后资源消失
- 资源数量增加

---

## 🎨 渲染系统

### Canvas封装 (Canvas.js)

```javascript
class Canvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.resize(); // 自适应窗口
  }

  getContext() { return this.ctx; }
  getWidth() { return this.canvas.width; }
  getHeight() { return this.canvas.height; }
  clear() { /* 清空画布 */ }
}
```

### 渲染顺序

```
游戏主循环 render()
  ↓
1. 清空Canvas
  ↓
2. 应用屏幕抖动（如有）
  ↓
3. 渲染背景（网格/地面）
  ↓
4. 渲染载具（边框和组件）
  ↓
5. 渲染游戏对象
   - 敌人
   - 子弹
   - 资源节点
   - 障碍物
  ↓
6. 渲染视觉效果
   - 粒子
   - 伤害数字
   - 光标
  ↓
7. 渲染UI
   - 资源显示
   - 波次信息
   - 状态提示
  ↓
8. 渲染状态UI
   - 安全屋UI（如在SAFEHOUSE）
   - 商店UI
   - 仓库UI
  ↓
9. 渲染拖拽预览（最上层）
  ↓
10. 渲染游戏结束画面（如有）
```

**Z-Index顺序**（从底到顶）：
1. 背景
2. 载具和组件
3. 敌人和子弹
4. 视觉效果
5. UI元素
6. 拖拽预览
7. 游戏结束画面

---

## 🔄 数据流

### 游戏循环中的数据流

```
用户输入（鼠标/键盘）
  ↓
事件监听器
  ↓
Game类处理
  ↓
更新相关系统
  ↓
系统更新实体状态
  ↓
渲染系统绘制
  ↓
显示到屏幕
```

### 购买流程的数据流

```
用户点击商品
  ↓
getShopItemAtMouse() - 检测点击
  ↓
ShopSystem.purchase() - 购买逻辑
  - 检查金币
  - 扣除金币（修改resources对象）
  - 返回组件对象
  ↓
DragSystem.addToInventory() - 添加到仓库
  - 修改inventoryItems数组
  ↓
renderInventory() - 渲染更新
  ↓
用户看到仓库中的组件
```

### 战斗流程的数据流

```
敌人生成
  ↓
EnemySystem.enemies数组
  ↓
武器系统检测敌人
  ↓
发射子弹
  ↓
WeaponSystem.projectiles数组
  ↓
碰撞检测
  ↓
CollisionSystem检测碰撞
  ↓
敌人HP减少
  ↓
敌人被击败
  ↓
掉落资源
  ↓
ResourceSystem处理掉落
  ↓
resources对象更新
  ↓
UI显示更新
```

---

## 🏭 工厂模式

### ComponentFactory

**职责**: 创建不同类型和品质的组件

```javascript
class ComponentFactory {
  static createComponent(type, options) {
    // 1. 获取基础模板
    const template = this.getBaseTemplate(type);

    // 2. 应用品质系数
    const qualityMultiplier = this.getQualityMultiplier(quality);
    const scaledStats = this.applyQualityScaling(template, qualityMultiplier);

    // 3. 创建组件实例
    return new Component({
      type: type,
      quality: quality,
      stats: scaledStats
    });
  }
}
```

**基础模板**：
- CORE: HP 200
- WEAPON: 伤害10, 射速1.0, 射程300
- ARMOR: HP 150, 防御10
- BOOSTER: 各种增益效果

**品质系数**：
- common: ×1.0
- uncommon: ×1.5
- rare: ×2.0
- epic: ×3.0

---

## 🔧 配置和常量

### Constants.js

```javascript
// Canvas配置
export const CANVAS = {
  ID: 'gameCanvas',
  DEFAULT_WIDTH: 1200,
  DEFAULT_HEIGHT: 800
};

// 游戏配置
export const GAME = {
  FPS: 60,
  GRID_SIZE: 5,
  CELL_SIZE: 70
};

// 滚动配置
export const SCROLL = {
  SPEED: 100,
  VEHICLE_X_RATIO: 0.3
};

// 组件类型
export const ComponentType = {
  CORE: 'CORE',
  WEAPON: 'WEAPON',
  ARMOR: 'ARMOR',
  BOOSTER: 'BOOSTER'
};

// 调试配置
export const DEBUG = {
  SHOW_FPS: false,
  SHOW_GRID: false,
  SHOW_HITBOXES: false
};
```

---

## 🎯 关键设计决策

### 为什么使用纯Canvas而非DOM？

**优点**：
- 高性能渲染
- 完全控制绘制
- 适合游戏场景

**缺点**：
- UI交互需要手动实现
- 调试相对困难

**解决方案**：
- Canvas用于游戏画面
- DOM用于部分UI（如果需要）
- 混合使用发挥各自优势

### 为什么不用游戏引擎？

**原因**：
1. 学习和掌握底层原理
2. 完全控制和定制
3. 无外部依赖
4. 项目规模适中

### 为什么使用组件-系统架构？

**优点**：
- 清晰的职责分离
- 易于扩展新系统
- 易于测试和维护

**示例**：
- 添加新组件类型：只需修改ComponentFactory
- 添加新敌人行为：只需修改EnemySystem
- 添加新UI：只需添加新的渲染函数

---

## 🚀 性能考虑

### 渲染优化

1. **避免重复绘制**
   - 只渲染可见对象
   - 使用脏标记

2. **Canvas优化**
   - save/restore配对使用
   - 减少状态切换
   - 批量绘制相同对象

3. **计算优化**
   - 缓存计算结果
   - 避免每帧重复计算
   - 使用简单的碰撞检测

### 内存管理

1. **对象池**（未来优化）
   - 复用子弹对象
   - 复用粒子对象

2. **及时清理**
   - 移除屏幕外的对象
   - 清理已销毁的实体

3. **避免内存泄漏**
   - 正确移除事件监听器
   - 清理引用

---

## 🔮 未来架构改进

### 短期
- [ ] 状态机系统（替代硬编码的游戏状态）
- [ ] 事件系统（系统间通信解耦）
- [ ] 配置文件外部化（JSON）

### 中期
- [ ] 存档系统（LocalStorage）
- [ ] 音频管理器
- [ ] 更复杂的AI系统

### 长期
- [ ] 多场景支持
- [ ] 关卡编辑器
- [ ] 网络对战（如需要）

---

## 📝 代码约定

### 文件命名
- 类文件：PascalCase.js（`EnemySystem.js`）
- 配置文件：PascalCase.js（`Constants.js`）
- 主文件：camelCase.js（`main.js`）

### 类结构
```javascript
class ExampleSystem {
  constructor() {
    // 1. 属性初始化
  }

  // 2. 公共方法
  publicMethod() {}

  // 3. 私有方法（下划线前缀）
  _privateMethod() {}

  // 4. 工具方法
  static utilityMethod() {}
}
```

### 注释风格
```javascript
/**
 * 函数说明
 * @param {Type} paramName - 参数说明
 * @returns {Type} 返回值说明
 */
function example(paramName) {
  // 单行注释

  /*
   * 多行注释
   * 说明复杂逻辑
   */
}
```

---

## 🔍 调试技巧

### 使用DEBUG模式

```javascript
// 在Constants.js中启用
export const DEBUG = {
  SHOW_FPS: true,      // 显示FPS
  SHOW_GRID: true,     // 显示网格线
  SHOW_HITBOXES: true  // 显示碰撞箱
};
```

### Console日志

项目中已添加了关键点的日志：
- `[初始化]` - 系统初始化
- `[调试]` - 调试信息
- `[光标]` - 光标状态切换
- `✅` - 成功操作
- `❌` - 失败操作

### 浏览器开发工具

- **Sources**: 设置断点，单步调试
- **Console**: 查看日志和错误
- **Performance**: 性能分析
- **Network**: 检查资源加载

---

## 📚 相关文档

- [核心指导思想](./GUIDING_PRINCIPLES.md) - 开发原则
- [游戏设计文档](./DESIGN_DOC.md) - 游戏机制
- [开发指南](./DEV_GUIDE.md) - 开发流程
- [测试清单](./TESTING_CHECKLIST.md) - 质量保证

---

**理解架构，才能更好地扩展和维护！**
