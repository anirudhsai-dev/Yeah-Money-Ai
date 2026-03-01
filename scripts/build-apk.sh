#!/usr/bin/env bash
set -euo pipefail

BUILD_TYPE="${1:-debug}"

if [[ "$BUILD_TYPE" != "debug" && "$BUILD_TYPE" != "release" ]]; then
  echo "Usage: $0 [debug|release]" >&2
  exit 1
fi

has_android_gradle_project() {
  [[ -f android/settings.gradle || -f android/settings.gradle.kts || -f android/settings.gradle.dcl ]] || return 1
  [[ -f android/build.gradle || -f android/build.gradle.kts || -f android/build.gradle.dcl ]] || return 1
  return 0
}

if ! has_android_gradle_project; then
  echo "android Gradle project missing or incomplete. Running prebuild first..."
  rm -rf android
  CI=1 npx expo prebuild --platform android --non-interactive
fi

GRADLE_TASK="assembleDebug"
if [[ "$BUILD_TYPE" == "release" ]]; then
  GRADLE_TASK="assembleRelease"
fi

DEFAULT_JAVA_HOME="/root/.local/share/mise/installs/java/21.0.2"
if [[ -n "${YM_JAVA_HOME:-}" ]]; then
  export JAVA_HOME="$YM_JAVA_HOME"
elif [[ -d "$DEFAULT_JAVA_HOME" ]]; then
  export JAVA_HOME="$DEFAULT_JAVA_HOME"
fi

if [[ -n "${JAVA_HOME:-}" ]]; then
  export PATH="$JAVA_HOME/bin:$PATH"
fi

if [[ -x android/gradlew ]]; then
  (cd android && ./gradlew "$GRADLE_TASK" --no-daemon)
else
  (cd android && gradle "$GRADLE_TASK" --no-daemon)
fi

APK_PATH="android/app/build/outputs/apk/${BUILD_TYPE}/app-${BUILD_TYPE}.apk"
if [[ -f "$APK_PATH" ]]; then
  echo "Built APK: $APK_PATH"
else
  echo "Gradle finished but APK not found at expected path: $APK_PATH" >&2
fi
