/**
 * ObstacleSystem.js
 * 障碍物系统
 *
 * 职责：
 * - 管理障碍物对象池
 * - 生成障碍物（树木/巨石）
 * - 检测与载具的碰撞（阻挡机制）
 * - 检测光标挖掘
 * - 更新挖掘进度
 * - 处理挖掘完成和资源给予
 * - 触发屏幕抖动效果
 * - 控制载具速度
 */

import Obstacle from '../entities/Obstacle.js';
import ObjectPool from './ObjectPool.js';

export class ObstacleSystem {
  /**
   * 构造函数
   * @param {ScrollSystem} scrollSystem - 卷轴系统（用于坐标转换和速度控制）
   * @param {Number} canvasWidth - 画布宽度
   * @param {Number} canvasHeight - 画布高度
   */
  constructor(scrollSystem, canvasWidth, canvasHeight) {
    this.scrollSystem = scrollSystem;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // 初始化障碍物对象池
    this.obstaclePool = new ObjectPool(() => new Obstacle(), 20);

    // 障碍物生成配置
    this.spawnTimer = 0;
    this.spawnInterval = 8.0; // 每8秒尝试生成一个障碍物
    this.maxActiveObstacles = 8; // 最大同时存在的障碍物数

    // 障碍物类型权重
    this.obstacleWeights = {
      TREE: 0.6,  // 60% 概率
      ROCK: 0.4   // 40% 概率
    };

    // 载具配置（用于碰撞检测）
    this.vehicleX = canvasWidth * 0.33; // 载具 X 位置（屏幕左侧1/3）
    this.vehicleY = canvasHeight / 2;   // 载具 Y 位置（屏幕中央）
    this.vehicleWidth = 100;
    this.vehicleHeight = 80;

    // 当前正在挖掘的障碍物
    this.currentDigObstacle = null;

    // 屏幕抖动状态
    this.screenShake = {
      active: false,
      duration: 0,
      intensity: 0,
      offsetX: 0,
      offsetY: 0
    };

    // 阻挡状态
    this.isBlocked = false;
    this.blockingObstacle = null;

    // 统计信息
    this.stats = {
      totalSpawned: 0,
      totalCleared: 0,
      treesCleared: 0,
      rocksCleared: 0
    };

    console.log('ObstacleSystem 初始化');
  }

  /**
   * 更新障碍物系统
   * @param {Number} deltaTime - 时间增量（秒）
   * @param {Object} cursorPos - 光标位置 { x, y }（屏幕坐标）
   * @param {Object} resources - 资源对象（用于给予资源）
   */
  update(deltaTime, cursorPos, resources) {
    // 更新生成计时器
    this.spawnTimer += deltaTime;

    // 检查是否需要生成新障碍物
    if (this.spawnTimer >= this.spawnInterval) {
      this.trySpawnObstacle();
      this.spawnTimer = 0;
    }

    // 检测与载具的碰撞（阻挡）
    this.checkVehicleCollision();

    // 检测光标挖掘
    this.checkCursorDig(cursorPos, deltaTime, resources);

    // 更新屏幕抖动
    this.updateScreenShake(deltaTime);

    // 清理已清除的障碍物
    this.cleanupClearedObstacles();
  }

  /**
   * 尝试生成障碍物
   */
  trySpawnObstacle() {
    // 检查当前活跃障碍物数量
    const activeCount = this.getActiveObstacleCount();
    if (activeCount >= this.maxActiveObstacles) {
      return;
    }

    // 随机选择障碍物类型
    const obstacleType = this.randomObstacleType();

    // 生成位置（世界坐标）
    // 在载具前方一定距离内随机生成
    const currentDistance = this.scrollSystem.getDistanceTraveled();
    const spawnDistanceMin = currentDistance + this.canvasWidth * 0.8; // 屏幕右侧
    const spawnDistanceMax = currentDistance + this.canvasWidth * 2.0; // 更远处
    const worldX = spawnDistanceMin + Math.random() * (spawnDistanceMax - spawnDistanceMin);

    // Y 坐标在画布中间区域随机（避免生成在边缘）
    const worldY = this.canvasHeight * 0.3 + Math.random() * (this.canvasHeight * 0.4);

    // 生命值和挖掘时间（根据类型）
    let hp = 100;
    let digTime = 3.0;
    let rewardAmount = 15;

    switch (obstacleType) {
      case 'TREE':
        hp = 80;
        digTime = 2.5;
        rewardAmount = 15; // 建材
        break;
      case 'ROCK':
        hp = 120;
        digTime = 4.0;
        rewardAmount = 20; // 弹药
        break;
    }

    // 从对象池获取障碍物并初始化
    const obstacle = this.obstaclePool.get();
    if (obstacle) {
      obstacle.init({
        obstacleType,
        worldX,
        worldY,
        hp,
        maxHp: hp,
        digTime,
        rewardAmount
      });

      this.stats.totalSpawned++;
    }
  }

