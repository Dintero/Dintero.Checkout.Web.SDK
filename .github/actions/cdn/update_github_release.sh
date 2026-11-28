#!/usr/bin/env bash
# append a "Use from CDN" snippet to the release notes of a tag
#  update_github_release.sh <url> <sha384-hash> <tag>
set -euo pipefail

URL=$1
HASH=$2
TAG=$3

USE_FROM_CDN_EXAMPLE="\n\n### Use from CDN \n
\`\`\`html
<script
  src=\"${URL}\"
  integrity=\"sha384-${HASH}\"
  crossorigin=\"anonymous\">
</script>
\`\`\`
"
echo "$USE_FROM_CDN_EXAMPLE"

current_body=$(gh release view "$TAG" --json body --jq '.body')
amended_body="$current_body$USE_FROM_CDN_EXAMPLE"

echo -e "$amended_body" | gh release edit "$TAG" --notes-file -
