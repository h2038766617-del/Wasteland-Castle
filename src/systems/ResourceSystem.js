/**
 * ResourceSystem.js
 * 资源采集系统
 *
 * 职责：
 * - 管理资源节点对象池
 * - 生成资源节点（在横版卷轴世界中）
 * - 检测光标悬停采集
 * - 更新采集进度
 * - 处理采集完成和资源给予
 * - 渲染资源节点和采集进度条
 */

import ResourceNode from '../entities/ResourceNode.js';
import ObjectPool from './ObjectPool.js';

export class ResourceSystem {
  /**
   * 构造函数
   * @param {ScrollSystem} scrollSystem - 卷轴系统（用于坐标转换）
   * @param {Number} canvasWidth - 画布宽度
   * @param {Number} canvasHeight - 画布高度
   */
  constructor(scrollSystem, canvasWidth, canvasHeight) {
    this.scrollSystem = scrollSystem;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // 初始化资源节点对象池
    this.nodePool = new ObjectPool(() => new ResourceNode(), 30);

    // 资源生成配置
    this.spawnTimer = 0;
    this.spawnInterval = 3.0; // 每3秒尝试生成一个资源节点
    this.maxActiveNodes = 10; // 最大同时存在的资源节点数

    // 资源类型权重（生成概率）
    this.resourceWeights = {
      RED: 0.5,   // 50% 概率
      BLUE: 0.3,  // 30% 概率
      GOLD: 0.2   // 20% 概率
    };

    // 当前正在采集的节点
    this.currentHarvestNode = null;

    // 资源掉落动画列表
    this.resourceDrops = [];

    // 统计信息
    this.stats = {
      totalSpawned: 0,
      totalCollected: 0,
      redCollected: 0,
      blueCollected: 0,
      goldCollected: 0
    };

    console.log('ResourceSystem 初始化');
  }

  /**
   * 更新资源系统
   * @param {Number} deltaTime - 时间增量（秒）
   * @param {Object} cursorPos - 光标位置 { x, y }（屏幕坐标）
   * @param {Object} resources - 资源对象（用于给予资源）
   */
  update(deltaTime, cursorPos, resources) {
    // 更新生成计时器
    this.spawnTimer += deltaTime;

    // 检查是否需要生成新资源节点
    if (this.spawnTimer >= this.spawnInterval) {
      this.trySpawnResourceNode();
      this.spawnTimer = 0;
    }

    // 检测光标悬停
    this.checkCursorHover(cursorPos, deltaTime, resources);

    // 更新资源掉落动画
    this.updateResourceDrops(deltaTime);

    // 清理已采集完成的节点
    this.cleanupCollectedNodes();
  }

  /**
   * 尝试生成资源节点
   */
  trySpawnResourceNode() {
    // 检查当前活跃节点数量
    const activeCount = this.getActiveNodeCount();
    if (activeCount >= this.maxActiveNodes) {
      return;
    }

    // 随机选择资源类型
    const resourceType = this.randomResourceType();

    // 生成位置（世界坐标）
    // 在载具前方一定距离内随机生成
    const currentDistance = this.scrollSystem.getDistanceTraveled();
    const spawnDistanceMin = currentDistance + this.canvasWidth * 0.5; // 屏幕右侧
    const spawnDistanceMax = currentDistance + this.canvasWidth * 1.5; // 更远处
    const worldX = spawnDistanceMin + Math.random() * (spawnDistanceMax - spawnDistanceMin);

    // Y 坐标在画布中间区域随机
    const worldY = this.canvasHeight * 0.3 + Math.random() * (this.canvasHeight * 0.4);

    // 资源数量（根据类型）
    let amount = 10;
    let harvestTime = 2.0;
    switch (resourceType) {
      case 'RED':
        amount = 15 + Math.floor(Math.random() * 15); // 15-30 (+50%)
        harvestTime = 1.5;
        break;
      case 'BLUE':
        amount = 8 + Math.floor(Math.random() * 15); // 8-23 (+50%)
        harvestTime = 2.0;
        break;
      case 'GOLD':
        amount = 5 + Math.floor(Math.random() * 7); // 5-12 (+50%)
        harvestTime = 3.0;
        break;
    }

    // 从对象池获取节点并初始化
    const node = this.nodePool.acquire({
      resourceType,
      worldX,
      worldY,
      amount,
      harvestTime
    });
    if (node) {
      this.stats.totalSpawned++;
    }
  }

