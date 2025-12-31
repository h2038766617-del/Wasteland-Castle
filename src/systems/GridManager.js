/**
 * GridManager - 网格管理系统
 *
 * 职责：
 * - 维护 4x4 网格数据结构
 * - 坐标系转换（像素坐标 ↔ 网格索引）
 * - 组件放置和移除
 * - 碰撞检测（重叠/越界）
 * - 网格渲染
 *
 * 坐标系规范：
 * - 像素坐标：x_px, y_px（屏幕空间）
 * - 网格坐标：col, row（逻辑空间，从 0 开始）
 *
 * 网格布局：
 *   col: 0   1   2   3
 * row 0  [ ] [ ] [ ] [ ]
 *     1  [ ] [ ] [ ] [ ]
 *     2  [ ] [ ] [ ] [ ]
 *     3  [ ] [ ] [ ] [ ]
 */

import { GRID } from '../config/Constants.js';

export default class GridManager {
  /**
   * 构造函数
   * @param {number} gridSize - 网格尺寸（默认 4x4）
   * @param {number} cellSize_px - 每个格子的像素大小
   * @param {number} originX_px - 网格起始 X 坐标（像素）
   * @param {number} originY_px - 网格起始 Y 坐标（像素）
   */
  constructor(
    gridSize = GRID.SIZE,
    cellSize_px = GRID.CELL_SIZE_PX,
    originX_px = GRID.ORIGIN_X_PX,
    originY_px = GRID.ORIGIN_Y_PX
  ) {
    // 网格尺寸
    this.gridSize = gridSize;

    // 格子像素大小
    this.cellSize_px = cellSize_px;

    // 网格在屏幕上的起始位置（像素坐标）
    this.originX_px = originX_px;
    this.originY_px = originY_px;

    // 网格数据：grid[row][col] = Component | null
    // 使用二维数组存储组件引用
    this.grid = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(null));

    // 组件列表（用于快速遍历）
    this.components = [];

