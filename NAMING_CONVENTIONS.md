# 命名规范 (Naming Conventions)

版本：v1.0
状态：**强制执行**

本文档定义《光标指挥官》项目的命名规范，所有开发者必须严格遵守。

---

## 🚨 核心原则：坐标系命名规范

这是最重要的规范，违反此规范会导致严重的逻辑错误！

### 像素坐标（屏幕空间）

**用途**：Canvas 渲染坐标、鼠标位置、实体位置

**命名规则**：
- 变量必须以 `_px` 结尾
- 或使用 `Pos` 后缀表示位置对象

**示例**：
```javascript
// ✅ 正确
const x_px = 100;
const y_px = 200;
const mousePos = { x: 150, y: 250 };
const targetPos = { x: 300, y: 400 };
const droneX_px = 500;
const screenPosX = 600;

// ❌ 错误
const x = 100;  // 不明确是像素还是网格
const mouseX = 150;  // 缺少 _px 后缀
```

### 网格坐标（逻辑空间）

**用途**：网格索引、组件位置、网格系统

**命名规则**：
- 必须使用 `col` (列) 和 `row` (行)
- 或以 `_idx` 结尾表示索引
- 或使用 `gridPos` 对象

**示例**：
```javascript
// ✅ 正确
const col = 2;
const row = 3;
const gridPos = { col: 1, row: 2 };
const cellIdx = 5;
const columnIdx = 0;

// ❌ 错误
const x = 2;  // 不明确是像素还是网格
const gridX = 1;  // 应使用 col
const posY = 3;  // 应使用 row
```

### 混合使用示例

```javascript
// ✅ 正确：清晰区分两种坐标系
class GridManager {
  screenToGrid(x_px, y_px) {
    const col = Math.floor((x_px - this.originX_px) / this.cellSize_px);
    const row = Math.floor((y_px - this.originY_px) / this.cellSize_px);
    return { col, row };
  }

  gridToScreen(col, row) {
    const x_px = this.originX_px + col * this.cellSize_px;
    const y_px = this.originY_px + row * this.cellSize_px;
    return { x_px, y_px };
  }
}

// ❌ 错误：混淆坐标系
class GridManager {
  screenToGrid(x, y) {  // 不明确
    const gridX = Math.floor(x / this.cellSize);  // 严重混淆！
    const gridY = Math.floor(y / this.cellSize);
    return { x: gridX, y: gridY };  // 灾难性命名
  }
}
```

---

## 📦 类和文件命名

### 类名（Class Names）

**规则**：PascalCase（大驼峰命名）

```javascript
// ✅ 正确
class DroneCursor { }
class GridManager { }
class ProjectilePool { }
class WeaponSystem { }

// ❌ 错误
class droneCursor { }  // 应使用 PascalCase
class grid_manager { }  // 不要使用下划线
class projectilepool { }  // 缺少单词分隔
```

### 文件名（File Names）

**规则**：与类名一致的 PascalCase.js

```
✅ 正确：
DroneCursor.js
GridManager.js
ProjectilePool.js

❌ 错误：
dronecursor.js
grid_manager.js
projectile-pool.js
```

### 目录名（Directory Names）

**规则**：全小写，无下划线

```
✅ 正确：
src/core/
src/entities/
src/systems/
src/utils/

❌ 错误：
src/Core/
src/game_entities/
src/Systems/
```

---

## 🔤 变量和函数命名

### 变量名（Variable Names）

**规则**：camelCase（小驼峰命名）

```javascript
// ✅ 正确
const droneSpeed = 500;
const currentCooldown = 0;
const buffMultiplier = 1.2;
const projectilePool = new ProjectilePool();

// ❌ 错误
const DroneSpeed = 500;  // 变量不用 PascalCase
const current_cooldown = 0;  // 不要使用下划线
const projectile_pool = new ProjectilePool();
```

### 函数名（Function Names）

**规则**：camelCase，动词开头

```javascript
// ✅ 正确
function updatePosition(deltaTime) { }
function calculateDistance(a, b) { }
function fireProjectile(target) { }
function canPlaceComponent(col, row) { }

// ❌ 错误
function UpdatePosition() { }  // 不用 PascalCase
function distance_calc() { }  // 不要下划线，缺少动词
function fire() { }  // 太模糊，应明确 fireProjectile
```

### 布尔变量（Boolean Variables）

**规则**：以 `is`、`has`、`can`、`should` 开头

```javascript
// ✅ 正确
const isActive = true;
const hasTarget = false;
const canFire = true;
const shouldSpawn = false;

// ❌ 错误
const active = true;  // 缺少 is 前缀
const target = false;  // 不明确是布尔值
const fire = true;  // 混淆
```

