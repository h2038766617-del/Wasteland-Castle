/**
 * ResourceNode.js
 * 资源节点实体
 *
 * 职责：
 * - 存储资源节点的位置、类型、数量
 * - 管理采集进度
 * - 渲染资源节点
 *
 * 采集机制：
 * - 光标悬停在资源节点上时开始采集
 * - 显示圆形采集进度条（Channeling Ring）
 * - 填满后采集成功，给予资源
 */

import { RESOURCES } from '../config/Constants.js';

/**
 * 资源节点类
 */
export default class ResourceNode {
  /**
   * 构造函数
   */
  constructor() {
    // 对象池标记
    this.active = false;

    // 资源类型：'RED', 'BLUE', 'GOLD'
    this.resourceType = 'RED';

    // 位置（世界坐标，像素）
    this.worldX = 0;
    this.worldY = 0;

    // 资源数量
    this.amount = 10;

    // 采集配置
    this.harvestTime = 2.0; // 采集所需时间（秒）
    this.harvestProgress = 0; // 当前采集进度（0-1）
    this.isBeingHarvested = false; // 是否正在被采集

    // 采集者引用（用于显示进度条）
    this.harvester = null;

    // 视觉属性
    this.radius = 20;
    this.color = RESOURCES.COLORS.RED;

    // 是否已被采集完成
    this.collected = false;
  }

  /**
   * 初始化资源节点（从对象池获取时调用）
   * @param {Object} config - 配置对象
   * @param {String} config.resourceType - 资源类型 ('RED', 'BLUE', 'GOLD')
   * @param {Number} config.worldX - 世界 X 坐标
   * @param {Number} config.worldY - 世界 Y 坐标
   * @param {Number} config.amount - 资源数量
   * @param {Number} config.harvestTime - 采集所需时间（秒）
   */
  init(config) {
    this.active = true;
    this.resourceType = config.resourceType || 'RED';
    this.worldX = config.worldX || 0;
    this.worldY = config.worldY || 0;
    this.amount = config.amount || 10;
    this.harvestTime = config.harvestTime || 2.0;

    // 重置采集状态
    this.harvestProgress = 0;
    this.isBeingHarvested = false;
    this.harvester = null;
    this.collected = false;

    // 根据资源类型设置颜色和大小
    switch (this.resourceType) {
      case 'RED':
        this.color = RESOURCES.COLORS.RED;
        this.radius = 20;
        break;
      case 'BLUE':
        this.color = RESOURCES.COLORS.BLUE;
        this.radius = 22;
        break;
      case 'GOLD':
        this.color = RESOURCES.COLORS.GOLD;
        this.radius = 18;
        break;
    }
  }

  /**
   * 开始采集
   * @param {Object} harvester - 采集者对象（光标）
   */
  startHarvest(harvester) {
    if (!this.isBeingHarvested) {
      this.isBeingHarvested = true;
      this.harvester = harvester;
      this.harvestProgress = 0;
    }
  }

  /**
   * 停止采集
   */
  stopHarvest() {
    this.isBeingHarvested = false;
    this.harvester = null;
    this.harvestProgress = 0;
  }

  /**
   * 更新采集进度
   * @param {Number} deltaTime - 时间增量（秒）
   * @returns {Boolean} - 是否采集完成
   */
  updateHarvest(deltaTime) {
    if (!this.isBeingHarvested) {
      return false;
    }

    // 更新进度
    this.harvestProgress += deltaTime / this.harvestTime;

    // 检查是否完成
    if (this.harvestProgress >= 1.0) {
      this.harvestProgress = 1.0;
      this.collected = true;
      return true; // 采集完成
    }

    return false;
  }

  /**
   * 检测点是否在资源节点范围内
   * @param {Number} x - X 坐标（屏幕坐标）
   * @param {Number} y - Y 坐标（屏幕坐标）
   * @param {Number} screenX - 资源节点的屏幕 X 坐标
   * @param {Number} screenY - 资源节点的屏幕 Y 坐标
   * @returns {Boolean}
   */
  containsPoint(x, y, screenX, screenY) {
    const dx = x - screenX;
    const dy = y - screenY;
    const distanceSquared = dx * dx + dy * dy;
    return distanceSquared <= this.radius * this.radius;
  }

  /**
   * 渲染资源节点
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {Number} screenX - 屏幕 X 坐标
   * @param {Number} screenY - 屏幕 Y 坐标
   */
  render(ctx, screenX, screenY) {
    if (!this.active || this.collected) {
      return;
    }

    // 绘制资源节点主体（实心圆）
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // 绘制边框
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 如果正在被采集，绘制采集进度条（圆形）
    if (this.isBeingHarvested && this.harvestProgress > 0) {
      this.renderHarvestProgress(ctx, screenX, screenY);
    }

    // 绘制资源类型标识（文字）
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let symbol = '';
    switch (this.resourceType) {
      case 'RED': symbol = 'R'; break;
      case 'BLUE': symbol = 'B'; break;
      case 'GOLD': symbol = 'G'; break;
    }
    ctx.fillText(symbol, screenX, screenY);

    ctx.restore();
  }

  /**
   * 渲染采集进度条（Channeling Ring）
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {Number} screenX - 屏幕 X 坐标
   * @param {Number} screenY - 屏幕 Y 坐标
   */
  renderHarvestProgress(ctx, screenX, screenY) {
    const progressRadius = this.radius + 10; // 进度条半径
    const lineWidth = 4;

    // 绘制背景圆环（灰色）
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(screenX, screenY, progressRadius, 0, Math.PI * 2);
    ctx.stroke();

    // 绘制进度圆环（顺时针填充）
    // 从顶部（-90度）开始，顺时针填充
    const startAngle = -Math.PI / 2; // -90度（顶部）
    const endAngle = startAngle + (Math.PI * 2 * this.harvestProgress);

    ctx.strokeStyle = this.color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(screenX, screenY, progressRadius, startAngle, endAngle);
    ctx.stroke();

    // 绘制采集百分比（可选）
    if (this.harvestProgress > 0.1) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const percentage = Math.floor(this.harvestProgress * 100);
      ctx.fillText(`${percentage}%`, screenX, screenY + this.radius + 15);
    }

    ctx.restore();
  }

  /**
   * 获取资源奖励
   * @returns {Object} - { type: 'RED'|'BLUE'|'GOLD', amount: Number }
   */
  getReward() {
    return {
      type: this.resourceType,
      amount: this.amount
    };
  }

  /**
   * 重置资源节点（返回对象池）
   */
  reset() {
    this.active = false;
    this.collected = false;
    this.isBeingHarvested = false;
    this.harvester = null;
    this.harvestProgress = 0;
  }
}
