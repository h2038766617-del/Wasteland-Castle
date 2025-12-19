/**
 * ObjectPool.js
 * 对象池 - 用于复用对象，避免频繁的 new/delete 导致 GC
 *
 * 职责：
 * - 管理可复用对象的池子
 * - 提供 acquire() 获取对象
 * - 提供 release() 回收对象
 * - 自动扩容
 *
 * 使用场景：
 * - Projectile (子弹)
 * - Enemy (敌人)
 * - ParticleEffect (粒子特效)
 */

/**
 * 对象池类
 * @template T
 */
export default class ObjectPool {
  /**
   * 构造函数
   * @param {Function} factory - 对象工厂函数，返回新实例
   * @param {Number} initialSize - 初始池大小
   */
  constructor(factory, initialSize = 50) {
    this.factory = factory;
    this.pool = [];
    this.activeObjects = new Set(); // 追踪活跃对象

    // 预创建初始对象
    for (let i = 0; i < initialSize; i++) {
      const obj = this.factory();
      obj.active = false;
      this.pool.push(obj);
    }

    // 统计信息
    this.stats = {
      totalCreated: initialSize,
      maxActive: 0,
      currentActive: 0,
      acquisitions: 0,
      releases: 0
    };
  }

  /**
   * 获取一个对象
   * @param {Object} config - 初始化配置（传递给 obj.init()）
   * @returns {T} 对象实例
   */
  acquire(config = {}) {
    let obj;

    // 尝试从池中获取未使用的对象
    obj = this.pool.find(item => !item.active);

    // 如果池中没有可用对象，创建新对象
    if (!obj) {
      obj = this.factory();
      this.pool.push(obj);
      this.stats.totalCreated++;
    }

    // 初始化对象
    if (typeof obj.init === 'function') {
      obj.init(config);
    } else {
      obj.active = true;
    }

    // 添加到活跃集合
    this.activeObjects.add(obj);

    // 更新统计
    this.stats.acquisitions++;
    this.stats.currentActive = this.activeObjects.size;
    this.stats.maxActive = Math.max(this.stats.maxActive, this.stats.currentActive);

    return obj;
  }

  /**
   * 回收一个对象
   * @param {T} obj - 要回收的对象
   */
  release(obj) {
    if (!obj) return;

    // 重置对象
    if (typeof obj.reset === 'function') {
      obj.reset();
    } else {
      obj.active = false;
    }

    // 从活跃集合中移除
    this.activeObjects.delete(obj);

    // 更新统计
    this.stats.releases++;
    this.stats.currentActive = this.activeObjects.size;
  }

  /**
   * 批量回收对象
   * @param {Array<T>} objects - 要回收的对象数组
   */
  releaseAll(objects) {
    for (const obj of objects) {
      this.release(obj);
    }
  }

  /**
   * 获取所有活跃对象
   * @returns {Array<T>}
   */
  getActiveObjects() {
    return Array.from(this.activeObjects);
  }

  /**
   * 根据条件回收对象
   * @param {Function} predicate - 判断函数，返回 true 则回收
   * @returns {Number} 回收的对象数量
   */
  releaseIf(predicate) {
    let count = 0;
    const toRelease = [];

    for (const obj of this.activeObjects) {
      if (predicate(obj)) {
        toRelease.push(obj);
        count++;
      }
    }

    this.releaseAll(toRelease);
    return count;
  }

  /**
   * 清空所有活跃对象
   */
  clear() {
    const activeArray = Array.from(this.activeObjects);
    this.releaseAll(activeArray);
  }

  /**
   * 获取池的统计信息
   * @returns {Object}
   */
  getStats() {
    return {
      ...this.stats,
      poolSize: this.pool.length,
      activeCount: this.activeObjects.size,
      availableCount: this.pool.length - this.activeObjects.size
    };
  }

  /**
   * 打印统计信息（调试用）
   */
  printStats() {
    const stats = this.getStats();
    console.log('=== ObjectPool Stats ===');
    console.log(`Pool Size: ${stats.poolSize}`);
    console.log(`Active: ${stats.activeCount}`);
    console.log(`Available: ${stats.availableCount}`);
    console.log(`Max Active: ${stats.maxActive}`);
    console.log(`Total Created: ${stats.totalCreated}`);
    console.log(`Acquisitions: ${stats.acquisitions}`);
    console.log(`Releases: ${stats.releases}`);
  }

  /**
   * 预热池（预创建对象）
   * @param {Number} count - 预创建数量
   */
  prewarm(count) {
    for (let i = 0; i < count; i++) {
      const obj = this.factory();
      obj.active = false;
      this.pool.push(obj);
      this.stats.totalCreated++;
    }
  }

  /**
   * 收缩池（移除未使用的对象，减少内存占用）
   * @param {Number} targetSize - 目标池大小
   */
  shrink(targetSize) {
    const inactiveObjects = this.pool.filter(obj => !obj.active);
    const toRemove = Math.max(0, inactiveObjects.length - targetSize);

    if (toRemove > 0) {
      // 移除多余的未使用对象
      const newPool = [];
      let removed = 0;

      for (const obj of this.pool) {
        if (obj.active || removed >= toRemove) {
          newPool.push(obj);
        } else {
          removed++;
        }
      }

      this.pool = newPool;
      console.log(`ObjectPool shrunk by ${removed} objects`);
    }
  }
}
