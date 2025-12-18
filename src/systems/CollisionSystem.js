/**
 * CollisionSystem.js
 * 碰撞检测系统
 *
 * 职责：
 * - 检测子弹与敌人的碰撞
 * - 处理碰撞结果（伤害、击杀奖励）
 * - 回收碰撞后的子弹
 *
 * 碰撞算法：
 * - 圆形碰撞检测（Circle-Circle）
 * - 使用 distanceSquared 优化性能
 */

import * as Vector2 from '../utils/Vector2.js';

export class CollisionSystem {
  /**
   * 构造函数
   */
  constructor() {
    // 统计信息
    this.stats = {
      totalHits: 0,        // 总命中次数
      totalKills: 0,       // 总击杀数
      totalDamage: 0       // 总伤害
    };
  }

  /**
   * 检测并处理子弹与敌人的碰撞
   * @param {Array<Projectile>} projectiles - 子弹数组
   * @param {Array<Enemy>} enemies - 敌人数组
   * @param {ObjectPool} projectilePool - 子弹对象池
   * @param {Object} resources - 资源对象（用于击杀奖励）
   * @returns {Object} { hits: Number, kills: Number }
   */
  checkProjectileEnemyCollisions(projectiles, enemies, projectilePool, resources) {
    let hits = 0;
    let kills = 0;

    for (const projectile of projectiles) {
      if (!projectile.active) continue;

      for (const enemy of enemies) {
        if (!enemy.active) continue;

        // 检查碰撞
        if (this.checkCircleCollision(
          projectile.position,
          projectile.radius,
          enemy.position,
          15 // 敌人半径（暂时硬编码）
        )) {
          // 处理碰撞
          this.handleProjectileEnemyHit(projectile, enemy, projectilePool, resources);
          hits++;

          // 检查敌人是否死亡
          if (!enemy.active) {
            kills++;
          }

          // 子弹已被回收，跳出内层循环
          break;
        }
      }
    }

    return { hits, kills };
  }

  /**
   * 圆形碰撞检测
   * @param {Object} pos1 - 第一个圆的位置 { x, y }
   * @param {Number} radius1 - 第一个圆的半径
   * @param {Object} pos2 - 第二个圆的位置 { x, y }
   * @param {Number} radius2 - 第二个圆的半径
   * @returns {Boolean} 是否碰撞
   */
  checkCircleCollision(pos1, radius1, pos2, radius2) {
    const distanceSquared = Vector2.distanceSquared(pos1, pos2);
    const radiusSum = radius1 + radius2;
    const radiusSumSquared = radiusSum * radiusSum;

    return distanceSquared <= radiusSumSquared;
  }

  /**
   * 处理子弹命中敌人
   * @param {Projectile} projectile - 子弹
   * @param {Enemy} enemy - 敌人
   * @param {ObjectPool} projectilePool - 子弹对象池
   * @param {Object} resources - 资源对象
   */
  handleProjectileEnemyHit(projectile, enemy, projectilePool, resources) {
    // 对敌人造成伤害
    enemy.hp -= projectile.damage;

    // 更新统计
    this.stats.totalHits++;
    this.stats.totalDamage += projectile.damage;

    // 回收子弹
    projectilePool.release(projectile);

    // 检查敌人是否死亡
    if (enemy.hp <= 0) {
      this.handleEnemyDeath(enemy, resources);
    }
  }

  /**
   * 处理敌人死亡
   * @param {Enemy} enemy - 死亡的敌人
   * @param {Object} resources - 资源对象
   */
  handleEnemyDeath(enemy, resources) {
    // 标记为非活跃
    enemy.active = false;

    // 给予击杀奖励
    if (resources) {
      resources.red += enemy.rewardRed || 0;
      resources.gold += enemy.rewardGold || 0;
    }

    // 更新统计
    this.stats.totalKills++;

    // TODO: 触发死亡特效、音效
  }

  /**
   * 检测敌人与组件的碰撞并处理攻击
   * @param {Array<Enemy>} enemies - 敌人数组
   * @param {Array<Component>} components - 组件数组
   * @param {GridManager} gridManager - 网格管理器
   * @returns {Object} { attacks: Number, destroyed: Number }
   */
  checkEnemyComponentCollisions(enemies, components, gridManager) {
    let attacks = 0;
    let destroyed = 0;

    for (const enemy of enemies) {
      if (!enemy.active) continue;

      // 获取距离敌人最近的组件
      const nearestComponent = this.findNearestComponent(enemy, components, gridManager);

      if (nearestComponent) {
        const componentPos = gridManager.gridToScreen(
          nearestComponent.gridPos.col,
          nearestComponent.gridPos.row
        );

        // 检查是否在攻击范围内（敌人半径 + 组件半径）
        const attackRange = enemy.radius + gridManager.cellSize_px / 2;
        const distance = Vector2.distance(enemy.position, {
          x: componentPos.x_px,
          y: componentPos.y_px
        });

        if (distance <= attackRange) {
          // 敌人在攻击范围内，尝试攻击
          if (enemy.canAttack()) {
            const damage = enemy.attack();
            nearestComponent.takeDamage(damage);
            attacks++;

            // 检查组件是否被摧毁
            if (nearestComponent.isDestroyed()) {
              destroyed++;
            }
          }
        }
      }
    }

    return { attacks, destroyed };
  }

  /**
   * 找到距离敌人最近的组件
   * @param {Enemy} enemy - 敌人
   * @param {Array<Component>} components - 组件数组
   * @param {GridManager} gridManager - 网格管理器
   * @returns {Component|null} 最近的组件或 null
   */
  findNearestComponent(enemy, components, gridManager) {
    let nearestComponent = null;
    let minDistance = Infinity;

    for (const component of components) {
      if (component.isDestroyed()) continue;

      const componentPos = gridManager.gridToScreen(
        component.gridPos.col,
        component.gridPos.row
      );

      const distance = Vector2.distance(enemy.position, {
        x: componentPos.x_px,
        y: componentPos.y_px
      });

      if (distance < minDistance) {
        minDistance = distance;
        nearestComponent = component;
      }
    }

    return nearestComponent;
  }

  /**
   * 矩形碰撞检测（用于未来的 AOE 或区域技能）
   * @param {Object} rect1 - 第一个矩形 { x, y, width, height }
   * @param {Object} rect2 - 第二个矩形 { x, y, width, height }
   * @returns {Boolean} 是否碰撞
   */
  checkRectCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  /**
   * 点与圆形碰撞检测（用于点击选中等）
   * @param {Object} point - 点 { x, y }
   * @param {Object} circle - 圆形 { x, y, radius }
   * @returns {Boolean} 是否碰撞
   */
  checkPointCircleCollision(point, circle) {
    const distanceSquared = Vector2.distanceSquared(point, { x: circle.x, y: circle.y });
    return distanceSquared <= circle.radius * circle.radius;
  }

  /**
   * 获取统计信息
   * @returns {Object}
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats.totalHits = 0;
    this.stats.totalKills = 0;
    this.stats.totalDamage = 0;
  }

  /**
   * 打印统计信息（调试用）
   */
  printStats() {
    console.log('=== CollisionSystem Stats ===');
    console.log(`Total Hits: ${this.stats.totalHits}`);
    console.log(`Total Kills: ${this.stats.totalKills}`);
    console.log(`Total Damage: ${this.stats.totalDamage}`);
  }
}
