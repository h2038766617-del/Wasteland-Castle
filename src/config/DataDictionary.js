/**
 * 数据字典 (Data Dictionary)
 *
 * 这是《光标指挥官》的核心数据结构定义文件
 * 所有开发者必须严格遵守此字典，禁止自由发挥
 *
 * 版本：v1.0
 * 基于：MasterPlan.txt v4.2
 */

/**
 * ============================================
 * 坐标系命名规范 (CRITICAL)
 * ============================================
 *
 * 像素坐标（屏幕空间）：
 *   - 变量必须以 _px 结尾或使用 Pos 后缀
 *   - 例如：x_px, y_px, mousePos, targetPos, screenPos
 *
 * 网格坐标（逻辑空间）：
 *   - 必须使用 col/row 或 _idx 结尾
 *   - 例如：col, row, gridPos, cellIdx
 *
 * 严禁使用通用的 x, y 同时代表两种含义！
 */

/**
 * ============================================
 * 组件 (Component) 数据结构
 * ============================================
 */
export const ComponentSchema = {
  // 唯一标识符
  id: "String",              // e.g., "basic_gun_1", "core_main", "armor_plate_2"

  // 组件类型（枚举）
  type: "CORE | WEAPON | ARMOR | BOOSTER",

  // 网格形状（相对坐标数组）
  // 以组件锚点为 [0,0]，定义占据的所有格子
  gridShape: "Array<[col, row]>",  // e.g., [[0,0], [1,0]] 表示水平1x2

  // 网格位置（锚点的网格坐标）
  gridPos: {
    col: "Number",           // 列索引 (0-3 for 4x4 grid)
    row: "Number"            // 行索引 (0-3 for 4x4 grid)
  },

  // 统计属性
  stats: {
    // 通用属性
    hp: "Number",            // 当前生命值（Float，可被 deltaTime 递减）
    maxHp: "Number",         // 最大生命值

    // 武器专属
    damage: "Number",        // 基础伤害
    cooldown: "Number",      // 冷却时间（秒）
    range: "Number",         // 射程（像素_px）
    ammoCost: "Number",      // 每次开火消耗的弹药（红资源）

    // 攻击模式（枚举）
    pattern: "NEAREST | CURSOR | AOE",
    // - NEAREST: 攻击范围内最近的敌人
    // - CURSOR: 攻击光标附近的敌人（光标引导）
    // - AOE: 范围伤害
  },

  // 运行时状态
  currentCooldown: "Number", // 当前冷却计时器（秒）

  // 邻接加成倍率
  buffMultiplier: "Number"   // 默认 1.0，受 BOOSTER 影响可变为 1.2 等
};

/**
 * 组件类型枚举
 */
export const ComponentType = {
  CORE: "CORE",       // 核心：必须保护，被毁则 GameOver
  WEAPON: "WEAPON",   // 武器：自动攻击
  ARMOR: "ARMOR",     // 装甲：高血量，保护其他组件
  BOOSTER: "BOOSTER"  // 增压器：为相邻组件提供 Buff
};

/**
 * 攻击模式枚举
 */
export const AttackPattern = {
  NEAREST: "NEAREST", // 最近敌人
  CURSOR: "CURSOR",   // 光标引导
  AOE: "AOE"          // 范围伤害
};

/**
 * ============================================
 * 子弹 (Projectile) 数据结构
 * ============================================
 */
export const ProjectileSchema = {
  // 对象池标记
  active: "Boolean",         // true = 使用中, false = 已回收

  // 位置（像素坐标）
  position: {
    x: "Number",             // x_px
    y: "Number"              // y_px
  },

  // 速度（像素/秒）
  velocity: {
    x: "Number",             // vx
    y: "Number"              // vy
  },

  // 伤害
  damage: "Number",

  // 归属队伍
  team: "player | enemy"
};

/**
 * ============================================
 * 敌人 (Enemy) 数据结构
 * ============================================
 */
export const EnemySchema = {
  // 对象池标记
  active: "Boolean",

  // 类型
  type: "String",            // e.g., "basic_grunt", "exploder", "sniper"

  // 位置（像素坐标）
  position: {
    x: "Number",             // x_px
    y: "Number"              // y_px
  },

  // 速度（像素/秒）
  velocity: {
    x: "Number",
    y: "Number"
  },

  // 属性
  hp: "Number",
  maxHp: "Number",
  damage: "Number",
  moveSpeed: "Number",

  // 死亡奖励（击杀直充，无掉落物）
  rewardRed: "Number",       // 红资源（弹药）
  rewardGold: "Number"       // 金资源（金币）
};

/**
 * ============================================
 * 全局资源 (Resources) 数据结构
 * ============================================
 */
