#!/bin/bash
# Remove duplicate _2 podspecs that cause conflicts
cd "$(dirname "$0")/.." || exit

# Clean node_modules duplicates
find node_modules -name "* 2.podspec" -type f -delete
find node_modules -name "* 2.swift" -type f -delete
find node_modules -name "* 2.js" -type f -delete
find node_modules -name "* 2.ts" -type f -delete
find node_modules -name "* 2.d.ts" -type f -delete

# Clean Pods directory duplicates (if it exists)
if [ -d "ios/Pods" ]; then
  find ios/Pods -name "* 2.h" -type f -delete
  find ios/Pods -name "* 2.podspec" -type f -delete
  find ios/Pods -name "* 2.podspec.json" -type f -delete
fi
