# 光标指挥官 (Cursor Commander) - 开发计划

版本：v1.0
日期：2025-12-17

## 项目概述

基于 HTML5 Canvas 开发的 2D 横版卷轴游戏，核心机制包括：
- 固定速度无人机光标系统
- 4x4 网格拼装战车
- 全自动战斗
- 三种资源循环（红/蓝/黄）
- 击杀直充机制

## 模块化架构设计

```
project/
├── index.html              # 主HTML文件
├── src/
│   ├── main.js            # 游戏入口和主循环
│   ├── config/
│   │   └── constants.js   # 全局常量和配置
│   ├── core/
│   │   ├── Canvas.js      # Canvas初始化和DPI适配
│   │   ├── GameManager.js # 游戏状态机和流程控制
│   │   └── InputManager.js# 输入事件管理
│   ├── entities/
│   │   ├── DroneCursor.js # 无人机光标
│   │   ├── Component.js   # 组件基类
│   │   ├── Projectile.js  # 子弹实体
│   │   └── Enemy.js       # 敌人实体
│   ├── systems/
│   │   ├── GridManager.js # 网格管理和坐标转换
│   │   ├── ResourceManager.js # 资源管理
│   │   ├── ProjectilePool.js  # 子弹对象池
│   │   ├── EnemyPool.js       # 敌人对象池
│   │   ├── WeaponSystem.js    # 武器系统
│   │   ├── CollisionSystem.js # 碰撞检测
│   │   └── BuffSystem.js      # 邻接加成系统
│   ├── ui/
│   │   ├── UIRenderer.js  # UI渲染
│   │   ├── DragSystem.js  # 拖拽系统
│   │   └── HoverMining.js # 悬停采集UI
│   └── utils/
│       ├── Vector2.js     # 2D向量工具
│       └── MathUtils.js   # 数学工具函数
└── assets/                # 资源文件（可选）
```

## 开发阶段规划

### 阶段 1：基础设施搭建 (Foundation)

**目标**：建立项目骨架和核心基础设施

#### 任务 1.1：创建项目结构
- 创建所有目录和文件
- 设置 HTML 模板
- 配置基础的 CSS 样式

#### 任务 1.2：Canvas 初始化
**文件**：`src/core/Canvas.js`
- 实现 DPI 适配（devicePixelRatio）
- Canvas 自动缩放以填充窗口
- 提供统一的绘图上下文

**关键代码**：
```javascript
class Canvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    this.resize();
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.ctx.scale(this.dpr, this.dpr);
  }
}
```

#### 任务 1.3：工具类实现
**文件**：`src/utils/Vector2.js`, `src/utils/MathUtils.js`
- Vector2：加减乘除、长度、归一化、距离平方
- MathUtils：距离平方计算、插值、随机数等

---

### 阶段 2：核心实体系统 (Core Entities)

**目标**：实现游戏的核心移动和交互实体

#### 任务 2.1：无人机光标系统
**文件**：`src/entities/DroneCursor.js`

**核心特性**：
- 固定速度移动（无加速度）
- 向鼠标位置匀速飞行
- 吸附机制（接近目标时直接定位）

**关键变量**：
```javascript
class DroneCursor {
  constructor() {
    this.position = { x: 0, y: 0 };      // 当前位置（像素坐标_px）
    this.targetPos = { x: 0, y: 0 };     // 目标位置（像素坐标_px）
    this.moveSpeed = 500;                 // 固定速度 px/s
    this.radius = 8;                      // 渲染半径
  }

  update(deltaTime, mousePos_px) {
    this.targetPos = mousePos_px;
    const vec = Vector2.subtract(this.targetPos, this.position);
    const distance = Vector2.length(vec);
    const step = this.moveSpeed * deltaTime;

    if (distance > step) {
      const direction = Vector2.normalize(vec);
      this.position = Vector2.add(this.position, Vector2.multiply(direction, step));
    } else {
      this.position = { ...this.targetPos }; // 吸附
    }
  }

  render(ctx) {
    // 绘制无人机（圆圈）
    ctx.strokeStyle = '#00FFFF';
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    // 绘制连接线
    ctx.strokeStyle = '#00FFFF44';
    ctx.beginPath();
    ctx.moveTo(this.position.x, this.position.y);
    ctx.lineTo(this.targetPos.x, this.targetPos.y);
    ctx.stroke();
  }
}
```

#### 任务 2.2：组件基类
**文件**：`src/entities/Component.js`

