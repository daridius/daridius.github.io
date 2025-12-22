#!/bin/bash

# Configuration
REPO_URL="git@github.com:daridius/daridius.github.io.git"
BUILD_DIR="dist"
BRANCH="gh-pages"

echo "🚀 Starting deployment to GitHub Pages..."

# 0. Ensure deps are installed
echo "📦 Installing dependencies..."
pnpm install

# 1. Build the project
echo "📦 Building project..."
pnpm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Aborting."
    exit 1
fi

# 2. Navigate to build directory
cd $BUILD_DIR

# 3. Initialize git in the build directory
echo "🔧 Preparing build for upload..."
git init -b master
git add .
git commit -m "Deploy to GitHub Pages: $(date)"

# 4. Force push to the target branch
echo "📤 Pushing to $REPO_URL ($BRANCH)..."
git push -f $REPO_URL master:$BRANCH


# 5. Cleanup
echo "🧹 Cleaning up..."
cd ..

echo "✅ Deployment complete! Your site will be live at https://daridius.github.io (after GitHub finishes processing)."
