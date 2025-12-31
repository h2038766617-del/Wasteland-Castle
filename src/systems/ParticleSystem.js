/**
 * ParticleSystem.js
 * 粒子效果系统
 *
 * 职责：
 * - 管理所有粒子效果
 * - 敌人死亡爆炸
 * - 资源采集闪光
 * - 其他视觉反馈
 */

export class ParticleSystem {
  constructor() {
    this.particles = []; // 所有活跃粒子
  }

  /**
   * 创建敌人死亡爆炸效果
   * @param {Number} x - X 坐标
   * @param {Number} y - Y 坐标
   * @param {String} color - 敌人颜色
   */
  createEnemyExplosion(x, y, color = '#FF3333') {
    const particleCount = 12; // 粒子数量

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 100 + Math.random() * 100; // 100-200 像素/秒

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3, // 3-6 像素
        color,
        life: 0.6, // 0.6秒生命周期
        maxLife: 0.6,
        type: 'explosion'
      });
    }
  }

  /**
   * 创建资源采集完成效果
   * @param {Number} x - X 坐标
   * @param {Number} y - Y 坐标
   * @param {String} resourceType - 资源类型
   */
  createResourceCollect(x, y, resourceType) {
    const colors = {
      'RED': '#FF3333',
      'BLUE': '#3333FF',
      'GOLD': '#FFD700'
    };
    const color = colors[resourceType] || '#FFFFFF';

    // 创建向上飘散的粒子
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 40,
        y,
        vx: (Math.random() - 0.5) * 50,
        vy: -80 - Math.random() * 40, // 向上
        size: 2 + Math.random() * 2,
        color,
        life: 0.8,
        maxLife: 0.8,
        type: 'collect'
      });
    }
  }

  /**
   * 创建升级效果
   * @param {Number} x - X 坐标
   * @param {Number} y - Y 坐标
   */
  createUpgradeEffect(x, y) {
    // 创建金色光环效果
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const radius = 30 + Math.random() * 20;

      this.particles.push({
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
        vx: Math.cos(angle) * 50,
        vy: Math.sin(angle) * 50,
        size: 3,
        color: '#FFD700',
        life: 1.0,
        maxLife: 1.0,
        type: 'upgrade'
      });
    }
  }

  /**
   * 更新所有粒子
   * @param {Number} deltaTime - 时间增量（秒）
   */
  update(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // 更新位置
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;

      // 应用重力（爆炸粒子）
      if (p.type === 'explosion') {
        p.vy += 200 * deltaTime; // 重力加速度
      }

      // 更新生命周期
      p.life -= deltaTime;

      // 移除死亡粒子
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * 渲染所有粒子
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   */
  render(ctx) {
    ctx.save();

    for (const p of this.particles) {
      const alpha = p.life / p.maxLife; // 渐隐效果

      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      // 绘制圆形粒子
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * 清空所有粒子
   */
  clear() {
    this.particles = [];
  }

  /**
   * 获取粒子数量
   * @returns {Number}
   */
  getParticleCount() {
    return this.particles.length;
  }
}

export default ParticleSystem;
