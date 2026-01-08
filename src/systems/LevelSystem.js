/**
 * LevelSystem.js
 * 等级系统 - 管理XP、升级、三选一奖励
 *
 * 职责：
 * - 追踪当前XP和等级
 * - 计算升级所需XP
 * - 触发升级事件
 * - 生成三选一组件奖励
 *
 * 设计规则（来自机制补充.txt）：
 * - 敌人死亡掉落XP
 * - 载具通过收集XP升级
 * - 升级后提供三选一组件
 * - 玩家选择后立即安装
 */

import { ComponentFactory } from '../factories/ComponentFactory.js';

export class LevelSystem {
  /**
   * 构造函数
   */
  constructor() {
    // 当前等级和经验
    this.currentLevel = 1;
    this.currentXP = 0;
    this.xpToNextLevel = 100; // 升到2级需要100XP

    // XP成长曲线（每级所需XP增加30%）
    this.xpGrowthRate = 1.3;

    // 三选一奖励
    this.pendingRewards = null; // { component1, component2, component3 }
    this.isShowingRewards = false;

    // 统计
    this.totalXPGained = 0;

    console.log('LevelSystem 初始化');
  }

  /**
   * 添加经验值
   * @param {Number} amount - XP数量
   * @returns {Boolean} 是否升级
   */
  addXP(amount) {
    this.currentXP += amount;
    this.totalXPGained += amount;

    // 检查是否升级
    if (this.currentXP >= this.xpToNextLevel) {
      return this.levelUp();
    }

    return false;
  }

  /**
   * 升级
   * @returns {Boolean} 总是返回true
   */
  levelUp() {
    // 扣除升级所需XP
    this.currentXP -= this.xpToNextLevel;

    // 等级提升
    this.currentLevel++;

    // 计算下一级所需XP（指数增长）
    this.xpToNextLevel = Math.floor(this.xpToNextLevel * this.xpGrowthRate);

    console.log(`=== 升级！当前等级: ${this.currentLevel} ===`);
    console.log(`下一级需要: ${this.xpToNextLevel} XP`);

    // 生成三选一奖励
    this.generateRewards();

    return true;
  }

  /**
   * 生成三选一组件奖励
   */
  generateRewards() {
    // 随机生成3个不同的组件
    const component1 = this.generateRandomReward();
    const component2 = this.generateRandomReward();
    const component3 = this.generateRandomReward();

    this.pendingRewards = {
      component1,
      component2,
      component3
    };

    this.isShowingRewards = true;

    console.log('三选一奖励已生成');
  }

  /**
   * 生成随机奖励组件
   * @returns {Component}
   */
  generateRandomReward() {
    // 类型权重：WEAPON 40%, ARMOR 30%, BOOSTER 20%, CORE 10%
    const rand = Math.random();
    let type;

    if (rand < 0.40) {
      type = 'WEAPON';
    } else if (rand < 0.70) {
      type = 'ARMOR';
    } else if (rand < 0.90) {
      type = 'BOOSTER';
    } else {
      type = 'CORE';
    }

    // 品质权重（随等级提升）
    const quality = this.getQualityByLevel();

    return ComponentFactory.createComponent(type, { quality });
  }

  /**
   * 根据等级决定品质权重
   * @returns {String} 品质
   */
  getQualityByLevel() {
    // 早期等级：大部分common
    // 中期等级：更多uncommon/rare
    // 后期等级：更多rare/epic

    const levelFactor = Math.min(this.currentLevel / 20, 1.0); // 20级封顶
    const rand = Math.random();

    // 根据等级调整权重
    const commonThreshold = 0.70 - (levelFactor * 0.40); // 70% -> 30%
    const uncommonThreshold = commonThreshold + 0.20;
    const rareThreshold = uncommonThreshold + (0.08 + levelFactor * 0.20); // 8% -> 28%

    if (rand < commonThreshold) {
      return 'common';
    } else if (rand < uncommonThreshold) {
      return 'uncommon';
    } else if (rand < rareThreshold) {
      return 'rare';
    } else {
      return 'epic';
    }
  }

  /**
   * 玩家选择奖励
   * @param {Number} choice - 选择 (1, 2, 或 3)
   * @returns {Component} 选中的组件
   */
  selectReward(choice) {
    if (!this.isShowingRewards || !this.pendingRewards) {
      console.warn('没有待选择的奖励');
      return null;
    }

    let selectedComponent = null;

    switch (choice) {
      case 1:
        selectedComponent = this.pendingRewards.component1;
        break;
      case 2:
        selectedComponent = this.pendingRewards.component2;
        break;
      case 3:
        selectedComponent = this.pendingRewards.component3;
        break;
      default:
        console.warn('无效的选择');
        return null;
    }

    console.log(`选择了奖励 ${choice}: ${selectedComponent.type} (${selectedComponent.quality})`);

    // 清除奖励状态
    this.pendingRewards = null;
    this.isShowingRewards = false;

    return selectedComponent;
  }

  /**
   * 获取经验值百分比
   * @returns {Number} 0-1之间的值
   */
  getXPPercentage() {
    if (this.xpToNextLevel === 0) {
      return 1.0;
    }
    return this.currentXP / this.xpToNextLevel;
  }

  /**
   * 是否正在显示奖励UI
   * @returns {Boolean}
   */
  isShowingRewardUI() {
    return this.isShowingRewards;
  }

  /**
   * 获取待选择的奖励
   * @returns {Object|null}
   */
  getPendingRewards() {
    return this.pendingRewards;
  }

  /**
   * 获取统计信息
   * @returns {Object}
   */
  getStats() {
    return {
      currentLevel: this.currentLevel,
      currentXP: this.currentXP,
      xpToNextLevel: this.xpToNextLevel,
      totalXPGained: this.totalXPGained,
      xpPercentage: this.getXPPercentage()
    };
  }

  /**
   * 重置等级系统
   */
  reset() {
    this.currentLevel = 1;
    this.currentXP = 0;
    this.xpToNextLevel = 100;
    this.pendingRewards = null;
    this.isShowingRewards = false;
    this.totalXPGained = 0;

    console.log('LevelSystem 已重置');
  }
}
