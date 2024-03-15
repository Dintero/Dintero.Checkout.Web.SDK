#!/usr/bin/env bash
# append to the latest release notes
#  update_release.sh "text to append"
set -euo pipefail

URL=$1
HASH=$2

USE_FROM_CDN_EXAMPLE="\n\n### Use from CDN \n
\`\`\`html
<script
  src=\"${URL}\"
  integrity=\"sha-384-${HASH}\"
  crossorigin=\"anonymous\">
</script>
\`\`\`
"
echo "$USE_FROM_CDN_EXAMPLE"

latest_tag=$(gh release list --json 'isLatest,tagName' --jq '.[] | select(.isLatest == true) | .tagName')
current_body=$(gh release view "$latest_tag" --json body --jq '.body')
amended_body="$current_body$USE_FROM_CDN_EXAMPLE"

echo -e "$amended_body" | gh release edit "$latest_tag" --notes-file -