    console.log(`GridManager 初始化: ${gridSize}x${gridSize}, 格子大小: ${cellSize_px}px`);
  }

  /**
   * 像素坐标转换为网格索引
   * @param {number} x_px - 屏幕 X 坐标（像素）
   * @param {number} y_px - 屏幕 Y 坐标（像素）
   * @returns {{col: number, row: number}} 网格坐标
   */
  screenToGrid(x_px, y_px) {
    const col = Math.floor((x_px - this.originX_px) / this.cellSize_px);
    const row = Math.floor((y_px - this.originY_px) / this.cellSize_px);
    return { col, row };
  }

  /**
   * 网格索引转换为像素坐标（格子中心点）
   * @param {number} col - 列索引
   * @param {number} row - 行索引
   * @returns {{x_px: number, y_px: number}} 像素坐标（格子中心）
   */
  gridToScreen(col, row) {
    const x_px = this.originX_px + col * this.cellSize_px + this.cellSize_px / 2;
    const y_px = this.originY_px + row * this.cellSize_px + this.cellSize_px / 2;
    return { x_px, y_px };
  }

  /**
   * 网格索引转换为像素坐标（格子左上角）
   * @param {number} col - 列索引
   * @param {number} row - 行索引
   * @returns {{x_px: number, y_px: number}} 像素坐标（左上角）
   */
  gridToScreenTopLeft(col, row) {
    const x_px = this.originX_px + col * this.cellSize_px;
    const y_px = this.originY_px + row * this.cellSize_px;
    return { x_px, y_px };
  }

  /**
   * 检查网格坐标是否在边界内
   * @param {number} col - 列索引
   * @param {number} row - 行索引
   * @returns {boolean}
   */
  isInBounds(col, row) {
    return col >= 0 && col < this.gridSize && row >= 0 && row < this.gridSize;
  }

  /**
   * 检查组件是否可以放置在指定位置
   * @param {Object} component - 组件对象（必须有 gridShape 属性）
   * @param {number} col - 放置的列索引（锚点）
   * @param {number} row - 放置的行索引（锚点）
   * @returns {boolean} 是否可以放置
   */
  canPlaceComponent(component, col, row) {
    if (!component || !component.gridShape) {
      console.warn('GridManager.canPlaceComponent: 无效的组件');
      return false;
    }

    // 检查组件的每个格子
    for (const [offsetCol, offsetRow] of component.gridShape) {
      const targetCol = col + offsetCol;
      const targetRow = row + offsetRow;

      // 越界检查
      if (!this.isInBounds(targetCol, targetRow)) {
        return false;
      }

      // 重叠检查
      if (this.grid[targetRow][targetCol] !== null) {
        return false;
      }
    }

    return true;
  }

  /**
   * 放置组件到网格
   * @param {Object} component - 组件对象
   * @param {number} col - 放置的列索引（锚点）
   * @param {number} row - 放置的行索引（锚点）
   * @returns {boolean} 是否成功放置
   */
  placeComponent(component, col, row) {
    // 检查是否可以放置
    if (!this.canPlaceComponent(component, col, row)) {
      return false;
    }

    // 设置组件的网格位置
    component.gridPos = { col, row };

    // 在网格中标记组件占据的所有格子
    for (const [offsetCol, offsetRow] of component.gridShape) {
      const targetCol = col + offsetCol;
      const targetRow = row + offsetRow;
      this.grid[targetRow][targetCol] = component;
    }

    // 添加到组件列表
    if (!this.components.includes(component)) {
      this.components.push(component);
    }

    return true;
  }

  /**
   * 从网格中移除组件
   * @param {Object} component - 要移除的组件
   * @returns {boolean} 是否成功移除
   */
  removeComponent(component) {
    if (!component || !component.gridPos) {
      return false;
    }

    const { col, row } = component.gridPos;

    // 清除网格中的引用
    for (const [offsetCol, offsetRow] of component.gridShape) {
      const targetCol = col + offsetCol;
      const targetRow = row + offsetRow;

      if (this.isInBounds(targetCol, targetRow)) {
        if (this.grid[targetRow][targetCol] === component) {
          this.grid[targetRow][targetCol] = null;
        }
      }
    }

    // 从组件列表中移除
    const index = this.components.indexOf(component);
    if (index !== -1) {
      this.components.splice(index, 1);
    }

    return true;
  }

  /**
   * 获取指定网格位置的组件
   * @param {number} col - 列索引
   * @param {number} row - 行索引
   * @returns {Object|null} 组件对象或 null
   */
  getComponentAt(col, row) {
    if (!this.isInBounds(col, row)) {
      return null;
    }
    return this.grid[row][col];
  }

  /**
   * 清空网格
   */
  clear() {
    // 清空网格数据
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        this.grid[row][col] = null;
      }
    }

    // 清空组件列表
    this.components = [];

    console.log('网格已清空');
  }

  /**
   * 获取所有组件
   * @returns {Array} 组件数组
   */
  getAllComponents() {
    return [...this.components];
  }

  /**
   * 根据类型获取组件
   * @param {string} type - 组件类型（CORE, WEAPON, ARMOR, BOOSTER）
   * @returns {Array} 匹配的组件数组
   */
  getComponentsByType(type) {
    return this.components.filter(component => component.type === type);
  }

  /**
   * 渲染网格
   * @param {CanvasRenderingContext2D} ctx - Canvas 渲染上下文
   */
  render(ctx) {
    ctx.save();

    // 绘制网格边框
    this.renderGridBorder(ctx);

    // 绘制网格线
    this.renderGridLines(ctx);

    // 绘制组件
    this.renderComponents(ctx);

    ctx.restore();
  }

  /**
   * 绘制网格边框
   * @param {CanvasRenderingContext2D} ctx
   */
  renderGridBorder(ctx) {
    const width_px = this.gridSize * this.cellSize_px;
    const height_px = this.gridSize * this.cellSize_px;

    ctx.strokeStyle = GRID.BORDER_COLOR;
    ctx.lineWidth = GRID.BORDER_WIDTH;
    ctx.strokeRect(this.originX_px, this.originY_px, width_px, height_px);
  }

  /**
   * 绘制网格线
   * @param {CanvasRenderingContext2D} ctx
   */
  renderGridLines(ctx) {
    const width_px = this.gridSize * this.cellSize_px;
    const height_px = this.gridSize * this.cellSize_px;

    ctx.strokeStyle = GRID.GRID_LINE_COLOR;
    ctx.lineWidth = GRID.GRID_LINE_WIDTH;

    // 绘制垂直线
    for (let col = 1; col < this.gridSize; col++) {
      const x_px = this.originX_px + col * this.cellSize_px;
      ctx.beginPath();
      ctx.moveTo(x_px, this.originY_px);
      ctx.lineTo(x_px, this.originY_px + height_px);
      ctx.stroke();
    }

    // 绘制水平线
    for (let row = 1; row < this.gridSize; row++) {
      const y_px = this.originY_px + row * this.cellSize_px;
      ctx.beginPath();
      ctx.moveTo(this.originX_px, y_px);
      ctx.lineTo(this.originX_px + width_px, y_px);
      ctx.stroke();
    }
  }

  /**
   * 渲染所有组件
   * @param {CanvasRenderingContext2D} ctx
   */
  renderComponents(ctx) {
    // 为每个组件绘制占据的格子
    for (const component of this.components) {
      this.renderComponent(ctx, component);
    }
  }

  /**
   * 渲染单个组件
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} component
   */
  renderComponent(ctx, component) {
    if (!component || !component.gridPos) return;

    const { col, row } = component.gridPos;

    ctx.save();

    // 检查组件是否被摧毁
    const isDestroyed = component.isDestroyed();

    // 根据组件类型选择颜色
    const color = this.getComponentColor(component.type);

    // 被摧毁的组件使用暗灰色
    if (isDestroyed) {
      ctx.fillStyle = '#333333'; // 深灰色填充
      ctx.strokeStyle = '#666666'; // 灰色边框
    } else {
      ctx.fillStyle = color + '88'; // 半透明
      ctx.strokeStyle = color;
    }
    ctx.lineWidth = 2;

    // 绘制组件占据的每个格子
    for (const [offsetCol, offsetRow] of component.gridShape) {
      const targetCol = col + offsetCol;
      const targetRow = row + offsetRow;

      if (this.isInBounds(targetCol, targetRow)) {
        const { x_px, y_px } = this.gridToScreenTopLeft(targetCol, targetRow);

        // 填充格子
        ctx.fillRect(x_px + 2, y_px + 2, this.cellSize_px - 4, this.cellSize_px - 4);

        // 描边格子
        ctx.strokeRect(x_px + 2, y_px + 2, this.cellSize_px - 4, this.cellSize_px - 4);
      }
    }

    // 显示加成信息（在组件的第一个格子中心，被摧毁的组件不显示）
    if (!isDestroyed && component.buffMultiplier && component.buffMultiplier > 1.0) {
      const firstCellCol = col;
      const firstCellRow = row;
      const { x_px, y_px } = this.gridToScreen(firstCellCol, firstCellRow);

      const buffPercent = Math.round((component.buffMultiplier - 1.0) * 100);
      ctx.fillStyle = '#00FF00';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`+${buffPercent}%`, x_px, y_px);
    }

    ctx.restore();
  }

  /**
   * 根据组件类型获取颜色
   * @param {string} type - 组件类型
   * @returns {string} 颜色代码
   */
  getComponentColor(type) {
    const colors = {
      CORE: '#FF00FF',    // 紫色
      WEAPON: '#FFFF00',  // 黄色
      ARMOR: '#00FFFF',   // 青色
      BOOSTER: '#FF8800'  // 橙色
    };
    return colors[type] || '#FFFFFF';
  }

  /**
   * 获取网格总像素宽度
   * @returns {number}
   */
  getGridWidth_px() {
    return this.gridSize * this.cellSize_px;
  }

  /**
   * 获取网格总像素高度
   * @returns {number}
   */
  getGridHeight_px() {
    return this.gridSize * this.cellSize_px;
  }
}
