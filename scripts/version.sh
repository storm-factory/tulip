#!/bin/bash
set -e

# Get the version type (patch, minor, major)
VERSION_TYPE=$1
if [ -z "$VERSION_TYPE" ]; then
  echo "Usage: npm run release -- patch|minor|major"
  exit 1
fi

# Bump package.json without git
npm version $VERSION_TYPE --no-git-tag-version
VERSION=$(node -p "require('./package.json').version")
# Generate changelog and stage it
npm run changelog

# Update changelog.html
git cliff --unreleased --tag "v$VERSION" |pandoc  -f markdown-auto_identifiers -t html > /tmp/tulip.html
sed -i -n '/<h2/,$p' /tmp/tulip.html
sed -i '0,/<h2/s//___PLACEHOLDER___\n<h2/' changelog.html
sed -i '/___PLACEHOLDER___/{r /tmp/tulip.html
d;}' changelog.html
read -p "Check changelog.html and press any key to continue"

# Commit (amend if needed) and tag
git add CHANGELOG.md package.json package-lock.json changelog.html
git commit -m "chore: release v$(node -p "require('./package.json').version")" || git commit --amend --no-edit

git tag -a "v$VERSION" -m "Release v$VERSION" --force

echo "Released $VERSION with updated changelog"