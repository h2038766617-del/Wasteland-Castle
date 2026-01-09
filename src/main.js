/**
 * main.js - 游戏主入口
 *
 * 职责：
 * - 初始化 Canvas
 * - 启动游戏主循环
 * - 管理游戏状态
 * - 协调各个系统
 */

import Canvas from './core/Canvas.js';
import DroneCursor from './entities/DroneCursor.js';
import GridManager from './systems/GridManager.js';
import { BuffSystem } from './systems/BuffSystem.js';
import { WeaponSystem } from './systems/WeaponSystem.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { EnemySystem } from './systems/EnemySystem.js';
import { ScrollSystem } from './systems/ScrollSystem.js';
import { ResourceSystem } from './systems/ResourceSystem.js';
import { ObstacleSystem } from './systems/ObstacleSystem.js';
import { SafeHouseSystem } from './systems/SafeHouseSystem.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
import { DragSystem } from './ui/DragSystem.js';
import { ShopSystem } from './systems/ShopSystem.js';
import { RepairSystem } from './systems/RepairSystem.js';
import { LevelSystem } from './systems/LevelSystem.js';
import ObjectPool from './systems/ObjectPool.js';
import Component from './entities/Component.js';
import Projectile from './entities/Projectile.js';
import Enemy from './entities/Enemy.js';
import * as Vector2 from './utils/Vector2.js';
import { CANVAS, DEBUG, PERFORMANCE, SCROLL } from './config/Constants.js';
import { ComponentType } from './config/DataDictionary.js';

/**
 * 游戏主类
 */
class Game {
  constructor() {
    console.log('=== 光标指挥官 (Cursor Commander) ===');
    console.log('版本: v0.15 - 波次系统 + 粒子效果');

    // 初始化 Canvas
    this.canvas = new Canvas(CANVAS.ID);
    this.ctx = this.canvas.getContext();

    // 时间管理
    this.lastTime = 0;
    this.deltaTime = 0;
    this.accumulatedTime = 0;
    this.frameCount = 0;
    this.fps = 0;

    // 鼠标位置（像素坐标）
    this.mousePos = { x: 0, y: 0 };

    // 游戏状态
    this.isRunning = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false; // 胜利状态
    this.showHelp = false; // 帮助界面显示状态

    // 游戏状态机（核心循环）
    this.gameState = 'SAFEHOUSE'; // SAFEHOUSE（安全屋整备） / JOURNEY（旅途战斗）
    this.journeyNumber = 0; // 当前旅途编号（难度递增）

    // 视觉效果
    this.damageNumbers = []; // 浮动伤害数字

    // 初始化资源
    this.resources = {
      red: 200,   // 弹药/能源（初始值）
      blue: 100,   // 建材/矿石
      gold: 50     // 金币/芯片
    };

    // 计算载具锚定位置（屏幕左侧 1/3）
    const vehicleX = this.canvas.getWidth() * SCROLL.VEHICLE_X_RATIO;
    const vehicleY = this.canvas.getHeight() / 2;

    // 初始化网格管理器（放置在载具位置附近）
    // 网格宽度 = 4格 * 80px = 320px，将网格中心对齐到载具位置
    const gridWidth = 4 * 80;  // GRID.SIZE * GRID.CELL_SIZE_PX
    const gridHeight = 4 * 80;
    const gridOriginX = vehicleX - gridWidth / 2;
    const gridOriginY = vehicleY - gridHeight / 2;

    this.gridManager = new GridManager(
      4,  // gridSize
      80, // cellSize_px
      gridOriginX,
      gridOriginY
    );

    // 初始化邻接加成系统
    this.buffSystem = new BuffSystem();

    // 创建测试组件并放置到网格
    this.createTestComponents();

    // 计算邻接加成
    this.buffSystem.recalculateBuffs(this.gridManager);

    // 初始化对象池
    this.projectilePool = new ObjectPool(() => new Projectile(), 100);

    // 初始化武器系统
    this.weaponSystem = new WeaponSystem(this.gridManager, this.projectilePool);

    // 初始化碰撞检测系统
    this.collisionSystem = new CollisionSystem();

    // 初始化敌人系统
    this.enemySystem = new EnemySystem(
      this.gridManager,
      this.canvas.getWidth(),
      this.canvas.getHeight()
    );

    // 初始化横版卷轴系统
    this.scrollSystem = new ScrollSystem(
      this.canvas.getWidth(),
      5000  // 目标距离 5000 像素
    );

    // 初始化资源采集系统
    this.resourceSystem = new ResourceSystem(
      this.scrollSystem,
      this.canvas.getWidth(),
      this.canvas.getHeight()
    );

    // 初始化障碍物系统
    this.obstacleSystem = new ObstacleSystem(
      this.scrollSystem,
      this.canvas.getWidth(),
      this.canvas.getHeight()
    );

    // 初始化安全屋系统
    this.safeHouseSystem = new SafeHouseSystem(
      this.scrollSystem,
      this.canvas.getWidth(),
      this.canvas.getHeight(),
      5000  // 目标距离（与 scrollSystem 一致）
    );

    // 生成旅途中的安全屋
    this.safeHouseSystem.initJourney();

    // 初始化粒子系统
    this.particleSystem = new ParticleSystem();

    // 初始化拖拽系统
    this.dragSystem = new DragSystem(this.gridManager, this.canvas);

    // 初始化商店系统
    this.shopSystem = new ShopSystem();
    this.shopSystem.refreshShop(false); // 初始化商店商品

    // 初始化修复系统
    this.repairSystem = new RepairSystem(this.gridManager);

    // 初始化等级系统
    this.levelSystem = new LevelSystem();

    // 添加测试组件到仓库
    this.addTestComponentsToInventory();

    // 初始化无人机光标
    const centerX = this.canvas.getWidth() / 2;
    const centerY = this.canvas.getHeight() / 2;
    this.droneCursor = new DroneCursor(centerX, centerY);

    // 设置输入监听
    this.setupInput();

    // 更新调试信息
    this.updateDebugInfo();
  }

  /**
   * 创建测试组件
   */
  createTestComponents() {
    // 创建核心组件（1x1，放在中心）
    const core = new Component({
      id: 'core_main',
      type: ComponentType.CORE,
      gridShape: [[0, 0]],
      stats: {
        hp: 500,
        maxHp: 500
      }
    });
    this.gridManager.placeComponent(core, 1, 1);

    // 创建基础武器（1x1，放在核心右侧）
    const weapon1 = new Component({
      id: 'weapon_basic_1',
      type: ComponentType.WEAPON,
      gridShape: [[0, 0]],
      stats: {
        hp: 80,
        maxHp: 80,
        damage: 10,
        cooldown: 0.5,
        range: 300,
        ammoCost: 0.5, // 从1减少到0.5（减少50%消耗）
        pattern: 'NEAREST'
      }
    });
    this.gridManager.placeComponent(weapon1, 2, 1);

    // 创建重型武器（1x2 水平，放在核心上方）
    const weapon2 = new Component({
      id: 'weapon_heavy_1',
      type: ComponentType.WEAPON,
      gridShape: [[0, 0], [1, 0]],
      stats: {
        hp: 120,
        maxHp: 120,
        damage: 50,
        cooldown: 2.0,
        range: 400,
        ammoCost: 3, // 从5减少到3（减少40%消耗）
        pattern: 'NEAREST'
      }
    });
    this.gridManager.placeComponent(weapon2, 0, 0);

    // 创建装甲（1x1，放在核心下方）
    const armor = new Component({
      id: 'armor_plate_1',
      type: ComponentType.ARMOR,
      gridShape: [[0, 0]],
      stats: {
        hp: 200,
        maxHp: 200
      }
    });
    this.gridManager.placeComponent(armor, 1, 2);

    // 创建增压器（1x1，放在核心左侧）
    const booster = new Component({
      id: 'booster_1',
      type: ComponentType.BOOSTER,
      gridShape: [[0, 0]],
      stats: {
        hp: 50,
        maxHp: 50
      }
    });
    this.gridManager.placeComponent(booster, 0, 1);
  }

