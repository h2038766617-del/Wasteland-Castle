/**
 * main.js - 游戏主入口
 *
 * 职责：
 * - 初始化 Canvas
 * - 启动游戏主循环
 * - 管理游戏状态
 * - 协调各个系统
 */

import Canvas from './core/Canvas.js';
import { CANVAS, DEBUG, PERFORMANCE } from './config/Constants.js';

/**
 * 游戏主类
 */
class Game {
  constructor() {
    console.log('=== 光标指挥官 (Cursor Commander) ===');
    console.log('版本: v0.1 - Canvas 初始化测试');

    // 初始化 Canvas
    this.canvas = new Canvas(CANVAS.ID);
    this.ctx = this.canvas.getContext();

    // 时间管理
    this.lastTime = 0;
    this.deltaTime = 0;
    this.accumulatedTime = 0;
    this.frameCount = 0;
    this.fps = 0;

    // 鼠标位置（像素坐标）
    this.mousePos = { x: 0, y: 0 };

    // 游戏状态
    this.isRunning = false;
    this.isPaused = false;

    // 设置输入监听
    this.setupInput();

    // 更新调试信息
    this.updateDebugInfo();

    console.log('游戏初始化完成');
  }

  /**
   * 设置输入监听
   */
  setupInput() {
    // 鼠标移动
    window.addEventListener('mousemove', (e) => {
      this.mousePos.x = e.clientX;
      this.mousePos.y = e.clientY;

      // 更新调试信息
      if (DEBUG.SHOW_DRONE_POS) {
        document.getElementById('mousePos').textContent =
          `${Math.floor(this.mousePos.x)}, ${Math.floor(this.mousePos.y)}`;
      }
    });

    // 键盘事件（用于调试）
    window.addEventListener('keydown', (e) => {
      // 空格键：暂停/继续
      if (e.code === 'Space') {
        this.togglePause();
      }

      // D 键：切换调试信息
      if (e.code === 'KeyD') {
        this.toggleDebug();
      }

      // R 键：重启游戏
      if (e.code === 'KeyR') {
        this.restart();
      }
    });

    console.log('输入系统已设置');
    console.log('快捷键: [空格] 暂停  [D] 调试信息  [R] 重启');
  }

  /**
   * 启动游戏
   */
  start() {
    console.log('游戏启动中...');
    this.isRunning = true;

    // 隐藏加载界面
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.classList.add('hidden');
    }

    // 显示调试信息（如果启用）
    if (DEBUG.SHOW_FPS) {
      const debugElement = document.getElementById('debug');
      if (debugElement) {
        debugElement.classList.remove('hidden');
      }
    }

    // 启动游戏循环
    requestAnimationFrame((time) => this.gameLoop(time));

    console.log('游戏已启动');
  }

  /**
   * 游戏主循环
   * @param {number} currentTime - 当前时间戳（毫秒）
   */
  gameLoop(currentTime) {
    // 继续循环
    requestAnimationFrame((time) => this.gameLoop(time));

    // 计算 deltaTime（秒）
    if (this.lastTime === 0) {
      this.lastTime = currentTime;
      return;
    }

    this.deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // 限制 deltaTime（防止卡顿导致物理穿透）
    if (this.deltaTime > PERFORMANCE.MAX_DELTA_TIME) {
      this.deltaTime = PERFORMANCE.MAX_DELTA_TIME;
    }

    // 如果暂停，只渲染不更新
    if (this.isPaused) {
      this.render();
      return;
    }

    // 更新游戏逻辑
    this.update(this.deltaTime);

    // 渲染画面
    this.render();

    // 更新 FPS
    this.updateFPS();
  }

  /**
   * 更新游戏逻辑
   * @param {number} deltaTime - 时间增量（秒）
   */
  update(deltaTime) {
    // TODO: 在这里更新所有游戏系统
    // - 无人机光标
    // - 武器系统
    // - 子弹
    // - 敌人
    // - 碰撞检测
    // - 资源采集
  }

  /**
   * 渲染画面
   */
  render() {
    // 清空 Canvas
    this.canvas.clear();

    // TODO: 在这里渲染所有游戏对象
    // - 背景
    // - 网格
    // - 组件
    // - 敌人
    // - 子弹
    // - 无人机光标
    // - UI

    // 临时测试：绘制一些内容
    this.renderTest();
  }

  /**
   * 测试渲染（临时）
   */
  renderTest() {
    const ctx = this.ctx;
    const width = this.canvas.getWidth();
    const height = this.canvas.getHeight();

    // 绘制标题
    ctx.save();
    ctx.fillStyle = '#00FFFF';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('光标指挥官', width / 2, height / 2 - 50);

    ctx.font = '24px monospace';
    ctx.fillStyle = '#888888';
    ctx.fillText('Cursor Commander', width / 2, height / 2);

    ctx.font = '16px monospace';
    ctx.fillStyle = '#666666';
    ctx.fillText('Canvas 初始化成功', width / 2, height / 2 + 40);
    ctx.fillText('DPI: ' + this.canvas.getDPR().toFixed(2), width / 2, height / 2 + 65);
    ctx.fillText(`分辨率: ${width}x${height}`, width / 2, height / 2 + 90);
    ctx.restore();

    // 绘制鼠标位置指示器
    this.canvas.drawCircle(this.mousePos.x, this.mousePos.y, 20, '#00FFFF', false);
    this.canvas.drawCircle(this.mousePos.x, this.mousePos.y, 5, '#00FFFF', true);

    // 绘制网格示意（用于测试坐标系）
    ctx.save();
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    const gridSpacing = 50;
    for (let x = 0; x < width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    // 绘制提示文字
    ctx.save();
    ctx.fillStyle = '#00FFFF';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('[空格] 暂停  [D] 调试信息  [R] 重启', 20, height - 20);
    ctx.restore();
  }

  /**
   * 更新 FPS
   */
  updateFPS() {
    this.frameCount++;
    this.accumulatedTime += this.deltaTime;

    // 每秒更新一次 FPS 显示
    if (this.accumulatedTime >= 1.0) {
      this.fps = Math.round(this.frameCount / this.accumulatedTime);
      this.frameCount = 0;
      this.accumulatedTime = 0;

      // 更新调试信息
      if (DEBUG.SHOW_FPS) {
        document.getElementById('fps').textContent = this.fps;
      }
    }
  }

  /**
   * 更新调试信息
   */
  updateDebugInfo() {
    if (!DEBUG.SHOW_FPS) return;

    document.getElementById('canvasSize').textContent =
      `${this.canvas.getWidth()}x${this.canvas.getHeight()}`;

    document.getElementById('gameState').textContent =
      this.isPaused ? 'PAUSED' : 'RUNNING';
  }

  /**
   * 切换暂停状态
   */
  togglePause() {
    this.isPaused = !this.isPaused;
    console.log(this.isPaused ? '游戏已暂停' : '游戏继续');
    this.updateDebugInfo();
  }

  /**
   * 切换调试信息显示
   */
  toggleDebug() {
    const debugElement = document.getElementById('debug');
    if (debugElement) {
      debugElement.classList.toggle('hidden');
    }
  }

  /**
   * 重启游戏
   */
  restart() {
    console.log('重启游戏...');
    // TODO: 重置所有游戏状态
    this.isPaused = false;
    this.updateDebugInfo();
  }
}

// 等待 DOM 加载完成后启动游戏
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM 加载完成');

  // 创建游戏实例
  const game = new Game();

  // 启动游戏
  game.start();

  // 将游戏实例暴露到全局（方便调试）
  window.game = game;
  console.log('游戏实例已暴露到 window.game');
});
