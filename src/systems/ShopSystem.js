/**
 * ShopSystem.js
 * 商店系统 - 管理组件购买、刷新、锁定
 *
 * 职责：
 * - 生成随机商品
 * - 处理购买逻辑
 * - 刷新商品池
 * - 锁定/解锁商品
 *
 * 设计规则（来自设计文档）：
 * - 每次进入安全屋，随机刷新 3-5 个商品
 * - 商品池：成品组件（不同形状/品质）、消耗品、服务
 * - 锁住功能：保留商品到下一次安全屋
 */

import { ComponentFactory } from '../factories/ComponentFactory.js';

export class ShopSystem {
  /**
   * 构造函数
   */
  constructor() {
    // 当前商店商品列表
    this.shopItems = [];

    // 商店配置
    this.minItems = 3;
    this.maxItems = 5;
    this.refreshCost = 10; // 刷新花费金币

    // 组件价格表（基础价格）
    this.componentBasePrices = {
      CORE: 100,
      WEAPON: 30,
      ARMOR: 25,
      BOOSTER: 40
    };

    // 品质价格倍数
    this.qualityMultipliers = {
      common: 1.0,
      uncommon: 1.5,
      rare: 2.0,
      epic: 3.0
    };

    console.log('ShopSystem 初始化');
  }

  /**
   * 生成新的商店商品
   * @param {Boolean} preserveLocked - 是否保留锁定的商品
   */
  refreshShop(preserveLocked = false) {
    // 保留锁定的商品
    const lockedItems = preserveLocked
      ? this.shopItems.filter(item => item.locked)
      : [];

    // 计算需要生成的新商品数量
    const itemCount = Math.floor(Math.random() * (this.maxItems - this.minItems + 1)) + this.minItems;
    const newItemsNeeded = itemCount - lockedItems.length;

    // 生成新商品
    const newItems = [];
    for (let i = 0; i < newItemsNeeded; i++) {
      newItems.push(this.generateRandomItem());
    }

    // 合并锁定商品和新商品
    this.shopItems = [...lockedItems, ...newItems];

    console.log(`商店刷新: ${newItems.length} 件新商品, ${lockedItems.length} 件锁定商品`);
  }

  /**
   * 生成随机商品
   * @returns {Object} 商品对象
   */
  generateRandomItem() {
    // 随机选择组件类型
    const types = ['CORE', 'WEAPON', 'ARMOR', 'BOOSTER'];
    const type = types[Math.floor(Math.random() * types.length)];

    // 随机选择品质（权重：普通70%，罕见20%，稀有8%，史诗2%）
    const rand = Math.random();
    let quality;
    if (rand < 0.70) {
      quality = 'common';
    } else if (rand < 0.90) {
      quality = 'uncommon';
    } else if (rand < 0.98) {
      quality = 'rare';
    } else {
      quality = 'epic';
    }

    // 生成组件
    const component = ComponentFactory.createComponent(type, { quality });

    // 计算价格
    const basePrice = this.componentBasePrices[type];
    const qualityMultiplier = this.qualityMultipliers[quality];
    const price = Math.floor(basePrice * qualityMultiplier);

    return {
      id: `shop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      component: component,
      price: price,
      locked: false
    };
  }

  /**
   * 购买商品
   * @param {String} itemId - 商品ID
   * @param {Object} resources - 资源对象（用于扣除金币）
   * @returns {Object|null} 购买的组件，或 null（如果购买失败）
   */
  purchase(itemId, resources) {
    const itemIndex = this.shopItems.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      console.warn(`商品不存在: ${itemId}`);
      return null;
    }

    const item = this.shopItems[itemIndex];

    // 检查金币是否足够
    if (resources.gold < item.price) {
      console.warn(`金币不足: 需要 ${item.price}, 当前 ${resources.gold}`);
      return null;
    }

    // 扣除金币
    resources.gold -= item.price;

    // 移除商品
    this.shopItems.splice(itemIndex, 1);

    console.log(`购买成功: ${item.component.type} (${item.component.quality}) - ${item.price} 金币`);

    return item.component;
  }

  /**
   * 切换商品锁定状态
   * @param {String} itemId - 商品ID
   * @returns {Boolean} 新的锁定状态
   */
  toggleLock(itemId) {
    const item = this.shopItems.find(item => item.id === itemId);
    if (!item) {
      console.warn(`商品不存在: ${itemId}`);
      return false;
    }

    item.locked = !item.locked;
    console.log(`商品 ${itemId} ${item.locked ? '已锁定' : '已解锁'}`);
    return item.locked;
  }

  /**
   * 获取商店商品列表
   * @returns {Array}
   */
  getItems() {
    return this.shopItems;
  }

  /**
   * 检查是否有足够的金币刷新
   * @param {Object} resources - 资源对象
   * @returns {Boolean}
   */
  canRefresh(resources) {
    return resources.gold >= this.refreshCost;
  }

  /**
   * 刷新商店（消耗金币）
   * @param {Object} resources - 资源对象
   * @returns {Boolean} 是否刷新成功
   */
  refreshWithCost(resources) {
    if (!this.canRefresh(resources)) {
      console.warn(`金币不足: 刷新需要 ${this.refreshCost} 金币`);
      return false;
    }

    // 扣除金币
    resources.gold -= this.refreshCost;

    // 刷新商店（保留锁定商品）
    this.refreshShop(true);

    console.log(`商店刷新成功，消耗 ${this.refreshCost} 金币`);
    return true;
  }

  /**
   * 获取商店统计信息
   * @returns {Object}
   */
  getStats() {
    return {
      totalItems: this.shopItems.length,
      lockedItems: this.shopItems.filter(item => item.locked).length,
      refreshCost: this.refreshCost
    };
  }
}