---

## 🔧 常量命名

### 全局常量（Global Constants）

**规则**：SCREAMING_SNAKE_CASE（全大写+下划线）

```javascript
// ✅ 正确
const MOVE_SPEED = 500;
const MAX_HP = 100;
const GRID_SIZE = 4;
const CELL_SIZE_PX = 80;

// ❌ 错误
const moveSpeed = 500;  // 常量应全大写
const maxHp = 100;
const GridSize = 4;
```

### 枚举常量（Enum Constants）

**规则**：对象名 PascalCase，键名全大写

```javascript
// ✅ 正确
const GameState = {
  TRAVEL: 'TRAVEL',
  COMBAT: 'COMBAT',
  SAFEHOUSE: 'SAFEHOUSE',
  PAUSED: 'PAUSED'
};

const ComponentType = {
  CORE: 'CORE',
  WEAPON: 'WEAPON',
  ARMOR: 'ARMOR',
  BOOSTER: 'BOOSTER'
};

// ❌ 错误
const gameState = {  // 对象名应 PascalCase
  travel: 'travel',  // 键名应全大写
  Combat: 'combat'
};
```

---

## 🎯 特定领域命名

### 实体属性（Entity Properties）

```javascript
// ✅ 正确：严格遵守数据字典
class Component {
  constructor(config) {
    this.id = config.id;              // 唯一ID
    this.type = config.type;          // 类型枚举
    this.gridShape = config.gridShape; // 形状数组
    this.gridPos = { col: 0, row: 0 }; // 网格位置
    this.stats = { };                 // 统计属性
    this.currentCooldown = 0;         // 当前冷却
    this.buffMultiplier = 1.0;        // Buff 倍率
  }
}

// ❌ 错误：自由发挥
class Component {
  constructor(config) {
    this.ID = config.id;           // 不要全大写
    this.componentType = config.type; // 冗余的前缀
    this.shape = config.shape;     // 应该是 gridShape
    this.position = { x: 0, y: 0 }; // 应该是 gridPos: {col, row}
    this.cool_down = 0;            // 不要下划线
    this.buff = 1.0;               // 不明确，应是 buffMultiplier
  }
}
```

### 资源类型（Resource Types）

```javascript
// ✅ 正确：使用小写字符串作为键
const resources = {
  red: 100,   // 🔴 弹药
  blue: 50,   // 🔵 建材
  gold: 0     // 🟡 金币
};

// 访问资源
resourceManager.addResource('red', 10);
resourceManager.consume('blue', 5);

// ❌ 错误
const resources = {
  Red: 100,    // 不要大写
  BLUE: 50,    // 不要全大写
  ammo: 0      // 不要自定义名称，必须是 red/blue/gold
};
```

### 对象池属性（Pool Properties）

```javascript
// ✅ 正确
class Projectile {
  constructor() {
    this.active = false;  // 布尔值，对象池标记
    this.position = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.damage = 0;
  }
}

// ❌ 错误
class Projectile {
  constructor() {
    this.isActive = false;  // 应该是 active（数据字典规定）
    this.pos = { x: 0, y: 0 };  // 应该是 position
    this.vel = { x: 0, y: 0 };  // 应该是 velocity
    this.dmg = 0;  // 不要缩写，应该是 damage
  }
}
```

---

## 🔍 方法命名模式

### 查询方法（Query Methods）

返回布尔值的查询方法：

```javascript
// ✅ 正确
canPlaceComponent(component, col, row) { }
isOutOfBounds(x_px, y_px) { }
hasEnoughResources(type, amount) { }

// ❌ 错误
placeComponent(component, col, row) { }  // 不明确是查询还是执行
checkBounds(x, y) { }  // 应明确返回值类型
```

### 执行方法（Action Methods）

执行操作的方法：

```javascript
// ✅ 正确
placeComponent(component, col, row) { }
removeComponent(component) { }
fireWeapon(weapon, target) { }
addResource(type, amount) { }

// ❌ 错误
component(component, col, row) { }  // 缺少动词
doRemove(component) { }  // do 前缀冗余
weaponFire(weapon, target) { }  // 应该是 fireWeapon（动词在前）
```

### 获取方法（Getter Methods）

```javascript
// ✅ 正确
getComponent(col, row) { }
getActiveProjectiles() { }
getNearestEnemy(position) { }
getDisplayValue(resourceType) { }  // 特殊处理（如 Math.floor）

// ❌ 错误
component(col, row) { }  // 缺少 get 前缀
fetchComponent(col, row) { }  // fetch 通常用于异步，用 get
retrieveComponent(col, row) { }  // 太复杂，用 get
```

### 设置方法（Setter Methods）