export const ResourcesSchema = {
  red: "Number",    // 🔴 弹药/能源（逻辑层 Float，UI层 Math.floor）
  blue: "Number",   // 🔵 建材/矿石
  gold: "Number"    // 🟡 金币/芯片
};

/**
 * 资源类型枚举
 */
export const ResourceType = {
  RED: "red",
  BLUE: "blue",
  GOLD: "gold"
};

/**
 * ============================================
 * 游戏状态 (GameState) 枚举
 * ============================================
 */
export const GameState = {
  TRAVEL: "TRAVEL",     // 旅途：背景卷动，正常生怪
  COMBAT: "COMBAT",     // 战斗：背景停止，双倍生怪
  SAFEHOUSE: "SAFEHOUSE", // 安全屋：商店和拼装
  PAUSED: "PAUSED"      // 暂停：拖拽组件时
};

/**
 * ============================================
 * 无人机光标 (DroneCursor) 数据结构
 * ============================================
 */
export const DroneCursorSchema = {
  // 当前位置（像素坐标）
  position: {
    x: "Number",           // x_px
    y: "Number"            // y_px
  },

  // 目标位置（像素坐标，通常是鼠标位置）
  targetPos: {
    x: "Number",           // x_px
    y: "Number"            // y_px
  },

  // 固定移动速度（像素/秒）
  moveSpeed: "Number",     // 常量：500 px/s

  // 渲染半径
  radius: "Number",        // 常量：8 px

  // 采集/攻击属性（可升级）
  miningPower: "Number",   // 采集效率
  attackPower: "Number"    // 攻击力
};

/**
 * ============================================
 * 网格管理器 (GridManager) 配置
 * ============================================
 */
export const GridConfig = {
  gridSize: 4,             // 网格尺寸 (4x4)
  cellSize_px: 80,         // 每个格子的像素大小

  // 网格在屏幕上的起始位置（像素坐标）
  gridOriginX_px: 100,
  gridOriginY_px: 200
};

/**
 * ============================================
 * 拖拽状态 (DragState) 枚举
 * ============================================
 */
export const DragState = {
  IDLE: "IDLE",           // 未拖拽
  DRAGGING: "DRAGGING"    // 拖拽中
};

/**
 * ============================================
 * 对象池配置
 * ============================================
 */
export const PoolConfig = {
  projectilePoolSize: 200, // 子弹池大小
  enemyPoolSize: 100       // 敌人池大小
};

/**
 * ============================================
 * 向量 (Vector2) 数据结构
 * ============================================
 */
export const Vector2Schema = {
  x: "Number",
  y: "Number"
};

/**
 * ============================================
 * 邻接方向常量
 * ============================================
 */
export const AdjacentDirections = [
  { col: -1, row: 0 },  // 左
  { col: 1, row: 0 },   // 右
  { col: 0, row: -1 },  // 上
  { col: 0, row: 1 }    // 下
];

/**
 * ============================================
 * Buff 配置
 * ============================================
 */
export const BuffConfig = {
  boosterMultiplier: 1.2  // BOOSTER 提供的加成倍率（+20%）
};

/**
 * ============================================
 * 采集资源点 (ResourceNode) 数据结构
 * ============================================
 */
export const ResourceNodeSchema = {
  // 位置（像素坐标）
  position: {
    x: "Number",           // x_px
    y: "Number"            // y_px
  },

  // 资源类型
  type: "red | blue | gold",

  // 资源量
  amount: "Number",

  // 采集进度
  miningProgress: "Number", // 0.0 - 1.0

  // 采集速度
  miningSpeed: "Number",    // 每秒增长的进度

  // 采集距离阈值
  miningRadius: "Number"    // 像素_px
};

/**
 * ============================================
 * 性能优化规范
 * ============================================
 */
export const PerformanceRules = {
  // 距离计算：必须使用距离平方
  useDistanceSquared: true,

  // 对象池：严禁在运行时使用 new
  noRuntimeNew: true,

  // 空间划分：实体数 > 100 时启用
  spatialPartitionThreshold: 100
};

/**
 * ============================================
 * 数值处理规范
 * ============================================
 */
export const NumberRules = {
  // 逻辑层使用 Float（支持 deltaTime）
  logicPrecision: "Float",

  // UI 层必须向下取整
  displayPrecision: "Math.floor()"
};

// 默认导出所有规范
export default {
  ComponentSchema,
  ComponentType,
  AttackPattern,
  ProjectileSchema,
  EnemySchema,
  ResourcesSchema,
  ResourceType,
  GameState,
  DroneCursorSchema,
  GridConfig,
  DragState,
  PoolConfig,
  Vector2Schema,
  AdjacentDirections,
  BuffConfig,
  ResourceNodeSchema,
  PerformanceRules,
  NumberRules
};
