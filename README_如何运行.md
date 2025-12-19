# 光标指挥官 - 运行说明

## 🚨 重要：必须通过 HTTP 服务器运行

由于游戏使用了 ES6 模块，**不能直接双击 index.html**，否则会遇到 CORS 错误。

## ✅ 运行方法（推荐）

### 方法 1：使用启动脚本（最简单）

**Windows 用户：**
```
双击 START_SERVER.bat
```

**Mac/Linux 用户：**
```bash
./START_SERVER.sh
```

然后在浏览器访问：`http://localhost:8000`

---

### 方法 2：手动启动 Python 服务器

在项目根目录打开终端/命令提示符，运行：

**Windows:**
```cmd
python -m http.server 8000
```

**Mac/Linux:**
```bash
python3 -m http.server 8000
```

然后在浏览器访问：`http://localhost:8000`

---

### 方法 3：使用 VS Code Live Server

1. 在 VS Code 中安装 "Live Server" 扩展
2. 右键点击 `index.html`
3. 选择 "Open with Live Server"

---

### 方法 4：使用 Node.js

如果已安装 Node.js：

```bash
npx http-server
```

然后在浏览器访问显示的地址（通常是 http://localhost:8080）

---

## 🎮 游戏操作

启动成功后，你应该看到：
- 游戏标题："光标指挥官 - 敌人攻击测试"
- 4x4 的网格系统
- 组件（核心、武器、装甲、增压器）
- 敌人从屏幕边缘生成
- 武器自动开火

### 快捷键：
- `空格` - 暂停/继续
- `D` - 显示/隐藏调试信息
- `R` - 重启游戏（TODO）

---

## ❌ 常见错误

### "Failed to load resource: net::ERR_FAILED"
**原因：** 直接打开了 index.html 文件
**解决：** 使用上述任意方法通过 HTTP 服务器运行

### "CORS policy" 错误
**原因：** 浏览器阻止了 file:// 协议加载模块
**解决：** 使用上述任意方法通过 HTTP 服务器运行

---

## 🔧 技术信息

- **浏览器要求：** Chrome 87+, Firefox 78+, Edge 88+, Safari 14+
- **ES6 模块：** 项目使用现代 JavaScript 模块系统
- **Canvas API：** 支持 devicePixelRatio 的现代浏览器

---

## 📝 版本信息

当前版本：**v0.9** - 敌人攻击与游戏结束

完成功能：
- ✅ Canvas 渲染与游戏循环
- ✅ 无人机光标跟随
- ✅ 4x4 网格系统
- ✅ 组件系统（核心/武器/装甲/增压器）
- ✅ 邻接加成系统
- ✅ 武器自动射击
- ✅ 碰撞检测
- ✅ 敌人 AI 与波次系统
- ✅ 敌人攻击组件
- ✅ 游戏结束条件

---

祝游戏愉快！🎮
