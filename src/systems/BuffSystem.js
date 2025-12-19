/**
 * BuffSystem.js
 * 邻接加成系统 - 负责计算和应用组件之间的邻接加成效果
 *
 * 核心机制:
 * - Booster 组件为相邻组件提供 +20% 加成 (buffMultiplier = 1.2)
 * - 加成效果叠加: 2个 Booster 相邻 = +40% (buffMultiplier = 1.4)
 * - 加成影响冷却速度: Component.update() 中 currentCooldown -= deltaTime * buffMultiplier
 */

import { ComponentType } from '../config/DataDictionary.js';

export class BuffSystem {
  /**
   * 构造函数
   */
  constructor() {
    this.buffPerBooster = 0.2; // 每个 Booster 提供 +20% 加成
  }

  /**
   * 重新计算所有组件的 buffMultiplier
   * @param {GridManager} gridManager - 网格管理器
   */
  recalculateBuffs(gridManager) {
    const grid = gridManager.grid;
    const size = gridManager.gridSize;

    // 首先重置所有组件的 buffMultiplier 为 1.0
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const component = grid[row][col];
        if (component) {
          component.buffMultiplier = 1.0;
        }
      }
    }

    // 遍历所有 Booster，为其相邻组件添加加成
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const component = grid[row][col];

        // 只有 Booster 才提供加成
        if (component && component.type === ComponentType.BOOSTER) {
          this.applyBoosterBuffs(gridManager, col, row);
        }
      }
    }
  }

  /**
   * 为指定 Booster 的相邻组件应用加成
   * @param {GridManager} gridManager - 网格管理器
   * @param {Number} boosterCol - Booster 所在列
   * @param {Number} boosterRow - Booster 所在行
   */
  applyBoosterBuffs(gridManager, boosterCol, boosterRow) {
    const grid = gridManager.grid;
    const size = gridManager.gridSize;

    // 四个方向: 上、下、左、右
    const directions = [
      { col: 0, row: -1 },  // 上
      { col: 0, row: 1 },   // 下
      { col: -1, row: 0 },  // 左
      { col: 1, row: 0 }    // 右
    ];

    // 遍历四个相邻格子
    for (const dir of directions) {
      const targetCol = boosterCol + dir.col;
      const targetRow = boosterRow + dir.row;

      // 检查是否在网格范围内
      if (targetCol < 0 || targetCol >= size || targetRow < 0 || targetRow >= size) {
        continue;
      }

      const targetComponent = grid[targetRow][targetCol];

      // 如果相邻格子有组件且不是 Booster 自己
      if (targetComponent && targetComponent.type !== ComponentType.BOOSTER) {
        targetComponent.buffMultiplier += this.buffPerBooster;
      }
    }
  }

  /**
   * 获取指定组件的邻接 Booster 数量
   * @param {GridManager} gridManager - 网格管理器
   * @param {Number} col - 组件所在列
   * @param {Number} row - 组件所在行
   * @returns {Number} 邻接的 Booster 数量
   */
  getAdjacentBoosterCount(gridManager, col, row) {
    const grid = gridManager.grid;
    const size = gridManager.gridSize;
    let count = 0;

    const directions = [
      { col: 0, row: -1 },
      { col: 0, row: 1 },
      { col: -1, row: 0 },
      { col: 1, row: 0 }
    ];

    for (const dir of directions) {
      const targetCol = col + dir.col;
      const targetRow = row + dir.row;

      if (targetCol < 0 || targetCol >= size || targetRow < 0 || targetRow >= size) {
        continue;
      }

      const component = grid[targetRow][targetCol];
      if (component && component.type === ComponentType.BOOSTER) {
        count++;
      }
    }

    return count;
  }

  /**
   * 获取指定位置组件的加成描述 (用于 UI 显示)
   * @param {GridManager} gridManager - 网格管理器
   * @param {Number} col - 组件所在列
   * @param {Number} row - 组件所在行
   * @returns {String} 加成描述，例如 "+20%"
   */
  getBuffDescription(gridManager, col, row) {
    const component = gridManager.grid[row]?.[col];
    if (!component) {
      return '';
    }

    if (component.buffMultiplier === 1.0) {
      return '';
    }

    const buffPercent = Math.round((component.buffMultiplier - 1.0) * 100);
    return `+${buffPercent}%`;
  }

  /**
   * 检查移除组件后需要重新计算加成
   * @param {GridManager} gridManager - 网格管理器
   * @param {Component} removedComponent - 被移除的组件
   */
  onComponentRemoved(gridManager, removedComponent) {
    // 如果移除的是 Booster，需要重新计算所有加成
    if (removedComponent.type === ComponentType.BOOSTER) {
      this.recalculateBuffs(gridManager);
    }
  }

  /**
   * 检查添加组件后需要重新计算加成
   * @param {GridManager} gridManager - 网格管理器
   * @param {Component} addedComponent - 新添加的组件
   */
  onComponentAdded(gridManager, addedComponent) {
    // 如果添加的是 Booster，需要重新计算所有加成
    if (addedComponent.type === ComponentType.BOOSTER) {
      this.recalculateBuffs(gridManager);
    }
  }
}
