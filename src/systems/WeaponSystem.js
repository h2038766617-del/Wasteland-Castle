/**
 * WeaponSystem.js
 * 武器系统 - 管理武器发射逻辑
 *
 * 职责：
 * - 更新所有武器的冷却计时器
 * - 为每个武器寻找目标
 * - 发射子弹
 * - 消耗弹药资源
 *
 * 攻击模式：
 * - NEAREST: 攻击范围内最近的敌人
 * - CURSOR: 攻击光标附近的敌人
 * - AOE: 范围伤害（未实现）
 */

import { ComponentType, AttackPattern } from '../config/DataDictionary.js';
import * as Vector2 from '../utils/Vector2.js';

export class WeaponSystem {
  /**
   * 构造函数
   * @param {GridManager} gridManager - 网格管理器
   * @param {ObjectPool} projectilePool - 子弹对象池
   */
  constructor(gridManager, projectilePool) {
    this.gridManager = gridManager;
    this.projectilePool = projectilePool;

    // 子弹速度（像素/秒）
    this.projectileSpeed = 400;
  }

  /**
   * 更新武器系统
   * @param {Number} deltaTime - 时间增量（秒）
   * @param {Array} enemies - 敌人数组
   * @param {Object} cursorPos - 光标位置 { x, y }
   * @param {Object} resources - 资源对象（用于消耗弹药）
   */
  update(deltaTime, enemies, cursorPos, resources) {
    // 获取所有武器组件
    const weapons = this.gridManager.getComponentsByType(ComponentType.WEAPON);

    for (const weapon of weapons) {
      // 更新冷却计时器（Component.update() 已经处理，这里可省略）
      weapon.update(deltaTime);

      // 检查是否可以发射
      if (weapon.currentCooldown <= 0) {
        // 检查弹药是否充足
        if (resources.red >= weapon.stats.ammoCost) {
          // 寻找目标
          const target = this.findTarget(weapon, enemies, cursorPos);

          if (target) {
            // 发射子弹
            this.fire(weapon, target);

            // 消耗弹药
            resources.red -= weapon.stats.ammoCost;

            // 重置冷却
            weapon.currentCooldown = weapon.stats.cooldown;
          }
        }
      }
    }
  }

  /**
   * 为武器寻找目标
   * @param {Component} weapon - 武器组件
   * @param {Array} enemies - 敌人数组
   * @param {Object} cursorPos - 光标位置
   * @returns {Object|null} 目标位置 { x, y } 或 null
   */
  findTarget(weapon, enemies, cursorPos) {
    const weaponPos = this.getWeaponPosition(weapon);

    switch (weapon.stats.pattern) {
      case AttackPattern.NEAREST:
        return this.findNearestEnemy(weaponPos, enemies, weapon.stats.range);

      case AttackPattern.CURSOR:
        return this.findCursorTarget(weaponPos, enemies, cursorPos, weapon.stats.range);

      case AttackPattern.AOE:
        // AOE 模式：向光标方向发射（简化实现）
        return cursorPos;

      default:
        return this.findNearestEnemy(weaponPos, enemies, weapon.stats.range);
    }
  }

  /**
   * 获取武器的世界坐标（像素）
   * @param {Component} weapon - 武器组件
   * @returns {Object} { x, y }
   */
  getWeaponPosition(weapon) {
    const { col, row } = weapon.gridPos;
    const { x_px, y_px } = this.gridManager.gridToScreen(col, row);
    return { x: x_px, y: y_px };
  }

  /**
   * 寻找范围内最近的敌人
   * @param {Object} weaponPos - 武器位置 { x, y }
   * @param {Array} enemies - 敌人数组
   * @param {Number} range - 射程（像素）
   * @returns {Object|null} 目标敌人位置或 null
   */
  findNearestEnemy(weaponPos, enemies, range) {
    let nearestEnemy = null;
    let minDistanceSquared = range * range;

    for (const enemy of enemies) {
      if (!enemy.active) continue;

      const distanceSquared = Vector2.distanceSquared(weaponPos, enemy.position);

      if (distanceSquared < minDistanceSquared) {
        minDistanceSquared = distanceSquared;
        nearestEnemy = enemy;
      }
    }

    return nearestEnemy ? nearestEnemy.position : null;
  }

