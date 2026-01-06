/**
 * DragSystem.js
 * 拖拽系统 - 组件拼装核心交互
 *
 * 职责：
 * - 处理组件拖拽交互
 * - 预览组件放置位置
 * - 验证放置合法性
 * - 暂停/恢复游戏状态
 */

import Component from '../entities/Component.js';
import { ComponentType } from '../config/DataDictionary.js';

/**
 * 拖拽状态枚举
 */
export const DragState = {
  IDLE: 'IDLE',           // 空闲，无拖拽
  DRAGGING: 'DRAGGING'    // 拖拽中
};

export class DragSystem {
  /**
   * 构造函数
   * @param {GridManager} gridManager - 网格管理器
   * @param {Canvas} canvas - Canvas对象
   */
  constructor(gridManager, canvas) {
    this.gridManager = gridManager;
    this.canvas = canvas;

    // 拖拽状态
    this.state = DragState.IDLE;

    // 当前拖拽的组件
    this.draggedComponent = null;

    // 鼠标位置（像素坐标）
    this.mousePos = { x: 0, y: 0 };

    // 预览位置（网格坐标）
    this.previewCol = -1;
    this.previewRow = -1;
    this.previewValid = false; // 预览位置是否合法

    // 拖拽前的游戏状态
    this.previousPausedState = false;

    // 仓库区域配置（画布底部100px）
    this.inventoryHeight = 100;
    this.inventoryItems = []; // 可用组件列表

    console.log('DragSystem 初始化');
  }

  /**
   * 开始拖拽组件
   * @param {Component} component - 要拖拽的组件
   * @param {Object} mousePos - 鼠标位置 { x, y }
   * @param {boolean} currentPausedState - 当前游戏暂停状态
   */
  startDrag(component, mousePos, currentPausedState) {
    if (this.state === DragState.DRAGGING) {
      console.warn('已经在拖拽中');
      return;
    }

    this.state = DragState.DRAGGING;
    this.draggedComponent = component;
    this.mousePos = { ...mousePos };
    this.previousPausedState = currentPausedState;

    console.log(`开始拖拽组件: ${component.id}`);
  }

  /**
   * 更新拖拽状态
   * @param {Object} mousePos - 鼠标位置 { x, y }
   */
  updateDrag(mousePos) {
    if (this.state !== DragState.DRAGGING) return;

    this.mousePos = { ...mousePos };

    // 计算鼠标在网格中的位置
    const gridPos = this.gridManager.screenToGrid(mousePos.x, mousePos.y);

    if (gridPos) {
      this.previewCol = gridPos.col;
      this.previewRow = gridPos.row;

      // 检查该位置是否可以放置组件
      this.previewValid = this.gridManager.canPlace(
        this.draggedComponent,
        this.previewCol,
        this.previewRow
      );
    } else {
      // 鼠标不在网格区域
      this.previewCol = -1;
      this.previewRow = -1;
      this.previewValid = false;
    }
  }

  /**
   * 结束拖拽
   * @returns {Object|null} 如果成功放置，返回 { col, row }，否则返回 null
   */
  endDrag() {
    if (this.state !== DragState.DRAGGING) {
      return null;
    }

    let result = null;

    // 如果预览位置合法，尝试放置组件
    if (this.previewValid && this.previewCol >= 0 && this.previewRow >= 0) {
      // 尝试放置组件到网格
      const placed = this.gridManager.placeComponent(
        this.draggedComponent,
        this.previewCol,
        this.previewRow
      );

      if (placed) {
        result = {
          col: this.previewCol,
          row: this.previewRow,
          component: this.draggedComponent
        };
        console.log(`组件已放置: ${this.draggedComponent.id} at (${this.previewCol}, ${this.previewRow})`);
      }
    }

    // 重置状态
    this.state = DragState.IDLE;
    this.draggedComponent = null;
    this.previewCol = -1;
    this.previewRow = -1;
    this.previewValid = false;

    return result;
  }

  /**
   * 取消拖拽
   */
  cancelDrag() {
    if (this.state !== DragState.DRAGGING) return;

    console.log('拖拽已取消');

    this.state = DragState.IDLE;
    this.draggedComponent = null;
    this.previewCol = -1;
    this.previewRow = -1;
    this.previewValid = false;
  }

  /**
   * 检查是否在拖拽中
   * @returns {boolean}
   */
  isDragging() {
    return this.state === DragState.DRAGGING;
  }

  /**
   * 渲染拖拽预览
   * @param {CanvasRenderingContext2D} ctx - Canvas上下文
   */
  renderPreview(ctx) {
    if (this.state !== DragState.DRAGGING || !this.draggedComponent) return;

    ctx.save();

    // 如果鼠标在网格区域，绘制吸附预览
    if (this.previewCol >= 0 && this.previewRow >= 0) {
      this.renderGridPreview(ctx);
    } else {
      // 否则绘制跟随鼠标的预览
      this.renderMousePreview(ctx);
    }

    ctx.restore();
  }

  /**
   * 渲染网格吸附预览
   * @param {CanvasRenderingContext2D} ctx
   */
  renderGridPreview(ctx) {
    const cellSize = this.gridManager.cellSize_px;
    const originX = this.gridManager.originX_px;
    const originY = this.gridManager.originY_px;

    // 预览颜色（绿色=合法，红色=非法）
    const previewColor = this.previewValid ? '#00FF0044' : '#FF000044';
    const borderColor = this.previewValid ? '#00FF00' : '#FF0000';

    // 绘制组件占据的所有格子
    for (const [offsetCol, offsetRow] of this.draggedComponent.gridShape) {
      const col = this.previewCol + offsetCol;
      const row = this.previewRow + offsetRow;

      const x = originX + col * cellSize;
      const y = originY + row * cellSize;

      // 填充
      ctx.fillStyle = previewColor;
      ctx.fillRect(x, y, cellSize, cellSize);

      // 边框
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, cellSize, cellSize);
    }