  /**
   * 随机选择障碍物类型（根据权重）
   * @returns {String} - 'TREE', 'ROCK'
   */
  randomObstacleType() {
    const rand = Math.random();
    let cumulative = 0;

    for (const [type, weight] of Object.entries(this.obstacleWeights)) {
      cumulative += weight;
      if (rand < cumulative) {
        return type;
      }
    }

    return 'TREE'; // 默认返回树木
  }

  /**
   * 检测与载具的碰撞（阻挡机制）
   */
  checkVehicleCollision() {
    let hasCollision = false;
    let collidingObstacle = null;

    for (const obstacle of this.obstaclePool.pool) {
      if (!obstacle.active || obstacle.cleared) {
        obstacle.isBlocking = false;
        continue;
      }

      // 转换世界坐标到屏幕坐标
      const screenX = this.scrollSystem.worldToScreenX(obstacle.worldX);
      const screenY = obstacle.worldY;

      // 检查是否在屏幕可见范围内
      if (screenX < -100 || screenX > this.canvasWidth + 100) {
        obstacle.isBlocking = false;
        continue;
      }

      // 检测是否与载具碰撞
      if (obstacle.checkVehicleCollision(
        this.vehicleX,
        this.vehicleY,
        this.vehicleWidth,
        this.vehicleHeight,
        screenX,
        screenY
      )) {
        hasCollision = true;
        collidingObstacle = obstacle;
        obstacle.isBlocking = true;
      } else {
        obstacle.isBlocking = false;
      }
    }

    // 处理阻挡状态变化
    if (hasCollision && !this.isBlocked) {
      // 刚开始阻挡
      this.onBlockStart(collidingObstacle);
    } else if (!hasCollision && this.isBlocked) {
      // 阻挡解除
      this.onBlockEnd();
    }

    this.isBlocked = hasCollision;
    this.blockingObstacle = collidingObstacle;
  }

  /**
   * 阻挡开始回调
   * @param {Obstacle} obstacle - 阻挡的障碍物
   */
  onBlockStart(obstacle) {
    console.log(`载具被阻挡: ${obstacle.obstacleType}`);

    // 停止卷轴（载具速度降为0）
    this.scrollSystem.currentSpeed = 0;

    // 触发屏幕抖动
    this.triggerScreenShake(0.3, 10);
  }

  /**
   * 阻挡解除回调
   */
  onBlockEnd() {
    console.log('载具恢复行驶');

    // 恢复卷轴速度
    this.scrollSystem.currentSpeed = this.scrollSystem.normalSpeed || 100;
  }

  /**
   * 触发屏幕抖动
   * @param {Number} duration - 持续时间（秒）
   * @param {Number} intensity - 强度（像素）
   */
  triggerScreenShake(duration, intensity) {
    this.screenShake.active = true;
    this.screenShake.duration = duration;
    this.screenShake.intensity = intensity;
  }

  /**
   * 更新屏幕抖动
   * @param {Number} deltaTime - 时间增量（秒）
   */
  updateScreenShake(deltaTime) {
    if (!this.screenShake.active) {
      this.screenShake.offsetX = 0;
      this.screenShake.offsetY = 0;
      return;
    }

    this.screenShake.duration -= deltaTime;

    if (this.screenShake.duration <= 0) {
      this.screenShake.active = false;
      this.screenShake.offsetX = 0;
      this.screenShake.offsetY = 0;
    } else {
      // 随机偏移
      const intensity = this.screenShake.intensity;
      this.screenShake.offsetX = (Math.random() - 0.5) * intensity * 2;
      this.screenShake.offsetY = (Math.random() - 0.5) * intensity * 2;
    }
  }

  /**
   * 检测光标挖掘并更新挖掘进度
   * @param {Object} cursorPos - 光标位置 { x, y }（屏幕坐标）
   * @param {Number} deltaTime - 时间增量（秒）
   * @param {Object} resources - 资源对象
   */
  checkCursorDig(cursorPos, deltaTime, resources) {
    if (!cursorPos) {
      // 如果没有光标位置，停止所有挖掘
      if (this.currentDigObstacle) {
        this.currentDigObstacle.stopDig();
        this.currentDigObstacle = null;
      }
      return;
    }

    // 查找光标悬停的障碍物
    let hoveredObstacle = null;

    for (const obstacle of this.obstaclePool.pool) {
      if (!obstacle.active || obstacle.cleared) continue;

      // 转换世界坐标到屏幕坐标
      const screenX = this.scrollSystem.worldToScreenX(obstacle.worldX);
      const screenY = obstacle.worldY;

      // 检查是否在屏幕可见范围内
      if (screenX < -100 || screenX > this.canvasWidth + 100) {
        continue;
      }

      // 检测光标是否悬停在障碍物上
      if (obstacle.containsPoint(cursorPos.x, cursorPos.y, screenX, screenY)) {
        hoveredObstacle = obstacle;
        break;
      }
    }

    // 处理挖掘逻辑
    if (hoveredObstacle) {
      // 如果悬停的障碍物不是当前挖掘障碍物，切换
      if (this.currentDigObstacle !== hoveredObstacle) {
        if (this.currentDigObstacle) {
          this.currentDigObstacle.stopDig();
        }
        hoveredObstacle.startDig({ type: 'cursor' });
        this.currentDigObstacle = hoveredObstacle;
      }

      // 更新挖掘进度
      const completed = this.currentDigObstacle.updateDig(deltaTime);

      // 如果挖掘完成
      if (completed) {
        this.onDigComplete(this.currentDigObstacle, resources);
        this.currentDigObstacle = null;
      }
    } else {
      // 没有悬停任何障碍物，停止当前挖掘
      if (this.currentDigObstacle) {
        this.currentDigObstacle.stopDig();
        this.currentDigObstacle = null;
      }
    }
  }

