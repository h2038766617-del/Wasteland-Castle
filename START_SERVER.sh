#!/bin/bash

echo "==================================="
echo "  光标指挥官 - 游戏服务器启动"
echo "==================================="
echo ""
echo "正在启动本地服务器..."
echo ""

# 检查 Python 3
if command -v python3 &> /dev/null; then
    echo "使用 Python 3 启动服务器（端口 8000）"
    echo ""
    echo "请在浏览器访问: http://localhost:8000"
    echo ""
    echo "按 Ctrl+C 可停止服务器"
    echo ""
    python3 -m http.server 8000
    exit 0
fi

# 检查 Python
if command -v python &> /dev/null; then
    echo "使用 Python 启动服务器（端口 8000）"
    echo ""
    echo "请在浏览器访问: http://localhost:8000"
    echo ""
    echo "按 Ctrl+C 可停止服务器"
    echo ""
    python -m http.server 8000
    exit 0
fi

# 如果没有 Python
echo "错误: 未找到 Python！"
echo ""
echo "请安装 Python 或使用其他方式启动服务器："
echo "1. 安装 Python: https://www.python.org/downloads/"
echo "2. 使用 VS Code Live Server 扩展"
echo "3. 使用 Node.js: npx http-server"
echo ""
