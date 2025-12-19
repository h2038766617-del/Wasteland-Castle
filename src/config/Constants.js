/**
 * 全局常量配置 (Constants)
 *
 * 集中管理所有游戏常量，避免魔法数字
 * 所有数值可在此调整以便平衡测试
 *
 * 版本：v1.0
 */

/**
 * ============================================
 * Canvas 配置
 * ============================================
 */
export const CANVAS = {
  // Canvas ID
  ID: 'gameCanvas',

  // DPI 适配
  USE_DEVICE_PIXEL_RATIO: true,

  // 默认尺寸（会被窗口大小覆盖）
  DEFAULT_WIDTH: 1920,
  DEFAULT_HEIGHT: 1080,

  // 背景色
  BACKGROUND_COLOR: '#0a0a0a'
};

/**
 * ============================================
 * 无人机光标配置
 * ============================================
 */
export const DRONE = {
  // 移动速度（像素/秒）- 固定速度，无加速度
  MOVE_SPEED: 500,

  // 渲染属性
  RADIUS: 8,
  COLOR: '#00FFFF',
  LINE_COLOR: '#00FFFF44',
  LINE_WIDTH: 2,

  // 吸附阈值（像素）
  SNAP_THRESHOLD: 5,

  // 初始位置（像素坐标）
  INITIAL_X_PX: 400,
  INITIAL_Y_PX: 300
};

/**
 * ============================================
 * 网格配置
 * ============================================
 */
export const GRID = {
  // 网格尺寸
  SIZE: 4,  // 4x4

  // 每个格子的像素大小
  CELL_SIZE_PX: 80,

  // 网格在屏幕上的起始位置（像素坐标）
  ORIGIN_X_PX: 100,
  ORIGIN_Y_PX: 200,

  // 渲染样式
  BORDER_COLOR: '#333333',
  BORDER_WIDTH: 2,
  GRID_LINE_COLOR: '#1a1a1a',
  GRID_LINE_WIDTH: 1,

  // 预览样式
  PREVIEW_VALID_COLOR: '#00FF0044',    // 绿色半透明
  PREVIEW_INVALID_COLOR: '#FF000044',  // 红色半透明
  PREVIEW_ALPHA: 0.5
};

/**
 * ============================================
 * 资源配置
 * ============================================
 */
export const RESOURCES = {
  // 初始资源
  INITIAL: {
    RED: 100,   // 弹药
    BLUE: 50,   // 建材
    GOLD: 0     // 金币
  },

  // UI 显示
  DISPLAY_PRECISION: 'floor',  // 向下取整

  // 资源图标颜色
  COLORS: {
    RED: '#FF3333',
    BLUE: '#3333FF',
    GOLD: '#FFD700'
  },

  // 资源点配置
  NODE: {
    MINING_RADIUS: 50,           // 采集半径（像素）
    MINING_SPEED: 1.0,           // 采集速度（进度/秒）
    PROGRESS_RING_RADIUS: 20,    // 进度条半径
    PROGRESS_RING_WIDTH: 4       // 进度条宽度
  }
};

/**
 * ============================================
 * 组件配置
 * ============================================
 */
export const COMPONENT = {
  // 邻接加成
  BUFF: {
    BOOSTER_MULTIPLIER: 1.2  // +20% 攻速/伤害
  },

  // 组件渲染
  RENDER: {
    BORDER_WIDTH: 2,
    HP_BAR_HEIGHT: 4,
    HP_BAR_OFFSET_Y: -10,
    HP_BAR_BG_COLOR: '#333333',
    HP_BAR_FG_COLOR: '#00FF00',
    HP_BAR_LOW_COLOR: '#FF0000'  // 血量 < 30%
  },

  // 组件类型颜色
  TYPE_COLORS: {
    CORE: '#FF00FF',     // 紫色
    WEAPON: '#FFFF00',   // 黄色
    ARMOR: '#00FFFF',    // 青色
    BOOSTER: '#FF8800'   // 橙色
  }
};

