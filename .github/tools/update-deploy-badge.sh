#!/usr/bin/env bash
set -euo pipefail

NAME="$1"
LABEL="$2"
STATUS="$3"
VERSION="${4:-}"
BRANCH="badges"
JSON_FILE="$NAME.json"
SVG_FILE="$NAME.svg"
LABEL_COLOR="#24292e"

case "$STATUS" in
  success) color="#2ea44f" ;;
  failure) color="#cf222e" ;;
  *)
    echo "::warning::Unknown status '$STATUS', expected success or failure" >&2
    exit 1
    ;;
esac

current_badge() {
  local content
  if content=$(gh api "repos/$REPOSITORY/contents/$JSON_FILE?ref=$BRANCH" --jq .content 2>/dev/null); then
    base64 -d <<<"$content"
  fi
}

is_svg() {
  [[ "$1" == "<svg "* ]] \
    && python3 -I -c 'import sys, xml.etree.ElementTree as ET; ET.fromstring(sys.stdin.read())' <<<"$1" 2>/dev/null
}

render_svg() {
  local svg="" attempt image position logo inlined
  for attempt in {1..3}; do
    if svg=$(curl --fail --silent --show-error --max-time 30 --get "https://img.shields.io/static/v1" \
        --data-urlencode "label=$LABEL" --data-urlencode "message=$message" --data-urlencode "color=$color" \
        --data-urlencode "labelColor=$LABEL_COLOR" --data-urlencode "logo=github"); then
      break
    fi
    svg=""
    sleep $((attempt * 2))
  done
  is_svg "$svg" || return 1

  if image=$(grep -o '<image [^>]*href="data:image/svg+xml;base64,[^"]*"[^>]*/>' <<<"$svg") \
    && position=$(grep -o 'x="[^"]*" y="[^"]*" width="[^"]*" height="[^"]*"' <<<"$image") \
    && logo=$(grep -o 'base64,[^"]*' <<<"$image" | cut -d, -f2 | base64 -d) \
    && [[ "$logo" == "<svg "* ]]; then
    inlined=${svg/"$image"/"<svg $position ${logo#<svg }"}
    if is_svg "$inlined"; then
      svg=$inlined
    fi
  fi
  printf '%s\n' "$svg"
}

ensure_branch() {
  if gh api "repos/$REPOSITORY/git/ref/heads/$BRANCH" --silent 2>/dev/null; then
    return
  fi

  local tree commit
  tree=$(jq -n '{tree: [{path: "README.md", mode: "100644", type: "blob",
      content: "Deploy badges for the README, written by .github/workflows/workflow-update-deploy-badge.yml.\n"}]}' \
    | gh api "repos/$REPOSITORY/git/trees" --input - --jq .sha)
  commit=$(jq -n --arg tree "$tree" '{message: "Create badges branch", tree: $tree, parents: []}' \
    | gh api "repos/$REPOSITORY/git/commits" --input - --jq .sha)
  jq -n --arg ref "refs/heads/$BRANCH" --arg sha "$commit" '{ref: $ref, sha: $sha}' \
    | gh api "repos/$REPOSITORY/git/refs" --input - --silent \
    || gh api "repos/$REPOSITORY/git/ref/heads/$BRANCH" --silent
}

write_file() {
  local path=$1 content=$2 message=$3 attempt sha
  for attempt in {1..5}; do
    if ! sha=$(gh api "repos/$REPOSITORY/contents/$path?ref=$BRANCH" --jq .sha 2>/dev/null); then
      sha=""
    fi
    if jq -n --arg message "$message" --arg content "$(base64 <<<"$content" | tr -d '\n')" \
        --arg branch "$BRANCH" --arg sha "$sha" \
        '{message: $message, content: $content, branch: $branch} + (if $sha == "" then {} else {sha: $sha} end)' \
      | gh api -X PUT "repos/$REPOSITORY/contents/$path" --input - --silent; then
      return
    fi
    echo "Writing $path failed (attempt $attempt), retrying"
    sleep $((attempt * 2))
  done
  echo "::warning::Could not write $path to the $BRANCH branch" >&2
  return 1
}

if [[ -n "$VERSION" ]]; then
  message="v${VERSION#v}"
else
  message=$(current_badge | jq -r '.message // empty')
  if [[ -z "$message" ]]; then
    echo "No version given and $JSON_FILE has none yet, leaving the badge unwritten"
    exit 0
  fi
fi

json=$(jq -n --arg label "$LABEL" --arg message "$message" --arg color "$color" --arg labelColor "$LABEL_COLOR" \
  '{schemaVersion: 1, label: $label, message: $message, color: $color, labelColor: $labelColor, namedLogo: "github"}')
echo "$JSON_FILE: $json"

if ! svg=$(render_svg); then
  echo "::warning::Could not draw $SVG_FILE with shields.io, the badge keeps its previous image" >&2
  svg=""
fi

if [[ "${DRY_RUN:-0}" == "1" ]]; then
  if [[ -n "$svg" ]]; then
    printf '%s\n' "$svg" >"$SVG_FILE"
    echo "Saved $SVG_FILE"
  fi
  exit 0
fi

ensure_branch
write_file "$JSON_FILE" "$json" "$LABEL: $message ($STATUS)"
if [[ -n "$svg" ]]; then
  write_file "$SVG_FILE" "$svg" "$LABEL: $message ($STATUS)"
fi