    // 绘制组件类型文字
    const centerCol = this.previewCol + 0.5;
    const centerRow = this.previewRow + 0.5;
    const centerX = originX + centerCol * cellSize;
    const centerY = originY + centerRow * cellSize;

    ctx.fillStyle = this.previewValid ? '#00FF00' : '#FF0000';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.draggedComponent.type, centerX, centerY);
  }

  /**
   * 渲染跟随鼠标的预览
   * @param {CanvasRenderingContext2D} ctx
   */
  renderMousePreview(ctx) {
    const cellSize = this.gridManager.cellSize_px;

    ctx.globalAlpha = 0.7;

    // 绘制组件占据的所有格子（相对鼠标位置）
    for (const [offsetCol, offsetRow] of this.draggedComponent.gridShape) {
      const x = this.mousePos.x + offsetCol * cellSize;
      const y = this.mousePos.y + offsetRow * cellSize;

      // 填充
      ctx.fillStyle = '#8888FF44';
      ctx.fillRect(x, y, cellSize, cellSize);

      // 边框
      ctx.strokeStyle = '#8888FF';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, cellSize, cellSize);
    }

    // 绘制组件类型文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      this.draggedComponent.type,
      this.mousePos.x + cellSize / 2,
      this.mousePos.y + cellSize / 2
    );

    ctx.globalAlpha = 1.0;
  }

  /**
   * 添加组件到仓库
   * @param {Component} component - 组件
   */
  addToInventory(component) {
    this.inventoryItems.push(component);
    console.log(`组件已添加到仓库: ${component.id}`);
  }

  /**
   * 从仓库移除组件
   * @param {Component} component - 组件
   */
  removeFromInventory(component) {
    const index = this.inventoryItems.indexOf(component);
    if (index > -1) {
      this.inventoryItems.splice(index, 1);
      console.log(`组件已从仓库移除: ${component.id}`);
    }
  }

  /**
   * 渲染仓库区域
   * @param {CanvasRenderingContext2D} ctx
   */
  renderInventory(ctx) {
    const canvasWidth = this.canvas.getWidth();
    const canvasHeight = this.canvas.getHeight();

    ctx.save();

    // 仓库背景
    const inventoryY = canvasHeight - this.inventoryHeight;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, inventoryY, canvasWidth, this.inventoryHeight);

    // 仓库标题
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('组件仓库', 20, inventoryY + 25);

    // 绘制仓库中的组件
    const itemSize = 70;
    const padding = 10;
    const startX = 150;
    const startY = inventoryY + 15;

    for (let i = 0; i < this.inventoryItems.length; i++) {
      const component = this.inventoryItems[i];
      const x = startX + i * (itemSize + padding);
      const y = startY;

      // 组件框
      ctx.fillStyle = '#333333';
      ctx.fillRect(x, y, itemSize, itemSize);

      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, itemSize, itemSize);

      // 组件类型
      ctx.fillStyle = this.getComponentColor(component.type);
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(component.type, x + itemSize / 2, y + itemSize / 2);

      // HP
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px monospace';
      ctx.fillText(
        `${component.stats.hp}/${component.stats.maxHp}`,
        x + itemSize / 2,
        y + itemSize - 10
      );
    }

    ctx.restore();
  }

  /**
   * 获取组件类型对应的颜色
   * @param {string} type - 组件类型
   * @returns {string} 颜色值
   */
  getComponentColor(type) {
    switch (type) {
      case ComponentType.CORE:
        return '#FF00FF';
      case ComponentType.WEAPON:
        return '#FFFF00';
      case ComponentType.ARMOR:
        return '#00FFFF';
      case ComponentType.BOOSTER:
        return '#FF8800';
      default:
        return '#FFFFFF';
    }
  }

  /**
   * 检查鼠标是否在仓库区域
   * @param {Object} mousePos - 鼠标位置 { x, y }
   * @returns {boolean}
   */
  isMouseInInventory(mousePos) {
    const canvasHeight = this.canvas.getHeight();
    const inventoryY = canvasHeight - this.inventoryHeight;
    return mousePos.y >= inventoryY;
  }

  /**
   * 获取鼠标点击的仓库组件
   * @param {Object} mousePos - 鼠标位置 { x, y }
   * @returns {Component|null} 点击的组件，如果没有则返回null
   */
  getInventoryComponentAtMouse(mousePos) {
    if (!this.isMouseInInventory(mousePos)) return null;

    const canvasHeight = this.canvas.getHeight();
    const inventoryY = canvasHeight - this.inventoryHeight;
    const itemSize = 70;
    const padding = 10;
    const startX = 150;
    const startY = inventoryY + 15;

    for (let i = 0; i < this.inventoryItems.length; i++) {
      const x = startX + i * (itemSize + padding);
      const y = startY;

      if (
        mousePos.x >= x &&
        mousePos.x <= x + itemSize &&
        mousePos.y >= y &&
        mousePos.y <= y + itemSize
      ) {
        return this.inventoryItems[i];
      }
    }

    return null;
  }

  /**
   * 重置拖拽系统
   */
  reset() {
    this.state = DragState.IDLE;
    this.draggedComponent = null;
    this.previewCol = -1;
    this.previewRow = -1;
    this.previewValid = false;
    this.inventoryItems = [];
  }
}

export default DragSystem;