```javascript
// ✅ 正确
setGridPosition(col, row) { }
updateCooldown(deltaTime) { }  // update 表示增量修改
resetProjectile(projectile) { }

// ❌ 错误
gridPosition(col, row) { }  // 缺少 set 前缀
modifyCooldown(deltaTime) { }  // modify 不明确，用 update
```

---

## 📐 数学和物理相关

### 向量操作（Vector Operations）

```javascript
// ✅ 正确
const vec = Vector2.subtract(target, source);
const distance = Vector2.length(vec);
const distSq = Vector2.distanceSquared(a, b);  // 性能优化
const normalized = Vector2.normalize(vec);

// ❌ 错误
const vec = Vector2.sub(target, source);  // 不要缩写
const dist = Vector2.len(vec);  // 不要缩写
const d2 = Vector2.dist2(a, b);  // 不要缩写
```

### 时间相关（Time Related）

```javascript
// ✅ 正确
update(deltaTime) {
  this.currentCooldown -= deltaTime;
  this.position.x += this.velocity.x * deltaTime;
}

// ❌ 错误
update(dt) {  // 不要缩写 deltaTime
  this.cooldown -= dt;  // 应该是 currentCooldown
  this.x += this.vx * dt;  // 应该是 position.x 和 velocity.x
}
```

---

## 🛠️ 工具函数命名

### 坐标转换（Coordinate Conversion）

```javascript
// ✅ 正确
screenToGrid(x_px, y_px) { }
gridToScreen(col, row) { }

// ❌ 错误
toGrid(x, y) { }  // 不明确从哪里转换
pixelToCell(x, y) { }  // 虽然清楚，但不符合项目规范
convertCoordinates(x, y) { }  // 太模糊
```

### 碰撞检测（Collision Detection）

```javascript
// ✅ 正确
checkProjectileEnemyCollisions(projectilePool, enemyPool) { }
isCollidingWithEnemy(position, radius) { }

// ❌ 错误
checkCollisions() { }  // 太模糊，应明确检测什么
collision(a, b) { }  // 缺少动词
```

---

## 📝 注释规范

### JSDoc 注释

```javascript
/**
 * 将屏幕像素坐标转换为网格索引
 * @param {number} x_px - 屏幕 X 坐标（像素）
 * @param {number} y_px - 屏幕 Y 坐标（像素）
 * @returns {{col: number, row: number}} 网格坐标
 */
screenToGrid(x_px, y_px) {
  const col = Math.floor((x_px - this.originX_px) / this.cellSize_px);
  const row = Math.floor((y_px - this.originY_px) / this.cellSize_px);
  return { col, row };
}
```

### 内联注释

```javascript
// ✅ 正确：简洁明了
// 计算距离平方（避免 sqrt，性能优化）
const distSq = (dx * dx) + (dy * dy);

// 应用邻接加成
component.buffMultiplier = 1.2;

// ❌ 错误：冗余或无意义
// 设置 x
x = 10;  // 这是 x

// 这个函数很重要
function doSomething() { }
```

---

## ⚠️ 禁止使用的命名

### 绝对禁止

```javascript
// ❌ 绝对不要使用
var x, y;  // 太模糊
var data, info, temp;  // 无意义
var a, b, c;  // 单字母（除了循环变量 i, j）
var thing, stuff, obj;  // 不明确

// ❌ 不要使用拼音
var sudu = 100;  // 应该是 speed
var shuliang = 5;  // 应该是 amount

// ❌ 不要混合命名风格
var player_Speed = 100;  // 混合下划线和驼峰
var PlayerDamage = 10;  // 变量不用 PascalCase
```

---

## ✅ 检查清单

在提交代码前，确认以下几点：

- [ ] 像素坐标使用 `_px` 或 `Pos` 后缀
- [ ] 网格坐标使用 `col`/`row` 或 `gridPos`
- [ ] 类名使用 PascalCase
- [ ] 变量和函数使用 camelCase
- [ ] 常量使用 SCREAMING_SNAKE_CASE
- [ ] 布尔变量以 `is`/`has`/`can`/`should` 开头
- [ ] 严格遵守数据字典定义的字段名
- [ ] 没有使用缩写（除非是公认的如 `HP`, `FPS`）
- [ ] 函数名以动词开头
- [ ] 没有拼音命名

---

## 📚 参考

- 数据字典：`src/config/DataDictionary.js`
- 全局常量：`src/config/Constants.js`
- 开发计划：`DEVELOPMENT_PLAN.md`

---

**最后提醒**：命名规范不是建议，而是强制执行。不符合规范的代码将被拒绝合并。

**原因**：良好的命名是代码可维护性的基础，尤其是坐标系命名规范，直接关系到游戏逻辑的正确性。