**数据结构**（严格遵守数据字典）：
```javascript
class Component {
  constructor(config) {
    this.id = config.id;                 // 唯一ID
    this.type = config.type;             // "CORE", "WEAPON", "ARMOR", "BOOSTER"
    this.gridShape = config.gridShape;   // [[0,0], [1,0]] 相对坐标
    this.gridPos = { col: 0, row: 0 };  // 网格位置（网格坐标）
    this.stats = {
      hp: config.hp || 100,
      maxHp: config.maxHp || 100,
      damage: config.damage || 0,
      cooldown: config.cooldown || 1,
      range: config.range || 200,
      ammoCost: config.ammoCost || 1,
      pattern: config.pattern || "NEAREST" // "NEAREST", "CURSOR"
    };
    this.currentCooldown = 0;
    this.buffMultiplier = 1.0;           // 邻接加成
  }
}
```

---

### 阶段 3：网格与资源系统 (Grid & Resources)

#### 任务 3.1：网格管理器
**文件**：`src/systems/GridManager.js`

**核心功能**：
1. 维护 4x4 网格数据
2. 坐标系转换（像素 ↔ 网格）
3. 组件放置和移除
4. 碰撞检测（组件是否重叠/越界）

**关键方法**：
```javascript
class GridManager {
  constructor(gridSize = 4, cellSize_px = 80) {
    this.gridSize = gridSize;
    this.cellSize_px = cellSize_px;
    this.grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
    this.components = [];

    // 网格起始位置（屏幕坐标）
    this.gridOriginX_px = 100;
    this.gridOriginY_px = 200;
  }

  // 像素坐标 -> 网格索引
  screenToGrid(x_px, y_px) {
    const col = Math.floor((x_px - this.gridOriginX_px) / this.cellSize_px);
    const row = Math.floor((y_px - this.gridOriginY_px) / this.cellSize_px);
    return { col, row };
  }

  // 网格索引 -> 像素坐标（格子中心）
  gridToScreen(col, row) {
    const x_px = this.gridOriginX_px + col * this.cellSize_px + this.cellSize_px / 2;
    const y_px = this.gridOriginY_px + row * this.cellSize_px + this.cellSize_px / 2;
    return { x_px, y_px };
  }

  // 检查组件是否可以放置
  canPlace(component, col, row) {
    for (const [offsetCol, offsetRow] of component.gridShape) {
      const targetCol = col + offsetCol;
      const targetRow = row + offsetRow;

      // 越界检查
      if (targetCol < 0 || targetCol >= this.gridSize ||
          targetRow < 0 || targetRow >= this.gridSize) {
        return false;
      }

      // 重叠检查
      if (this.grid[targetRow][targetCol] !== null) {
        return false;
      }
    }
    return true;
  }

  // 放置组件
  placeComponent(component, col, row) {
    if (!this.canPlace(component, col, row)) return false;

    component.gridPos = { col, row };
    for (const [offsetCol, offsetRow] of component.gridShape) {
      this.grid[row + offsetRow][col + offsetCol] = component;
    }
    this.components.push(component);
    return true;
  }
}
```

#### 任务 3.2：资源管理器
**文件**：`src/systems/ResourceManager.js`

**严格遵守命名规范**：
```javascript
class ResourceManager {
  constructor() {
    this.resources = {
      red: 100,    // 弹药（Float in logic, Floor in UI）
      blue: 50,    // 建材
      gold: 0      // 金币
    };
  }

  // 添加资源（击杀直充）
  addResource(type, amount) {
    this.resources[type] += amount;
  }

  // 消耗资源
  consume(type, amount) {
    if (this.resources[type] >= amount) {
      this.resources[type] -= amount;
      return true;
    }
    return false;
  }

  // UI显示（向下取整）
  getDisplayValue(type) {
    return Math.floor(this.resources[type]);
  }
}
```

#### 任务 3.3：邻接加成系统
**文件**：`src/systems/BuffSystem.js`

**算法**：
```javascript
class BuffSystem {
  static recalculateBuffs(gridManager) {
    // 重置所有组件的 buffMultiplier
    for (const component of gridManager.components) {
      component.buffMultiplier = 1.0;
    }

    // 遍历所有 BOOSTER 组件
    for (const booster of gridManager.components) {
      if (booster.type !== 'BOOSTER') continue;

      const { col, row } = booster.gridPos;
      const directions = [
        { col: col - 1, row },
        { col: col + 1, row },
        { col, row: row - 1 },
        { col, row: row + 1 }
      ];

      for (const dir of directions) {
        if (dir.col < 0 || dir.col >= gridManager.gridSize ||
            dir.row < 0 || dir.row >= gridManager.gridSize) continue;

        const neighbor = gridManager.grid[dir.row][dir.col];
        if (neighbor && neighbor !== booster) {
          neighbor.buffMultiplier = 1.2; // +20% 攻速/伤害
        }
      }
    }
  }
}
```