/**
 * ============================================
 * 子弹配置
 * ============================================
 */
export const PROJECTILE = {
  // 对象池大小
  POOL_SIZE: 200,

  // 默认属性
  DEFAULT_SPEED: 400,      // 像素/秒
  DEFAULT_SIZE: 4,         // 渲染大小

  // 渲染颜色
  PLAYER_COLOR: '#FFFF00', // 玩家子弹：黄色
  ENEMY_COLOR: '#FF0000',  // 敌人子弹：红色

  // 边界检查偏移（超出屏幕多少像素后回收）
  BOUNDARY_OFFSET: 50
};

/**
 * ============================================
 * 敌人配置
 * ============================================
 */
export const ENEMY = {
  // 对象池大小
  POOL_SIZE: 100,

  // 生成位置（屏幕右侧外）
  SPAWN_OFFSET_X: 100,

  // 默认属性
  DEFAULT: {
    MOVE_SPEED: 100,     // 像素/秒
    HP: 50,
    DAMAGE: 10,
    SIZE: 20,            // 渲染大小
    COLOR: '#FF4444'
  },

  // 敌人类型定义
  TYPES: {
    BASIC_GRUNT: {
      type: 'basic_grunt',
      hp: 50,
      moveSpeed: 100,
      damage: 10,
      rewardRed: 5,
      rewardGold: 1,
      color: '#FF4444',
      size: 20
    },

    FAST_RUNNER: {
      type: 'fast_runner',
      hp: 30,
      moveSpeed: 200,
      damage: 15,
      rewardRed: 8,
      rewardGold: 2,
      color: '#FF8844',
      size: 15
    },

    HEAVY_TANK: {
      type: 'heavy_tank',
      hp: 150,
      moveSpeed: 50,
      damage: 30,
      rewardRed: 20,
      rewardGold: 5,
      color: '#884444',
      size: 30
    }
  },

  // 生成配置
  SPAWN: {
    BASE_INTERVAL: 2.0,      // 基础生成间隔（秒）
    MIN_INTERVAL: 0.5,       // 最小生成间隔
    DIFFICULTY_SCALE: 0.95   // 每次生成后间隔 * 此值（难度递增）
  }
};

/**
 * ============================================
 * 武器配置
 * ============================================
 */
export const WEAPON = {
  // 武器类型定义
  TYPES: {
    BASIC_GUN: {
      id: 'basic_gun',
      type: 'WEAPON',
      gridShape: [[0, 0]],  // 1x1
      stats: {
        damage: 10,
        cooldown: 0.5,       // 秒
        range: 300,          // 像素
        ammoCost: 1,
        pattern: 'NEAREST'
      },
      hp: 100,
      maxHp: 100
    },

    HEAVY_CANNON: {
      id: 'heavy_cannon',
      type: 'WEAPON',
      gridShape: [[0, 0], [1, 0]],  // 1x2
      stats: {
        damage: 50,
        cooldown: 2.0,
        range: 400,
        ammoCost: 5,
        pattern: 'NEAREST'
      },
      hp: 150,
      maxHp: 150
    },

    CURSOR_LASER: {
      id: 'cursor_laser',
      type: 'WEAPON',
      gridShape: [[0, 0]],
      stats: {
        damage: 15,
        cooldown: 0.3,
        range: 500,
        ammoCost: 2,
        pattern: 'CURSOR'  // 光标引导
      },
      hp: 80,
      maxHp: 80
    }
  }
};

/**
 * ============================================
 * 装甲配置
 * ============================================
 */
export const ARMOR = {
  TYPES: {
    BASIC_PLATE: {
      id: 'basic_plate',
      type: 'ARMOR',
      gridShape: [[0, 0]],
      stats: {},
      hp: 200,
      maxHp: 200
    },

    HEAVY_PLATE: {
      id: 'heavy_plate',
      type: 'ARMOR',
      gridShape: [[0, 0], [0, 1]],  // 2x1 竖直
      stats: {},
      hp: 400,
      maxHp: 400
    }
  }
};

