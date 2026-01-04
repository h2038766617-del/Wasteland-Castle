/**
 * DroneCursor - 无人机光标实体
 *
 * 核心特性：
 * - 固定速度移动（无加速度）
 * - 匀速飞向鼠标位置
 * - 吸附机制（接近目标时直接定位）
 * - 作为"光标引导类"武器的集火信号
 * - 用于悬停采集资源
 *
 * 物理模型：
 * - 无加速度，以固定速度飞向目标
 * - 当距离 < step 时，直接吸附到目标位置
 *
 * 数据字典规范：
 * - position: { x, y } - 像素坐标
 * - targetPos: { x, y } - 像素坐标
 * - moveSpeed: 常量 px/s
 */

import * as Vector2 from '../utils/Vector2.js';
import { DRONE, DEBUG } from '../config/Constants.js';

export default class DroneCursor {
  /**
   * 构造函数
   * @param {number} x_px - 初始 X 坐标（像素）
   * @param {number} y_px - 初始 Y 坐标（像素）
   */
  constructor(x_px = DRONE.INITIAL_X_PX, y_px = DRONE.INITIAL_Y_PX) {
    // 当前位置（像素坐标）
    this.position = {
      x: x_px,
      y: y_px
    };

    // 目标位置（像素坐标，通常是鼠标位置）
    this.targetPos = {
      x: x_px,
      y: y_px
    };

    // 固定移动速度（像素/秒）- 无加速度
    this.moveSpeed = DRONE.MOVE_SPEED;

    // 渲染属性
    this.radius = DRONE.RADIUS;
    this.color = DRONE.COLOR;
    this.lineColor = DRONE.LINE_COLOR;

    // 吸附阈值（当距离小于此值时，直接定位到目标）
    this.snapThreshold = DRONE.SNAP_THRESHOLD;

    // 采集/攻击属性（可升级）
    this.miningPower = 1.0;
    this.attackPower = 20; // 每秒伤害

    // 攻击相关属性
    this.attackRange = 80; // 攻击范围（像素）
    this.attackCooldown = 0.15; // 攻击间隔（秒）
    this.currentAttackCooldown = 0;
    this.currentTarget = null; // 当前攻击目标

    console.log(`DroneCursor 初始化于 (${x_px}, ${y_px})`);
  }

  /**
   * 更新无人机位置
   * @param {number} deltaTime - 时间增量（秒）
   * @param {{x: number, y: number}} mousePos - 鼠标位置（像素坐标）
   */
  update(deltaTime, mousePos) {
    // 更新目标位置为当前鼠标位置
    this.targetPos = { ...mousePos };

    // 计算从当前位置到目标位置的向量
    const vec = Vector2.subtract(this.targetPos, this.position);

    // 计算距离
    const distance = Vector2.length(vec);

    // 计算本帧可移动的距离
    const step = this.moveSpeed * deltaTime;

    // 移动逻辑
    if (distance > step) {
      // 距离大于步长：按固定速度移动
      const direction = Vector2.normalize(vec);
      const movement = Vector2.multiply(direction, step);
      this.position = Vector2.add(this.position, movement);
    } else if (distance > 0) {
      // 距离小于步长：直接吸附到目标位置
      this.position = { ...this.targetPos };
    }

    // 额外的吸附检查（优化小距离抖动）
    if (distance < this.snapThreshold) {
      this.position = { ...this.targetPos };
    }
  }

  /**
   * 渲染无人机光标
   * @param {CanvasRenderingContext2D} ctx - Canvas 渲染上下文
   */
  render(ctx) {
    // 保存上下文状态
    ctx.save();

    // 绘制连接线（从无人机到鼠标）
    this.renderConnectionLine(ctx);

    // 绘制无人机主体（圆圈）
    this.renderDrone(ctx);

    // 绘制调试信息（如果启用）
    if (DEBUG.SHOW_DRONE_POS) {
      this.renderDebugInfo(ctx);
    }

    // 恢复上下文状态
    ctx.restore();
  }

  /**
   * 绘制连接线
   * @param {CanvasRenderingContext2D} ctx
   */
  renderConnectionLine(ctx) {
    // 只有当无人机和鼠标位置不同时才绘制连接线
    const distance = Vector2.distance(this.position, this.targetPos);
    if (distance < 1) return; // 距离太近，不绘制

    ctx.strokeStyle = this.lineColor;
    ctx.lineWidth = DRONE.LINE_WIDTH;
    ctx.beginPath();
    ctx.moveTo(this.position.x, this.position.y);
    ctx.lineTo(this.targetPos.x, this.targetPos.y);
    ctx.stroke();
  }

  /**
   * 绘制无人机主体
   * @param {CanvasRenderingContext2D} ctx
   */
  renderDrone(ctx) {
    const x = this.position.x;
    const y = this.position.y;

    // 外圈（发光效果）
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    // 内圈（填充）
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(x, y, this.radius / 2, 0, Math.PI * 2);
    ctx.fill();

    // 十字准星
    const crossSize = this.radius + 4;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;

    // 水平线
    ctx.beginPath();
    ctx.moveTo(x - crossSize, y);
    ctx.lineTo(x + crossSize, y);
    ctx.stroke();

    // 垂直线
    ctx.beginPath();
    ctx.moveTo(x, y - crossSize);
    ctx.lineTo(x, y + crossSize);
    ctx.stroke();
  }

