/**
 * SafeHouseSystem.js
 * 安全屋系统
 *
 * 职责：
 * - 管理安全屋节点
 * - 生成安全屋位置
 * - 检测载具到达
 * - 触发安全屋事件
 * - 渲染安全屋和UI
 */

import SafeHouse from '../entities/SafeHouse.js';
import ObjectPool from './ObjectPool.js';

export class SafeHouseSystem {
  /**
   * 构造函数
   * @param {ScrollSystem} scrollSystem - 卷轴系统（用于坐标转换）
   * @param {Number} canvasWidth - 画布宽度
   * @param {Number} canvasHeight - 画布高度
   * @param {Number} targetDistance - 旅途总距离
   */
  constructor(scrollSystem, canvasWidth, canvasHeight, targetDistance) {
    this.scrollSystem = scrollSystem;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.targetDistance = targetDistance;

    // 初始化安全屋对象池
    this.safeHousePool = new ObjectPool(() => new SafeHouse(), 10);

    // 载具配置
    this.vehicleX = canvasWidth * 0.33; // 载具 X 位置（屏幕左侧1/3）
    this.vehicleY = canvasHeight / 2;   // 载具 Y 位置（屏幕中央）

    // 当前安全屋状态
    this.currentSafeHouse = null;
    this.isInSafeHouse = false;

    // 统计信息
    this.stats = {
      totalHouses: 0,
      housesReached: 0
    };

    console.log('SafeHouseSystem 初始化');
  }

  /**
   * 初始化旅途安全屋
   * 在旅途开始时调用，生成所有安全屋节点
   */
  initJourney() {
    // 清空现有安全屋
    for (const house of this.safeHousePool.pool) {
      if (house.active) {
        this.safeHousePool.release(house);
      }
    }

    // 重置状态
    this.currentSafeHouse = null;
    this.isInSafeHouse = false;
    this.stats.housesReached = 0;

    // 生成安全屋节点
    // 策略：在旅途中间位置放置安全屋
    const safeHousePositions = this.calculateSafeHousePositions();

    for (let i = 0; i < safeHousePositions.length; i++) {
      const pos = safeHousePositions[i];
      const house = this.safeHousePool.acquire({
        worldX: pos.worldX,
        worldY: pos.worldY,
        houseNumber: i + 1
      });
      if (house) {
        this.stats.totalHouses++;
      }
    }

    console.log(`生成了 ${this.stats.totalHouses} 个安全屋`);
  }

  /**
   * 计算安全屋位置
   * @returns {Array} - 安全屋位置数组 [{worldX, worldY}, ...]
   */
  calculateSafeHousePositions() {
    const positions = [];

    // 策略：在旅途中间放置1个安全屋
    // 如果旅途很长，可以放置多个
    const numHouses = Math.floor(this.targetDistance / 3000); // 每3000像素一个安全屋
    const minHouses = 1;
    const maxHouses = 3;
    const actualNumHouses = Math.max(minHouses, Math.min(numHouses, maxHouses));

    for (let i = 0; i < actualNumHouses; i++) {
      // 均匀分布
      const ratio = (i + 1) / (actualNumHouses + 1);
      const worldX = this.targetDistance * ratio;
      const worldY = this.canvasHeight / 2; // 屏幕中央

      positions.push({ worldX, worldY });
    }

    return positions;
  }

  /**
   * 更新安全屋系统
   * @param {Number} deltaTime - 时间增量（秒）
   */
  update(deltaTime) {
    // 如果已经在安全屋中，不需要检测
    if (this.isInSafeHouse) {
      return;
    }

    // 检测载具是否到达安全屋
    this.checkReached();
  }