  /**
   * 随机选择资源类型（根据权重）
   * @returns {String} - 'RED', 'BLUE', 'GOLD'
   */
  randomResourceType() {
    const rand = Math.random();
    let cumulative = 0;

    for (const [type, weight] of Object.entries(this.resourceWeights)) {
      cumulative += weight;
      if (rand < cumulative) {
        return type;
      }
    }

    return 'RED'; // 默认返回红色
  }

  /**
   * 检测光标悬停并更新采集进度
   * @param {Object} cursorPos - 光标位置 { x, y }（屏幕坐标）
   * @param {Number} deltaTime - 时间增量（秒）
   * @param {Object} resources - 资源对象
   */
  checkCursorHover(cursorPos, deltaTime, resources) {
    if (!cursorPos) {
      // 如果没有光标位置，停止所有采集
      if (this.currentHarvestNode) {
        this.currentHarvestNode.stopHarvest();
        this.currentHarvestNode = null;
      }
      return;
    }

    // 查找光标悬停的节点
    let hoveredNode = null;

    for (const node of this.nodePool.pool) {
      if (!node.active || node.collected) continue;

      // 转换世界坐标到屏幕坐标
      const screenX = this.scrollSystem.worldToScreenX(node.worldX);
      const screenY = node.worldY; // Y 坐标不受卷轴影响

      // 检查是否在屏幕可见范围内
      if (screenX < -50 || screenX > this.canvasWidth + 50) {
        continue;
      }

      // 检测光标是否悬停在节点上
      if (node.containsPoint(cursorPos.x, cursorPos.y, screenX, screenY)) {
        hoveredNode = node;
        break;
      }
    }

    // 处理采集逻辑
    if (hoveredNode) {
      // 如果悬停的节点不是当前采集节点，切换
      if (this.currentHarvestNode !== hoveredNode) {
        if (this.currentHarvestNode) {
          this.currentHarvestNode.stopHarvest();
        }
        hoveredNode.startHarvest({ type: 'cursor' }); // 简单的采集者标识
        this.currentHarvestNode = hoveredNode;
      }

      // 更新采集进度
      const completed = this.currentHarvestNode.updateHarvest(deltaTime);

      // 如果采集完成
      if (completed) {
        this.onHarvestComplete(this.currentHarvestNode, resources);
        this.currentHarvestNode = null;
      }
    } else {
      // 没有悬停任何节点，停止当前采集
      if (this.currentHarvestNode) {
        this.currentHarvestNode.stopHarvest();
        this.currentHarvestNode = null;
      }
    }
  }

  /**
   * 采集完成回调
   * @param {ResourceNode} node - 资源节点
   * @param {Object} resources - 资源对象
   */
  onHarvestComplete(node, resources) {
    const reward = node.getReward();

    // 给予资源
    if (resources) {
      switch (reward.type) {
        case 'RED':
          resources.red += reward.amount;
          this.stats.redCollected += reward.amount;
          break;
        case 'BLUE':
          resources.blue += reward.amount;
          this.stats.blueCollected += reward.amount;
          break;
        case 'GOLD':
          resources.gold += reward.amount;
          this.stats.goldCollected += reward.amount;
          break;
      }
    }

    // 创建资源掉落动画
    const screenX = this.scrollSystem.worldToScreenX(node.worldX);
    const screenY = node.worldY;
    this.createResourceDrop(screenX, screenY, reward);

    // 更新统计
    this.stats.totalCollected++;

    console.log(`采集完成: ${reward.type} +${reward.amount}`);
  }

  /**
   * 创建资源掉落动画
   * @param {Number} startX - 起始 X 坐标
   * @param {Number} startY - 起始 Y 坐标
   * @param {Object} reward - 资源奖励
   */
  createResourceDrop(startX, startY, reward) {
    // 目标位置：左上角资源栏
    const targetX = 100;
    const targetY = 60;

    this.resourceDrops.push({
      x: startX,
      y: startY,
      targetX,
      targetY,
      type: reward.type,
      amount: reward.amount,
      progress: 0, // 动画进度 (0-1)
      duration: 0.8 // 动画持续时间（秒）
    });
  }

