/**
 * Enemy.js
 * 敌人实体
 *
 * 职责：
 * - 存储敌人的位置、速度、属性
 * - 更新敌人位置（AI 移动）
 * - 渲染敌人
 *
 * 注意：
 * - 使用对象池管理，避免频繁 new/delete
 * - 坐标使用像素 (position.x, position.y)
 * - 速度使用像素/秒 (velocity.x, velocity.y)
 */

import * as Vector2 from '../utils/Vector2.js';

/**
 * 敌人类
 */
export default class Enemy {
  /**
   * 构造函数
   */
  constructor() {
    // 对象池标记
    this.active = false;

    // 类型
    this.type = 'basic_grunt';

    // 位置（像素坐标）
    this.position = { x: 0, y: 0 };

    // 速度（像素/秒）
    this.velocity = { x: 0, y: 0 };

    // 属性
    this.hp = 50;
    this.maxHp = 50;
    this.damage = 10;
    this.moveSpeed = 30;

    // 死亡奖励
    this.rewardRed = 5;
    this.rewardGold = 1;

    // 渲染属性（不在 Schema 中，但方便渲染）
    this.radius = 15;
    this.color = '#FF3333';

    // AI 状态
    this.targetPosition = null; // 当前目标位置
    this.attackCooldown = 0; // 攻击冷却计时器（秒）
    this.attackInterval = 1.0; // 攻击间隔（秒）

    // 视觉反馈
    this.hitFlash = 0; // 受击闪光计时器（秒）
  }

  /**
   * 初始化敌人（从对象池获取时调用）
   * @param {Object} config - 配置对象
   * @param {String} config.type - 敌人类型
   * @param {Object} config.position - 初始位置 { x, y }
   * @param {Number} config.hp - 生命值
   * @param {Number} config.damage - 伤害
   * @param {Number} config.moveSpeed - 移动速度
   */
  init(config) {
    this.active = true;
    this.type = config.type || 'basic_grunt';
    this.position = { ...config.position };
    this.velocity = { x: 0, y: 0 };

    // 根据类型设置属性
    this.hp = config.hp || 50;
    this.maxHp = config.maxHp || this.hp;
    this.damage = config.damage || 10;
    this.moveSpeed = config.moveSpeed || 30;

    // 奖励
    this.rewardRed = config.rewardRed || 5;
    this.rewardGold = config.rewardGold || 1;

    // 根据类型设置外观
    this.setAppearanceByType(this.type);

    // 重置 AI 状态
    this.targetPosition = null;
    this.attackCooldown = 0;
  }

  /**
   * 重置敌人（回收到对象池时调用）
   */
  reset() {
    this.active = false;
    this.position = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.hp = 50;
    this.targetPosition = null;
    this.attackCooldown = 0;
  }

  /**
   * 根据类型设置外观
   * @param {String} type - 敌人类型
   */
  setAppearanceByType(type) {
    switch (type) {
      case 'basic_grunt':
        this.radius = 15;
        this.color = '#FF3333';
        break;

      case 'fast_runner':
        this.radius = 12;
        this.color = '#FF9933';
        break;

      case 'heavy_tank':
        this.radius = 20;
        this.color = '#CC0000';
        break;

      default:
        this.radius = 15;
        this.color = '#FF3333';
    }
  }

  /**
   * 更新敌人（AI 移动）
   * @param {Number} deltaTime - 时间增量（秒）
   * @param {Object} targetPos - 目标位置 { x, y }（通常是网格中心）
   */
  update(deltaTime, targetPos) {
    if (!this.active) return;

    // 更新攻击冷却
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
      if (this.attackCooldown < 0) {
        this.attackCooldown = 0;
      }
    }

    // 更新受击闪光
    if (this.hitFlash > 0) {
      this.hitFlash -= deltaTime;
      if (this.hitFlash < 0) {
        this.hitFlash = 0;
      }
    }

    // 更新目标位置
    this.targetPosition = targetPos;

    if (this.targetPosition) {
      // 计算朝向目标的方向
      const direction = Vector2.subtract(this.targetPosition, this.position);
      const distance = Vector2.length(direction);

      if (distance > 10) { // 距离目标 10px 以上才移动
        const normalizedDirection = Vector2.normalize(direction);
        this.velocity = Vector2.multiply(normalizedDirection, this.moveSpeed);

        // 更新位置
        const movement = Vector2.multiply(this.velocity, deltaTime);
        this.position = Vector2.add(this.position, movement);
      } else {
        // 到达目标，停止移动
        this.velocity = { x: 0, y: 0 };
      }
    }
  }

  /**
   * 检查是否可以攻击
   * @returns {Boolean}
   */
  canAttack() {
    return this.attackCooldown <= 0;
  }

  /**
   * 执行攻击（重置冷却）
   * @returns {Number} 伤害值
   */
  attack() {
    if (!this.canAttack()) return 0;

    this.attackCooldown = this.attackInterval;
    return this.damage;
  }

  /**
   * 受到伤害
   * @param {Number} damage - 伤害值
   * @returns {Boolean} 是否死亡
   */
  takeDamage(damage) {
    this.hp -= damage;
    this.hitFlash = 0.15; // 设置受击闪光效果（150ms）
    return this.hp <= 0;
  }

  /**
   * 渲染敌人
   * @param {CanvasRenderingContext2D} ctx - Canvas 渲染上下文
   */
  render(ctx) {
    if (!this.active) return;

    ctx.save();

    // 绘制敌人身体（圆形）
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // 受击闪光效果
    if (this.hitFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.hitFlash * 4})`; // 闪光强度随时间衰减
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 绘制边框
    ctx.strokeStyle = this.color.replace('33', '00'); // 更深的颜色
    ctx.lineWidth = 2;
    ctx.stroke();

    // 绘制血条
    this.renderHealthBar(ctx);

    ctx.restore();
  }

  /**
   * 渲染血条
   * @param {CanvasRenderingContext2D} ctx - Canvas 渲染上下文
   */
  renderHealthBar(ctx) {
    const hpPercent = this.hp / this.maxHp;
    const barWidth = this.radius * 2;
    const barHeight = 4;
    const barX = this.position.x - barWidth / 2;
    const barY = this.position.y - this.radius - 10;

    // 背景（灰色）
    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // 当前血量（绿色到红色渐变）
    if (hpPercent > 0.5) {
      ctx.fillStyle = '#00FF00';
    } else if (hpPercent > 0.25) {
      ctx.fillStyle = '#FFFF00';
    } else {
      ctx.fillStyle = '#FF0000';
    }
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
  }

  /**
   * 获取敌人的包围盒（用于碰撞检测）
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
   * 获取到目标的距离
   * @param {Object} targetPos - 目标位置 { x, y }
   * @returns {Number} 距离
   */
  getDistanceTo(targetPos) {
    return Vector2.distance(this.position, targetPos);
  }

  /**
   * 序列化（调试用）
   * @returns {Object}
   */
  serialize() {
    return {
      active: this.active,
      type: this.type,
      position: { ...this.position },
      velocity: { ...this.velocity },
      hp: this.hp,
      maxHp: this.maxHp,
      damage: this.damage,
      moveSpeed: this.moveSpeed
    };
  }
}
