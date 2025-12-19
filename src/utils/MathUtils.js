/**
 * MathUtils - 数学工具函数
 *
 * 提供常用的数学计算和辅助函数
 */

/**
 * 线性插值
 * @param {number} a - 起始值
 * @param {number} b - 目标值
 * @param {number} t - 插值因子 (0-1)
 * @returns {number} 插值结果
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * 限制数值在指定范围内
 * @param {number} value - 值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 限制后的值
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * 将数值映射到新的范围
 * @param {number} value - 原始值
 * @param {number} inMin - 原始范围最小值
 * @param {number} inMax - 原始范围最大值
 * @param {number} outMin - 目标范围最小值
 * @param {number} outMax - 目标范围最大值
 * @returns {number} 映射后的值
 */
export function map(value, inMin, inMax, outMin, outMax) {
  return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
}

/**
 * 角度转弧度
 * @param {number} degrees - 角度
 * @returns {number} 弧度
 */
export function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}

/**
 * 弧度转角度
 * @param {number} radians - 弧度
 * @returns {number} 角度
 */
export function radiansToDegrees(radians) {
  return radians * 180 / Math.PI;
}

/**
 * 生成指定范围内的随机整数
 * @param {number} min - 最小值（包含）
 * @param {number} max - 最大值（包含）
 * @returns {number} 随机整数
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成指定范围内的随机浮点数
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 随机浮点数
 */
export function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * 从数组中随机选择一个元素
 * @param {Array} array - 数组
 * @returns {*} 随机元素
 */