  /**
   * 更新资源掉落动画
   * @param {Number} deltaTime - 时间增量（秒）
   */
  updateResourceDrops(deltaTime) {
    for (let i = this.resourceDrops.length - 1; i >= 0; i--) {
      const drop = this.resourceDrops[i];
      drop.progress += deltaTime / drop.duration;

      if (drop.progress >= 1.0) {
        // 动画完成，移除
        this.resourceDrops.splice(i, 1);
      }
    }
  }

  /**
   * 清理已采集完成的节点
   */
  cleanupCollectedNodes() {
    for (const node of this.nodePool.pool) {
      if (node.active && node.collected) {
        // 等待一小段时间后释放（给动画时间）
        this.nodePool.release(node);
      }
    }
  }

  /**
   * 获取当前活跃节点数量
   * @returns {Number}
   */
  getActiveNodeCount() {
    let count = 0;
    for (const node of this.nodePool.pool) {
      if (node.active && !node.collected) {
        count++;
      }
    }
    return count;
  }

  /**
   * 渲染所有资源节点
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   */
  renderNodes(ctx) {
    for (const node of this.nodePool.pool) {
      if (!node.active || node.collected) continue;

      // 转换世界坐标到屏幕坐标
      const screenX = this.scrollSystem.worldToScreenX(node.worldX);
      const screenY = node.worldY;

      // 只渲染屏幕可见范围内的节点
      if (screenX < -50 || screenX > this.canvasWidth + 50) {
        continue;
      }

      node.render(ctx, screenX, screenY);
    }
  }

  /**
   * 渲染资源掉落动画
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   */
  renderResourceDrops(ctx) {
    for (const drop of this.resourceDrops) {
      // 使用缓动函数计算当前位置
      const t = this.easeOutCubic(drop.progress);
      const currentX = drop.x + (drop.targetX - drop.x) * t;
      const currentY = drop.y + (drop.targetY - drop.y) * t;

      // 计算透明度（淡出）
      const alpha = 1.0 - drop.progress * 0.5;

      // 绘制资源图标（小圆点）
      ctx.save();
      ctx.globalAlpha = alpha;

      // 根据资源类型设置颜色
      let color = '#FF3333';
      switch (drop.type) {
        case 'RED': color = '#FF3333'; break;
        case 'BLUE': color = '#3333FF'; break;
        case 'GOLD': color = '#FFD700'; break;
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(currentX, currentY, 8, 0, Math.PI * 2);
      ctx.fill();

      // 绘制数量文字
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`+${drop.amount}`, currentX, currentY);

      ctx.restore();
    }
  }

  /**
   * 缓动函数 - EaseOutCubic
   * @param {Number} t - 进度 (0-1)
   * @returns {Number}
   */
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * 获取调试信息
   * @returns {Object}
   */
  getDebugInfo() {
    return {
      activeNodes: this.getActiveNodeCount(),
      totalSpawned: this.stats.totalSpawned,
      totalCollected: this.stats.totalCollected,
      redCollected: this.stats.redCollected,
      blueCollected: this.stats.blueCollected,
      goldCollected: this.stats.goldCollected,
      isHarvesting: this.currentHarvestNode !== null
    };
  }

  /**
   * 重置资源系统
   */
  reset() {
    // 清空所有节点
    for (const node of this.nodePool.pool) {
      if (node.active) {
        this.nodePool.release(node);
      }
    }

    // 清空掉落动画
    this.resourceDrops = [];

    // 重置当前采集节点
    this.currentHarvestNode = null;

    // 重置计时器
    this.spawnTimer = 0;

    // 重置统计
    this.stats = {
      totalSpawned: 0,
      totalCollected: 0,
      redCollected: 0,
      blueCollected: 0,
      goldCollected: 0
    };

    console.log('ResourceSystem 已重置');
  }
}

export default ResourceSystem;