  /**
   * 添加测试组件到仓库
   */
  addTestComponentsToInventory() {
    // 添加一些测试组件到仓库，供玩家拖拽测试

    // 基础武器
    const weapon = new Component({
      id: 'weapon_inventory_1',
      type: ComponentType.WEAPON,
      gridShape: [[0, 0]],
      stats: {
        hp: 80,
        maxHp: 80,
        damage: 10,
        cooldown: 0.5,
        range: 300,
        ammoCost: 0.5,
        pattern: 'NEAREST'
      }
    });
    this.dragSystem.addToInventory(weapon);

    // 装甲板
    const armor = new Component({
      id: 'armor_inventory_1',
      type: ComponentType.ARMOR,
      gridShape: [[0, 0]],
      stats: {
        hp: 200,
        maxHp: 200
      }
    });
    this.dragSystem.addToInventory(armor);

    // 增压器
    const booster = new Component({
      id: 'booster_inventory_1',
      type: ComponentType.BOOSTER,
      gridShape: [[0, 0]],
      stats: {
        hp: 50,
        maxHp: 50
      }
    });
    this.dragSystem.addToInventory(booster);

    console.log(`已添加${this.dragSystem.inventoryItems.length}个组件到仓库`);
  }

  /**
   * 设置输入监听
   */
  setupInput() {
    // 鼠标移动
    window.addEventListener('mousemove', (e) => {
      this.mousePos.x = e.clientX;
      this.mousePos.y = e.clientY;

      // 如果正在拖拽，更新拖拽预览
      if (this.dragSystem.isDragging()) {
        this.dragSystem.updateDrag(this.mousePos);
      }

      // 更新调试信息
      if (DEBUG.SHOW_DRONE_POS) {
        document.getElementById('mousePos').textContent =
          `${Math.floor(this.mousePos.x)}, ${Math.floor(this.mousePos.y)}`;
      }
    });

    // 鼠标按下
    window.addEventListener('mousedown', (e) => {
      // 优先处理升级奖励选择
      if (this.levelSystem.isShowingRewardUI() && e.button === 0) { // 左键
        const choice = this.getRewardChoiceAtMouse(this.mousePos);
        if (choice !== -1) {
          const selectedComponent = this.levelSystem.selectReward(choice);
          if (selectedComponent) {
            // 添加到仓库
            this.dragSystem.addToInventory(selectedComponent);
            console.log(`选择了奖励: ${selectedComponent.type} (${selectedComponent.quality})`);
            // 恢复游戏
            this.isPaused = false;
          }
        }
        return;
      }

      // 在安全屋状态，检查商店和修复交互
      if (this.gameState === 'SAFEHOUSE' && e.button === 0) { // 左键
        // 检查一键修复按钮
        if (this.isClickingRepairAllButton(this.mousePos)) {
          const result = this.repairSystem.repairAll(this.resources);
          if (result.repaired > 0) {
            console.log(`修复成功: ${result.repaired} 个组件, 消耗 ${result.cost} 建材`);
          }
          return;
        }

        // 检查单个组件修复
        const clickedDamagedComponent = this.getRepairComponentAtMouse(this.mousePos);
        if (clickedDamagedComponent) {
          if (this.repairSystem.repairComponent(clickedDamagedComponent.component, this.resources)) {
            console.log('组件修复成功');
          }
          return;
        }

        // 检查刷新按钮
        if (this.isClickingRefreshButton(this.mousePos)) {
          if (this.shopSystem.refreshWithCost(this.resources)) {
            console.log('商店已刷新');
          }
          return;
        }

        // 检查商品点击
        const clickedItem = this.getShopItemAtMouse(this.mousePos);
        if (clickedItem) {
          const component = this.shopSystem.purchase(clickedItem.id, this.resources);
          if (component) {
            this.dragSystem.addToInventory(component);
            console.log('购买成功，组件已添加到仓库');
          }
          return;
        }
      }

      // 检查是否点击了仓库中的组件
      const component = this.dragSystem.getInventoryComponentAtMouse(this.mousePos);
      if (component) {
        // 从仓库移除组件
        this.dragSystem.removeFromInventory(component);

        // 开始拖拽
        this.dragSystem.startDrag(component, this.mousePos, this.isPaused);

        // 暂停游戏
        this.isPaused = true;
        console.log('游戏已暂停（拖拽组件）');
      }
    });

    // 鼠标右键 - 锁定商品
    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();

      // 在安全屋状态，检查商品锁定
      if (this.gameState === 'SAFEHOUSE') {
        const clickedItem = this.getShopItemAtMouse(this.mousePos);
        if (clickedItem) {
          this.shopSystem.toggleLock(clickedItem.id);
          console.log(`商品 ${clickedItem.locked ? '已解锁' : '已锁定'}`);
        }
      }
    });

    // 鼠标抬起
    window.addEventListener('mouseup', (e) => {
      if (this.dragSystem.isDragging()) {
        // 尝试放置组件
        const result = this.dragSystem.endDrag();

        if (result) {
          // 成功放置
          console.log('组件已放置到网格');

          // 重新计算邻接加成
          this.buffSystem.recalculateBuffs(this.gridManager);
        } else {
          // 放置失败，组件回到仓库
          const component = this.dragSystem.draggedComponent;
          if (component) {
            this.dragSystem.addToInventory(component);
          }
        }

        // 恢复之前的游戏状态
        this.isPaused = this.dragSystem.previousPausedState;
        console.log('游戏已恢复');
      }
    });

    // 键盘事件（用于调试）
    window.addEventListener('keydown', (e) => {
      // 空格键：切换安全屋/旅途状态
      if (e.code === 'Space') {
        if (this.gameState === 'SAFEHOUSE') {
          // 离开安全屋，开始旅途
          this.startJourney();
        } else if (this.gameState === 'JOURNEY') {
          // 在旅途中，暂停/继续
          this.togglePause();
        }
      }

      // D 键：切换调试信息
      if (e.code === 'KeyD') {
        this.toggleDebug();
      }

      // R 键：重启游戏
      if (e.code === 'KeyR') {
        this.restart();
      }

      // H 键：切换帮助界面
      if (e.code === 'KeyH') {
        this.showHelp = !this.showHelp;
      }
    });
  }

  /**
   * 获取鼠标点击的奖励选择
   * @param {{x: number, y: number}} mousePos - 鼠标位置
   * @returns {Number} 1, 2, 3 或 -1（未点击）
   */
  getRewardChoiceAtMouse(mousePos) {
    const width = this.canvas.getWidth();
    const height = this.canvas.getHeight();

    const cardWidth = 280;
    const cardHeight = 350;
    const cardSpacing = 30;
    const totalWidth = cardWidth * 3 + cardSpacing * 2;
    const startX = (width - totalWidth) / 2;
    const cardY = height / 2 - 50;

    for (let i = 0; i < 3; i++) {
      const cardX = startX + i * (cardWidth + cardSpacing);

      if (
        mousePos.x >= cardX &&
        mousePos.x <= cardX + cardWidth &&
        mousePos.y >= cardY &&
        mousePos.y <= cardY + cardHeight
      ) {
        return i + 1; // 返回1, 2, 或3
      }
    }

    return -1; // 未点击任何卡片
  }

  /**
   * 检查是否点击了一键修复按钮
   * @param {{x: number, y: number}} mousePos - 鼠标位置
   * @returns {Boolean}
   */
  isClickingRepairAllButton(mousePos) {
    const repairX = 20;
    const repairY = 20;
    const repairWidth = 300;
    const repairAllButtonY = repairY + 60;

    return (
      mousePos.x >= repairX + 10 &&
      mousePos.x <= repairX + repairWidth - 10 &&
      mousePos.y >= repairAllButtonY &&
      mousePos.y <= repairAllButtonY + 40
    );
  }

  /**
   * 获取鼠标位置下的受损组件
   * @param {{x: number, y: number}} mousePos - 鼠标位置
   * @returns {Object|null} 受损组件对象或null
   */
  getRepairComponentAtMouse(mousePos) {
    const repairX = 20;
    const repairY = 20;
    const repairWidth = 300;
    const repairAllButtonY = repairY + 60;
    const damaged = this.repairSystem.getDamagedComponents();

    let itemY = repairAllButtonY + 60;
    const itemHeight = 80;

    for (let i = 0; i < damaged.length && i < 6; i++) {
      const item = damaged[i];

      if (
        mousePos.x >= repairX + 10 &&
        mousePos.x <= repairX + repairWidth - 10 &&
        mousePos.y >= itemY &&
        mousePos.y <= itemY + itemHeight
      ) {
        return item;
      }

      itemY += itemHeight + 8;
    }

    return null;
  }

  /**
   * 检查是否点击了刷新按钮
   * @param {{x: number, y: number}} mousePos - 鼠标位置
   * @returns {Boolean}
   */
  isClickingRefreshButton(mousePos) {
    const width = this.canvas.getWidth();
    const shopX = width - 320;
    const shopY = 20;
    const shopWidth = 300;
    const refreshButtonY = shopY + 60;

    return (
      mousePos.x >= shopX + 10 &&
      mousePos.x <= shopX + shopWidth - 10 &&
      mousePos.y >= refreshButtonY &&
      mousePos.y <= refreshButtonY + 35
    );
  }

  /**
   * 获取鼠标位置下的商品
   * @param {{x: number, y: number}} mousePos - 鼠标位置
   * @returns {Object|null} 商品对象或null
   */
  getShopItemAtMouse(mousePos) {
    const width = this.canvas.getWidth();
    const shopX = width - 320;
    const shopY = 20;
    const shopWidth = 300;
    const refreshButtonY = shopY + 60;
    const items = this.shopSystem.getItems();

    let itemY = refreshButtonY + 50;
    const itemHeight = 100;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (
        mousePos.x >= shopX + 10 &&
        mousePos.x <= shopX + shopWidth - 10 &&
        mousePos.y >= itemY &&
        mousePos.y <= itemY + itemHeight
      ) {
        return item;
      }

      itemY += itemHeight + 10;
    }

    return null;
  }

  /**
   * 启动游戏
   */
  start() {
    this.isRunning = true;

    // 隐藏加载界面
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.classList.add('hidden');
    }

    // 显示调试信息（如果启用）
    if (DEBUG.SHOW_FPS) {
      const debugElement = document.getElementById('debug');
      if (debugElement) {
        debugElement.classList.remove('hidden');
      }
    }

    // 启动游戏循环
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  /**
   * 游戏主循环
   * @param {number} currentTime - 当前时间戳（毫秒）
   */
  gameLoop(currentTime) {
    // 继续循环
    requestAnimationFrame((time) => this.gameLoop(time));

    // 计算 deltaTime（秒）
    if (this.lastTime === 0) {
      this.lastTime = currentTime;
      return;
    }

    this.deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // 限制 deltaTime（防止卡顿导致物理穿透）
    if (this.deltaTime > PERFORMANCE.MAX_DELTA_TIME) {
      this.deltaTime = PERFORMANCE.MAX_DELTA_TIME;
    }

    // 如果暂停，只渲染不更新
    if (this.isPaused) {
      this.render();
      return;
    }

    // 更新游戏逻辑
    this.update(this.deltaTime);

    // 渲染画面
    this.render();

    // 更新 FPS
    this.updateFPS();
  }

  /**
   * 更新游戏逻辑
   * @param {number} deltaTime - 时间增量（秒）
   */
  update(deltaTime) {
    // 更新无人机光标（安全屋和旅途都需要）
    this.droneCursor.update(deltaTime, this.mousePos);

    // 更新视觉效果（安全屋和旅途都需要）
    this.updateDamageNumbers(deltaTime);
    this.particleSystem.update(deltaTime);

    // 安全屋状态：不更新战斗系统
    if (this.gameState === 'SAFEHOUSE') {
      return;
    }

    // 旅途状态：更新所有战斗系统
    // 更新横版卷轴系统
    this.scrollSystem.update(deltaTime);

    // 更新资源采集系统
    this.resourceSystem.update(deltaTime, this.mousePos, this.resources);

    // 更新障碍物系统
    this.obstacleSystem.update(deltaTime, this.mousePos, this.resources);

    // 更新安全屋系统
    this.safeHouseSystem.update(deltaTime);

    // 更新敌人系统（生成、AI）
    this.enemySystem.update(deltaTime);

    // 获取所有活跃敌人
    const enemies = this.enemySystem.getActiveEnemies();

    // 光标攻击敌人（玩家主要输出）
    const attackResult = this.droneCursor.updateAttack(deltaTime, enemies);
    if (attackResult) {
      const { target, damage } = attackResult;

      // 对敌人造成伤害
      target.hp -= damage;

      // 添加浮动伤害数字
      this.damageNumbers.push({
        x: target.position.x,
        y: target.position.y - 20,
        damage: Math.floor(damage),
        alpha: 1.0,
        velocity: { x: (Math.random() - 0.5) * 50, y: -100 }
      });

      // 添加击中粒子效果
      this.particleSystem.createHitEffect(
        target.position.x,
        target.position.y,
        '#FF6600'
      );

      // 检查敌人是否死亡
      if (target.hp <= 0) {
        // 统一使用CollisionSystem处理敌人死亡（资源、XP、粒子效果、统计）
        this.collisionSystem.handleEnemyDeath(
          target,
          this.resources,
          this.particleSystem,
          this.enemySystem,
          this.levelSystem
        );
      }
    }

    // 更新武器系统（寻找目标并发射）
    this.weaponSystem.update(deltaTime, enemies, this.mousePos, this.resources);

    // 更新子弹
    this.weaponSystem.updateProjectiles(
      deltaTime,
      this.canvas.getWidth(),
      this.canvas.getHeight()
    );

    // 碰撞检测：子弹-敌人
    const projectiles = this.weaponSystem.getActiveProjectiles();
    const collisionResult = this.collisionSystem.checkProjectileEnemyCollisions(
      projectiles,
      enemies,
      this.projectilePool,
      this.resources,
      this.damageNumbers,
      this.particleSystem,
      this.enemySystem,  // 传递 enemySystem 以正确处理敌人死亡
      this.levelSystem   // 传递 levelSystem 以给予XP
    );

    // 检查是否升级（无论光标击杀还是武器击杀）
    if (this.levelSystem.isShowingRewardUI() && !this.isPaused) {
      this.isPaused = true;
      console.log('升级！暂停游戏显示奖励选择');
    }

    // 碰撞检测：敌人-组件
    const components = this.gridManager.getAllComponents();
    const componentAttackResult = this.collisionSystem.checkEnemyComponentCollisions(
      enemies,
      components,
      this.gridManager
    );

    // 检查核心是否被摧毁
    this.checkGameOver();

    // 检查是否胜利
    this.checkVictory();
  }

  /**
   * 检查游戏是否结束
   */
  checkGameOver() {
    if (this.isGameOver) return;

    // 检查核心组件是否被摧毁
    const coreComponents = this.gridManager.getComponentsByType(ComponentType.CORE);

    if (coreComponents.length === 0 || coreComponents.every(core => core.isDestroyed())) {
      this.isGameOver = true;
      this.isPaused = true;
      console.log('=== GAME OVER ===');
      console.log('核心被摧毁！');
    }
  }

  /**
   * 检查是否完成旅途
   */
  checkVictory() {
    if (this.isGameOver || this.gameState !== 'JOURNEY') return;

    // 检查是否完成所有波次
    if (this.enemySystem.waveState === 'VICTORY') {
      // 完成旅途，回到安全屋
      this.returnToSafeHouse();
    }
  }

  /**
   * 开始旅途
   */
  startJourney() {
    console.log(`=== 开始旅途 #${this.journeyNumber + 1} ===`);

    this.gameState = 'JOURNEY';
    this.journeyNumber++;

    // 重置敌人系统
    this.enemySystem.reset();

    // 设置难度（基于旅途编号）
    this.enemySystem.setDifficulty(this.journeyNumber);

    // 重置各个战斗系统
    this.collisionSystem.resetStats();
    this.weaponSystem.clearProjectiles();
    this.scrollSystem.reset();
    this.resourceSystem.reset();
    this.obstacleSystem.reset();
    this.safeHouseSystem.initJourney(); // 重新生成旅途中的安全屋

    // 清空视觉效果
    this.damageNumbers = [];
    this.particleSystem.clear();

    // 重置光标攻击状态
    this.droneCursor.currentTarget = null;
    this.droneCursor.currentAttackCooldown = 0;

    console.log(`难度等级: ${this.journeyNumber}`);
  }

  /**
   * 回到安全屋
   */
  returnToSafeHouse() {
    console.log('=== 旅途完成，回到安全屋 ===');
    console.log(`完成波次: ${this.enemySystem.currentWave - 1}`);
    console.log(`总击杀: ${this.collisionSystem.stats.totalKills}`);
    console.log(`总伤害: ${this.collisionSystem.stats.totalDamage}`);

    this.gameState = 'SAFEHOUSE';

    // 奖励资源（根据表现）
    const killBonus = this.collisionSystem.stats.totalKills * 2;
    this.resources.gold += killBonus;
    console.log(`获得金币奖励: ${killBonus}`);

    // 刷新商店（保留锁定的商品）
    this.shopSystem.refreshShop(true);
  }

  /**
   * 渲染画面
   */
  render() {
    // 清空 Canvas
    this.canvas.clear();

    // 保存上下文状态
    this.ctx.save();

    // 应用屏幕抖动效果
    this.obstacleSystem.applyScreenShake(this.ctx);

    // 绘制背景网格（用于坐标参考）
    this.renderBackgroundGrid();

    // 绘制滚动地面（营造运动感）
    this.renderScrollingGround();

    // 渲染载具外形（底盘和边框）
    this.renderVehicle();

    // 渲染游戏网格和组件
    this.gridManager.render(this.ctx);

    // 渲染资源节点
    this.resourceSystem.renderNodes(this.ctx);

    // 渲染障碍物
    this.obstacleSystem.renderObstacles(this.ctx);

    // 渲染安全屋
    this.safeHouseSystem.renderSafeHouses(this.ctx);

    // 渲染敌人
    this.enemySystem.renderEnemies(this.ctx);

    // 渲染子弹
    this.weaponSystem.renderProjectiles(this.ctx);

    // 渲染无人机光标
    this.droneCursor.render(this.ctx);

    // 渲染光标攻击效果（激光束）
    this.droneCursor.renderAttackEffect(this.ctx);

    // 渲染资源掉落动画（在最上层）
    this.resourceSystem.renderResourceDrops(this.ctx);

    // 渲染粒子效果（在游戏世界层）
    this.particleSystem.render(this.ctx);

    // 渲染伤害数字（在游戏世界层）
    this.renderDamageNumbers(this.ctx);

    // 恢复上下文状态（取消屏幕抖动）
    this.ctx.restore();

    // 渲染阻挡警告 UI（不受屏幕抖动影响）
    this.obstacleSystem.renderBlockingWarning(this.ctx);

    // 渲染 UI 提示
    this.renderUI();

    // 渲染安全屋 UI（全屏，在最上层）
    if (this.gameState === 'SAFEHOUSE') {
      this.renderSafeHouseState(this.ctx);
    }

    // 渲染帮助界面（最顶层）
    this.renderHelpOverlay(this.ctx);

    // 渲染组件仓库（UI层）
    this.dragSystem.renderInventory(this.ctx);

    // 渲染拖拽预览（最上层）
    this.dragSystem.renderPreview(this.ctx);

    // 渲染升级奖励UI（全屏遮罩，在仓库和拖拽之上）
    if (this.levelSystem.isShowingRewardUI()) {
      this.renderLevelUpRewards();
    }

    // 渲染游戏结束画面（最最顶层）
    if (this.isGameOver) {
      this.renderGameOverScreen(this.ctx);
    }
  }

  /**
   * 渲染背景网格（用于坐标参考）
   */
  renderBackgroundGrid() {
    const ctx = this.ctx;
    const width = this.canvas.getWidth();
    const height = this.canvas.getHeight();

    ctx.save();
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    const gridSpacing = 50;

    // 绘制垂直线
    for (let x = 0; x < width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // 绘制水平线
    for (let y = 0; y < height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * 渲染滚动地面（营造运动感）
   */
  renderScrollingGround() {
    const ctx = this.ctx;
    const width = this.canvas.getWidth();
    const height = this.canvas.getHeight();

    // 获取滚动偏移（用于地面移动）
    const offset = this.scrollSystem.getScrollOffset() % 100;

    ctx.save();

    // 绘制地面条纹（交替颜色）
    for (let x = -offset; x < width + 100; x += 100) {
      const isEven = Math.floor((x + offset) / 100) % 2 === 0;
      ctx.fillStyle = isEven ? '#1a1a1a' : '#151515';
      ctx.fillRect(x, height - 100, 100, 100);
    }

    // 绘制地面上的细节线条（增强运动感）
    ctx.strokeStyle = '#0a0a0a';
    ctx.lineWidth = 1;
    for (let x = -offset; x < width + 100; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, height - 100);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * 渲染载具外形（底盘和边框）
   */
  renderVehicle() {
    const ctx = this.ctx;
    const gridOriginX = this.gridManager.originX_px;
    const gridOriginY = this.gridManager.originY_px;
    const gridWidth = this.gridManager.getGridWidth_px();
    const gridHeight = this.gridManager.getGridHeight_px();

    ctx.save();

    // 绘制载具底盘（扩展网格边界）
    const padding = 15;
    const vehicleX = gridOriginX - padding;
    const vehicleY = gridOriginY - padding;
    const vehicleWidth = gridWidth + padding * 2;
    const vehicleHeight = gridHeight + padding * 2;

    // 底盘填充
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(vehicleX, vehicleY, vehicleWidth, vehicleHeight);

    // 底盘边框
    ctx.strokeStyle = '#4a4a4a';
    ctx.lineWidth = 3;
    ctx.strokeRect(vehicleX, vehicleY, vehicleWidth, vehicleHeight);

    // 绘制车轮/履带（左右两侧）
    const wheelRadius = 8;
    const wheelColor = '#333333';
    const wheelStroke = '#555555';

    // 左侧车轮（3个）
    for (let i = 0; i < 3; i++) {
      const wheelY = vehicleY + (vehicleHeight / 4) * (i + 1);
      const wheelX = vehicleX - 5;

      ctx.fillStyle = wheelColor;
      ctx.beginPath();
      ctx.arc(wheelX, wheelY, wheelRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = wheelStroke;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 右侧车轮（3个）
    for (let i = 0; i < 3; i++) {
      const wheelY = vehicleY + (vehicleHeight / 4) * (i + 1);
      const wheelX = vehicleX + vehicleWidth + 5;

      ctx.fillStyle = wheelColor;
      ctx.beginPath();
      ctx.arc(wheelX, wheelY, wheelRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = wheelStroke;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 绘制载具装饰细节（顶部条纹）
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(vehicleX + 10, vehicleY + 5);
    ctx.lineTo(vehicleX + vehicleWidth - 10, vehicleY + 5);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 渲染 UI 提示
   */
  renderUI() {
    const ctx = this.ctx;
    const width = this.canvas.getWidth();
    const height = this.canvas.getHeight();

    ctx.save();

    // 绘制标题
    ctx.fillStyle = this.isGameOver ? '#FF0000' : '#00FFFF';
    ctx.font = '32px monospace';
    ctx.textAlign = 'center';
    const title = this.isGameOver ? '游戏结束 - 核心被摧毁' : '光标指挥官 - 横版卷轴测试';
    ctx.fillText(title, width / 2, 75);

    // 绘制资源信息（改进：显示所有资源）
    ctx.font = '18px monospace';
    ctx.textAlign = 'left';

    // 红色资源（弹药）
    ctx.fillStyle = '#FF3333';
    ctx.fillText(`● ${Math.floor(this.resources.red)}`, 20, 40);

    // 蓝色资源（建材）
    ctx.fillStyle = '#3333FF';
    ctx.fillText(`● ${Math.floor(this.resources.blue)}`, 120, 40);

    // 金色资源（金币）
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`● ${Math.floor(this.resources.gold)}`, 220, 40);

    // 绘制当前状态提示
    this.renderCurrentStatus(ctx);

    // 绘制提示文字
    ctx.fillStyle = '#666666';
    ctx.font = '14px monospace';
    ctx.fillText('[空格] 暂停  [D] 调试信息  [R] 重启  [H] 帮助', 20, height - 20);

    // 绘制波次信息（新设计）
    this.renderWaveInfo(ctx, width);

    // 绘制统计信息
    const collisionStats = this.collisionSystem.getStats();
    const enemyStats = this.enemySystem.getStats();
    const coreComponents = this.gridManager.getComponentsByType(ComponentType.CORE);
    const coreHp = coreComponents.length > 0 ? coreComponents[0].stats.hp : 0;

    ctx.fillStyle = '#00FF00';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`击杀: ${collisionStats.totalKills}`, 20, 70);
    ctx.fillText(`存活: ${enemyStats.currentAlive}`, 20, 90);

    // 核心血量（红色警告）
    ctx.fillStyle = coreHp < 200 ? '#FF0000' : '#00FF00';
    ctx.fillText(`核心: ${Math.floor(coreHp)}`, 20, 110);

    // 绘制版本信息
    ctx.fillStyle = '#666666';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('v0.15', width - 20, height - 20);

    // 只在旅途状态显示距离进度条和经验值条
    if (this.gameState === 'JOURNEY') {
      // 绘制距离进度条
      this.renderDistanceProgress();

      // 绘制经验值条
      this.renderXPBar();
    }

    ctx.restore();
  }

  /**
   * 渲染距离进度条
   */
  renderDistanceProgress() {
    const ctx = this.ctx;
    const width = this.canvas.getWidth();
    const height = this.canvas.getHeight();

    ctx.save();

    // 进度条尺寸和位置
    const barWidth = 400;
    const barHeight = 30;
    const barX = (width - barWidth) / 2;
    const barY = 20;

    // 获取进度
    const progress = this.scrollSystem.getProgress();
    const distance = this.scrollSystem.getDistanceTraveled();
    const target = this.scrollSystem.getTargetDistance();

    // 绘制进度条背景
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // 绘制进度条边框
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // 绘制进度填充
    const fillWidth = barWidth * progress;
    const gradient = ctx.createLinearGradient(barX, 0, barX + fillWidth, 0);
    gradient.addColorStop(0, '#00FFFF');
    gradient.addColorStop(1, '#00FF00');
    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, fillWidth, barHeight);

    // 绘制距离文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const distanceText = `${Math.floor(distance)} / ${target} 米`;
    ctx.fillText(distanceText, barX + barWidth / 2, barY + barHeight / 2);

    // 绘制百分比
    ctx.fillStyle = '#00FFFF';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    const percentText = `${Math.floor(progress * 100)}%`;
    ctx.fillText(percentText, barX + barWidth + 10, barY + barHeight / 2);

    // 如果到达终点，显示提示
    if (this.scrollSystem.hasReachedDestination()) {
      ctx.fillStyle = '#00FF00';
      ctx.font = '20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('已到达安全屋！', barX + barWidth / 2, barY + barHeight + 25);
    }

    ctx.restore();
  }

  /**
   * 更新伤害数字
   * @param {Number} deltaTime - 时间增量（秒）
   */
  updateDamageNumbers(deltaTime) {
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dmg = this.damageNumbers[i];

      // 更新位置（向上飘动）
      dmg.y += dmg.velocity * deltaTime;

      // 更新生命周期和透明度
      dmg.life -= deltaTime;
      dmg.opacity = Math.max(0, dmg.life / 1.0); // 淡出

      // 移除已消失的伤害数字
      if (dmg.life <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }
  }

  /**
   * 渲染伤害数字
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   */
  renderDamageNumbers(ctx) {
    ctx.save();

    for (const dmg of this.damageNumbers) {
      ctx.globalAlpha = dmg.opacity;
      ctx.fillStyle = '#FFFF00';
      ctx.strokeStyle = '#000000';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 3;

      // 描边（黑色轮廓）
      ctx.strokeText(`-${dmg.damage}`, dmg.x, dmg.y);
      // 填充（黄色文字）
      ctx.fillText(`-${dmg.damage}`, dmg.x, dmg.y);
    }

    ctx.restore();
  }

  /**
   * 渲染波次信息
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {Number} width - 画布宽度
   */
  renderWaveInfo(ctx, width) {
    const waveInfo = this.enemySystem.getWaveDisplayInfo();

    ctx.save();

    // 波次信息框位置（右上角）
    const boxX = width - 250;
    const boxY = 20;
    const boxWidth = 230;
    const boxHeight = 100;

    // 绘制半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // 绘制边框
    ctx.strokeStyle = waveInfo.waveState === 'WAVE_ACTIVE' ? '#FF3333' : '#00FFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // 波次标题
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`波次 ${waveInfo.currentWave} / ${waveInfo.maxWaves}`, boxX + boxWidth / 2, boxY + 25);

    // 状态文字
    let statusColor = '#AAAAAA';
    switch (waveInfo.waveState) {
      case 'PREPARING':
        statusColor = '#00FFFF';
        break;
      case 'WAVE_ACTIVE':
        statusColor = '#FF3333';
        break;
      case 'WAVE_COMPLETE':
        statusColor = '#00FF00';
        break;
      case 'VICTORY':
        statusColor = '#FFD700';
        break;
    }

    ctx.fillStyle = statusColor;
    ctx.font = 'bold 18px monospace';
    ctx.fillText(waveInfo.statusText, boxX + boxWidth / 2, boxY + 50);

    // 时间/敌人剩余
    if (waveInfo.waveState === 'PREPARING') {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px monospace';
      ctx.fillText(`准备时间: ${waveInfo.timeRemaining}秒`, boxX + boxWidth / 2, boxY + 75);
    } else if (waveInfo.waveState === 'WAVE_ACTIVE') {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px monospace';
      ctx.fillText(`剩余敌人: ${waveInfo.timeRemaining}`, boxX + boxWidth / 2, boxY + 75);
    } else if (waveInfo.waveState === 'WAVE_COMPLETE') {
      ctx.fillStyle = '#00FF00';
      ctx.font = '16px monospace';
      ctx.fillText('✓ 准备下一波', boxX + boxWidth / 2, boxY + 75);
    }

    ctx.restore();
  }

  /**
   * 渲染当前状态提示
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   */
  renderCurrentStatus(ctx) {
    // 检查当前正在进行的活动
    let statusText = '';
    let statusColor = '#888888';

    // 检查是否正在采集资源
    const resourceDebug = this.resourceSystem.getDebugInfo();
    if (resourceDebug.isHarvesting) {
      const node = this.resourceSystem.currentHarvestNode;
      if (node && node.harvestProgress !== undefined) {
        const progress = Math.floor(node.harvestProgress * 100);
        const typeNames = { RED: '红色', BLUE: '蓝色', GOLD: '金色' };
        const typeName = typeNames[node.resourceType] || node.resourceType;
        statusText = `采集中: ${typeName}资源 (${progress}%)`;
        statusColor = '#00FF00';
      }
    }

    // 检查是否正在挖掘障碍物
    if (!statusText) {
      const obstacleDebug = this.obstacleSystem.getDebugInfo();
      if (obstacleDebug.isDigging && this.obstacleSystem.currentDigObstacle) {
        const obstacle = this.obstacleSystem.currentDigObstacle;
        if (obstacle && obstacle.digProgress !== undefined) {
          const progress = Math.floor(obstacle.digProgress * 100);
          const typeNames = { TREE: '树木', ROCK: '巨石' };
          const typeName = typeNames[obstacle.obstacleType] || obstacle.obstacleType;
          statusText = `挖掘中: ${typeName} (${progress}%)`;
          statusColor = '#FFAA00';
        }
      }
    }

    // 如果没有活动，显示空闲状态
    if (!statusText) {
      statusText = '空闲 - 移动光标到资源或障碍物上';
      statusColor = '#666666';
    }

    // 渲染状态文字
    ctx.save();
    ctx.fillStyle = statusColor;
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(statusText, 20, 150);
    ctx.restore();
  }

  /**
   * 渲染帮助界面
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   */
  renderHelpOverlay(ctx) {
    if (!this.showHelp) return;

    const width = this.canvas.getWidth();
    const height = this.canvas.getHeight();

    ctx.save();

    // 半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, width, height);

    // 标题
    ctx.fillStyle = '#00FFFF';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('游戏帮助', width / 2, 80);

    // 帮助内容
    const helpLines = [
      '',
      '【游戏目标】',
      '驾驶载具穿越废土，击败10波敌人',
      '',
      '【操作说明】',
      '● 移动光标：悬停在资源节点上自动采集',
      '● 挖掘障碍：悬停在障碍物上进行挖掘',
      '● 自动战斗：炮塔自动攻击敌人',
      '',
      '【波次系统】',
      '● 准备期：8秒安全时间采集资源',
      '● 战斗期：消灭所有敌人完成波次',
      '● 难度递增：每波敌人数量+2',
      '',
      '【资源说明】',
      '● 红色：弹药/能源（用于武器开火）',
      '● 蓝色：建材/矿石（用于建造）',
      '● 金色：金币/芯片（用于升级）',
      '',
      '【控制按键】',
      '空格键 - 暂停/继续游戏',
      'H 键   - 显示/隐藏帮助',
      'D 键   - 切换调试信息',
      'R 键   - 重新开始游戏',
      '',
      '【提示】',
      '● 及时采集资源补充弹药',
      '● 挖掉障碍物避免载具被卡住',
      '● 保护核心，血量归零即游戏结束',
      '',
      '',
      '按 H 键关闭帮助'
    ];

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px monospace';
    ctx.textAlign = 'left';

    let y = 130;
    for (const line of helpLines) {
      if (line.startsWith('【')) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px monospace';
      } else if (line.startsWith('●')) {
        ctx.fillStyle = '#00FF00';
        ctx.font = '16px monospace';
      } else {
        ctx.fillStyle = '#CCCCCC';
        ctx.font = '16px monospace';
      }

      ctx.fillText(line, width / 2 - 300, y);
      y += 24;
    }

    ctx.restore();
  }

  /**
   * 渲染安全屋状态UI
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   */
  renderSafeHouseState(ctx) {
    const width = this.canvas.getWidth();
    const height = this.canvas.getHeight();

    ctx.save();

    // 半透明黑色背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, width, height);

    // 标题
    ctx.fillStyle = '#00FFFF';
    ctx.font = 'bold 60px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 15;
    ctx.fillText('安全屋整备', width / 2, height / 2 - 180);

    // 旅途编号
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(`旅途 #${this.journeyNumber + 1}`, width / 2, height / 2 - 120);

    // 提示信息
    ctx.fillStyle = '#AAAAAA';
    ctx.font = '22px monospace';
    const instructions = [
      '[ 拖拽组件到网格拼装载具 ]',
      '[ 调整布局优化邻接加成 ]',
      '[ 准备好后按 SPACE 出发 ]'
    ];

    let y = height / 2 - 40;
    for (const text of instructions) {
      ctx.fillText(text, width / 2, y);
      y += 35;
    }

    // 资源统计
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(
      `金币: ${Math.floor(this.resources.gold)}  弹药: ${Math.floor(this.resources.red)}  建材: ${Math.floor(this.resources.blue)}`,
      width / 2,
      height / 2 + 100
    );

    // 出发按钮
    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 32px monospace';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00FF00';
    ctx.fillText('[ 按 SPACE 开始旅途 ]', width / 2, height / 2 + 170);

    // 帮助提示
    ctx.fillStyle = '#AAAAAA';
    ctx.font = '20px monospace';
    ctx.shadowBlur = 0;
    ctx.fillText('[ 按 H 查看帮助 ]', width / 2, height / 2 + 210);

    // 渲染商店UI
    this.renderShopUI(ctx);

    // 渲染修复UI
    this.renderRepairUI(ctx);

    ctx.restore();
  }

  /**
   * 渲染商店UI
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   */
  renderShopUI(ctx) {
    const width = this.canvas.getWidth();
    const height = this.canvas.getHeight();

    // 商店面板（右侧，为底部inventory留出空间）
    const shopX = width - 320;
    const shopY = 20;
    const shopWidth = 300;
    const shopHeight = height - 140; // 留出120px给inventory (100px) + 间距

    ctx.save();
    ctx.shadowBlur = 0;

    // 商店背景
    ctx.fillStyle = 'rgba(20, 20, 30, 0.9)';
    ctx.fillRect(shopX, shopY, shopWidth, shopHeight);

    // 商店边框
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(shopX, shopY, shopWidth, shopHeight);

    // 商店标题
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('商店', shopX + shopWidth / 2, shopY + 30);

    // 刷新按钮
    const refreshButtonY = shopY + 60;
    const canRefresh = this.shopSystem.canRefresh(this.resources);
    ctx.fillStyle = canRefresh ? '#4CAF50' : '#666666';
    ctx.fillRect(shopX + 10, refreshButtonY, shopWidth - 20, 35);

    ctx.fillStyle = canRefresh ? '#FFFFFF' : '#999999';
    ctx.font = '16px monospace';
    ctx.fillText(`刷新 (${this.shopSystem.refreshCost} 金币)`, shopX + shopWidth / 2, refreshButtonY + 22);

    // 渲染商品列表
    const items = this.shopSystem.getItems();
    let itemY = refreshButtonY + 50;

    ctx.textAlign = 'left';
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemHeight = 100;

      // 商品背景
      const canBuy = this.resources.gold >= item.price;
      ctx.fillStyle = item.locked ? 'rgba(100, 100, 50, 0.3)' : 'rgba(40, 40, 50, 0.8)';
      ctx.fillRect(shopX + 10, itemY, shopWidth - 20, itemHeight);

      // 商品边框
      ctx.strokeStyle = canBuy ? '#00FF00' : '#666666';
      ctx.lineWidth = 1;
      ctx.strokeRect(shopX + 10, itemY, shopWidth - 20, itemHeight);

      // 组件类型
      ctx.fillStyle = this.getComponentColor(item.component.type);
      ctx.font = 'bold 18px monospace';
      ctx.fillText(item.component.type, shopX + 20, itemY + 25);

      // 品质
      ctx.fillStyle = this.getQualityColor(item.component.quality);
      ctx.font = '14px monospace';
      ctx.fillText(item.component.quality.toUpperCase(), shopX + 20, itemY + 45);

      // 属性
      ctx.fillStyle = '#CCCCCC';
      ctx.font = '12px monospace';
      ctx.fillText(`HP: ${item.component.hp}`, shopX + 20, itemY + 65);

      // 价格
      ctx.fillStyle = canBuy ? '#FFD700' : '#999999';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`${item.price} 金币`, shopX + 20, itemY + 85);

      // 锁定标志
      if (item.locked) {
        ctx.fillStyle = '#FFD700';
        ctx.font = '20px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('🔒', shopX + shopWidth - 20, itemY + 25);
        ctx.textAlign = 'left';
      }

      itemY += itemHeight + 10;
    }

    // 提示信息
    ctx.fillStyle = '#AAAAAA';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('点击商品购买', shopX + shopWidth / 2, height - 60);
    ctx.fillText('右键锁定商品', shopX + shopWidth / 2, height - 40);

    ctx.restore();
  }

  /**
   * 获取组件类型颜色
   * @param {String} type - 组件类型
   * @returns {String}
   */
  getComponentColor(type) {
    const colors = {
      CORE: '#FF6B6B',
      WEAPON: '#4ECDC4',
      ARMOR: '#45B7D1',
      BOOSTER: '#FFA07A'
    };
    return colors[type] || '#FFFFFF';
  }

  /**
   * 获取品质颜色
   * @param {String} quality - 品质
   * @returns {String}
   */
  getQualityColor(quality) {
    const colors = {
      common: '#AAAAAA',
      uncommon: '#4CAF50',
      rare: '#2196F3',
      epic: '#9C27B0'
    };
    return colors[quality] || '#FFFFFF';
  }

  /**
   * 渲染修复UI
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   */
  renderRepairUI(ctx) {
    const height = this.canvas.getHeight();

    // 修复面板（左侧，为底部inventory留出空间）
    const repairX = 20;
    const repairY = 20;
    const repairWidth = 300;
    const repairHeight = height - 140; // 留出120px给inventory (100px) + 间距

    ctx.save();
    ctx.shadowBlur = 0;

    // 修复面板背景
    ctx.fillStyle = 'rgba(30, 20, 20, 0.9)';
    ctx.fillRect(repairX, repairY, repairWidth, repairHeight);

    // 修复面板边框
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.strokeRect(repairX, repairY, repairWidth, repairHeight);

    // 修复标题
    ctx.fillStyle = '#4CAF50';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('修复站', repairX + repairWidth / 2, repairY + 30);

    // 获取受损组件
    const damaged = this.repairSystem.getDamagedComponents();
    const stats = this.repairSystem.getStats();

    // 一键修复按钮
    const repairAllButtonY = repairY + 60;
    const canRepairAll = this.resources.blue >= stats.totalRepairCost && damaged.length > 0;
    ctx.fillStyle = canRepairAll ? '#4CAF50' : '#666666';
    ctx.fillRect(repairX + 10, repairAllButtonY, repairWidth - 20, 40);

    ctx.fillStyle = canRepairAll ? '#FFFFFF' : '#999999';
    ctx.font = '16px monospace';
    ctx.fillText(
      `一键修复 (${Math.floor(stats.totalRepairCost)} 建材)`,
      repairX + repairWidth / 2,
      repairAllButtonY + 25
    );

    // 受损组件列表
    let itemY = repairAllButtonY + 60;

    if (damaged.length === 0) {
      // 没有受损组件
      ctx.fillStyle = '#AAAAAA';
      ctx.font = '18px monospace';
      ctx.fillText('所有组件完好', repairX + repairWidth / 2, itemY + 50);
    } else {
      ctx.textAlign = 'left';
      for (let i = 0; i < damaged.length && i < 6; i++) { // 最多显示6个
        const item = damaged[i];
        const itemHeight = 80;

        // 组件背景
        const canRepair = this.resources.blue >= item.cost;
        ctx.fillStyle = 'rgba(50, 40, 40, 0.8)';
        ctx.fillRect(repairX + 10, itemY, repairWidth - 20, itemHeight);

        // 组件边框
        ctx.strokeStyle = canRepair ? '#4CAF50' : '#666666';
        ctx.lineWidth = 1;
        ctx.strokeRect(repairX + 10, itemY, repairWidth - 20, itemHeight);

        // 组件类型
        ctx.fillStyle = this.getComponentColor(item.component.type);
        ctx.font = 'bold 16px monospace';
        ctx.fillText(item.component.type, repairX + 20, itemY + 22);

        // HP信息
        const hpPercent = (item.component.stats.hp / item.component.stats.maxHp) * 100;
        ctx.fillStyle = hpPercent < 30 ? '#FF6666' : (hpPercent < 60 ? '#FFAA00' : '#FFFF00');
        ctx.font = '14px monospace';
        ctx.fillText(
          `HP: ${Math.floor(item.component.stats.hp)}/${item.component.stats.maxHp} (${Math.floor(hpPercent)}%)`,
          repairX + 20,
          itemY + 42
        );

        // HP条
        const barX = repairX + 20;
        const barY = itemY + 50;
        const barWidth = repairWidth - 40;
        const barHeight = 6;

        // 背景（灰色）
        ctx.fillStyle = '#333333';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // 当前HP（绿色）
        ctx.fillStyle = hpPercent < 30 ? '#FF0000' : (hpPercent < 60 ? '#FFA500' : '#00FF00');
        ctx.fillRect(barX, barY, barWidth * (hpPercent / 100), barHeight);

        // 修复成本
        ctx.fillStyle = canRepair ? '#4CAF50' : '#999999';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(`修复: ${item.cost} 建材`, repairX + 20, itemY + 70);

        itemY += itemHeight + 8;
      }

      // 如果还有更多受损组件
      if (damaged.length > 6) {
        ctx.fillStyle = '#AAAAAA';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`...还有 ${damaged.length - 6} 个受损组件`, repairX + repairWidth / 2, itemY);
      }
    }

    ctx.restore();
  }

  /**
   * 渲染经验值条
   */
  renderXPBar() {
    const ctx = this.ctx;
    const width = this.canvas.getWidth();
    const stats = this.levelSystem.getStats();

    ctx.save();

    // XP条位置（顶部中央下方）
    const barX = width / 2 - 200;
    const barY = 100;
    const barWidth = 400;
    const barHeight = 20;

    // 背景（深色）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);

    // 边框
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);

    // 经验值条背景（灰色）
    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // 当前经验值（金色）
    const xpPercent = stats.xpPercentage;
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(barX, barY, barWidth * xpPercent, barHeight);

    // 文本信息
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `Level ${stats.currentLevel}  -  ${Math.floor(stats.currentXP)}/${stats.xpToNextLevel} XP`,
      barX + barWidth / 2,
      barY + barHeight / 2
    );

    ctx.restore();
  }

  /**
   * 渲染升级奖励UI（三选一）
   */
  renderLevelUpRewards() {
    const ctx = this.ctx;
    const width = this.canvas.getWidth();
    const height = this.canvas.getHeight();
    const rewards = this.levelSystem.getPendingRewards();

    if (!rewards) {
      return;
    }

    ctx.save();

    // 半透明黑色遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, width, height);

    // 标题
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 60px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 20;
    ctx.fillText('升级！', width / 2, height / 2 - 200);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '28px monospace';
    ctx.fillText('选择一个组件奖励', width / 2, height / 2 - 140);

    // 三个奖励选项
    const cardWidth = 280;
    const cardHeight = 350;
    const cardSpacing = 30;
    const totalWidth = cardWidth * 3 + cardSpacing * 2;
    const startX = (width - totalWidth) / 2;
    const cardY = height / 2 - 50;

    const rewardComponents = [rewards.component1, rewards.component2, rewards.component3];

    for (let i = 0; i < 3; i++) {
      const component = rewardComponents[i];
      const cardX = startX + i * (cardWidth + cardSpacing);

      // 卡片背景
      ctx.fillStyle = 'rgba(30, 30, 40, 0.9)';
      ctx.fillRect(cardX, cardY, cardWidth, cardHeight);

      // 卡片边框（品质颜色）
      ctx.strokeStyle = this.getQualityColor(component.quality);
      ctx.lineWidth = 4;
      ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);

      // 鼠标悬停高亮
      const mouseInCard =
        this.mousePos.x >= cardX &&
        this.mousePos.x <= cardX + cardWidth &&
        this.mousePos.y >= cardY &&
        this.mousePos.y <= cardY + cardHeight;

      if (mouseInCard) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
      }

      // 组件类型
      ctx.fillStyle = this.getComponentColor(component.type);
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(component.type, cardX + cardWidth / 2, cardY + 60);

      // 品质
      ctx.fillStyle = this.getQualityColor(component.quality);
      ctx.font = 'bold 20px monospace';
      ctx.fillText(component.quality.toUpperCase(), cardX + cardWidth / 2, cardY + 100);

      // 属性
      ctx.fillStyle = '#CCCCCC';
      ctx.font = '16px monospace';
      ctx.textAlign = 'left';
      let attrY = cardY + 140;

      ctx.fillText(`HP: ${component.stats.hp}`, cardX + 20, attrY);
      attrY += 25;

      if (component.type === 'WEAPON' && component.stats.damage) {
        ctx.fillText(`攻击: ${component.stats.damage}`, cardX + 20, attrY);
        attrY += 25;
        ctx.fillText(`射程: ${component.stats.range}`, cardX + 20, attrY);
        attrY += 25;
      }

      if (component.type === 'ARMOR' && component.stats.defense) {
        ctx.fillText(`防御: ${component.stats.defense}`, cardX + 20, attrY);
        attrY += 25;
      }

      if (component.type === 'BOOSTER' && component.stats.buffValue) {
        ctx.fillText(`增益: +${Math.floor(component.stats.buffValue * 100)}%`, cardX + 20, attrY);
        attrY += 25;
      }

      // 选择提示
      ctx.fillStyle = mouseInCard ? '#00FF00' : '#666666';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ 点击选择 ]', cardX + cardWidth / 2, cardY + cardHeight - 30);
    }

    // 提示信息
    ctx.fillStyle = '#AAAAAA';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('选择后组件将添加到仓库', width / 2, height - 80);

    ctx.restore();
  }

  /**
   * 渲染游戏结束画面
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   */
  renderGameOverScreen(ctx) {
    if (!this.isGameOver) return;

    const width = this.canvas.getWidth();
    const height = this.canvas.getHeight();

    ctx.save();

    // 半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, width, height);

    // 标题
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 72px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 10;
    ctx.fillText('💀 游戏结束 💀', width / 2, height / 2 - 100);

    // 副标题
    ctx.fillStyle = '#FF6666';
    ctx.font = 'bold 32px monospace';
    ctx.fillText('核心被摧毁！', width / 2, height / 2 - 20);

    // 统计数据
    const collisionStats = this.collisionSystem.getStats();
    const enemyStats = this.enemySystem.getStats();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px monospace';
    ctx.fillText(`总击杀: ${collisionStats.totalKills}`, width / 2, height / 2 + 40);
    ctx.fillText(`总伤害: ${collisionStats.totalDamage}`, width / 2, height / 2 + 70);
    ctx.fillText(`前进距离: ${Math.floor(this.scrollSystem.getDistanceTraveled())} 米`, width / 2, height / 2 + 100);

    // 提示
    ctx.fillStyle = '#888888';
    ctx.font = '20px monospace';
    ctx.fillText('[R] 重新开始游戏', width / 2, height / 2 + 160);

    ctx.restore();
  }

  /**
   * 更新 FPS
   */
  updateFPS() {
    this.frameCount++;
    this.accumulatedTime += this.deltaTime;

    // 每秒更新一次 FPS 显示
    if (this.accumulatedTime >= 1.0) {
      this.fps = Math.round(this.frameCount / this.accumulatedTime);
      this.frameCount = 0;
      this.accumulatedTime = 0;

      // 更新调试信息
      if (DEBUG.SHOW_FPS) {
        document.getElementById('fps').textContent = this.fps;
      }
    }
  }

  /**
   * 更新调试信息
   */
  updateDebugInfo() {
    if (!DEBUG.SHOW_FPS) return;

    document.getElementById('canvasSize').textContent =
      `${this.canvas.getWidth()}x${this.canvas.getHeight()}`;

    document.getElementById('gameState').textContent =
      this.isPaused ? 'PAUSED' : 'RUNNING';
  }

  /**
   * 切换暂停状态
   */
  togglePause() {
    this.isPaused = !this.isPaused;
    this.updateDebugInfo();
  }

  /**
   * 切换调试信息显示
   */
  toggleDebug() {
    const debugElement = document.getElementById('debug');
    if (debugElement) {
      debugElement.classList.toggle('hidden');
    }
  }

  /**
   * 重启游戏
   */
  restart() {
    // 重置游戏状态标志
    this.isGameOver = false;
    this.isPaused = false;
    this.showHelp = false;
    this.isVictory = false;

    // 重置游戏状态机
    this.gameState = 'SAFEHOUSE'; // 重新从安全屋开始
    this.journeyNumber = 0; // 重置旅途编号

    // 重置资源到初始值
    this.resources.red = 200;
    this.resources.blue = 100;
    this.resources.gold = 50;

    // 清空视觉效果
    this.damageNumbers = [];
    this.particleSystem.clear();

    // 重置光标攻击状态
    this.droneCursor.currentTarget = null;
    this.droneCursor.currentAttackCooldown = 0;

    // 重置各个系统
    this.enemySystem.reset();
    this.collisionSystem.resetStats();
    this.weaponSystem.clearProjectiles();
    this.scrollSystem.reset();
    this.resourceSystem.reset();
    this.obstacleSystem.reset();
    this.safeHouseSystem.reset();
    this.dragSystem.reset();
    this.levelSystem.reset();

    // 重新初始化安全屋旅程
    this.safeHouseSystem.initJourney();

    // 刷新商店
    this.shopSystem.refreshShop(false);

    // 重新添加测试组件到仓库
    this.addTestComponentsToInventory();

    // 重置所有组件血量
    const components = this.gridManager.getAllComponents();
    for (const component of components) {
      component.stats.hp = component.stats.maxHp;
    }

    // 重新计算邻接加成
    this.buffSystem.recalculateBuffs(this.gridManager);

    // 更新调试信息
    this.updateDebugInfo();
  }
}

// 等待 DOM 加载完成后启动游戏
window.addEventListener('DOMContentLoaded', () => {

  try {
    // 创建游戏实例
    const game = new Game();

    // 启动游戏
    game.start();

    // 将游戏实例暴露到全局（方便调试）
    window.game = game;
  } catch (error) {
    console.error('=== 游戏初始化失败 ===');
    console.error(error);

    // 显示错误在加载界面
    const loading = document.getElementById('loading');
    if (loading) {
      loading.innerHTML = `
        <h1 style="color: #FF0000;">游戏初始化失败</h1>
        <p style="color: #FFFF00; margin-top: 20px;">请打开浏览器控制台查看详细错误信息</p>
        <p style="color: #888; margin-top: 10px; font-size: 14px;">${error.message}</p>
        <p style="color: #666; margin-top: 5px; font-size: 12px;">${error.stack ? error.stack.split('\n')[1] : ''}</p>
      `;
    }
  }
});
