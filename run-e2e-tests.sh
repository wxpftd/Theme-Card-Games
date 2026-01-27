#!/bin/bash

# E2E 测试运行脚本
# 设置 Java 环境变量以确保 Maestro 能找到 Java

export JAVA_HOME=/opt/homebrew/opt/openjdk
export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"

echo "🚀 运行 P0 E2E 测试..."
echo "Java 版本: $(/opt/homebrew/opt/openjdk/bin/java -version 2>&1 | head -1)"
echo ""

# 运行测试
if [ "$1" = "all" ]; then
    echo "运行所有 P0 测试..."
    maestro test .maestro/flows/09-*.yaml .maestro/flows/10-*.yaml .maestro/flows/11-*.yaml .maestro/flows/12-*.yaml
elif [ "$1" = "stat" ]; then
    echo "运行属性变化验证测试..."
    maestro test .maestro/flows/09-stat-change-validation.yaml
elif [ "$1" = "combo" ]; then
    echo "运行 Combo 效果验证测试..."
    maestro test .maestro/flows/10-combo-effect-validation.yaml
elif [ "$1" = "status" ]; then
    echo "运行状态效果系统测试..."
    maestro test .maestro/flows/11-status-effect-validation.yaml
elif [ "$1" = "flow" ]; then
    echo "运行完整游戏流程测试..."
    maestro test .maestro/flows/12-full-game-flow.yaml
else
    echo "用法: ./run-e2e-tests.sh [all|stat|combo|status|flow]"
    echo ""
    echo "参数:"
    echo "  all    - 运行所有 P0 测试"
    echo "  stat   - 运行属性变化验证测试"
    echo "  combo  - 运行 Combo 效果验证测试"
    echo "  status - 运行状态效果系统测试"
    echo "  flow   - 运行完整游戏流程测试"
    echo ""
    echo "不带参数显示此帮助信息"
fi