  /**
   * 寻找光标附近的敌人
   * @param {Object} weaponPos - 武器位置 { x, y }
   * @param {Array} enemies - 敌人数组
   * @param {Object} cursorPos - 光标位置 { x, y }
   * @param {Number} range - 射程（像素）
   * @returns {Object|null} 目标敌人位置或 null
   */
  findCursorTarget(weaponPos, enemies, cursorPos, range) {
    const cursorRadius = 100; // 光标周围 100px 范围内的敌人
    let nearestToCursor = null;
    let minCursorDistanceSquared = cursorRadius * cursorRadius;

    // 找到光标附近最近的敌人
    for (const enemy of enemies) {
      if (!enemy.active) continue;

      // 检查敌人是否在武器射程内
      const weaponDistanceSquared = Vector2.distanceSquared(weaponPos, enemy.position);
      if (weaponDistanceSquared > range * range) continue;

      // 检查敌人是否在光标附近
      const cursorDistanceSquared = Vector2.distanceSquared(cursorPos, enemy.position);
      if (cursorDistanceSquared < minCursorDistanceSquared) {
        minCursorDistanceSquared = cursorDistanceSquared;
        nearestToCursor = enemy;
      }
    }

    return nearestToCursor ? nearestToCursor.position : null;
  }

  /**
   * 发射子弹
   * @param {Component} weapon - 武器组件
   * @param {Object} targetPos - 目标位置 { x, y }
   */
  fire(weapon, targetPos) {
    const weaponPos = this.getWeaponPosition(weapon);

    // 计算方向向量
    const direction = Vector2.subtract(targetPos, weaponPos);
    const normalizedDirection = Vector2.normalize(direction);

    // 计算速度向量
    const velocity = Vector2.multiply(normalizedDirection, this.projectileSpeed);

    // 从对象池获取子弹
    const projectile = this.projectilePool.acquire({
      position: { x: weaponPos.x, y: weaponPos.y },
      velocity: velocity,
      damage: weapon.stats.damage,
      team: 'player'
    });

    // 触发开火音效（未来实现）
    // AudioSystem.play('weapon_fire');
  }

  /**
   * 渲染所有子弹
   * @param {CanvasRenderingContext2D} ctx - Canvas 渲染上下文
   */
  renderProjectiles(ctx) {
    const projectiles = this.projectilePool.getActiveObjects();

    for (const projectile of projectiles) {
      projectile.render(ctx);
    }
  }

  /**
   * 更新所有子弹
   * @param {Number} deltaTime - 时间增量（秒）
   * @param {Number} screenWidth - 屏幕宽度
   * @param {Number} screenHeight - 屏幕高度
   */
  updateProjectiles(deltaTime, screenWidth, screenHeight) {
    const projectiles = this.projectilePool.getActiveObjects();

    for (const projectile of projectiles) {
      projectile.update(deltaTime);

      // 检查是否超出边界
      if (projectile.isOutOfBounds(screenWidth, screenHeight)) {
        this.projectilePool.release(projectile);
      }
    }
  }

  /**
   * 获取所有活跃子弹
   * @returns {Array<Projectile>}
   */
  getActiveProjectiles() {
    return this.projectilePool.getActiveObjects();
  }

  /**
   * 清空所有子弹
   */
  clearProjectiles() {
    this.projectilePool.clear();
  }

  /**
   * 获取统计信息（调试用）
   * @returns {Object}
   */
  getStats() {
    const weapons = this.gridManager.getComponentsByType(ComponentType.WEAPON);
    const projectileStats = this.projectilePool.getStats();

    return {
      weaponCount: weapons.length,
      activeProjectiles: projectileStats.activeCount,
      totalProjectilesCreated: projectileStats.totalCreated
    };
  }
}