---

### 阶段 4：对象池系统 (Object Pooling)

**目标**：高性能实体管理，严禁运行时 `new`

#### 任务 4.1：子弹对象池
**文件**：`src/systems/ProjectilePool.js`

```javascript
class Projectile {
  constructor() {
    this.active = false;
    this.position = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.damage = 0;
    this.team = 'player'; // 'player' or 'enemy'
  }

  reset(x_px, y_px, vx, vy, damage) {
    this.active = true;
    this.position = { x: x_px, y: y_px };
    this.velocity = { x: vx, y: vy };
    this.damage = damage;
  }

  update(deltaTime) {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
  }

  render(ctx) {
    ctx.fillStyle = this.team === 'player' ? '#FFFF00' : '#FF0000';
    ctx.fillRect(this.position.x - 2, this.position.y - 2, 4, 4);
  }
}

class ProjectilePool {
  constructor(size = 200) {
    this.pool = [];
    for (let i = 0; i < size; i++) {
      this.pool.push(new Projectile());
    }
  }

  get(x_px, y_px, vx, vy, damage) {
    for (const p of this.pool) {
      if (!p.active) {
        p.reset(x_px, y_px, vx, vy, damage);
        return p;
      }
    }
    console.warn('Projectile pool exhausted!');
    return null;
  }

  release(projectile) {
    projectile.active = false;
  }

  update(deltaTime, canvasWidth, canvasHeight) {
    for (const p of this.pool) {
      if (!p.active) continue;

      p.update(deltaTime);

      // 边界检查
      if (p.position.x < 0 || p.position.x > canvasWidth ||
          p.position.y < 0 || p.position.y > canvasHeight) {
        this.release(p);
      }
    }
  }

  render(ctx) {
    for (const p of this.pool) {
      if (p.active) p.render(ctx);
    }
  }
}
```

#### 任务 4.2：敌人对象池
**文件**：`src/systems/EnemyPool.js`

类似结构，实现敌人的池化管理。

---

### 阶段 5：战斗系统 (Combat Systems)

#### 任务 5.1：武器系统
**文件**：`src/systems/WeaponSystem.js`

**核心逻辑**：
1. 遍历所有 WEAPON 组件
2. 更新冷却（应用 buffMultiplier）
3. 索敌（根据 pattern）
4. 开火（消耗弹药，发射子弹）

```javascript
class WeaponSystem {
  static update(deltaTime, gridManager, projectilePool, enemyPool, resourceManager, droneCursor) {
    for (const component of gridManager.components) {
      if (component.type !== 'WEAPON') continue;

      // 更新冷却（应用邻接加成）
      component.currentCooldown -= deltaTime * component.buffMultiplier;

      if (component.currentCooldown <= 0) {
        // 检查弹药
        if (!resourceManager.consume('red', component.stats.ammoCost)) {
          continue; // 弹药不足
        }

        // 索敌
        const target = this.findTarget(component, enemyPool, droneCursor);
        if (!target) continue;

        // 发射子弹
        const weaponPos = gridManager.gridToScreen(component.gridPos.col, component.gridPos.row);
        const direction = Vector2.normalize(Vector2.subtract(target.position, weaponPos));
        const speed = 400; // 子弹速度

        projectilePool.get(
          weaponPos.x_px,
          weaponPos.y_px,
          direction.x * speed,
          direction.y * speed,
          component.stats.damage * component.buffMultiplier
        );

        // 重置冷却
        component.currentCooldown = component.stats.cooldown;
      }
    }
  }

  static findTarget(weapon, enemyPool, droneCursor) {
    const pattern = weapon.stats.pattern;

    if (pattern === 'NEAREST') {
      // 找最近的敌人
      let nearest = null;
      let minDistSq = Infinity;

      for (const enemy of enemyPool.pool) {
        if (!enemy.active) continue;
        const distSq = Vector2.distanceSquared(weaponPos, enemy.position);
        if (distSq < minDistSq && distSq < weapon.stats.range * weapon.stats.range) {
          minDistSq = distSq;
          nearest = enemy;
        }
      }
      return nearest;
    } else if (pattern === 'CURSOR') {
      // 找光标附近的敌人
      // 实现类似逻辑
    }

    return null;
  }
}
```

#### 任务 5.2：碰撞检测系统
**文件**：`src/systems/CollisionSystem.js`

**优化**：使用距离平方避免 sqrt

