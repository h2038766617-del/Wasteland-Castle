/**
 * Obstacle.js
 * 障碍物实体
 *
 * 职责：
 * - 存储障碍物的位置、类型、生命值
 * - 管理挖掘进度
 * - 检测与载具的碰撞（阻挡）
 * - 渲染障碍物
 *
 * 障碍物类型：
 * - TREE: 树木（给蓝色建材）
 * - ROCK: 巨石（给红色弹药）
 */

import { RESOURCES } from '../config/Constants.js';

/**
 * 障碍物类
 */
export default class Obstacle {
  /**
   * 构造函数
   */
  constructor() {
    // 对象池标记
    this.active = false;

    // 障碍物类型：'TREE', 'ROCK'
    this.obstacleType = 'TREE';

    // 位置（世界坐标，像素）
    this.worldX = 0;
    this.worldY = 0;

    // 生命值（挖掘需要的时间）
    this.hp = 100;
    this.maxHp = 100;

    // 挖掘配置
    this.digTime = 3.0; // 挖掘所需时间（秒）
    this.digProgress = 0; // 当前挖掘进度（0-1）
    this.isBeingDug = false; // 是否正在被挖掘

    // 挖掘者引用
    this.digger = null;

    // 视觉属性
    this.width = 60;
    this.height = 80;
    this.color = '#228B22'; // 默认绿色（树木）

    // 是否已被清除
    this.cleared = false;

    // 是否正在阻挡载具
    this.isBlocking = false;

    // 资源奖励
    this.rewardAmount = 20;
  }

  /**
   * 初始化障碍物（从对象池获取时调用）
   * @param {Object} config - 配置对象
   * @param {String} config.obstacleType - 障碍物类型 ('TREE', 'ROCK')
   * @param {Number} config.worldX - 世界 X 坐标
   * @param {Number} config.worldY - 世界 Y 坐标
   * @param {Number} config.hp - 生命值
   * @param {Number} config.digTime - 挖掘所需时间（秒）
   */
  init(config) {
    this.active = true;
    this.obstacleType = config.obstacleType || 'TREE';
    this.worldX = config.worldX || 0;
    this.worldY = config.worldY || 0;
    this.hp = config.hp || 100;
    this.maxHp = config.maxHp || this.hp;
    this.digTime = config.digTime || 3.0;

    // 重置挖掘状态
    this.digProgress = 0;
    this.isBeingDug = false;
    this.digger = null;
    this.cleared = false;
    this.isBlocking = false;

    // 根据障碍物类型设置属性
    switch (this.obstacleType) {
      case 'TREE':
        this.color = '#228B22'; // 森林绿
        this.width = 50;
        this.height = 100;
        this.rewardAmount = 15; // 建材
        break;
      case 'ROCK':
        this.color = '#696969'; // 深灰色
        this.width = 70;
        this.height = 70;
        this.rewardAmount = 20; // 弹药
        break;
    }
  }

  /**
   * 开始挖掘
   * @param {Object} digger - 挖掘者对象（光标）
   */
  startDig(digger) {
    if (!this.isBeingDug) {
      this.isBeingDug = true;
      this.digger = digger;
      this.digProgress = 0;
    }
  }

  /**
   * 停止挖掘
   */
  stopDig() {
    this.isBeingDug = false;
    this.digger = null;
    this.digProgress = 0;
  }

  /**
   * 更新挖掘进度
   * @param {Number} deltaTime - 时间增量（秒）
   * @returns {Boolean} - 是否挖掘完成
   */
  updateDig(deltaTime) {
    if (!this.isBeingDug) {
      return false;
    }

    // 更新进度
    this.digProgress += deltaTime / this.digTime;

    // 检查是否完成
    if (this.digProgress >= 1.0) {
      this.digProgress = 1.0;
      this.cleared = true;
      return true; // 挖掘完成
    }

    return false;
  }

  /**
   * 检测点是否在障碍物范围内
   * @param {Number} x - X 坐标（屏幕坐标）
   * @param {Number} y - Y 坐标（屏幕坐标）
   * @param {Number} screenX - 障碍物的屏幕 X 坐标
   * @param {Number} screenY - 障碍物的屏幕 Y 坐标
   * @returns {Boolean}
   */
  containsPoint(x, y, screenX, screenY) {
    return (
      x >= screenX - this.width / 2 &&
      x <= screenX + this.width / 2 &&
      y >= screenY - this.height / 2 &&
      y <= screenY + this.height / 2
    );
  }