  /**
   * 绘制调试信息
   * @param {CanvasRenderingContext2D} ctx
   */
  renderDebugInfo(ctx) {
    const x = this.position.x;
    const y = this.position.y;

    // 绘制位置坐标
    ctx.fillStyle = '#00FFFF';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(
      `(${Math.floor(x)}, ${Math.floor(y)})`,
      x + this.radius + 10,
      y - this.radius
    );

    // 绘制距离信息
    const distance = Vector2.distance(this.position, this.targetPos);
    if (distance > 1) {
      ctx.fillText(
        `距离: ${Math.floor(distance)}px`,
        x + this.radius + 10,
        y - this.radius + 15
      );
    }
  }

  /**
   * 获取当前位置
   * @returns {{x: number, y: number}}
   */
  getPosition() {
    return { ...this.position };
  }

  /**
   * 设置位置
   * @param {number} x_px - X 坐标（像素）
   * @param {number} y_px - Y 坐标（像素）
   */
  setPosition(x_px, y_px) {
    this.position.x = x_px;
    this.position.y = y_px;
  }

  /**
   * 获取目标位置
   * @returns {{x: number, y: number}}
   */
  getTargetPosition() {
    return { ...this.targetPos };
  }

  /**
   * 检查是否在指定位置附近（用于采集、攻击判定）
   * @param {{x: number, y: number}} pos - 目标位置（像素坐标）
   * @param {number} radius - 判定半径（像素）
   * @returns {boolean}
   */
  isNear(pos, radius) {
    const distSq = Vector2.distanceSquared(this.position, pos);
    return distSq <= radius * radius;
  }

  /**
   * 获取到目标的距离平方（性能优化）
   * @param {{x: number, y: number}} target - 目标位置（像素坐标）
   * @returns {number}
   */
  getDistanceSquaredTo(target) {
    return Vector2.distanceSquared(this.position, target);
  }

  /**
   * 获取到目标的距离
   * @param {{x: number, y: number}} target - 目标位置（像素坐标）
   * @returns {number}
   */
  getDistanceTo(target) {
    return Vector2.distance(this.position, target);
  }

  /**
   * 重置无人机到指定位置
   * @param {number} x_px - X 坐标（像素）
   * @param {number} y_px - Y 坐标（像素）
   */
  reset(x_px, y_px) {
    this.position = { x: x_px, y: y_px };
    this.targetPos = { x: x_px, y: y_px };
    this.currentTarget = null;
    this.currentAttackCooldown = 0;
  }

  /**
   * 更新攻击逻辑
   * @param {number} deltaTime - 时间增量（秒）
   * @param {Array} enemies - 敌人列表
   * @returns {Object|null} 攻击结果 { target, damage } 或 null
   */
  updateAttack(deltaTime, enemies) {
    // 更新冷却计时器
    if (this.currentAttackCooldown > 0) {
      this.currentAttackCooldown -= deltaTime;
    }

    // 如果当前目标失效（死亡或超出范围），清除目标
    if (this.currentTarget && !this.currentTarget.active) {
      this.currentTarget = null;
    }

    // 如果有当前目标，检查是否还在范围内
    if (this.currentTarget) {
      const distSq = Vector2.distanceSquared(this.position, this.currentTarget.position);
      if (distSq > this.attackRange * this.attackRange) {
        // 目标超出范围，清除目标
        this.currentTarget = null;
      }
    }

    // 寻找最近的敌人
    if (!this.currentTarget) {
      let nearestEnemy = null;
      let nearestDistSq = Infinity;

      for (const enemy of enemies) {
        if (!enemy.active) continue;

        const distSq = Vector2.distanceSquared(this.position, enemy.position);
        if (distSq < this.attackRange * this.attackRange && distSq < nearestDistSq) {
          nearestEnemy = enemy;
          nearestDistSq = distSq;
        }
      }

      this.currentTarget = nearestEnemy;
    }

    // 如果有目标且冷却完毕，执行攻击
    if (this.currentTarget && this.currentAttackCooldown <= 0) {
      this.currentAttackCooldown = this.attackCooldown;
      return {
        target: this.currentTarget,
        damage: this.attackPower * this.attackCooldown // 伤害 = DPS * 攻击间隔
      };
    }

    return null;
  }

  /**
   * 渲染攻击视觉效果
   * @param {CanvasRenderingContext2D} ctx
   */
  renderAttackEffect(ctx) {
    if (!this.currentTarget) return;

    ctx.save();

    // 绘制激光束（从光标到敌人）
    const targetPos = this.currentTarget.position;

    // 激光束主线
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(this.position.x, this.position.y);
    ctx.lineTo(targetPos.x, targetPos.y);
    ctx.stroke();

    // 激光束光晕
    ctx.strokeStyle = '#FF666688';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(this.position.x, this.position.y);
    ctx.lineTo(targetPos.x, targetPos.y);
    ctx.stroke();

    // 攻击范围指示圈（淡显示）
    ctx.strokeStyle = '#FF000033';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.attackRange, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}
