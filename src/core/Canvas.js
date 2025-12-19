/**
 * Canvas - Canvas 初始化和管理
 *
 * 功能：
 * - DPI 适配（Retina 屏幕支持）
 * - 自动缩放填充窗口
 * - 提供统一的绘图上下文
 * - 处理窗口大小变化
 *
 * 使用方法：
 *   const canvas = new Canvas('gameCanvas');
 *   canvas.clear();
 *   // ... 绘制操作
 */

import { CANVAS } from '../config/Constants.js';

export default class Canvas {
  /**
   * 构造函数
   * @param {string} canvasId - Canvas 元素的 ID
   */
  constructor(canvasId = CANVAS.ID) {
    // 获取 Canvas 元素
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }

    // 获取 2D 渲染上下文
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Failed to get 2D context');
    }

    // DPI 缩放比例
    this.dpr = CANVAS.USE_DEVICE_PIXEL_RATIO ? (window.devicePixelRatio || 1) : 1;

    // 逻辑宽高（CSS 像素）
    this.width = 0;
    this.height = 0;

    // 物理宽高（Canvas 内部像素）
    this.physicalWidth = 0;
    this.physicalHeight = 0;

    // 初始化 Canvas 尺寸
    this.resize();

    // 监听窗口大小变化
    this.setupResizeListener();

    console.log(`Canvas initialized: ${this.width}x${this.height} (DPR: ${this.dpr})`);
  }

  /**
   * 设置 Canvas 尺寸
   * 处理 DPI 适配，防止模糊
   */
  resize() {
    // 获取窗口尺寸（CSS 像素）
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // 计算物理尺寸（设备像素）
    this.physicalWidth = this.width * this.dpr;
    this.physicalHeight = this.height * this.dpr;

    // 设置 Canvas 内部分辨率（物理像素）
    this.canvas.width = this.physicalWidth;
    this.canvas.height = this.physicalHeight;

    // 设置 Canvas CSS 尺寸（逻辑像素）
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    // 缩放绘图上下文以匹配 DPI
    this.ctx.scale(this.dpr, this.dpr);

    // 设置默认样式
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  /**
   * 设置窗口大小变化监听器
   */
  setupResizeListener() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
      // 防抖：避免频繁触发
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.resize();
        console.log(`Canvas resized: ${this.width}x${this.height}`);
      }, 100);
    });
  }

  /**
   * 清空 Canvas
   * @param {string} color - 背景色（可选）
   */
  clear(color = CANVAS.BACKGROUND_COLOR) {
    if (color) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(0, 0, this.width, this.height);
    } else {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
  }

  /**
   * 保存绘图状态
   */
  save() {
    this.ctx.save();
  }

  /**
   * 恢复绘图状态
   */
  restore() {
    this.ctx.restore();
  }

  /**
   * 设置全局透明度
   * @param {number} alpha - 透明度 (0-1)
   */
  setAlpha(alpha) {
    this.ctx.globalAlpha = alpha;
  }

  /**
   * 重置全局透明度
   */
  resetAlpha() {
    this.ctx.globalAlpha = 1.0;
  }

  /**
   * 设置混合模式
   * @param {string} mode - 混合模式
   */
  setBlendMode(mode) {
    this.ctx.globalCompositeOperation = mode;
  }

  /**
   * 重置混合模式
   */
  resetBlendMode() {
    this.ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * 绘制文本（调试用）
   * @param {string} text - 文本内容
   * @param {number} x_px - X 坐标（像素）
   * @param {number} y_px - Y 坐标（像素）
   * @param {string} color - 颜色
   * @param {string} font - 字体
   */
  drawText(text, x_px, y_px, color = '#FFFFFF', font = '16px monospace') {
    this.ctx.save();
    this.ctx.fillStyle = color;
    this.ctx.font = font;
    this.ctx.fillText(text, x_px, y_px);
    this.ctx.restore();
  }

  /**
   * 绘制矩形（调试用）
   * @param {number} x_px - X 坐标（像素）
   * @param {number} y_px - Y 坐标（像素）
   * @param {number} width_px - 宽度（像素）
   * @param {number} height_px - 高度（像素）
   * @param {string} color - 颜色
   * @param {boolean} filled - 是否填充
   */
  drawRect(x_px, y_px, width_px, height_px, color = '#FFFFFF', filled = false) {
    this.ctx.save();
    if (filled) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x_px, y_px, width_px, height_px);
    } else {
      this.ctx.strokeStyle = color;
      this.ctx.strokeRect(x_px, y_px, width_px, height_px);
    }
    this.ctx.restore();
  }

  /**
   * 绘制圆形（调试用）
   * @param {number} x_px - 圆心 X 坐标（像素）
   * @param {number} y_px - 圆心 Y 坐标（像素）
   * @param {number} radius - 半径（像素）
   * @param {string} color - 颜色
   * @param {boolean} filled - 是否填充
   */
  drawCircle(x_px, y_px, radius, color = '#FFFFFF', filled = false) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(x_px, y_px, radius, 0, Math.PI * 2);
    if (filled) {
      this.ctx.fillStyle = color;
      this.ctx.fill();
    } else {
      this.ctx.strokeStyle = color;
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  /**
   * 绘制线条（调试用）
   * @param {number} x1_px - 起点 X 坐标（像素）
   * @param {number} y1_px - 起点 Y 坐标（像素）
   * @param {number} x2_px - 终点 X 坐标（像素）
   * @param {number} y2_px - 终点 Y 坐标（像素）
   * @param {string} color - 颜色
   * @param {number} lineWidth - 线宽
   */
  drawLine(x1_px, y1_px, x2_px, y2_px, color = '#FFFFFF', lineWidth = 1) {
    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(x1_px, y1_px);
    this.ctx.lineTo(x2_px, y2_px);
    this.ctx.stroke();
    this.ctx.restore();
  }

  /**
   * 获取 Canvas 宽度（逻辑像素）
   * @returns {number}
   */
  getWidth() {
    return this.width;
  }

  /**
   * 获取 Canvas 高度（逻辑像素）
   * @returns {number}
   */
  getHeight() {
    return this.height;
  }

  /**
   * 获取渲染上下文
   * @returns {CanvasRenderingContext2D}
   */
  getContext() {
    return this.ctx;
  }

  /**
   * 获取 DPI 缩放比例
   * @returns {number}
   */
  getDPR() {
    return this.dpr;
  }
}
