#!/bin/zsh
# Publish the current Small Nukem build to the Tailscale Funnel test site.
# Copies the build file as index.html (atomic: tmp + mv) so testers never
# catch a half-copied file. Call after each new gate lands.
set -e
SRC="$HOME/small-nukem/small-nukem.html"
DST="$HOME/small-nukem-publish/index.html"
cp "$SRC" "$DST.tmp"
mv "$DST.tmp" "$DST"
echo "published $(stat -f%z "$DST") bytes at $(date)"
