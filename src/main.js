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
import DroneCursor from './entities/DroneCursor.js';
import GridManager from './systems/GridManager.js';
import { BuffSystem } from './systems/BuffSystem.js';
import { WeaponSystem } from './systems/WeaponSystem.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { EnemySystem } from './systems/EnemySystem.js';
import { ScrollSystem } from './systems/ScrollSystem.js';
import { ResourceSystem } from './systems/ResourceSystem.js';
import { ObstacleSystem } from './systems/ObstacleSystem.js';
import { SafeHouseSystem } from './systems/SafeHouseSystem.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
import ObjectPool from './systems/ObjectPool.js';
import Component from './entities/Component.js';
import Projectile from './entities/Projectile.js';
import Enemy from './entities/Enemy.js';
import * as Vector2 from './utils/Vector2.js';
import { CANVAS, DEBUG, PERFORMANCE, SCROLL } from './config/Constants.js';
import { ComponentType } from './config/DataDictionary.js';

/**
 * 游戏主类
 */
class Game {
  constructor() {
    console.log('=== 光标指挥官 (Cursor Commander) ===');
    console.log('版本: v0.15 - 波次系统 + 粒子效果');

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
    this.isGameOver = false;
    this.showHelp = false; // 帮助界面显示状态

    // 视觉效果
    this.damageNumbers = []; // 浮动伤害数字

    // 初始化资源
    this.resources = {
      red: 200,   // 弹药/能源（初始值）
      blue: 100,   // 建材/矿石
      gold: 50     // 金币/芯片
    };

    // 计算载具锚定位置（屏幕左侧 1/3）
    const vehicleX = this.canvas.getWidth() * SCROLL.VEHICLE_X_RATIO;
    const vehicleY = this.canvas.getHeight() / 2;

    // 初始化网格管理器（放置在载具位置附近）
    // 网格宽度 = 4格 * 80px = 320px，将网格中心对齐到载具位置
    const gridWidth = 4 * 80;  // GRID.SIZE * GRID.CELL_SIZE_PX
    const gridHeight = 4 * 80;
    const gridOriginX = vehicleX - gridWidth / 2;
    const gridOriginY = vehicleY - gridHeight / 2;

    this.gridManager = new GridManager(
      4,  // gridSize
      80, // cellSize_px
      gridOriginX,
      gridOriginY
    );

    // 初始化邻接加成系统
    this.buffSystem = new BuffSystem();

    // 创建测试组件并放置到网格
    this.createTestComponents();

    // 计算邻接加成
    this.buffSystem.recalculateBuffs(this.gridManager);

    // 初始化对象池
    this.projectilePool = new ObjectPool(() => new Projectile(), 100);

    // 初始化武器系统
    this.weaponSystem = new WeaponSystem(this.gridManager, this.projectilePool);

    // 初始化碰撞检测系统
    this.collisionSystem = new CollisionSystem();

    // 初始化敌人系统
    this.enemySystem = new EnemySystem(
      this.gridManager,
      this.canvas.getWidth(),
      this.canvas.getHeight()
    );

    // 初始化横版卷轴系统
    this.scrollSystem = new ScrollSystem(
      this.canvas.getWidth(),
      5000  // 目标距离 5000 像素
    );

    // 初始化资源采集系统
    this.resourceSystem = new ResourceSystem(
      this.scrollSystem,
      this.canvas.getWidth(),
      this.canvas.getHeight()
    );

    // 初始化障碍物系统
    this.obstacleSystem = new ObstacleSystem(
      this.scrollSystem,
      this.canvas.getWidth(),
      this.canvas.getHeight()
    );

    // 初始化安全屋系统
    this.safeHouseSystem = new SafeHouseSystem(
      this.scrollSystem,
      this.canvas.getWidth(),
      this.canvas.getHeight(),
      5000  // 目标距离（与 scrollSystem 一致）
    );

    // 生成旅途中的安全屋
    this.safeHouseSystem.initJourney();

    // 初始化粒子系统
    this.particleSystem = new ParticleSystem();

    // 初始化无人机光标
    const centerX = this.canvas.getWidth() / 2;
    const centerY = this.canvas.getHeight() / 2;
    this.droneCursor = new DroneCursor(centerX, centerY);

    // 设置输入监听
    this.setupInput();

    // 更新调试信息
    this.updateDebugInfo();
  }