```javascript
class CollisionSystem {
  static checkProjectileEnemyCollisions(projectilePool, enemyPool, resourceManager) {
    for (const projectile of projectilePool.pool) {
      if (!projectile.active || projectile.team !== 'player') continue;

      for (const enemy of enemyPool.pool) {
        if (!enemy.active) continue;

        const distSq = Vector2.distanceSquared(projectile.position, enemy.position);
        const hitRadius = 10; // 碰撞半径

        if (distSq < hitRadius * hitRadius) {
          enemy.hp -= projectile.damage;
          projectilePool.release(projectile);

          // 敌人死亡 - 击杀直充
          if (enemy.hp <= 0) {
            resourceManager.addResource('red', enemy.rewardRed);
            resourceManager.addResource('gold', enemy.rewardGold);
            enemyPool.release(enemy);
          }
          break;
        }
      }
    }
  }
}
```

---

### 阶段 6：UI 和交互系统 (UI & Interaction)

#### 任务 6.1：拖拽系统
**文件**：`src/ui/DragSystem.js`

**核心流程**：
1. mousedown（UI区） → PAUSED → 创建 tempComponent
2. mousemove → 计算吸附位置 → 预览
3. mouseup → 恢复状态 → 放置组件

#### 任务 6.2：悬停采集
**文件**：`src/ui/HoverMining.js`

**逻辑**：
- 使用 DroneCursor.position（非鼠标）
- 计算与资源点距离
- 绘制圆形进度条
- 完成时收集资源

#### 任务 6.3：UI 渲染器
**文件**：`src/ui/UIRenderer.js`

渲染：
- 资源栏（顶部）
- 网格边框
- 组件血条
- 进度条

---

### 阶段 7：游戏流程 (Game Flow)

#### 任务 7.1：游戏状态机
**文件**：`src/core/GameManager.js`

**状态**：
- TRAVEL：背景卷动，正常生怪
- COMBAT：背景停止，双倍生怪
- SAFEHOUSE：商店和装配
- PAUSED：拖拽时暂停

#### 任务 7.2：主循环
**文件**：`src/main.js`

```javascript
let lastTime = 0;

function gameLoop(currentTime) {
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  // Update
  if (gameState !== 'PAUSED') {
    droneCursor.update(deltaTime, mousePos);
    weaponSystem.update(deltaTime, ...);
    projectilePool.update(deltaTime, ...);
    enemyPool.update(deltaTime, ...);
    collisionSystem.check(...);
  }

  // Render
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  gridManager.render(ctx);
  droneCursor.render(ctx);
  projectilePool.render(ctx);
  enemyPool.render(ctx);
  uiRenderer.render(ctx);

  requestAnimationFrame(gameLoop);
}
```

---

## 关键技术规范

### 1. 坐标命名规范（强制）
- 像素坐标：`x_px`, `y_px`, `mousePos`, `targetPos`
- 网格坐标：`col`, `row`, `gridPos`, `idx`
- **严禁**使用 `x`, `y` 同时代表两种含义

### 2. 性能优化
- 距离计算：使用 `distSquared`，避免 `Math.sqrt()`
- 对象池：子弹、敌人必须池化
- 空间划分：后期实体 > 100 时实现

### 3. 数值处理
- 逻辑层：Float（支持 deltaTime）
- UI 层：`Math.floor()`

### 4. DPI 适配
- 使用 `devicePixelRatio` 缩放
- Canvas 物理尺寸 ≠ CSS 尺寸

### 5. 暂停机制
- 拖拽时：`gameState = PAUSED`
- 停止 Update，保持 Render

---

## 测试与验证清单

- [ ] 光标匀速移动，无瞬移
- [ ] 网格坐标转换正确
- [ ] 组件邻接加成生效
- [ ] 子弹对象池无 new
- [ ] 击杀直充（无掉落物）
- [ ] 拖拽时游戏暂停
- [ ] 悬停采集进度条正确
- [ ] 资源 UI 正确取整
- [ ] 核心被毁触发 GameOver

---

## 开发顺序建议

**第一天**：阶段 1-2（基础设施 + 光标系统）
**第二天**：阶段 3（网格 + 资源）
**第三天**：阶段 4-5（对象池 + 战斗）
**第四天**：阶段 6（UI 交互）
**第五天**：阶段 7 + 测试优化

---

## 文档维护

每完成一个模块，更新此文档的状态：
- [x] 已完成
- [ ] 进行中
- [ ] 未开始

---

*此计划基于 MasterPlan.txt v4.2 制定，严格遵守数据字典和技术规范。*
