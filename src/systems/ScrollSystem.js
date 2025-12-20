/**
 * ScrollSystem - 横版卷轴系统
 *
 * 职责：
 * - 管理背景卷动
 * - 跟踪行驶距离
 * - 载具位置锚定（屏幕左侧 1/3）
 * - 终点判定
 *
 * 核心概念：
 * - 载具固定在屏幕左侧 1/3 处
 * - 背景向左移动，模拟载具向右行驶
 * - 卷动速度根据游戏状态动态调整
 */

import { SCROLL, CANVAS } from '../config/Constants.js';

export class ScrollSystem {
  /**
   * 构造函数
   * @param {number} canvasWidth - Canvas 宽度（像素）
   * @param {number} targetDistance - 目标距离（像素）
   */
  constructor(canvasWidth, targetDistance = 5000) {
    // Canvas 尺寸
    this.canvasWidth = canvasWidth;

    // 背景卷动偏移量（像素）
    this.scrollOffset = 0;

    // 当前卷动速度（像素/秒）
    this.currentSpeed = SCROLL.TRAVEL_SPEED;

    // 已行驶距离（像素）
    this.distanceTraveled = 0;

    // 目标距离（像素）
    this.targetDistance = targetDistance;

    // 载具锚定位置（像素坐标）
    this.vehicleX = canvasWidth * SCROLL.VEHICLE_X_RATIO;

    // 是否已到达终点
    this.reachedDestination = false;

    console.log(`ScrollSystem 初始化: 载具锚定在 x=${Math.floor(this.vehicleX)}px, 目标距离=${targetDistance}px`);
  }

  /**
   * 更新卷动系统
   * @param {number} deltaTime - 时间增量（秒）
   */
  update(deltaTime) {
    // 如果已到达终点，停止卷动
    if (this.reachedDestination) {
      this.currentSpeed = 0;
      return;
    }

    // 更新卷动偏移量
    const scrollDelta = this.currentSpeed * deltaTime;
    this.scrollOffset += scrollDelta;

    // 更新已行驶距离
    this.distanceTraveled += scrollDelta;

    // 检查是否到达终点
    if (this.distanceTraveled >= this.targetDistance) {
      this.reachedDestination = true;
      this.distanceTraveled = this.targetDistance;
      console.log('已到达终点！');
    }
  }

  /**
   * 设置卷动速度
   * @param {number} speed - 速度（像素/秒）
   */
  setSpeed(speed) {
    this.currentSpeed = speed;
  }

  /**
   * 停止卷动
   */
  stop() {
    this.currentSpeed = 0;
  }

  /**
   * 恢复卷动（使用旅途速度）
   */
  resume() {
    if (!this.reachedDestination) {
      this.currentSpeed = SCROLL.TRAVEL_SPEED;
    }
  }

  /**
   * 获取当前卷动偏移量
   * @returns {number} 偏移量（像素）
   */
  getScrollOffset() {
    return this.scrollOffset;
  }

  /**
   * 获取载具世界坐标 X
   * （用于物体生成和碰撞检测）
   * @returns {number} 世界 X 坐标（像素）
   */
  getVehicleWorldX() {
    return this.distanceTraveled + this.vehicleX;
  }

  /**
   * 获取载具屏幕坐标 X（固定）
   * @returns {number} 屏幕 X 坐标（像素）
   */
  getVehicleScreenX() {
    return this.vehicleX;
  }

  /**
   * 将世界坐标转换为屏幕坐标
   * @param {number} worldX - 世界 X 坐标
   * @returns {number} 屏幕 X 坐标
   */
  worldToScreenX(worldX) {
    return worldX - this.distanceTraveled;
  }

  /**
   * 将屏幕坐标转换为世界坐标
   * @param {number} screenX - 屏幕 X 坐标
   * @returns {number} 世界 X 坐标
   */
  screenToWorldX(screenX) {
    return screenX + this.distanceTraveled;
  }

  /**
   * 获取已行驶距离
   * @returns {number} 距离（像素）
   */
  getDistanceTraveled() {
    return this.distanceTraveled;
  }

  /**
   * 获取目标距离
   * @returns {number} 距离（像素）
   */
  getTargetDistance() {
    return this.targetDistance;
  }

  /**
   * 获取距离进度（0-1）
   * @returns {number} 进度比例
   */
  getProgress() {
    return Math.min(this.distanceTraveled / this.targetDistance, 1.0);
  }

  /**
   * 获取剩余距离
   * @returns {number} 距离（像素）
   */
  getRemainingDistance() {
    return Math.max(this.targetDistance - this.distanceTraveled, 0);
  }

  /**
   * 是否已到达终点
   * @returns {boolean}
   */
  hasReachedDestination() {
    return this.reachedDestination;
  }

  /**
   * 重置卷动系统
   */
  reset() {
    this.scrollOffset = 0;
    this.distanceTraveled = 0;
    this.reachedDestination = false;
    this.currentSpeed = SCROLL.TRAVEL_SPEED;
    console.log('ScrollSystem 已重置');
  }

  /**
   * 获取调试信息
   * @returns {Object}
   */
  getDebugInfo() {
    return {
      scrollOffset: Math.floor(this.scrollOffset),
      distanceTraveled: Math.floor(this.distanceTraveled),
      targetDistance: this.targetDistance,
      progress: (this.getProgress() * 100).toFixed(1) + '%',
      speed: this.currentSpeed,
      reachedDestination: this.reachedDestination,
      vehicleX: Math.floor(this.vehicleX)
    };
  }
}

export default ScrollSystem;
