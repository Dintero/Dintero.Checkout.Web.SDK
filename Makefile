DEPENDENCY_FILES := package.json pnpm-lock.yaml pnpm-workspace.yaml
INSTALLED_MARKER := node_modules/.installed
TARGETS := help dependencies lint test build

.PHONY: $(TARGETS)

help:
	@printf '%s\n' $(TARGETS)

dependencies: $(INSTALLED_MARKER)

$(INSTALLED_MARKER): $(DEPENDENCY_FILES)
	pnpm install
	touch $@

lint test build: dependencies
	pnpm run $@ $(ARGS)