/**
 * ============================================
 * 核心配置
 * ============================================
 */
export const CORE = {
  DEFAULT: {
    id: 'core_main',
    type: 'CORE',
    gridShape: [[0, 0]],
    stats: {},
    hp: 500,
    maxHp: 500
  },

  // 核心初始位置（网格坐标）
  INITIAL_POS: {
    col: 1,
    row: 1
  }
};

/**
 * ============================================
 * 增压器配置
 * ============================================
 */
export const BOOSTER = {
  TYPES: {
    BASIC_BOOSTER: {
      id: 'basic_booster',
      type: 'BOOSTER',
      gridShape: [[0, 0]],
      stats: {},
      hp: 50,
      maxHp: 50
    }
  }
};

/**
 * ============================================
 * 碰撞检测配置
 * ============================================
 */
export const COLLISION = {
  // 使用距离平方优化
  USE_DISTANCE_SQUARED: true,

  // 碰撞半径
  PROJECTILE_ENEMY_RADIUS: 10,  // 子弹-敌人
  DRONE_RESOURCE_RADIUS: 50,    // 光标-资源点
  ENEMY_COMPONENT_RADIUS: 15    // 敌人-组件
};

/**
 * ============================================
 * UI 配置
 * ============================================
 */
export const UI = {
  // 资源栏
  RESOURCE_BAR: {
    X: 20,
    Y: 20,
    SPACING: 120,
    FONT: '20px monospace',
    ICON_SIZE: 16
  },

  // 仓库区（底部）
  INVENTORY: {
    HEIGHT: 100,
    BACKGROUND_COLOR: '#1a1a1a',
    ITEM_SIZE: 80,
    PADDING: 10,
    SPACING: 10
  },

  // 暂停菜单
  PAUSE_MENU: {
    BACKGROUND_COLOR: '#000000AA',
    FONT: '40px monospace',
    BUTTON_WIDTH: 200,
    BUTTON_HEIGHT: 50
  }
};

/**
 * ============================================
 * 背景卷轴配置
 * ============================================
 */
export const SCROLL = {
  // 卷动速度（像素/秒）
  TRAVEL_SPEED: 100,    // TRAVEL 状态
  COMBAT_SPEED: 0,      // COMBAT 状态（停止）

  // 载具位置（屏幕左侧 1/3）
  VEHICLE_X_RATIO: 0.33
};

/**
 * ============================================
 * 游戏流程配置
 * ============================================
 */
export const GAME_FLOW = {
  // 初始状态
  INITIAL_STATE: 'TRAVEL',

  // 关卡配置
  LEVEL: {
    TRAVEL_DURATION: 60,     // 旅途持续时间（秒）
    COMBAT_TRIGGER_DISTANCE: 1000  // 触发战斗的距离
  }
};

/**
 * ============================================
 * 性能配置
 * ============================================
 */
export const PERFORMANCE = {
  // 空间划分阈值
  SPATIAL_PARTITION_THRESHOLD: 100,

  // 最大帧率
  MAX_FPS: 60,

  // deltaTime 上限（避免卡顿导致物理穿透）
  MAX_DELTA_TIME: 0.1  // 100ms
};

/**
 * ============================================
 * 调试配置
 * ============================================
 */
export const DEBUG = {
  // 显示调试信息
  SHOW_FPS: true,
  SHOW_DRONE_POS: true,
  SHOW_GRID_COORDS: false,
  SHOW_COLLISION_RADIUS: false,

  // 调试颜色
  COLORS: {
    COLLISION_RADIUS: '#FF00FF44',
    GRID_HIGHLIGHT: '#FFFF0044'
  }
};

// 默认导出所有常量
export default {
  CANVAS,
  DRONE,
  GRID,
  RESOURCES,
  COMPONENT,
  PROJECTILE,
  ENEMY,
  WEAPON,
  ARMOR,
  CORE,
  BOOSTER,
  COLLISION,
  UI,
  SCROLL,
  GAME_FLOW,
  PERFORMANCE,
  DEBUG
};