export function randomChoice(array) {
  if (array.length === 0) {
    console.warn('MathUtils.randomChoice: Empty array');
    return null;
  }
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 判断数值是否在范围内
 * @param {number} value - 值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {boolean} 是否在范围内
 */
export function inRange(value, min, max) {
  return value >= min && value <= max;
}

/**
 * 判断两个数值是否近似相等
 * @param {number} a - 数值 A
 * @param {number} b - 数值 B
 * @param {number} epsilon - 误差范围（默认 0.0001）
 * @returns {boolean} 是否近似相等
 */
export function approximately(a, b, epsilon = 0.0001) {
  return Math.abs(a - b) < epsilon;
}

/**
 * 平滑阻尼插值（适用于相机跟随等）
 * @param {number} current - 当前值
 * @param {number} target - 目标值
 * @param {number} smoothTime - 平滑时间
 * @param {number} deltaTime - 时间增量
 * @returns {number} 插值结果
 */
export function smoothDamp(current, target, smoothTime, deltaTime) {
  const t = Math.min(deltaTime / smoothTime, 1);
  return lerp(current, target, t);
}

/**
 * 弹性插值（带回弹效果）
 * @param {number} t - 插值因子 (0-1)
 * @returns {number} 弹性插值结果
 */
export function easeOutElastic(t) {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
    ? 1
    : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

/**
 * 二次缓入
 * @param {number} t - 插值因子 (0-1)
 * @returns {number} 缓入结果
 */
export function easeInQuad(t) {
  return t * t;
}

/**
 * 二次缓出
 * @param {number} t - 插值因子 (0-1)
 * @returns {number} 缓出结果
 */
export function easeOutQuad(t) {
  return 1 - (1 - t) * (1 - t);
}

/**
 * 二次缓入缓出
 * @param {number} t - 插值因子 (0-1)
 * @returns {number} 缓入缓出结果
 */
export function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * 将角度归一化到 [0, 360) 范围
 * @param {number} degrees - 角度
 * @returns {number} 归一化后的角度
 */
export function normalizeAngle(degrees) {
  degrees = degrees % 360;
  if (degrees < 0) degrees += 360;
  return degrees;
}

/**
 * 计算两个角度之间的最短差值
 * @param {number} from - 起始角度（度）
 * @param {number} to - 目标角度（度）
 * @returns {number} 角度差值（-180 到 180）
 */
export function deltaAngle(from, to) {
  let delta = normalizeAngle(to - from);
  if (delta > 180) delta -= 360;
  return delta;
}

/**
 * 向目标角度旋转（限制旋转速度）
 * @param {number} current - 当前角度（度）
 * @param {number} target - 目标角度（度）
 * @param {number} maxDelta - 最大旋转量（度）
 * @returns {number} 旋转后的角度
 */
export function rotateTowards(current, target, maxDelta) {
  const delta = deltaAngle(current, target);
  if (Math.abs(delta) <= maxDelta) {
    return target;
  }
  return current + Math.sign(delta) * maxDelta;
}

/**
 * 百分比计算
 * @param {number} value - 当前值
 * @param {number} max - 最大值
 * @returns {number} 百分比 (0-100)
 */
export function percentage(value, max) {
  if (max === 0) return 0;
  return clamp((value / max) * 100, 0, 100);
}

/**
 * 计算两个矩形是否重叠（AABB 碰撞检测）
 * @param {number} x1 - 矩形1 X
 * @param {number} y1 - 矩形1 Y
 * @param {number} w1 - 矩形1 宽度
 * @param {number} h1 - 矩形1 高度
 * @param {number} x2 - 矩形2 X
 * @param {number} y2 - 矩形2 Y
 * @param {number} w2 - 矩形2 宽度
 * @param {number} h2 - 矩形2 高度
 * @returns {boolean} 是否重叠
 */
export function rectanglesOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
  return !(x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1);
}

/**
 * 计算点是否在矩形内
 * @param {number} x - 点 X
 * @param {number} y - 点 Y
 * @param {number} rectX - 矩形 X
 * @param {number} rectY - 矩形 Y
 * @param {number} rectW - 矩形宽度
 * @param {number} rectH - 矩形高度
 * @returns {boolean} 是否在矩形内
 */
export function pointInRectangle(x, y, rectX, rectY, rectW, rectH) {
  return x >= rectX && x <= rectX + rectW && y >= rectY && y <= rectY + rectH;
}

/**
 * 计算点是否在圆内
 * @param {number} x - 点 X
 * @param {number} y - 点 Y
 * @param {number} circleX - 圆心 X
 * @param {number} circleY - 圆心 Y
 * @param {number} radius - 半径
 * @returns {boolean} 是否在圆内
 */
export function pointInCircle(x, y, circleX, circleY, radius) {
  const dx = x - circleX;
  const dy = y - circleY;
  return (dx * dx + dy * dy) <= (radius * radius);
}

/**
 * 计算圆与圆是否相交
 * @param {number} x1 - 圆1 X
 * @param {number} y1 - 圆1 Y
 * @param {number} r1 - 圆1 半径
 * @param {number} x2 - 圆2 X
 * @param {number} y2 - 圆2 Y
 * @param {number} r2 - 圆2 半径
 * @returns {boolean} 是否相交
 */
export function circlesIntersect(x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distSq = dx * dx + dy * dy;
  const radiusSumSq = (r1 + r2) * (r1 + r2);
  return distSq <= radiusSumSq;
}

/**
 * 向下取整（用于 UI 显示资源）
 * @param {number} value - 值
 * @returns {number} 取整后的值
 */
export function floorForDisplay(value) {
  return Math.floor(value);
}

/**
 * 格式化数字为带千分位的字符串
 * @param {number} value - 值
 * @returns {string} 格式化后的字符串
 */
export function formatNumber(value) {
  return Math.floor(value).toLocaleString();
}

/**
 * 计算进度（0-1）
 * @param {number} current - 当前值
 * @param {number} max - 最大值
 * @returns {number} 进度 (0-1)
 */
export function progress(current, max) {
  if (max === 0) return 0;
  return clamp(current / max, 0, 1);
}

// 常用常量
export const PI = Math.PI;
export const TWO_PI = Math.PI * 2;
export const HALF_PI = Math.PI / 2;
export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;

// 默认导出
export default {
  lerp,
  clamp,
  map,
  degreesToRadians,
  radiansToDegrees,
  randomInt,
  randomFloat,
  randomChoice,
  inRange,
  approximately,
  smoothDamp,
  easeOutElastic,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  normalizeAngle,
  deltaAngle,
  rotateTowards,
  percentage,
  rectanglesOverlap,
  pointInRectangle,
  pointInCircle,
  circlesIntersect,
  floorForDisplay,
  formatNumber,
  progress,
  PI,
  TWO_PI,
  HALF_PI,
  DEG_TO_RAD,
  RAD_TO_DEG
};
