#!/usr/bin/env bash
# append to the latest release notes
#  update_release.sh "text to append"
set -euo pipefail

latest_tag=$(gh release list --json 'isLatest,tagName' --jq '.[] | select(.isLatest == true) | .tagName')
current_body=$(gh release view "$latest_tag" --json body --jq '.body')
amended_body="$current_body<br /><br />$1"

echo "$amended_body" | gh release edit "$latest_tag" --notes-file -