  /**
   * 创建测试组件
   */
  createTestComponents() {
    // 创建核心组件（1x1，放在中心）
    const core = new Component({
      id: 'core_main',
      type: ComponentType.CORE,
      gridShape: [[0, 0]],
      stats: {
        hp: 500,
        maxHp: 500
      }
    });
    this.gridManager.placeComponent(core, 1, 1);

    // 创建基础武器（1x1，放在核心右侧）
    const weapon1 = new Component({
      id: 'weapon_basic_1',
      type: ComponentType.WEAPON,
      gridShape: [[0, 0]],
      stats: {
        hp: 80,
        maxHp: 80,
        damage: 10,
        cooldown: 0.5,
        range: 300,
        ammoCost: 1,
        pattern: 'NEAREST'
      }
    });
    this.gridManager.placeComponent(weapon1, 2, 1);

    // 创建重型武器（1x2 水平，放在核心上方）
    const weapon2 = new Component({
      id: 'weapon_heavy_1',
      type: ComponentType.WEAPON,
      gridShape: [[0, 0], [1, 0]],
      stats: {
        hp: 120,
        maxHp: 120,
        damage: 50,
        cooldown: 2.0,
        range: 400,
        ammoCost: 5,
        pattern: 'NEAREST'
      }
    });
    this.gridManager.placeComponent(weapon2, 0, 0);

    // 创建装甲（1x1，放在核心下方）
    const armor = new Component({
      id: 'armor_plate_1',
      type: ComponentType.ARMOR,
      gridShape: [[0, 0]],
      stats: {
        hp: 200,
        maxHp: 200
      }
    });
    this.gridManager.placeComponent(armor, 1, 2);

    // 创建增压器（1x1，放在核心左侧）
    const booster = new Component({
      id: 'booster_1',
      type: ComponentType.BOOSTER,
      gridShape: [[0, 0]],
      stats: {
        hp: 50,
        maxHp: 50
      }
    });
    this.gridManager.placeComponent(booster, 0, 1);
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
      // 空格键：离开安全屋 或 暂停/继续
      if (e.code === 'Space') {
        if (this.safeHouseSystem.isInSafeHouse) {
          // 在安全屋中，按空格离开
          this.safeHouseSystem.leaveSafeHouse();
        } else {
          // 不在安全屋，暂停/继续
          this.togglePause();
        }
      }

      // D 键：切换调试信息
      if (e.code === 'KeyD') {
        this.toggleDebug();
      }

      // R 键：重启游戏
      if (e.code === 'KeyR') {
        this.restart();
      }

      // H 键：切换帮助界面
      if (e.code === 'KeyH') {
        this.showHelp = !this.showHelp;
      }
    });
  }

  /**
   * 启动游戏
   */
  start() {
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
    // 更新横版卷轴系统
    this.scrollSystem.update(deltaTime);

    // 更新资源采集系统
    this.resourceSystem.update(deltaTime, this.mousePos, this.resources);

    // 更新障碍物系统
    this.obstacleSystem.update(deltaTime, this.mousePos, this.resources);

    // 更新安全屋系统
    this.safeHouseSystem.update(deltaTime);

    // 更新无人机光标
    this.droneCursor.update(deltaTime, this.mousePos);

    // 更新敌人系统（生成、AI）
    this.enemySystem.update(deltaTime);

    // 获取所有活跃敌人
    const enemies = this.enemySystem.getActiveEnemies();

    // 更新武器系统（寻找目标并发射）
    this.weaponSystem.update(deltaTime, enemies, this.mousePos, this.resources);

    // 更新子弹
    this.weaponSystem.updateProjectiles(
      deltaTime,
      this.canvas.getWidth(),
      this.canvas.getHeight()
    );

    // 碰撞检测：子弹-敌人
    const projectiles = this.weaponSystem.getActiveProjectiles();
    const collisionResult = this.collisionSystem.checkProjectileEnemyCollisions(
      projectiles,
      enemies,
      this.projectilePool,
      this.resources,
      this.damageNumbers,
      this.particleSystem
    );

    // 更新视觉效果
    this.updateDamageNumbers(deltaTime);
    this.particleSystem.update(deltaTime);

    // 碰撞检测：敌人-组件
    const components = this.gridManager.getAllComponents();
    const attackResult = this.collisionSystem.checkEnemyComponentCollisions(
      enemies,
      components,
      this.gridManager
    );

    // 检查核心是否被摧毁
    this.checkGameOver();
  }

  /**
   * 检查游戏是否结束
   */
  checkGameOver() {
    if (this.isGameOver) return;

    // 检查核心组件是否被摧毁
    const coreComponents = this.gridManager.getComponentsByType(ComponentType.CORE);

    if (coreComponents.length === 0 || coreComponents.every(core => core.isDestroyed())) {
      this.isGameOver = true;
      this.isPaused = true;
      console.log('=== GAME OVER ===');
      console.log('核心被摧毁！');
    }
  }

  /**
   * 渲染画面
   */
  render() {
    // 清空 Canvas
    this.canvas.clear();

    // 保存上下文状态
    this.ctx.save();

    // 应用屏幕抖动效果
    this.obstacleSystem.applyScreenShake(this.ctx);

    // 绘制背景网格（用于坐标参考）
    this.renderBackgroundGrid();

    // 渲染游戏网格和组件
    this.gridManager.render(this.ctx);

    // 渲染资源节点
    this.resourceSystem.renderNodes(this.ctx);

    // 渲染障碍物
    this.obstacleSystem.renderObstacles(this.ctx);

    // 渲染安全屋
    this.safeHouseSystem.renderSafeHouses(this.ctx);

    // 渲染敌人
    this.enemySystem.renderEnemies(this.ctx);

    // 渲染子弹
    this.weaponSystem.renderProjectiles(this.ctx);

    // 渲染无人机光标
    this.droneCursor.render(this.ctx);

    // 渲染资源掉落动画（在最上层）
    this.resourceSystem.renderResourceDrops(this.ctx);

    // 渲染粒子效果（在游戏世界层）
    this.particleSystem.render(this.ctx);

    // 渲染伤害数字（在游戏世界层）
    this.renderDamageNumbers(this.ctx);

    // 恢复上下文状态（取消屏幕抖动）
    this.ctx.restore();

    // 渲染阻挡警告 UI（不受屏幕抖动影响）
    this.obstacleSystem.renderBlockingWarning(this.ctx);

    // 渲染 UI 提示
    this.renderUI();

    // 渲染安全屋 UI（全屏，在最上层）
    this.safeHouseSystem.renderSafeHouseUI(this.ctx);

    // 渲染帮助界面（最顶层）
    this.renderHelpOverlay(this.ctx);
  }

  /**
   * 渲染背景网格（用于坐标参考）
   */
  renderBackgroundGrid() {
    const ctx = this.ctx;
    const width = this.canvas.getWidth();
    const height = this.canvas.getHeight();

    ctx.save();
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    const gridSpacing = 50;

    // 绘制垂直线
    for (let x = 0; x < width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // 绘制水平线
    for (let y = 0; y < height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * 渲染 UI 提示
   */
  renderUI() {
    const ctx = this.ctx;
    const width = this.canvas.getWidth();
    const height = this.canvas.getHeight();

    ctx.save();

    // 绘制标题
    ctx.fillStyle = this.isGameOver ? '#FF0000' : '#00FFFF';
    ctx.font = '32px monospace';
    ctx.textAlign = 'center';
    const title = this.isGameOver ? '游戏结束 - 核心被摧毁' : '光标指挥官 - 横版卷轴测试';
    ctx.fillText(title, width / 2, 75);

    // 绘制资源信息（改进：显示所有资源）
    ctx.font = '18px monospace';
    ctx.textAlign = 'left';

    // 红色资源（弹药）
    ctx.fillStyle = '#FF3333';
    ctx.fillText(`● ${Math.floor(this.resources.red)}`, 20, 40);

    // 蓝色资源（建材）
    ctx.fillStyle = '#3333FF';
    ctx.fillText(`● ${Math.floor(this.resources.blue)}`, 120, 40);

    // 金色资源（金币）
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`● ${Math.floor(this.resources.gold)}`, 220, 40);

    // 绘制当前状态提示
    this.renderCurrentStatus(ctx);

    // 绘制提示文字
    ctx.fillStyle = '#666666';
    ctx.font = '14px monospace';
    ctx.fillText('[空格] 暂停  [D] 调试信息  [R] 重启  [H] 帮助', 20, height - 20);

    // 绘制波次信息（新设计）
    this.renderWaveInfo(ctx, width);

    // 绘制统计信息
    const collisionStats = this.collisionSystem.getStats();
    const enemyStats = this.enemySystem.getStats();
    const coreComponents = this.gridManager.getComponentsByType(ComponentType.CORE);
    const coreHp = coreComponents.length > 0 ? coreComponents[0].stats.hp : 0;

    ctx.fillStyle = '#00FF00';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`击杀: ${collisionStats.totalKills}`, 20, 70);
    ctx.fillText(`存活: ${enemyStats.currentAlive}`, 20, 90);

    // 核心血量（红色警告）
    ctx.fillStyle = coreHp < 200 ? '#FF0000' : '#00FF00';
    ctx.fillText(`核心: ${Math.floor(coreHp)}`, 20, 110);

    // 绘制版本信息
    ctx.fillStyle = '#666666';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('v0.15', width - 20, height - 20);

    // 绘制距离进度条
    this.renderDistanceProgress();

    ctx.restore();
  }

  /**
   * 渲染距离进度条
   */
  renderDistanceProgress() {
    const ctx = this.ctx;
    const width = this.canvas.getWidth();
    const height = this.canvas.getHeight();

    ctx.save();

    // 进度条尺寸和位置
    const barWidth = 400;
    const barHeight = 30;
    const barX = (width - barWidth) / 2;
    const barY = 20;

    // 获取进度
    const progress = this.scrollSystem.getProgress();
    const distance = this.scrollSystem.getDistanceTraveled();
    const target = this.scrollSystem.getTargetDistance();

    // 绘制进度条背景
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // 绘制进度条边框
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // 绘制进度填充
    const fillWidth = barWidth * progress;
    const gradient = ctx.createLinearGradient(barX, 0, barX + fillWidth, 0);
    gradient.addColorStop(0, '#00FFFF');
    gradient.addColorStop(1, '#00FF00');
    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, fillWidth, barHeight);

    // 绘制距离文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const distanceText = `${Math.floor(distance)} / ${target} 米`;
    ctx.fillText(distanceText, barX + barWidth / 2, barY + barHeight / 2);

    // 绘制百分比
    ctx.fillStyle = '#00FFFF';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    const percentText = `${Math.floor(progress * 100)}%`;
    ctx.fillText(percentText, barX + barWidth + 10, barY + barHeight / 2);

    // 如果到达终点，显示提示
    if (this.scrollSystem.hasReachedDestination()) {
      ctx.fillStyle = '#00FF00';
      ctx.font = '20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('已到达安全屋！', barX + barWidth / 2, barY + barHeight + 25);
    }

    ctx.restore();
  }

  /**
   * 更新伤害数字
   * @param {Number} deltaTime - 时间增量（秒）
   */
  updateDamageNumbers(deltaTime) {
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dmg = this.damageNumbers[i];

      // 更新位置（向上飘动）
      dmg.y += dmg.velocity * deltaTime;

      // 更新生命周期和透明度
      dmg.life -= deltaTime;
      dmg.opacity = Math.max(0, dmg.life / 1.0); // 淡出

      // 移除已消失的伤害数字
      if (dmg.life <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }
  }

  /**
   * 渲染伤害数字
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   */
  renderDamageNumbers(ctx) {
    ctx.save();

    for (const dmg of this.damageNumbers) {
      ctx.globalAlpha = dmg.opacity;
      ctx.fillStyle = '#FFFF00';
      ctx.strokeStyle = '#000000';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 3;

      // 描边（黑色轮廓）
      ctx.strokeText(`-${dmg.damage}`, dmg.x, dmg.y);
      // 填充（黄色文字）
      ctx.fillText(`-${dmg.damage}`, dmg.x, dmg.y);
    }

    ctx.restore();
  }

  /**
   * 渲染波次信息
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {Number} width - 画布宽度
   */
  renderWaveInfo(ctx, width) {
    const waveInfo = this.enemySystem.getWaveDisplayInfo();

    ctx.save();

    // 波次信息框位置（右上角）
    const boxX = width - 250;
    const boxY = 20;
    const boxWidth = 230;
    const boxHeight = 100;

    // 绘制半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // 绘制边框
    ctx.strokeStyle = waveInfo.waveState === 'WAVE_ACTIVE' ? '#FF3333' : '#00FFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // 波次标题
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`波次 ${waveInfo.currentWave} / ${waveInfo.maxWaves}`, boxX + boxWidth / 2, boxY + 25);

    // 状态文字
    let statusColor = '#AAAAAA';
    switch (waveInfo.waveState) {
      case 'PREPARING':
        statusColor = '#00FFFF';
        break;
      case 'WAVE_ACTIVE':
        statusColor = '#FF3333';
        break;
      case 'WAVE_COMPLETE':
        statusColor = '#00FF00';
        break;
      case 'VICTORY':
        statusColor = '#FFD700';
        break;
    }

    ctx.fillStyle = statusColor;
    ctx.font = 'bold 18px monospace';
    ctx.fillText(waveInfo.statusText, boxX + boxWidth / 2, boxY + 50);

    // 时间/敌人剩余
    if (waveInfo.waveState === 'PREPARING') {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px monospace';
      ctx.fillText(`准备时间: ${waveInfo.timeRemaining}秒`, boxX + boxWidth / 2, boxY + 75);
    } else if (waveInfo.waveState === 'WAVE_ACTIVE') {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px monospace';
      ctx.fillText(`剩余敌人: ${waveInfo.timeRemaining}`, boxX + boxWidth / 2, boxY + 75);
    } else if (waveInfo.waveState === 'WAVE_COMPLETE') {
      ctx.fillStyle = '#00FF00';
      ctx.font = '16px monospace';
      ctx.fillText('✓ 准备下一波', boxX + boxWidth / 2, boxY + 75);
    }

    ctx.restore();
  }

  /**
   * 渲染当前状态提示
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   */
  renderCurrentStatus(ctx) {
    // 检查当前正在进行的活动
    let statusText = '';
    let statusColor = '#888888';

    // 检查是否正在采集资源
    const resourceDebug = this.resourceSystem.getDebugInfo();
    if (resourceDebug.isHarvesting) {
      const node = this.resourceSystem.currentHarvestNode;
      if (node && node.harvestProgress !== undefined) {
        const progress = Math.floor(node.harvestProgress * 100);
        const typeNames = { RED: '红色', BLUE: '蓝色', GOLD: '金色' };
        const typeName = typeNames[node.resourceType] || node.resourceType;
        statusText = `采集中: ${typeName}资源 (${progress}%)`;
        statusColor = '#00FF00';
      }
    }

    // 检查是否正在挖掘障碍物
    if (!statusText) {
      const obstacleDebug = this.obstacleSystem.getDebugInfo();
      if (obstacleDebug.isDigging && this.obstacleSystem.currentDigObstacle) {
        const obstacle = this.obstacleSystem.currentDigObstacle;
        if (obstacle && obstacle.digProgress !== undefined) {
          const progress = Math.floor(obstacle.digProgress * 100);
          const typeNames = { TREE: '树木', ROCK: '巨石' };
          const typeName = typeNames[obstacle.obstacleType] || obstacle.obstacleType;
          statusText = `挖掘中: ${typeName} (${progress}%)`;
          statusColor = '#FFAA00';
        }
      }
    }

    // 如果没有活动，显示空闲状态
    if (!statusText) {
      statusText = '空闲 - 移动光标到资源或障碍物上';
      statusColor = '#666666';
    }

    // 渲染状态文字
    ctx.save();
    ctx.fillStyle = statusColor;
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(statusText, 20, 150);
    ctx.restore();
  }

  /**
   * 渲染帮助界面
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   */
  renderHelpOverlay(ctx) {
    if (!this.showHelp) return;

    const width = this.canvas.getWidth();
    const height = this.canvas.getHeight();

    ctx.save();

    // 半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, width, height);

    // 标题
    ctx.fillStyle = '#00FFFF';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('游戏帮助', width / 2, 80);

    // 帮助内容
    const helpLines = [
      '',
      '【游戏目标】',
      '驾驶载具穿越废土，击败10波敌人',
      '',
      '【操作说明】',
      '● 移动光标：悬停在资源节点上自动采集',
      '● 挖掘障碍：悬停在障碍物上进行挖掘',
      '● 自动战斗：炮塔自动攻击敌人',
      '',
      '【波次系统】',
      '● 准备期：8秒安全时间采集资源',
      '● 战斗期：消灭所有敌人完成波次',
      '● 难度递增：每波敌人数量+2',
      '',
      '【资源说明】',
      '● 红色：弹药/能源（用于武器开火）',
      '● 蓝色：建材/矿石（用于建造）',
      '● 金色：金币/芯片（用于升级）',
      '',
      '【控制按键】',
      '空格键 - 暂停/继续游戏',
      'H 键   - 显示/隐藏帮助',
      'D 键   - 切换调试信息',
      'R 键   - 重新开始游戏',
      '',
      '【提示】',
      '● 及时采集资源补充弹药',
      '● 挖掉障碍物避免载具被卡住',
      '● 保护核心，血量归零即游戏结束',
      '',
      '',
      '按 H 键关闭帮助'
    ];

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px monospace';
    ctx.textAlign = 'left';

    let y = 130;
    for (const line of helpLines) {
      if (line.startsWith('【')) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px monospace';
      } else if (line.startsWith('●')) {
        ctx.fillStyle = '#00FF00';
        ctx.font = '16px monospace';
      } else {
        ctx.fillStyle = '#CCCCCC';
        ctx.font = '16px monospace';
      }

      ctx.fillText(line, width / 2 - 300, y);
      y += 24;
    }

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
    // 重置所有游戏状态
    this.isPaused = false;
    this.updateDebugInfo();
  }
}

// 等待 DOM 加载完成后启动游戏
window.addEventListener('DOMContentLoaded', () => {

  try {
    // 创建游戏实例
    const game = new Game();

    // 启动游戏
    game.start();

    // 将游戏实例暴露到全局（方便调试）
    window.game = game;
  } catch (error) {
    console.error('=== 游戏初始化失败 ===');
    console.error(error);

    // 显示错误在加载界面
    const loading = document.getElementById('loading');
    if (loading) {
      loading.innerHTML = `
        <h1 style="color: #FF0000;">游戏初始化失败</h1>
        <p style="color: #FFFF00; margin-top: 20px;">请打开浏览器控制台查看详细错误信息</p>
        <p style="color: #888; margin-top: 10px; font-size: 14px;">${error.message}</p>
        <p style="color: #666; margin-top: 5px; font-size: 12px;">${error.stack ? error.stack.split('\n')[1] : ''}</p>
      `;
    }
  }
});
