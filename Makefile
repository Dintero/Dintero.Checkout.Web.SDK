DEPENDENCY_FILES := package.json pnpm-lock.yaml pnpm-workspace.yaml
INSTALLED_MARKER := node_modules/.installed
TARGETS := help dependencies lint test build watch clean publish release bump-version

.PHONY: $(TARGETS)

help:
	@printf '%s\n' $(TARGETS)

dependencies: $(INSTALLED_MARKER)

$(INSTALLED_MARKER): $(DEPENDENCY_FILES)
	corepack enable pnpm 2>/dev/null || command -v pnpm >/dev/null
	pnpm install --frozen-lockfile
	touch $@

lint test build watch: dependencies
	pnpm run $@ $(ARGS)

clean:
	rm -rf dist coverage node_modules

# Release the version in package.json unless tag v<version> already exists.
# Retry-safe: npm publish is skipped if the version is already on npm, so a
# rerun after a failed GitHub release step only creates the missing release.
PACKAGE_NAME = $(shell jq -r .name package.json)
RELEASE_VERSION = $(shell jq -r .version package.json)
RELEASE_TAG = v$(RELEASE_VERSION)
GITHUB_API = https://api.github.com/repos/$(shell jq -r '.repository | if type == "object" then .url else . end' package.json | sed -E 's#^.*github\.com[:/]##; s#\.git$$##')
GH_CURL = curl --silent --show-error --oauth2-bearer "$$GITHUB_TOKEN" \
	-H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28"

publish: build
	npm publish --provenance --access public

release:
	@set -eu; \
	: "$${GITHUB_TOKEN:=$${GH_TOKEN:?GITHUB_TOKEN or GH_TOKEN must be set}}"; \
	status=$$($(GH_CURL) -o /dev/null -w '%{http_code}' "$(GITHUB_API)/git/ref/tags/$(RELEASE_TAG)"); \
	case "$$status" in \
		200) echo "$(RELEASE_TAG) is already released, nothing to do."; exit 0 ;; \
		404) ;; \
		*) echo "Unexpected HTTP $$status when checking for tag $(RELEASE_TAG)" >&2; exit 1 ;; \
	esac; \
	echo "Releasing $(RELEASE_TAG)"; \
	if [ "$$(npm view "$(PACKAGE_NAME)@$(RELEASE_VERSION)" version 2>/dev/null)" = "$(RELEASE_VERSION)" ]; then \
		echo "$(PACKAGE_NAME)@$(RELEASE_VERSION) is already on npm, skipping publish."; \
	else \
		$(MAKE) --no-print-directory publish; \
	fi; \
	jq -n --arg tag "$(RELEASE_TAG)" --arg sha "$$(git rev-parse HEAD)" \
		--argjson pre $(if $(findstring -,$(RELEASE_VERSION)),true,false) \
		'{tag_name: $$tag, target_commitish: $$sha, name: $$tag, prerelease: $$pre, generate_release_notes: true}' \
	| $(GH_CURL) --fail-with-body -X POST "$(GITHUB_API)/releases" -d @- \
	| jq -r '"Created release: \(.html_url)"'

# Usage: make bump-version [BUMP=patch|minor|major]
BUMP ?= patch
bump-version: dependencies
	pnpm version $(BUMP) --no-git-tag-version --no-git-checks