  /**
   * 挖掘完成回调
   * @param {Obstacle} obstacle - 障碍物
   * @param {Object} resources - 资源对象
   */
  onDigComplete(obstacle, resources) {
    const reward = obstacle.getReward();

    // 给予资源
    if (resources) {
      switch (reward.type) {
        case 'RED':
          resources.red += reward.amount;
          break;
        case 'BLUE':
          resources.blue += reward.amount;
          break;
      }
    }

    // 更新统计
    this.stats.totalCleared++;
    if (obstacle.obstacleType === 'TREE') {
      this.stats.treesCleared++;
    } else if (obstacle.obstacleType === 'ROCK') {
      this.stats.rocksCleared++;
    }

    console.log(`挖掘完成: ${obstacle.obstacleType} → ${reward.type} +${reward.amount}`);

    // 如果这个障碍物正在阻挡，阻挡将在下一帧自动解除
  }

  /**
   * 清理已清除的障碍物
   */
  cleanupClearedObstacles() {
    for (const obstacle of this.obstaclePool.pool) {
      if (obstacle.active && obstacle.cleared) {
        // 立即释放
        this.obstaclePool.release(obstacle);
      }
    }
  }

  /**
   * 获取当前活跃障碍物数量
   * @returns {Number}
   */
  getActiveObstacleCount() {
    let count = 0;
    for (const obstacle of this.obstaclePool.pool) {
      if (obstacle.active && !obstacle.cleared) {
        count++;
      }
    }
    return count;
  }

  /**
   * 渲染所有障碍物
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   */
  renderObstacles(ctx) {
    for (const obstacle of this.obstaclePool.pool) {
      if (!obstacle.active || obstacle.cleared) continue;

      // 转换世界坐标到屏幕坐标
      const screenX = this.scrollSystem.worldToScreenX(obstacle.worldX);
      const screenY = obstacle.worldY;

      // 只渲染屏幕可见范围内的障碍物
      if (screenX < -100 || screenX > this.canvasWidth + 100) {
        continue;
      }

      obstacle.render(ctx, screenX, screenY);
    }
  }

  /**
   * 渲染阻挡警告 UI
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   */
  renderBlockingWarning(ctx) {
    if (!this.isBlocked) {
      return;
    }

    // 左侧边缘红色呼吸灯
    const time = Date.now() / 1000;
    const alpha = 0.3 + Math.sin(time * 5) * 0.2; // 呼吸效果

    ctx.save();
    ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
    ctx.fillRect(0, 0, 20, this.canvasHeight);
    ctx.restore();

    // 屏幕中央警告文字
    ctx.save();
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 10;
    ctx.fillText('! 障碍物阻挡 !', this.canvasWidth / 2, 50);
    ctx.fillText('挖掘以继续前进', this.canvasWidth / 2, 90);
    ctx.restore();
  }

  /**
   * 应用屏幕抖动
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   */
  applyScreenShake(ctx) {
    if (this.screenShake.active) {
      ctx.translate(this.screenShake.offsetX, this.screenShake.offsetY);
    }
  }

  /**
   * 获取调试信息
   * @returns {Object}
   */
  getDebugInfo() {
    return {
      activeObstacles: this.getActiveObstacleCount(),
      totalSpawned: this.stats.totalSpawned,
      totalCleared: this.stats.totalCleared,
      treesCleared: this.stats.treesCleared,
      rocksCleared: this.stats.rocksCleared,
      isBlocked: this.isBlocked,
      isDigging: this.currentDigObstacle !== null,
      screenShake: this.screenShake.active
    };
  }

  /**
   * 重置障碍物系统
   */
  reset() {
    // 清空所有障碍物
    for (const obstacle of this.obstaclePool.pool) {
      if (obstacle.active) {
        this.obstaclePool.release(obstacle);
      }
    }

    // 重置当前挖掘障碍物
    this.currentDigObstacle = null;

    // 重置阻挡状态
    this.isBlocked = false;
    this.blockingObstacle = null;

    // 重置屏幕抖动
    this.screenShake.active = false;
    this.screenShake.duration = 0;
    this.screenShake.offsetX = 0;
    this.screenShake.offsetY = 0;

    // 重置计时器
    this.spawnTimer = 0;

    // 重置统计
    this.stats = {
      totalSpawned: 0,
      totalCleared: 0,
      treesCleared: 0,
      rocksCleared: 0
    };

    console.log('ObstacleSystem 已重置');
  }
}

export default ObstacleSystem;
