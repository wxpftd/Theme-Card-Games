#!/bin/bash
set -e

# E2E 测试初始化脚本
# 用途：自动化 Metro 缓存清理、服务器重启、模拟器检查

SIMULATOR_ID="${SIMULATOR_ID:-C9E7BBD5-0995-41AD-859E-670A4D94C96E}"
APP_BUNDLE_ID="com.themecardgames.bigtechworker"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== E2E Test Setup ==="
echo "Project root: $PROJECT_ROOT"

# 1. 清理 Metro 缓存
echo ""
echo "[1/6] Cleaning Metro cache..."
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf "$TMPDIR/metro-"* 2>/dev/null || true
rm -rf "$PROJECT_ROOT/node_modules/.cache" 2>/dev/null || true
rm -rf "$PROJECT_ROOT/apps/bigtech-worker/.expo" 2>/dev/null || true
echo "  Cache cleared"

# 2. 重新构建依赖包
echo ""
echo "[2/6] Building packages..."
cd "$PROJECT_ROOT"
pnpm --filter @theme-card-games/core build
pnpm --filter @theme-card-games/ui build
echo "  Packages built"

# 3. 检查模拟器状态
echo ""
echo "[3/6] Checking simulator..."
if xcrun simctl list | grep -q "$SIMULATOR_ID.*Booted"; then
    echo "  Simulator already booted"
else
    echo "  Booting simulator..."
    xcrun simctl boot "$SIMULATOR_ID" 2>/dev/null || true
    sleep 10
    echo "  Simulator booted"
fi

# 4. 终止旧的 Metro 进程
echo ""
echo "[4/6] Stopping old processes..."
pkill -f "expo.*start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 2
echo "  Old processes stopped"

# 5. 启动 Metro（后台运行）
echo ""
echo "[5/6] Starting Metro server..."
cd "$PROJECT_ROOT/apps/bigtech-worker"
nohup npx expo start --dev-client --reset-cache > /tmp/metro.log 2>&1 &
METRO_PID=$!
echo "  Metro PID: $METRO_PID"
echo "  Metro log: /tmp/metro.log"

# 6. 等待 Metro 启动
echo ""
echo "[6/6] Waiting for Metro to be ready..."
for i in {1..30}; do
    if curl --noproxy localhost -s "http://localhost:8081/status" 2>/dev/null | grep -q "packager-status:running"; then
        echo "  Metro is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "  Warning: Metro may not be fully ready yet"
    fi
    sleep 2
done

# 等待应用加载
echo ""
echo "Waiting for app bundle to be ready..."
sleep 10

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Run E2E tests: pnpm e2e:run"
echo "  2. View Metro logs: tail -f /tmp/metro.log"
echo "  3. Debug with Maestro Studio: pnpm e2e:studio"
echo ""
