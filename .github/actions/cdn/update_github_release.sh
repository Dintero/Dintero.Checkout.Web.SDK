#!/usr/bin/env bash
# append to the latest release notes
#  update_release.sh "text to append"
set -euo pipefail

URL=$1
HASH=$2

MULTI_LINES_TEXT="## Use from CDN: \n
                  \`\`\`html \n
                  <script \n
                    src=\"${URL}\" \n
                    integrity=\"sha-384-${HASH}\" \n
                    crossorigin=\"anonymous\"> \n
                  </script> \n
                  \`\`\` \n
                  "
echo "$MULTI_LINES_TEXT"

latest_tag=$(gh release list --json 'isLatest,tagName' --jq '.[] | select(.isLatest == true) | .tagName')
current_body=$(gh release view "$latest_tag" --json body --jq '.body')
amended_body="$current_body<br /><br />$MULTI_LINES_TEXT"

echo -e "$amended_body" | gh release edit "$latest_tag" --notes-file -