  /**
   * 检测是否与载具碰撞（阻挡检测）
   * @param {Number} vehicleX - 载具 X 坐标（屏幕坐标）
   * @param {Number} vehicleY - 载具 Y 坐标（屏幕坐标）
   * @param {Number} vehicleWidth - 载具宽度
   * @param {Number} vehicleHeight - 载具高度
   * @param {Number} screenX - 障碍物的屏幕 X 坐标
   * @param {Number} screenY - 障碍物的屏幕 Y 坐标
   * @returns {Boolean}
   */
  checkVehicleCollision(vehicleX, vehicleY, vehicleWidth, vehicleHeight, screenX, screenY) {
    // 矩形碰撞检测
    const obstacleLeft = screenX - this.width / 2;
    const obstacleRight = screenX + this.width / 2;
    const obstacleTop = screenY - this.height / 2;
    const obstacleBottom = screenY + this.height / 2;

    const vehicleLeft = vehicleX - vehicleWidth / 2;
    const vehicleRight = vehicleX + vehicleWidth / 2;
    const vehicleTop = vehicleY - vehicleHeight / 2;
    const vehicleBottom = vehicleY + vehicleHeight / 2;

    return (
      obstacleLeft < vehicleRight &&
      obstacleRight > vehicleLeft &&
      obstacleTop < vehicleBottom &&
      obstacleBottom > vehicleTop
    );
  }

  /**
   * 渲染障碍物
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {Number} screenX - 屏幕 X 坐标
   * @param {Number} screenY - 屏幕 Y 坐标
   */
  render(ctx, screenX, screenY) {
    if (!this.active || this.cleared) {
      return;
    }

    ctx.save();

    // 如果正在阻挡，添加红色高亮
    if (this.isBlocking) {
      ctx.shadowColor = '#FF0000';
      ctx.shadowBlur = 20;
    }

    // 绘制障碍物主体
    if (this.obstacleType === 'TREE') {
      this.renderTree(ctx, screenX, screenY);
    } else if (this.obstacleType === 'ROCK') {
      this.renderRock(ctx, screenX, screenY);
    }

    // 如果正在被挖掘，绘制挖掘进度条
    if (this.isBeingDug && this.digProgress > 0) {
      this.renderDigProgress(ctx, screenX, screenY);
    }

    // 如果正在阻挡，显示警告标识
    if (this.isBlocking) {
      this.renderBlockingWarning(ctx, screenX, screenY);
    }

    ctx.restore();
  }

  /**
   * 渲染树木
   * @param {CanvasRenderingContext2D} ctx
   * @param {Number} screenX
   * @param {Number} screenY
   */
  renderTree(ctx, screenX, screenY) {
    // 树冠（绿色圆形）
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(screenX, screenY - 20, 25, 0, Math.PI * 2);
    ctx.fill();

    // 树干（棕色矩形）
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(screenX - 8, screenY, 16, 40);

    // 边框
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(screenX, screenY - 20, 25, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * 渲染巨石
   * @param {CanvasRenderingContext2D} ctx
   * @param {Number} screenX
   * @param {Number} screenY
   */
  renderRock(ctx, screenX, screenY) {
    // 巨石（灰色多边形）
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY - 35);
    ctx.lineTo(screenX + 30, screenY - 10);
    ctx.lineTo(screenX + 25, screenY + 35);
    ctx.lineTo(screenX - 25, screenY + 35);
    ctx.lineTo(screenX - 30, screenY - 10);
    ctx.closePath();
    ctx.fill();

    // 边框
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 裂纹（装饰）
    ctx.strokeStyle = '#505050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(screenX - 10, screenY - 15);
    ctx.lineTo(screenX + 10, screenY + 10);
    ctx.stroke();
  }

  /**
   * 渲染挖掘进度条
   * @param {CanvasRenderingContext2D} ctx
   * @param {Number} screenX
   * @param {Number} screenY
   */
  renderDigProgress(ctx, screenX, screenY) {
    const barWidth = 60;
    const barHeight = 6;
    const barX = screenX - barWidth / 2;
    const barY = screenY + this.height / 2 + 10;

    // 背景条
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // 进度条（黄色）
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(barX, barY, barWidth * this.digProgress, barHeight);

    // 边框
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // 百分比文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const percentage = Math.floor(this.digProgress * 100);
    ctx.fillText(`${percentage}%`, screenX, barY + barHeight + 2);
  }

  /**
   * 渲染阻挡警告
   * @param {CanvasRenderingContext2D} ctx
   * @param {Number} screenX
   * @param {Number} screenY
   */
  renderBlockingWarning(ctx, screenX, screenY) {
    // 感叹号警告标识
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', screenX, screenY - this.height / 2 - 20);
  }

  /**
   * 获取资源奖励
   * @returns {Object} - { type: 'BLUE'|'RED', amount: Number }
   */
  getReward() {
    let resourceType = 'BLUE';
    if (this.obstacleType === 'TREE') {
      resourceType = 'BLUE'; // 树木给建材（蓝色）
    } else if (this.obstacleType === 'ROCK') {
      resourceType = 'RED'; // 石头给弹药（红色）
    }

    return {
      type: resourceType,
      amount: this.rewardAmount
    };
  }

  /**
   * 重置障碍物（返回对象池）
   */
  reset() {
    this.active = false;
    this.cleared = false;
    this.isBeingDug = false;
    this.digger = null;
    this.digProgress = 0;
    this.isBlocking = false;
  }
}