  /**
   * 检测载具是否到达安全屋
   */
  checkReached() {
    for (const house of this.safeHousePool.pool) {
      if (!house.active || house.reached) {
        continue;
      }

      // 转换世界坐标到屏幕坐标
      const screenX = this.scrollSystem.worldToScreenX(house.worldX);
      const screenY = house.worldY;

      // 检查是否在屏幕可见范围内
      if (screenX < -200 || screenX > this.canvasWidth + 200) {
        continue;
      }

      // 检测是否到达
      if (house.checkReached(this.vehicleX, this.vehicleY, screenX, screenY)) {
        this.onReachSafeHouse(house);
        break;
      }
    }
  }

  /**
   * 到达安全屋回调
   * @param {SafeHouse} house - 安全屋
   */
  onReachSafeHouse(house) {
    console.log(`到达安全屋 #${house.houseNumber}`);

    house.reached = true;
    this.currentSafeHouse = house;
    this.isInSafeHouse = true;
    this.stats.housesReached++;

    // 停止卷轴
    this.scrollSystem.currentSpeed = 0;
  }

  /**
   * 离开安全屋
   */
  leaveSafeHouse() {
    console.log('离开安全屋，继续旅途');

    this.isInSafeHouse = false;
    this.currentSafeHouse = null;

    // 恢复卷轴速度
    this.scrollSystem.currentSpeed = this.scrollSystem.normalSpeed;
  }

  /**
   * 渲染所有安全屋
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   */
  renderSafeHouses(ctx) {
    for (const house of this.safeHousePool.pool) {
      if (!house.active) continue;

      // 转换世界坐标到屏幕坐标
      const screenX = this.scrollSystem.worldToScreenX(house.worldX);
      const screenY = house.worldY;

      // 只渲染屏幕可见范围内的安全屋
      if (screenX < -200 || screenX > this.canvasWidth + 200) {
        continue;
      }

      house.render(ctx, screenX, screenY);
    }
  }

  /**
   * 渲染安全屋 UI
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   */
  renderSafeHouseUI(ctx) {
    if (!this.isInSafeHouse || !this.currentSafeHouse) {
      return;
    }

    // 半透明黑色背景
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // 标题
    ctx.fillStyle = '#00FFFF';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 10;
    ctx.fillText(
      `安全屋 #${this.currentSafeHouse.houseNumber}`,
      this.canvasWidth / 2,
      this.canvasHeight / 2 - 100
    );

    // 提示文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(
      '欢迎来到安全屋',
      this.canvasWidth / 2,
      this.canvasHeight / 2 - 20
    );

    ctx.fillText(
      '这里可以休息、购买装备、修复载具',
      this.canvasWidth / 2,
      this.canvasHeight / 2 + 20
    );

    // 按钮提示（简化版）
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(
      '[ 按 SPACE 继续旅途 ]',
      this.canvasWidth / 2,
      this.canvasHeight / 2 + 100
    );

    // 统计信息
    ctx.fillStyle = '#888888';
    ctx.font = '16px monospace';
    ctx.fillText(
      `已到达: ${this.stats.housesReached} / ${this.stats.totalHouses}`,
      this.canvasWidth / 2,
      this.canvasHeight / 2 + 150
    );

    ctx.restore();
  }

  /**
   * 获取调试信息
   * @returns {Object}
   */
  getDebugInfo() {
    return {
      totalHouses: this.stats.totalHouses,
      housesReached: this.stats.housesReached,
      isInSafeHouse: this.isInSafeHouse,
      currentHouse: this.currentSafeHouse ? this.currentSafeHouse.houseNumber : null
    };
  }

  /**
   * 重置安全屋系统
   */
  reset() {
    // 清空所有安全屋
    for (const house of this.safeHousePool.pool) {
      if (house.active) {
        this.safeHousePool.release(house);
      }
    }

    // 重置状态
    this.currentSafeHouse = null;
    this.isInSafeHouse = false;

    // 重置统计
    this.stats = {
      totalHouses: 0,
      housesReached: 0
    };

    console.log('SafeHouseSystem 已重置');
  }
}

export default SafeHouseSystem;
