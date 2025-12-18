/**
 * EnemySystem.js
 * 敌人系统 - 管理敌人生成、AI、波次
 *
 * 职责：
 * - 管理敌人对象池
 * - 生成敌人波次
 * - 更新所有敌人 AI
 * - 提供敌人列表给其他系统
 *
 * 波次系统：
 * - 每波生成一定数量的敌人
 * - 波次间隔时间
 * - 随着波次增加，敌人数量和强度提升
 */

import Enemy from '../entities/Enemy.js';
import ObjectPool from './ObjectPool.js';

export class EnemySystem {
  /**
   * 构造函数
   * @param {GridManager} gridManager - 网格管理器（用于获取目标位置）
   * @param {Number} canvasWidth - 画布宽度
   * @param {Number} canvasHeight - 画布高度
   */
  constructor(gridManager, canvasWidth, canvasHeight) {
    this.gridManager = gridManager;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // 初始化敌人对象池
    this.enemyPool = new ObjectPool(() => new Enemy(), 50);

    // 波次系统
    this.currentWave = 0;
    this.waveTimer = 0;
    this.waveDuration = 20; // 每波持续时间（秒）
    this.timeSinceLastSpawn = 0;
    this.spawnInterval = 2.0; // 生成间隔（秒）

    // 敌人类型配置
    this.enemyTypes = {
      basic_grunt: {
        hp: 50,
        maxHp: 50,
        damage: 10,
        moveSpeed: 30,
        rewardRed: 5,
        rewardGold: 1
      },
      fast_runner: {
        hp: 30,
        maxHp: 30,
        damage: 5,
        moveSpeed: 60,
        rewardRed: 3,
        rewardGold: 2
      },
      heavy_tank: {
        hp: 150,
        maxHp: 150,
        damage: 20,
        moveSpeed: 15,
        rewardRed: 10,
        rewardGold: 5
      }
    };

    // 统计信息
    this.stats = {
      totalSpawned: 0,
      totalKilled: 0,
      currentAlive: 0
    };
  }

  /**
   * 更新敌人系统
   * @param {Number} deltaTime - 时间增量（秒）
   */
  update(deltaTime) {
    // 更新波次计时器
    this.waveTimer += deltaTime;

    // 更新生成计时器
    this.timeSinceLastSpawn += deltaTime;

    // 检查是否需要生成新敌人
    if (this.timeSinceLastSpawn >= this.spawnInterval) {
      this.spawnEnemy();
      this.timeSinceLastSpawn = 0;
    }

    // 获取网格中心作为敌人目标
    const gridCenterX = this.gridManager.originX_px + (this.gridManager.gridSize * this.gridManager.cellSize_px) / 2;
    const gridCenterY = this.gridManager.originY_px + (this.gridManager.gridSize * this.gridManager.cellSize_px) / 2;
    const targetPos = { x: gridCenterX, y: gridCenterY };

    // 更新所有活跃敌人
    const enemies = this.enemyPool.getActiveObjects();
    for (const enemy of enemies) {
      enemy.update(deltaTime, targetPos);
    }

    // 更新统计
    this.stats.currentAlive = enemies.length;
  }

  /**
   * 生成一个敌人
   * @param {String} type - 敌人类型（可选）
   */
  spawnEnemy(type = null) {
    // 根据波次选择敌人类型
    if (!type) {
      type = this.selectEnemyType();
    }

    // 获取敌人配置
    const config = this.enemyTypes[type];
    if (!config) {
      console.warn(`Unknown enemy type: ${type}`);
      return;
    }

    // 随机生成位置（屏幕边缘）
    const spawnPos = this.getRandomSpawnPosition();

    // 从对象池获取敌人
    const enemy = this.enemyPool.acquire({
      type: type,
      position: spawnPos,
      ...config
    });

    // 更新统计
    this.stats.totalSpawned++;
  }

  /**
   * 根据波次选择敌人类型
   * @returns {String} 敌人类型
   */
  selectEnemyType() {
    const wave = Math.floor(this.waveTimer / this.waveDuration);

    // 第 1-2 波：只有基础敌人
    if (wave < 2) {
      return 'basic_grunt';
    }

    // 第 3-4 波：基础 + 快速
    if (wave < 4) {
      return Math.random() < 0.7 ? 'basic_grunt' : 'fast_runner';
    }

    // 第 5+ 波：所有类型
    const rand = Math.random();
    if (rand < 0.5) return 'basic_grunt';
    if (rand < 0.8) return 'fast_runner';
    return 'heavy_tank';
  }

  /**
   * 获取随机生成位置（屏幕边缘）
   * @returns {Object} { x, y }
   */
  getRandomSpawnPosition() {
    const margin = 50;
    const side = Math.floor(Math.random() * 4); // 0: 上, 1: 右, 2: 下, 3: 左

    let x, y;

    switch (side) {
      case 0: // 上
        x = Math.random() * this.canvasWidth;
        y = -margin;
        break;

      case 1: // 右
        x = this.canvasWidth + margin;
        y = Math.random() * this.canvasHeight;
        break;

      case 2: // 下
        x = Math.random() * this.canvasWidth;
        y = this.canvasHeight + margin;
        break;

      case 3: // 左
        x = -margin;
        y = Math.random() * this.canvasHeight;
        break;
    }

    return { x, y };
  }

  /**
   * 渲染所有敌人
   * @param {CanvasRenderingContext2D} ctx - Canvas 渲染上下文
   */
  renderEnemies(ctx) {
    const enemies = this.enemyPool.getActiveObjects();

    for (const enemy of enemies) {
      enemy.render(ctx);
    }
  }

  /**
   * 获取所有活跃敌人
   * @returns {Array<Enemy>}
   */
  getActiveEnemies() {
    return this.enemyPool.getActiveObjects();
  }

  /**
   * 通知敌人死亡（由 CollisionSystem 调用）
   * @param {Enemy} enemy - 死亡的敌人
   */
  onEnemyDeath(enemy) {
    this.enemyPool.release(enemy);
    this.stats.totalKilled++;
  }

  /**
   * 清空所有敌人
   */
  clearAllEnemies() {
    this.enemyPool.clear();
  }

  /**
   * 获取统计信息
   * @returns {Object}
   */
  getStats() {
    const wave = Math.floor(this.waveTimer / this.waveDuration) + 1;
    const waveProgress = (this.waveTimer % this.waveDuration) / this.waveDuration;

    return {
      currentWave: wave,
      waveProgress: waveProgress,
      totalSpawned: this.stats.totalSpawned,
      totalKilled: this.stats.totalKilled,
      currentAlive: this.stats.currentAlive,
      poolStats: this.enemyPool.getStats()
    };
  }

  /**
   * 手动触发下一波
   */
  nextWave() {
    this.currentWave++;
    this.waveTimer = this.currentWave * this.waveDuration;
    console.log(`Wave ${this.currentWave + 1} started!`);
  }

  /**
   * 重置系统
   */
  reset() {
    this.clearAllEnemies();
    this.currentWave = 0;
    this.waveTimer = 0;
    this.timeSinceLastSpawn = 0;
    this.stats.totalSpawned = 0;
    this.stats.totalKilled = 0;
    this.stats.currentAlive = 0;
  }
}
