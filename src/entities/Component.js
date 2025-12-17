/**
 * Component - 组件基类
 *
 * 所有游戏组件（武器、装甲、核心、增压器）的基类
 *
 * 核心概念：
 * - 组件是多格拼图（Polyomino），可占据多个网格格子
 * - 使用 gridShape 定义相对坐标
 * - 组件被毁留下空洞
 * - 邻接增压器可提供 Buff
 *
 * 数据字典规范：
 * - 严格遵守 ComponentSchema
 * - 所有字段名不可自由发挥
 */

import { ComponentType } from '../config/DataDictionary.js';

export default class Component {
  /**
   * 构造函数
   * @param {Object} config - 组件配置
   * @param {string} config.id - 唯一ID (e.g., "basic_gun_1")
   * @param {string} config.type - 组件类型（CORE, WEAPON, ARMOR, BOOSTER）
   * @param {Array<[number, number]>} config.gridShape - 相对坐标数组 [[0,0], [1,0]]
   * @param {Object} config.stats - 统计属性
   */
  constructor(config) {
    // 基础属性
    this.id = config.id || `component_${Date.now()}`;
    this.type = config.type || ComponentType.ARMOR;

    // 网格形状（相对坐标）
    // 例如：[[0,0], [1,0]] 表示水平 1x2
    this.gridShape = config.gridShape || [[0, 0]];

    // 网格位置（锚点的网格坐标）
    // 由 GridManager 在放置时设置
    this.gridPos = config.gridPos || { col: 0, row: 0 };

    // 统计属性
    this.stats = {
      // 通用属性
      hp: config.stats?.hp ?? 100,
      maxHp: config.stats?.maxHp ?? 100,

      // 武器专属
      damage: config.stats?.damage ?? 0,
      cooldown: config.stats?.cooldown ?? 1.0,  // 秒
      range: config.stats?.range ?? 200,        // 像素
      ammoCost: config.stats?.ammoCost ?? 1,
      pattern: config.stats?.pattern ?? 'NEAREST'  // NEAREST, CURSOR, AOE
    };

    // 运行时状态
    this.currentCooldown = 0;  // 当前冷却计时器

    // 邻接加成倍率（由 BuffSystem 计算）
    this.buffMultiplier = 1.0;

    // 视觉属性（可选）
    this.color = config.color || this.getDefaultColor();
  }

  /**
   * 更新组件（用于武器冷却等）
   * @param {number} deltaTime - 时间增量（秒）
   */
  update(deltaTime) {
    // 更新冷却（应用邻接加成）
    if (this.currentCooldown > 0) {
      this.currentCooldown -= deltaTime * this.buffMultiplier;
      if (this.currentCooldown < 0) {
        this.currentCooldown = 0;
      }
    }
  }

  /**
   * 受到伤害
   * @param {number} damage - 伤害值
   * @returns {boolean} 是否被摧毁
   */
  takeDamage(damage) {
    this.stats.hp -= damage;
    if (this.stats.hp < 0) {
      this.stats.hp = 0;
    }
    return this.stats.hp <= 0;
  }

  /**
   * 修复组件
   * @param {number} amount - 修复量
   */
  repair(amount) {
    this.stats.hp += amount;
    if (this.stats.hp > this.stats.maxHp) {
      this.stats.hp = this.stats.maxHp;
    }
  }

  /**
   * 检查是否存活
   * @returns {boolean}
   */
  isAlive() {
    return this.stats.hp > 0;
  }

  /**
   * 检查是否是武器
   * @returns {boolean}
   */
  isWeapon() {
    return this.type === ComponentType.WEAPON;
  }

  /**
   * 检查是否是核心
   * @returns {boolean}
   */
  isCore() {
    return this.type === ComponentType.CORE;
  }

  /**
   * 检查是否是增压器
   * @returns {boolean}
   */
  isBooster() {
    return this.type === ComponentType.BOOSTER;
  }

  /**
   * 检查冷却是否完成
   * @returns {boolean}
   */
  isCooldownReady() {
    return this.currentCooldown <= 0;
  }

  /**
   * 重置冷却
   */
  resetCooldown() {
    this.currentCooldown = this.stats.cooldown;
  }

  /**
   * 获取生命值百分比
   * @returns {number} 0-1
   */
  getHealthPercent() {
    if (this.stats.maxHp <= 0) return 0;
    return this.stats.hp / this.stats.maxHp;
  }

  /**
   * 根据类型获取默认颜色
   * @returns {string}
   */
  getDefaultColor() {
    const colors = {
      [ComponentType.CORE]: '#FF00FF',    // 紫色
      [ComponentType.WEAPON]: '#FFFF00',  // 黄色
      [ComponentType.ARMOR]: '#00FFFF',   // 青色
      [ComponentType.BOOSTER]: '#FF8800'  // 橙色
    };
    return colors[this.type] || '#FFFFFF';
  }

  /**
   * 获取组件信息（用于调试）
   * @returns {string}
   */
  getInfo() {
    return `${this.type} [${this.id}] HP:${Math.floor(this.stats.hp)}/${this.stats.maxHp} Buff:${this.buffMultiplier.toFixed(2)}x`;
  }

  /**
   * 克隆组件
   * @returns {Component}
   */
  clone() {
    return new Component({
      id: `${this.id}_clone_${Date.now()}`,
      type: this.type,
      gridShape: [...this.gridShape.map(([col, row]) => [col, row])],
      stats: { ...this.stats },
      color: this.color
    });
  }

  /**
   * 序列化为 JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      gridShape: this.gridShape,
      gridPos: this.gridPos,
      stats: this.stats,
      currentCooldown: this.currentCooldown,
      buffMultiplier: this.buffMultiplier
    };
  }

  /**
   * 从 JSON 反序列化
   * @param {Object} json
   * @returns {Component}
   */
  static fromJSON(json) {
    const component = new Component({
      id: json.id,
      type: json.type,
      gridShape: json.gridShape,
      stats: json.stats
    });
    component.gridPos = json.gridPos;
    component.currentCooldown = json.currentCooldown || 0;
    component.buffMultiplier = json.buffMultiplier || 1.0;
    return component;
  }
}
