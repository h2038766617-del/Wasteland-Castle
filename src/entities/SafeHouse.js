/**
 * SafeHouse.js
 * 安全屋实体
 *
 * 职责：
 * - 存储安全屋的位置
 * - 检测载具是否到达
 * - 渲染安全屋图标
 *
 * 安全屋机制：
 * - 旅途中的休息点
 * - 到达后进入安全屋界面（商店、修复、调整布局）
 * - 无时间限制
 */

/**
 * 安全屋类
 */
export default class SafeHouse {
  /**
   * 构造函数
   */
  constructor() {
    // 对象池标记
    this.active = false;

    // 位置（世界坐标，像素）
    this.worldX = 0;
    this.worldY = 0;

    // 是否已到达
    this.reached = false;

    // 视觉属性
    this.width = 150;
    this.height = 120;

    // 安全屋编号
    this.houseNumber = 0;
  }

  /**
   * 初始化安全屋（从对象池获取时调用）
   * @param {Object} config - 配置对象
   * @param {Number} config.worldX - 世界 X 坐标
   * @param {Number} config.worldY - 世界 Y 坐标
   * @param {Number} config.houseNumber - 安全屋编号
   */
  init(config) {
    this.active = true;
    this.worldX = config.worldX || 0;
    this.worldY = config.worldY || 0;
    this.houseNumber = config.houseNumber || 0;
    this.reached = false;
  }

  /**
   * 检测载具是否到达安全屋
   * @param {Number} vehicleX - 载具 X 坐标（屏幕坐标）
   * @param {Number} vehicleY - 载具 Y 坐标（屏幕坐标）
   * @param {Number} screenX - 安全屋的屏幕 X 坐标
   * @param {Number} screenY - 安全屋的屏幕 Y 坐标
   * @returns {Boolean}
   */
  checkReached(vehicleX, vehicleY, screenX, screenY) {
    // 简单的距离检测
    const dx = vehicleX - screenX;
    const dy = vehicleY - screenY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < 100; // 100像素范围内算到达
  }

  /**
   * 渲染安全屋
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {Number} screenX - 屏幕 X 坐标
   * @param {Number} screenY - 屏幕 Y 坐标
   */
  render(ctx, screenX, screenY) {
    if (!this.active) {
      return;
    }

    ctx.save();

    // 如果已到达，使用不同颜色
    if (this.reached) {
      ctx.globalAlpha = 0.5;
    }

    // 绘制安全屋主体（简化版：房子形状）
    this.renderHouse(ctx, screenX, screenY);

    // 绘制编号
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`#${this.houseNumber}`, screenX, screenY + 50);

    // 如果未到达，绘制闪烁效果
    if (!this.reached) {
      const time = Date.now() / 1000;
      const alpha = 0.3 + Math.sin(time * 3) * 0.2;
      ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(screenX, screenY - 40, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * 渲染房子形状
   * @param {CanvasRenderingContext2D} ctx
   * @param {Number} screenX
   * @param {Number} screenY
   */
  renderHouse(ctx, screenX, screenY) {
    const width = 80;
    const height = 60;
    const roofHeight = 40;

    // 房子主体（矩形）
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(
      screenX - width / 2,
      screenY - height / 2,
      width,
      height
    );

    // 房顶（三角形）
    ctx.fillStyle = '#A0522D';
    ctx.beginPath();
    ctx.moveTo(screenX, screenY - height / 2 - roofHeight);
    ctx.lineTo(screenX - width / 2 - 10, screenY - height / 2);
    ctx.lineTo(screenX + width / 2 + 10, screenY - height / 2);
    ctx.closePath();
    ctx.fill();

    // 门（矩形）
    ctx.fillStyle = '#654321';
    ctx.fillRect(
      screenX - 15,
      screenY + 5,
      30,
      25
    );

    // 窗户（矩形）
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(screenX - 30, screenY - 15, 15, 15);
    ctx.fillRect(screenX + 15, screenY - 15, 15, 15);

    // 边框
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      screenX - width / 2,
      screenY - height / 2,
      width,
      height
    );

    // 房顶边框
    ctx.beginPath();
    ctx.moveTo(screenX, screenY - height / 2 - roofHeight);
    ctx.lineTo(screenX - width / 2 - 10, screenY - height / 2);
    ctx.lineTo(screenX + width / 2 + 10, screenY - height / 2);
    ctx.closePath();
    ctx.stroke();

    // 绘制安全屋标识（绿色十字）
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(screenX - 10, screenY - height / 2 - roofHeight - 20);
    ctx.lineTo(screenX + 10, screenY - height / 2 - roofHeight - 20);
    ctx.moveTo(screenX, screenY - height / 2 - roofHeight - 30);
    ctx.lineTo(screenX, screenY - height / 2 - roofHeight - 10);
    ctx.stroke();
  }

  /**
   * 重置安全屋（返回对象池）
   */
  reset() {
    this.active = false;
    this.reached = false;
  }
}
