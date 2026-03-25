.PHONY: install compile test node deploy seed demo abi web

install:
	pnpm install

compile:
	pnpm compile

test:
	pnpm test

node:
	pnpm node

deploy:
	pnpm deploy:local

seed:
	pnpm seed:local

demo:
	pnpm demo:local

abi:
	pnpm abi:sync

web:
	pnpm web:dev
