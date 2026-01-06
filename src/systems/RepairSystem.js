/**
 * RepairSystem.js
 * 修复系统 - 管理组件修复逻辑
 *
 * 职责：
 * - 检测受损组件
 * - 计算修复成本
 * - 执行修复操作
 * - 提供修复UI提示
 *
 * 设计规则（来自设计文档）：
 * - 消耗蓝色资源（建材）修复组件
 * - 修复成本 = (损失的HP / 最大HP) * 基础成本
 * - 只能在安全屋修复
 */

export class RepairSystem {
  /**
   * 构造函数
   * @param {GridManager} gridManager - 网格管理器
   */
  constructor(gridManager) {
    this.gridManager = gridManager;

    // 修复成本配置（每点HP需要的建材）
    this.repairCostPerHP = 0.5; // 每点HP需要0.5建材
    this.minRepairCost = 5; // 最小修复成本

    console.log('RepairSystem 初始化');
  }

  /**
   * 获取所有受损组件
   * @returns {Array<{component: Component, damage: number, cost: number}>}
   */
  getDamagedComponents() {
    const damaged = [];
    const components = this.gridManager.getAllComponents();

    for (const component of components) {
      const currentHP = component.stats.hp;
      const maxHP = component.stats.maxHp;

      if (currentHP < maxHP) {
        const damage = maxHP - currentHP;
        const cost = this.calculateRepairCost(component);

        damaged.push({
          component: component,
          damage: damage,
          cost: cost
        });
      }
    }

    return damaged;
  }

  /**
   * 计算修复成本
   * @param {Component} component - 要修复的组件
   * @returns {number} 所需建材数量
   */
  calculateRepairCost(component) {
    const currentHP = component.stats.hp;
    const maxHP = component.stats.maxHp;
    const damage = maxHP - currentHP;

    if (damage <= 0) {
      return 0;
    }

    // 基础成本：每点HP需要一定建材
    const baseCost = Math.ceil(damage * this.repairCostPerHP);

    // 确保至少有最小成本
    return Math.max(baseCost, this.minRepairCost);
  }

  /**
   * 修复单个组件
   * @param {Component} component - 要修复的组件
   * @param {Object} resources - 资源对象
   * @returns {boolean} 是否修复成功
   */
  repairComponent(component, resources) {
    const cost = this.calculateRepairCost(component);

    // 检查是否已满血
    if (cost === 0) {
      console.log('组件已满血，无需修复');
      return false;
    }

    // 检查资源是否足够
    if (resources.blue < cost) {
      console.warn(`建材不足: 需要 ${cost}, 当前 ${Math.floor(resources.blue)}`);
      return false;
    }

    // 扣除资源
    resources.blue -= cost;

    // 恢复HP
    component.stats.hp = component.stats.maxHp;

    console.log(`修复成功: ${component.type} 恢复 ${cost} 建材`);
    return true;
  }

  /**
   * 修复所有组件（一键修复）
   * @param {Object} resources - 资源对象
   * @returns {{repaired: number, cost: number}} 修复数量和总成本
   */
  repairAll(resources) {
    const damaged = this.getDamagedComponents();
    let totalCost = 0;
    let repairedCount = 0;

    // 计算总成本
    for (const item of damaged) {
      totalCost += item.cost;
    }

    // 检查资源是否足够
    if (resources.blue < totalCost) {
      console.warn(`建材不足: 需要 ${totalCost}, 当前 ${Math.floor(resources.blue)}`);
      return { repaired: 0, cost: 0 };
    }

    // 修复所有组件
    for (const item of damaged) {
      resources.blue -= item.cost;
      item.component.stats.hp = item.component.stats.maxHp;
      repairedCount++;
    }

    console.log(`一键修复: ${repairedCount} 个组件, 消耗 ${totalCost} 建材`);
    return { repaired: repairedCount, cost: totalCost };
  }

  /**
   * 获取修复统计信息
   * @returns {Object}
   */
  getStats() {
    const damaged = this.getDamagedComponents();
    let totalCost = 0;

    for (const item of damaged) {
      totalCost += item.cost;
    }

    return {
      damagedCount: damaged.length,
      totalRepairCost: totalCost
    };
  }

  /**
   * 检查组件是否需要修复
   * @param {Component} component - 组件
   * @returns {boolean}
   */
  needsRepair(component) {
    return component.stats.hp < component.stats.maxHp;
  }

  /**
   * 获取组件的修复百分比
   * @param {Component} component - 组件
   * @returns {number} 0-1之间的值
   */
  getRepairPercentage(component) {
    const currentHP = component.stats.hp;
    const maxHP = component.stats.maxHp;

    if (maxHP === 0) {
      return 1.0;
    }

    return currentHP / maxHP;
  }
}
