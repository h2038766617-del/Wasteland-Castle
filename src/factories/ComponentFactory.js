/**
 * ComponentFactory.js
 * 组件工厂 - 生成不同类型和品质的组件
 *
 * 职责：
 * - 创建基础组件（CORE, WEAPON, ARMOR, BOOSTER）
 * - 应用品质系数
 * - 生成随机变体
 */

import Component from '../entities/Component.js';
import { COMPONENT_TYPES } from '../config/Constants.js';

export class ComponentFactory {
  /**
   * 创建组件
   * @param {String} type - 组件类型（CORE, WEAPON, ARMOR, BOOSTER）
   * @param {Object} options - 选项 { quality: 'common'|'uncommon'|'rare'|'epic', ... }
   * @returns {Component}
   */
  static createComponent(type, options = {}) {
    const quality = options.quality || 'common';

    // 获取基础模板
    const template = this.getBaseTemplate(type);

    // 应用品质系数
    const qualityMultiplier = this.getQualityMultiplier(quality);
    const scaledStats = this.applyQualityScaling(template, qualityMultiplier);

    // 创建组件
    const component = new Component({
      type: type,
      quality: quality,
      gridShape: scaledStats.gridShape || [[0, 0]],
      stats: {
        hp: scaledStats.hp,
        maxHp: scaledStats.hp, // maxHp = hp initially
        damage: scaledStats.damage || 0,
        fireRate: scaledStats.fireRate || 0,
        projectileSpeed: scaledStats.projectileSpeed || 0,
        range: scaledStats.range || 0,
        defense: scaledStats.defense || 0,
        buffType: scaledStats.buffType || null,
        buffValue: scaledStats.buffValue || 0
      }
    });

    return component;
  }

  /**
   * 获取基础模板
   * @param {String} type - 组件类型
   * @returns {Object}
   */
  static getBaseTemplate(type) {
    const templates = {
      CORE: {
        hp: 200,
        name: '核心',
        description: '载具的核心组件，被摧毁即失败',
        width: 1,
        height: 1
      },
      WEAPON: {
        hp: 80,
        fireRate: 1.0,
        damage: 20,
        projectileSpeed: 400,
        range: 300,
        name: '武器',
        description: '自动攻击敌人的武器组件',
        width: 1,
        height: 1
      },
      ARMOR: {
        hp: 150,
        defense: 5,
        name: '装甲',
        description: '高耐久的防护组件',
        width: 1,
        height: 1
      },
      BOOSTER: {
        hp: 60,
        buffType: 'DAMAGE',
        buffValue: 0.2,
        name: '增幅器',
        description: '为相邻组件提供增益',
        width: 1,
        height: 1
      }
    };

    return templates[type] || templates.CORE;
  }

  /**
   * 获取品质系数
   * @param {String} quality - 品质
   * @returns {Number}
   */
  static getQualityMultiplier(quality) {
    const multipliers = {
      common: 1.0,
      uncommon: 1.3,
      rare: 1.6,
      epic: 2.0
    };

    return multipliers[quality] || 1.0;
  }

  /**
   * 应用品质缩放
   * @param {Object} template - 基础模板
   * @param {Number} multiplier - 品质系数
   * @returns {Object}
   */
  static applyQualityScaling(template, multiplier) {
    const scaled = { ...template };

    // 缩放数值属性
    if (scaled.hp) {
      scaled.hp = Math.floor(scaled.hp * multiplier);
    }

    if (scaled.damage) {
      scaled.damage = Math.floor(scaled.damage * multiplier);
    }

    if (scaled.defense) {
      scaled.defense = Math.floor(scaled.defense * multiplier);
    }

    if (scaled.buffValue) {
      scaled.buffValue = scaled.buffValue * multiplier;
    }

    // 其他属性保持不变
    return scaled;
  }

  /**
   * 创建随机组件
   * @returns {Component}
   */
  static createRandomComponent() {
    const types = ['CORE', 'WEAPON', 'ARMOR', 'BOOSTER'];
    const qualities = ['common', 'uncommon', 'rare', 'epic'];

    const type = types[Math.floor(Math.random() * types.length)];
    const quality = qualities[Math.floor(Math.random() * qualities.length)];

    return this.createComponent(type, { quality });
  }

  /**
   * 创建测试组件（用于调试）
   * @param {String} type - 组件类型
   * @returns {Component}
   */
  static createTestComponent(type) {
    return this.createComponent(type, { quality: 'common' });
  }
}
