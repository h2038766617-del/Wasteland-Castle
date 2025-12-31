# 核心体验问题修复计划

## 真正的核心问题

### 问题 1：没有载具视觉表现 🔴 致命
**现状**：玩家只看到浮空的彩色方块（网格），不知道这是载具
**问题**：
- main.js render() 中完全没有载具外形渲染
- 只有 gridManager.render() 渲染网格组件
- 玩家看不出这些方块代表一辆载具

**解决方案**：
1. 在网格周围绘制载具轮廓/外壳
2. 添加载具底盘（矩形/圆角矩形）
3. 添加车轮/履带动画
4. 可选：添加排气/引擎效果

**实现位置**：
- 在 `GridManager.render()` 之前或之后
- 或创建新的 `renderVehicle()` 方法

---

### 问题 2：画面前3秒完全静止 🔴 严重
**现状**：
- 资源节点 3 秒后才生成
- 障碍物 15 秒后才生成
- 敌人 8 秒后才出现（准备期）
- **玩家看到静止的黑屏 + 彩色方块，以为卡住了**

**解决方案**：
1. **立即生成初始资源节点**（游戏启动时就有）
2. **立即生成初始障碍物**（游戏启动时就有）
3. **添加背景滚动效果**（地面、云层、废土纹理）
4. **添加粒子效果**（灰尘、碎片飘动）

**实现**：
```javascript
// ResourceSystem.constructor()
this.spawnTimer = this.spawnInterval; // 立即触发第一次生成

// ObstacleSystem.constructor()
this.spawnTimer = this.spawnInterval; // 立即触发第一次生成

// 或在 initJourney() 时预生成
for (let i = 0; i < 3; i++) {
  this.trySpawnResourceNode();
  this.trySpawnObstacle();
}
```

---

### 问题 3：背景纯黑 + 深灰网格 ⚠️ 影响体验
**现状**：
```javascript
renderBackgroundGrid() {
  ctx.strokeStyle = '#1a1a1a'; // 深灰色网格
  // 在黑色背景(#000000)上几乎看不见
}
```

**问题**：
- 没有参照物，看不出运动
- 画面单调
- 缺少废土氛围

**解决方案**：
1. **添加滚动地面纹理**
   - 使用重复的地面图案
   - 根据 scrollSystem.scrollOffset 偏移
   - 营造运动感

2. **优化背景网格颜色**
   - 改为 '#2a2a2a' 或 '#333333'（更明显）
   - 或改为废土色调（#3a2a1a）

3. **添加远景/近景层**
   - 远景：山脉/废墟轮廓（慢速移动）
   - 近景：地面细节（快速移动）
   - 视差滚动效果

**实现**：
```javascript
renderScrollingGround(ctx) {
  const offset = this.scrollSystem.scrollOffset % 100;
  ctx.fillStyle = '#1a1a1a';
  // 绘制重复的地面图案，根据 offset 偏移
  for (let x = -offset; x < width; x += 100) {
    ctx.fillRect(x, height - 50, 100, 50);
  }
}
```

---

### 问题 4：网格组件看起来像浮空方块 ⚠️
**现状**：4x4 的彩色格子，没有连接感

**解决方案**：
1. 在网格外围绘制载具外壳/边框
2. 添加连接线/管道连接各组件
3. 添加阴影效果（立体感）

---

## 修复优先级

### Phase 1：核心视觉（立即修复）
1. ✅ **添加载具外形渲染**
   - 在网格周围绘制矩形轮廓
   - 添加车轮/履带
   - 位置：main.js renderVehicle()

2. ✅ **游戏启动时预生成内容**
   - 资源节点 × 3
   - 障碍物 × 2
   - 位置：ResourceSystem/ObstacleSystem 构造函数

3. ✅ **添加滚动地面**
   - 简单的重复条纹
   - 营造运动感
   - 位置：main.js renderScrollingGround()

### Phase 2：视觉优化（次要）
4. 优化背景网格颜色（#1a1a1a → #333333）
5. 添加粒子效果（灰尘、碎片）
6. 添加视差背景（远景山脉）

---

## 实施步骤

### Step 1: 添加载具渲染
在 main.js 的 render() 中：
```javascript
render() {
  this.canvas.clear();
  this.ctx.save();

  // 应用屏幕抖动
  this.obstacleSystem.applyScreenShake(this.ctx);

  // 绘制背景
  this.renderBackgroundGrid();
  this.renderScrollingGround();  // 新增

  // 绘制载具外形
  this.renderVehicle();  // 新增

  // 绘制游戏网格和组件
  this.gridManager.render(this.ctx);

  // ... 其他渲染
}

renderVehicle() {
  const ctx = this.ctx;
  const gridOriginX = this.gridManager.originX_px;
  const gridOriginY = this.gridManager.originY_px;
  const gridWidth = this.gridManager.getGridWidth_px();
  const gridHeight = this.gridManager.getGridHeight_px();

  // 绘制载具底盘（扩展网格边界）
  ctx.save();
  ctx.fillStyle = '#2a2a2a';
  ctx.strokeStyle = '#4a4a4a';
  ctx.lineWidth = 3;

  const padding = 10;
  ctx.fillRect(
    gridOriginX - padding,
    gridOriginY - padding,
    gridWidth + padding * 2,
    gridHeight + padding * 2
  );
  ctx.strokeRect(
    gridOriginX - padding,
    gridOriginY - padding,
    gridWidth + padding * 2,
    gridHeight + padding * 2
  );

  // 绘制车轮/履带
  // TODO: 添加车轮动画

  ctx.restore();
}
```

### Step 2: 预生成内容
在 ResourceSystem 构造函数最后：
```javascript
constructor(scrollSystem, canvasWidth, canvasHeight) {
  // ... 现有代码

  // 预生成初始资源节点
  for (let i = 0; i < 3; i++) {
    this.trySpawnResourceNode();
  }
}
```

在 ObstacleSystem 构造函数最后：
```javascript
constructor(scrollSystem, canvasWidth, canvasHeight) {
  // ... 现有代码

  // 预生成初始障碍物
  for (let i = 0; i < 2; i++) {
    this.trySpawnObstacle();
  }
}
```

### Step 3: 添加滚动地面
在 main.js 添加：
```javascript
renderScrollingGround() {
  const ctx = this.ctx;
  const width = this.canvas.getWidth();
  const height = this.canvas.getHeight();

  // 获取滚动偏移
  const offset = this.scrollSystem.scrollOffset % 100;

  // 绘制地面条纹（营造运动感）
  ctx.save();
  ctx.fillStyle = '#1a1a1a';

  for (let x = -offset; x < width + 100; x += 100) {
    // 交替颜色的条纹
    ctx.fillStyle = (Math.floor(x / 100) % 2 === 0) ? '#1a1a1a' : '#151515';
    ctx.fillRect(x, height - 100, 100, 100);
  }

  ctx.restore();
}
```

---

## 预期效果

修复后，玩家在 0:00 看到：
✅ 载具外形（带底盘和边框的方形载具）
✅ 地面在向左滚动（运动感）
✅ 屏幕上已有 3 个资源节点 + 2 个障碍物（不再静止）
✅ 背景网格更明显

**玩家立刻知道：这是一辆在废土上行驶的载具！**
