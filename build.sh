#!/usr/bin/env bash
set -e

app=wakatime-sync
VERSION=$(hatch version)

echo "Version check passed: $VERSION"
echo "Building ${app}:${VERSION}"

docker build \
  --build-arg VERSION="$VERSION" \
  -t "${app}:${VERSION}" \
  -t "${app}:latest" \
  .
