# 核心流程分析：为什么玩不下去？

## 游戏应该的核心流程

横版卷轴 + 波次防御游戏应该是：
1. 载具前进（卷轴滚动）
2. 遇到敌人（波次）→ 击退敌人
3. 继续前进 → 下一波敌人
4. 重复直到完成目标

## 当前实现的问题

### 问题1：两个系统完全脱节 🔴
**EnemySystem（波次系统）**：
- PREPARING（8秒） → WAVE_ACTIVE → WAVE_COMPLETE → 下一波
- 共10波，完成后 VICTORY 状态

**ScrollSystem（卷轴系统）**：
- 一直向右前进
- 到达5000px后 reachedDestination = true

**关键问题**：这两个系统完全独立！
- 波次完成后，卷轴还在滚动，然后呢？
- 到达终点后，波次还在继续，然后呢？
- **没有统一的胜利条件！**

### 问题2：VICTORY状态后卡住？ 🔴
检查 EnemySystem：
```javascript
case 'VICTORY':
  // ❌ 什么都没做！
  break;
```

**如果完成10波**：
- waveState = 'VICTORY'
- 然后...游戏继续？还是结束？
- UI怎么处理？
- 玩家能做什么？

### 问题3：安全屋系统阻塞？ 🔴
SafeHouseSystem：
```javascript
onReachSafeHouse(house) {
  this.scrollSystem.currentSpeed = 0; // 停止卷轴
  this.isInSafeHouse = true;
}

leaveSafeHouse() {
  this.scrollSystem.currentSpeed = normalSpeed;
  this.isInSafeHouse = false;
}
```

**问题**：
- 到达安全屋后，需要按空格离开
- 如果玩家不知道按空格？**游戏卡住！**
- UI有提示吗？

### 问题4：到达终点后没有处理 🔴
ScrollSystem：
```javascript
if (this.distanceTraveled >= this.targetDistance) {
  this.reachedDestination = true;
  this.currentSpeed = 0; // 停止
}
```

**然后呢？**
- 游戏胜利？
- 显示什么UI？
- 玩家能做什么？
- **main.js 有检查这个状态吗？**

### 问题5：游戏胜利/失败逻辑不完整 🔴
main.js 只有：
```javascript
checkGameOver() {
  if (核心被摧毁) {
    this.isGameOver = true;
    this.isPaused = true;
    console.log('GAME OVER');
  }
}
```

**缺少**：
- ❌ 检查胜利条件（完成10波？到达终点？）
- ❌ 显示胜利UI
- ❌ 游戏结束后的选项（重玩？退出？）

---

## 核心流程缺失的部分

### 缺失1：胜利条件判定
游戏不知道什么时候算"赢"：
- 完成10波敌人？
- 到达5000px终点？
- 还是两者都要？

### 缺失2：状态转换逻辑
- VICTORY状态后 → ？
- reachedDestination后 → ？
- 两个都达成后 → ？

### 缺失3：游戏结束UI
- 胜利后显示什么？
- 失败后显示什么？
- 玩家能重玩吗？

### 缺失4：玩家引导
- 到达安全屋后，知道要按空格吗？
- 波次完成后，知道要做什么吗？

---

## 可能的卡死场景

### 场景1：完成10波后
1. waveState = 'VICTORY'
2. 不再生成敌人
3. 但卷轴还在滚动
4. 玩家困惑："然后呢？"
5. **游戏没有结束，也没有新内容**

### 场景2：到达安全屋
1. scrollSystem.currentSpeed = 0
2. isInSafeHouse = true
3. 显示UI："按空格离开"
4. 玩家不知道 → **卡住**

### 场景3：到达终点
1. reachedDestination = true
2. currentSpeed = 0
3. 然后...什么都没发生？
4. **游戏卡住**

---

## 需要检查的代码

1. main.js 的 update() 中是否检查胜利条件？
2. SafeHouseSystem 的UI提示是否清晰？
3. VICTORY状态后的处理？
4. reachedDestination后的处理？
