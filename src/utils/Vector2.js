/**
 * Vector2 - 2D 向量工具类
 *
 * 提供常用的二维向量运算
 * 所有方法都是纯函数，不修改原始向量
 *
 * 性能优化：
 * - 避免不必要的对象创建
 * - 提供 distanceSquared 避免 Math.sqrt()
 */

/**
 * 创建新的二维向量
 * @param {number} x - X 分量
 * @param {number} y - Y 分量
 * @returns {{x: number, y: number}}
 */
export function create(x = 0, y = 0) {
  return { x, y };
}

/**
 * 复制向量
 * @param {{x: number, y: number}} vec - 源向量
 * @returns {{x: number, y: number}} 新向量
 */
export function clone(vec) {
  return { x: vec.x, y: vec.y };
}

/**
 * 向量加法：a + b
 * @param {{x: number, y: number}} a - 向量 A
 * @param {{x: number, y: number}} b - 向量 B
 * @returns {{x: number, y: number}} 结果向量
 */
export function add(a, b) {
  return {
    x: a.x + b.x,
    y: a.y + b.y
  };
}

/**
 * 向量减法：a - b
 * @param {{x: number, y: number}} a - 向量 A
 * @param {{x: number, y: number}} b - 向量 B
 * @returns {{x: number, y: number}} 结果向量
 */
export function subtract(a, b) {
  return {
    x: a.x - b.x,
    y: a.y - b.y
  };
}

/**
 * 向量标量乘法：vec * scalar
 * @param {{x: number, y: number}} vec - 向量
 * @param {number} scalar - 标量
 * @returns {{x: number, y: number}} 结果向量
 */
export function multiply(vec, scalar) {
  return {
    x: vec.x * scalar,
    y: vec.y * scalar
  };
}

/**
 * 向量标量除法：vec / scalar
 * @param {{x: number, y: number}} vec - 向量
 * @param {number} scalar - 标量
 * @returns {{x: number, y: number}} 结果向量
 */
export function divide(vec, scalar) {
  if (scalar === 0) {
    console.warn('Vector2.divide: Division by zero');
    return { x: 0, y: 0 };
  }
  return {
    x: vec.x / scalar,
    y: vec.y / scalar
  };
}

/**
 * 计算向量长度的平方
 * 性能优化：避免 Math.sqrt()，用于距离比较
 * @param {{x: number, y: number}} vec - 向量
 * @returns {number} 长度的平方
 */
export function lengthSquared(vec) {
  return vec.x * vec.x + vec.y * vec.y;
}

/**
 * 计算向量长度（模）
 * @param {{x: number, y: number}} vec - 向量
 * @returns {number} 长度
 */
export function length(vec) {
  return Math.sqrt(lengthSquared(vec));
}

/**
 * 计算两点之间距离的平方
 * 性能优化：避免 Math.sqrt()，用于距离比较
 * @param {{x: number, y: number}} a - 点 A
 * @param {{x: number, y: number}} b - 点 B
 * @returns {number} 距离的平方
 */
export function distanceSquared(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return dx * dx + dy * dy;
}

/**
 * 计算两点之间的距离
 * @param {{x: number, y: number}} a - 点 A
 * @param {{x: number, y: number}} b - 点 B
 * @returns {number} 距离
 */
export function distance(a, b) {
  return Math.sqrt(distanceSquared(a, b));
}

/**
 * 归一化向量（转换为单位向量）
 * @param {{x: number, y: number}} vec - 向量
 * @returns {{x: number, y: number}} 归一化后的向量（长度为 1）
 */
export function normalize(vec) {
  const len = length(vec);
  if (len === 0) {
    console.warn('Vector2.normalize: Cannot normalize zero vector');
    return { x: 0, y: 0 };
  }
  return divide(vec, len);
}

/**
 * 点乘
 * @param {{x: number, y: number}} a - 向量 A
 * @param {{x: number, y: number}} b - 向量 B
 * @returns {number} 点乘结果
 */
