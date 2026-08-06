#!/usr/bin/env bash
# Build a standalone MarkItDown binary for the current platform using PyInstaller.
# Output: resources/markitdown-bin/<mac|win|linux>/markitdown(.exe)
#
# Requirements on the host: Python 3.10+ and pip available.
# Run once per target platform (PyInstaller does not cross-compile).

set -euo pipefail

cd "$(dirname "$0")/.."
PROJECT_ROOT="$(pwd)"

case "$(uname -s)" in
    Darwin*) OS_DIR="mac" ; BIN_NAME="markitdown" ;;
    Linux*)  OS_DIR="linux" ; BIN_NAME="markitdown" ;;
    MINGW*|MSYS*|CYGWIN*) OS_DIR="win" ; BIN_NAME="markitdown.exe" ;;
    *) echo "Unsupported platform: $(uname -s)" >&2 ; exit 1 ;;
esac

OUT_DIR="$PROJECT_ROOT/resources/markitdown-bin/$OS_DIR"
BUILD_DIR="$PROJECT_ROOT/build/markitdown-bin"
VENV_DIR="$BUILD_DIR/venv"

echo "==> Building MarkItDown binary for $OS_DIR"
echo "    output: $OUT_DIR/$BIN_NAME"

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR" "$OUT_DIR"

python3 -m venv "$VENV_DIR"
# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate" 2>/dev/null || source "$VENV_DIR/Scripts/activate"

pip install --upgrade pip wheel
pip install 'markitdown[all]' pyinstaller

cat > "$BUILD_DIR/entry.py" <<'PY'
from markitdown.__main__ import main
if __name__ == "__main__":
    main()
PY

pyinstaller \
    --onefile \
    --name markitdown \
    --distpath "$OUT_DIR" \
    --workpath "$BUILD_DIR/work" \
    --specpath "$BUILD_DIR" \
    --noconfirm \
    "$BUILD_DIR/entry.py"

if [[ "$OS_DIR" != "win" && -f "$OUT_DIR/markitdown" ]]; then
    chmod +x "$OUT_DIR/markitdown"
fi

echo "==> Done: $OUT_DIR/$BIN_NAME"
