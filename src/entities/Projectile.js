/**
 * Projectile.js
 * 弹幕/子弹实体
 *
 * 职责：
 * - 存储子弹的位置、速度、伤害
 * - 更新子弹位置
 * - 检测是否超出屏幕边界
 * - 渲染子弹
 *
 * 注意：
 * - 使用对象池管理，避免频繁 new/delete
 * - 坐标使用像素 (position.x, position.y)
 * - 速度使用像素/秒 (velocity.x, velocity.y)
 */

import * as Vector2 from '../utils/Vector2.js';

/**
 * 子弹类
 */
export default class Projectile {
  /**
   * 构造函数
   */
  constructor() {
    // 对象池标记
    this.active = false;

    // 位置（像素坐标）
    this.position = { x: 0, y: 0 };

    // 速度（像素/秒）
    this.velocity = { x: 0, y: 0 };

    // 伤害
    this.damage = 0;

    // 归属队伍
    this.team = 'player'; // 'player' | 'enemy'

    // 渲染属性（不在 Schema 中，但方便渲染）
    this.radius = 3;
    this.color = '#FFFF00'; // 黄色
  }

  /**
   * 初始化子弹（从对象池获取时调用）
   * @param {Object} config - 配置对象
   * @param {Object} config.position - 初始位置 { x, y }
   * @param {Object} config.velocity - 速度向量 { x, y }
   * @param {Number} config.damage - 伤害值
   * @param {String} config.team - 队伍 ('player' | 'enemy')
   */
  init(config) {
    this.active = true;
    this.position = { ...config.position };
    this.velocity = { ...config.velocity };
    this.damage = config.damage || 10;
    this.team = config.team || 'player';

    // 根据队伍设置颜色
    this.color = this.team === 'player' ? '#FFFF00' : '#FF0000';
    this.radius = this.team === 'player' ? 3 : 4;
  }

  /**
   * 重置子弹（回收到对象池时调用）
   */
  reset() {
    this.active = false;
    this.position = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.damage = 0;
    this.team = 'player';
  }

  /**
   * 更新子弹位置
   * @param {Number} deltaTime - 时间增量（秒）
   */
  update(deltaTime) {
    if (!this.active) return;

    // 更新位置：position += velocity * deltaTime
    const movement = Vector2.multiply(this.velocity, deltaTime);
    this.position = Vector2.add(this.position, movement);
  }

  /**
   * 渲染子弹
   * @param {CanvasRenderingContext2D} ctx - Canvas 渲染上下文
   */
  render(ctx) {
    if (!this.active) return;

    ctx.save();

    // 绘制子弹（圆形）
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // 绘制发光效果
    ctx.strokeStyle = this.color + 'AA';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius + 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 检查子弹是否超出屏幕边界
   * @param {Number} screenWidth - 屏幕宽度
   * @param {Number} screenHeight - 屏幕高度
   * @returns {Boolean} 是否超出边界
   */
  isOutOfBounds(screenWidth, screenHeight) {
    const margin = 50; // 超出边界 50px 后才回收
    return (
      this.position.x < -margin ||
      this.position.x > screenWidth + margin ||
      this.position.y < -margin ||
      this.position.y > screenHeight + margin
    );
  }

  /**
   * 获取子弹的包围盒（用于碰撞检测）
   * @returns {Object} { x, y, radius }
   */
  getBounds() {
    return {
      x: this.position.x,
      y: this.position.y,
      radius: this.radius
    };
  }

  /**
   * 序列化（调试用）
   * @returns {Object}
   */
  serialize() {
    return {
      active: this.active,
      position: { ...this.position },
      velocity: { ...this.velocity },
      damage: this.damage,
      team: this.team
    };
  }
}
