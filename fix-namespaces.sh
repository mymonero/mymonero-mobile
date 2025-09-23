#!/bin/bash

# Script to fix missing namespaces in Android build files
echo "🔧 Fixing Android namespaces..."

# Fix capacitor.build.gradle
if ! grep -q "namespace 'com.mymonero.app'" android/app/capacitor.build.gradle; then
    echo "Adding namespace to capacitor.build.gradle..."
    sed -i '' 's/android {/android {\n  namespace '\''com.mymonero.app'\''/' android/app/capacitor.build.gradle
fi

# Fix capacitor-cordova-android-plugins/build.gradle
if ! grep -q "namespace 'capacitor.android.plugins'" android/capacitor-cordova-android-plugins/build.gradle; then
    echo "Adding namespace to capacitor-cordova-android-plugins/build.gradle..."
    sed -i '' 's/android {/android {\n    namespace '\''capacitor.android.plugins'\''/' android/capacitor-cordova-android-plugins/build.gradle
fi

echo "✅ Namespaces fixed!"
echo "Run: chmod +x fix-namespaces.sh && ./fix-namespaces.sh"