export function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

/**
 * 叉乘（2D 向量返回标量，表示垂直于平面的向量的 Z 分量）
 * @param {{x: number, y: number}} a - 向量 A
 * @param {{x: number, y: number}} b - 向量 B
 * @returns {number} 叉乘结果（Z 分量）
 */
export function cross(a, b) {
  return a.x * b.y - a.y * b.x;
}

/**
 * 向量线性插值
 * @param {{x: number, y: number}} a - 起始向量
 * @param {{x: number, y: number}} b - 目标向量
 * @param {number} t - 插值因子 (0-1)
 * @returns {{x: number, y: number}} 插值结果
 */
export function lerp(a, b, t) {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t
  };
}

/**
 * 限制向量长度
 * @param {{x: number, y: number}} vec - 向量
 * @param {number} maxLength - 最大长度
 * @returns {{x: number, y: number}} 限制后的向量
 */
export function clampLength(vec, maxLength) {
  const lenSq = lengthSquared(vec);
  if (lenSq > maxLength * maxLength) {
    const len = Math.sqrt(lenSq);
    return multiply(vec, maxLength / len);
  }
  return clone(vec);
}

/**
 * 向量旋转（角度制）
 * @param {{x: number, y: number}} vec - 向量
 * @param {number} angleDegrees - 旋转角度（度）
 * @returns {{x: number, y: number}} 旋转后的向量
 */
export function rotate(vec, angleDegrees) {
  const angleRadians = angleDegrees * Math.PI / 180;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);
  return {
    x: vec.x * cos - vec.y * sin,
    y: vec.x * sin + vec.y * cos
  };
}

/**
 * 向量旋转（弧度制）
 * @param {{x: number, y: number}} vec - 向量
 * @param {number} angleRadians - 旋转角度（弧度）
 * @returns {{x: number, y: number}} 旋转后的向量
 */
export function rotateRadians(vec, angleRadians) {
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);
  return {
    x: vec.x * cos - vec.y * sin,
    y: vec.x * sin + vec.y * cos
  };
}

/**
 * 计算向量角度（弧度）
 * @param {{x: number, y: number}} vec - 向量
 * @returns {number} 角度（弧度）
 */
export function angle(vec) {
  return Math.atan2(vec.y, vec.x);
}

/**
 * 计算两个向量之间的角度（弧度）
 * @param {{x: number, y: number}} a - 向量 A
 * @param {{x: number, y: number}} b - 向量 B
 * @returns {number} 夹角（弧度）
 */
export function angleBetween(a, b) {
  return Math.acos(dot(a, b) / (length(a) * length(b)));
}

/**
 * 判断两个向量是否相等
 * @param {{x: number, y: number}} a - 向量 A
 * @param {{x: number, y: number}} b - 向量 B
 * @param {number} epsilon - 误差范围（默认 0.0001）
 * @returns {boolean} 是否相等
 */
export function equals(a, b, epsilon = 0.0001) {
  return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon;
}

/**
 * 零向量
 */
export const ZERO = Object.freeze({ x: 0, y: 0 });

/**
 * 单位向量（向右）
 */
export const RIGHT = Object.freeze({ x: 1, y: 0 });

/**
 * 单位向量（向左）
 */
export const LEFT = Object.freeze({ x: -1, y: 0 });

/**
 * 单位向量（向上）
 */
export const UP = Object.freeze({ x: 0, y: -1 });

/**
 * 单位向量（向下）
 */
export const DOWN = Object.freeze({ x: 0, y: 1 });

// 默认导出所有方法
export default {
  create,
  clone,
  add,
  subtract,
  multiply,
  divide,
  lengthSquared,
  length,
  distanceSquared,
  distance,
  normalize,
  dot,
  cross,
  lerp,
  clampLength,
  rotate,
  rotateRadians,
  angle,
  angleBetween,
  equals,
  ZERO,
  RIGHT,
  LEFT,
  UP,
  DOWN
};
