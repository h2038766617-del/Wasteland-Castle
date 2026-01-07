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

    // 波次系统（重构）
    this.currentWave = 1; // 当前波次（从1开始）
    this.maxWaves = 10; // 总波次数
    this.waveState = 'PREPARING'; // 状态：PREPARING, WAVE_ACTIVE, WAVE_COMPLETE（给玩家准备时间）
    this.waveTimer = 0; // 当前状态计时器
    this.prepareDuration = 8.0; // 准备期时长（秒）
    this.waveDuration = 30.0; // 战斗期时长（秒）

    // 敌人生成配置
    this.enemiesPerWave = 10; // 每波敌人数量（基础值）
    this.enemiesSpawnedThisWave = 0; // 本波已生成数量
    this.timeSinceLastSpawn = 0;
    this.spawnInterval = 3.0; // 生成间隔（秒）

    // 敌人类型配置
    this.enemyTypes = {
      basic_grunt: {
        hp: 40,
        maxHp: 40,
        damage: 10,
        moveSpeed: 30,
        rewardRed: 5,
        rewardGold: 1
      },
      fast_runner: {
        hp: 25,
        maxHp: 25,
        damage: 5,
        moveSpeed: 60,
        rewardRed: 3,
        rewardGold: 2
      },
      heavy_tank: {
        hp: 120,
        maxHp: 120,
        damage: 20,
        moveSpeed: 15,
        rewardRed: 10,
        rewardGold: 5
      }
    };

    // 难度系数（基于旅途编号）
    this.difficultyMultiplier = 1.0;

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
    // 更新波次状态机
    this.updateWaveStateMachine(deltaTime);

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
    this.stats.currentWave = this.currentWave;
  }

  /**
   * 波次状态机更新
   * @param {Number} deltaTime - 时间增量（秒）
   */
  updateWaveStateMachine(deltaTime) {
    this.waveTimer += deltaTime;

    switch (this.waveState) {
      case 'PREPARING':
        // 准备期：不生成敌人，等待玩家准备
        if (this.waveTimer >= this.prepareDuration) {
          this.startWave();
        }
        break;

      case 'WAVE_ACTIVE':
        // 战斗期：持续生成敌人
        this.timeSinceLastSpawn += deltaTime;

        // 检查是否应该生成敌人
        const targetEnemies = this.getEnemiesForCurrentWave();
        if (this.enemiesSpawnedThisWave < targetEnemies &&
            this.timeSinceLastSpawn >= this.spawnInterval) {
          this.spawnEnemy();
          this.enemiesSpawnedThisWave++;
          this.timeSinceLastSpawn = 0;
        }

        // 检查波次是否完成（所有敌人已生成且已被消灭）
        const activeEnemies = this.enemyPool.getActiveObjects().length;
        if (this.enemiesSpawnedThisWave >= targetEnemies && activeEnemies === 0) {
          this.completeWave();
        }
        break;

      case 'WAVE_COMPLETE':
        // 波次完成：过渡到下一波
        if (this.waveTimer >= 2.0) { // 2秒过渡时间
          this.prepareNextWave();
        }
        break;
    }
  }

  /**
   * 开始当前波次
   */
  startWave() {
    this.waveState = 'WAVE_ACTIVE';
    this.waveTimer = 0;
    this.enemiesSpawnedThisWave = 0;
    this.timeSinceLastSpawn = this.spawnInterval; // 立即生成第一个敌人
  }

  /**
   * 完成当前波次
   */
  completeWave() {
    this.waveState = 'WAVE_COMPLETE';
    this.waveTimer = 0;
  }

  /**
   * 准备下一波
   */
  prepareNextWave() {
    this.currentWave++;

    if (this.currentWave > this.maxWaves) {
      this.waveState = 'VICTORY';
      return;
    }

    this.waveState = 'PREPARING';
    this.waveTimer = 0;
  }

  /**
   * 获取当前波次应该生成的敌人数量
   * @returns {Number}
   */
  getEnemiesForCurrentWave() {
    // 难度递增：每波增加2个敌人
    return this.enemiesPerWave + (this.currentWave - 1) * 2;
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

    // 应用难度系数（基于旅途编号）
    const scaledConfig = {
      ...config,
      hp: Math.floor(config.hp * this.difficultyMultiplier),
      maxHp: Math.floor(config.maxHp * this.difficultyMultiplier),
      damage: Math.floor(config.damage * this.difficultyMultiplier),
      moveSpeed: config.moveSpeed * (1 + (this.difficultyMultiplier - 1) * 0.5), // 移速增长减半
      rewardRed: Math.floor(config.rewardRed * this.difficultyMultiplier),
      rewardGold: Math.floor(config.rewardGold * this.difficultyMultiplier)
    };

    // 随机生成位置（屏幕边缘）
    const spawnPos = this.getRandomSpawnPosition();

    // 从对象池获取敌人
    const enemy = this.enemyPool.acquire({
      type: type,
      position: spawnPos,
      ...scaledConfig
    });

    // 更新统计
    this.stats.totalSpawned++;
  }

  /**
   * 根据波次选择敌人类型
   * @returns {String} 敌人类型
   */
  selectEnemyType() {
    const rand = Math.random();

    // 波次 1-2：仅基础敌人（教学期）
    if (this.currentWave <= 2) {
      return 'basic_grunt';
    }

    // 波次 3-4：引入快速敌人
    if (this.currentWave <= 4) {
      return rand < 0.7 ? 'basic_grunt' : 'fast_runner';
    }

    // 波次 5-7：三种敌人混合
    if (this.currentWave <= 7) {
      if (rand < 0.5) {
        return 'basic_grunt';
      } else if (rand < 0.8) {
        return 'fast_runner';
      } else {
        return 'heavy_tank';
      }
    }

    // 波次 8-10：困难模式（更多重型敌人）
    if (rand < 0.3) {
      return 'basic_grunt';
    } else if (rand < 0.6) {
      return 'fast_runner';
    } else {
      return 'heavy_tank';
    }
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
    return {
      currentWave: this.currentWave,
      maxWaves: this.maxWaves,
      waveState: this.waveState,
      waveTimer: this.waveTimer,
      prepareDuration: this.prepareDuration,
      waveDuration: this.waveDuration,
      enemiesSpawned: this.enemiesSpawnedThisWave,
      enemiesTarget: this.waveState === 'WAVE_ACTIVE' ? this.getEnemiesForCurrentWave() : 0,
      totalSpawned: this.stats.totalSpawned,
      totalKilled: this.stats.totalKilled,
      currentAlive: this.stats.currentAlive,
      poolStats: this.enemyPool.getStats()
    };
  }

  /**
   * 获取波次显示信息（用于UI）
   * @returns {Object}
   */
  getWaveDisplayInfo() {
    let statusText = '';
    let timeRemaining = 0;

    switch (this.waveState) {
      case 'PREPARING':
        statusText = '准备中';
        timeRemaining = Math.ceil(this.prepareDuration - this.waveTimer);
        break;
      case 'WAVE_ACTIVE':
        statusText = '战斗中';
        timeRemaining = this.getEnemiesForCurrentWave() - this.enemiesSpawnedThisWave;
        break;
      case 'WAVE_COMPLETE':
        statusText = '波次完成';
        timeRemaining = 0;
        break;
      case 'VICTORY':
        statusText = '胜利！';
        timeRemaining = 0;
        break;
    }

    return {
      currentWave: this.currentWave,
      maxWaves: this.maxWaves,
      statusText,
      timeRemaining,
      waveState: this.waveState
    };
  }

  /**
   * 手动触发下一波
   */
  nextWave() {
    this.currentWave++;
    this.waveTimer = this.currentWave * this.waveDuration;
  }

  /**
   * 重置系统
   */
  reset() {
    this.clearAllEnemies();
    this.currentWave = 1;
    this.waveState = 'PREPARING'; // 给玩家准备时间
    this.waveTimer = 0;
    this.enemiesSpawnedThisWave = 0;
    this.timeSinceLastSpawn = 0;
    this.stats.totalSpawned = 0;
    this.stats.totalKilled = 0;
    this.stats.currentAlive = 0;
  }

  /**
   * 设置难度系数（基于旅途编号）
   * @param {Number} journeyNumber - 旅途编号（从1开始）
   */
  setDifficulty(journeyNumber) {
    // 每次旅途增加20%难度
    this.difficultyMultiplier = 1 + (journeyNumber - 1) * 0.2;
    console.log(`旅途 #${journeyNumber}：难度系数 = ${this.difficultyMultiplier.toFixed(2)}x`);
  }
}
