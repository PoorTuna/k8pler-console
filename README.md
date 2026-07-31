<p align="center">
  <img src="charts/k8pler-console/files/logo.png" alt="k8pler-console" width="360">
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: Apache-2.0" src="https://img.shields.io/badge/license-Apache--2.0-blue.svg"></a>
  <a href="https://kubernetes.io"><img alt="Kubernetes 1.24+" src="https://img.shields.io/badge/kubernetes-1.24%2B-326ce5.svg?logo=kubernetes&logoColor=white"></a>
  <a href="charts/k8pler-console"><img alt="Helm chart" src="https://img.shields.io/badge/helm-chart-0F1689.svg?logo=helm&logoColor=white"></a>
</p>

A web console for plain Kubernetes clusters, forked from the [OpenShift
Console](https://github.com/openshift/console) (`release-4.16`, the "Bridge"
codebase) and stripped of everything that only makes sense on OpenShift.

Where the upstream project assumes an OpenShift OAuth server, Projects,
Routes, ImageStreams, BuildConfigs, DeploymentConfigs, and OLM/OperatorHub,
this fork runs against a stock, unmodified Kubernetes API server and
authenticates through OIDC — Dex, Keycloak, or any other OIDC-compliant
identity provider. The upstream console architecture is otherwise untouched:
a Go backend ("the bridge") that proxies the Kubernetes API and serves the
frontend, plus a React/TypeScript single-page app. See
[`NOTICE.md`](NOTICE.md) for exactly which upstream commit this was forked
from and the license.

![k8pler-console](docs/screenshot.png)

## What's different from upstream

| Removed | Why |
|---|---|
| OLM / OperatorHub and every OLM-dependent operator plugin (GitOps, Insights, Knative, KubeVirt, Local Storage, Metal3, Pipelines, RHOAS, Service Binding, Shipwright, vSphere, Web Terminal, container security scanning) | OLM is an OpenShift-ecosystem package manager; none of these have a vanilla-Kubernetes equivalent, and they're unreachable without OLM installed anyway |
| The Developer perspective (`dev-console`, `@console/topology`, `helm-plugin`, `git-service`) | Built around OpenShift's S2I build pipeline and `DeploymentConfig` rollout model, which don't exist on plain Kubernetes |
| OAuth Users/Groups/Identities admin pages | Identity is now the OIDC provider's job |
| BuildConfigs, Builds, ImageStreams, Templates, Routes, Projects (as a first-class concept) | OpenShift-only APIs. Namespaces and Ingress are the direct Kubernetes equivalents and are what the console now defaults to |

| Kept / added | Notes |
|---|---|
| OIDC authentication (`--user-auth=oidc`) | The bridge already supported this upstream — no backend code changes were needed, only configuration. See [`docs/RUNNING-ON-KUBERNETES.md`](docs/RUNNING-ON-KUBERNETES.md) |
| Namespaces, Ingress, native RBAC, workloads, storage, CRDs | All standard Kubernetes-native views, unaffected |
| "Edit resource limits" modal | Ported out of the deleted `dev-console` package locally, since it's a generic Kubernetes feature worth keeping |
| A [Helm chart](charts/k8pler-console) | Not present upstream; ships with a bundled Dex for quick starts |

## Quick start

Helm chart:

```bash
helm install k8pler-console ./charts/k8pler-console \
  -f charts/k8pler-console/examples/minimal-values.yaml
kubectl port-forward svc/k8pler-console 9000:80
open http://localhost:9000
```

Full example values (bundled-Dex quick start, production with an external
OIDC provider and TLS ingress) and configuration reference:
[`charts/k8pler-console/README.md`](charts/k8pler-console/README.md).

Plain manifests instead of Helm: [`deploy/`](deploy/README.md) — a
hand-written Dex + console + RBAC set, `kubectl apply -f` directly.

## Architecture

- **Backend ("the bridge")** — Go 1.21+, in `cmd/bridge` and `pkg/`. Proxies
  the Kubernetes API under `/api/kubernetes`, serves the compiled frontend,
  and handles authentication. Entirely configuration-driven — see
  [`docs/RUNNING-ON-KUBERNETES.md`](docs/RUNNING-ON-KUBERNETES.md) for the
  flags that matter on plain Kubernetes.
- **Frontend** — React + TypeScript, in `frontend/`. Built with Yarn Berry
  and webpack; the compiled output is what the bridge serves as static
  assets. The active packages after the OpenShift-only strip-down are:
  - [`console-app`](frontend/packages/console-app) — the Administrator
    perspective: navigation, workloads, RBAC, storage, and the rest of the
    core admin UI
  - [`console-shared`](frontend/packages/console-shared) — components and
    hooks shared across the app
  - [`console-dynamic-plugin-sdk`](frontend/packages/console-dynamic-plugin-sdk)
    [[API]](frontend/packages/console-dynamic-plugin-sdk/docs/api.md)
    [[Console Extensions]](frontend/packages/console-dynamic-plugin-sdk/docs/console-extensions.md)
    — the extension/plugin API the rest of the app is built on
  - [`console-plugin-sdk`](frontend/packages/console-plugin-sdk),
    [`console-plugin-shared`](frontend/packages/console-plugin-shared) —
    plugin build tooling
  - [`console-telemetry-plugin`](frontend/packages/console-telemetry-plugin)
  - [`patternfly`](frontend/packages/patternfly) — PatternFly theming glue
  - [`console-demo-plugin`](frontend/packages/console-demo-plugin) — example
    dynamic plugin, dev/reference only
  - [`eslint-plugin-console`](frontend/packages/eslint-plugin-console),
    [`integration-tests-cypress`](frontend/packages/integration-tests-cypress)
    — tooling, not shipped in the built app

## Building from source

### Dependencies

- [Go](https://golang.org/) 1.21+
- [Node.js](https://nodejs.org/) 22+ with [corepack](https://npmjs.com/package/corepack) enabled (for Yarn Berry)
- `kubectl` and a Kubernetes cluster to point it at
- Docker, if you want to build the container image rather than run the
  binaries directly (recommended on Windows/macOS — the shell scripts below
  assume a POSIX environment)

### Build everything

```bash
./build.sh
```

This runs `build-backend.sh` (outputs `bin/bridge`) and `build-frontend.sh`
(outputs `frontend/public/dist`), or build the container image directly:

```bash
docker build -t k8pler-console:latest .
```

### Run against a cluster

```bash
export KUBECONFIG=/path/to/kubeconfig
./bin/bridge \
  -k8s-mode off-cluster \
  -k8s-mode-off-cluster-endpoint https://<api-server-host>:6443 \
  -user-auth oidc \
  -user-auth-oidc-issuer-url https://<your-oidc-issuer> \
  -user-auth-oidc-client-id console \
  -user-auth-oidc-client-secret <client-secret> \
  -user-settings-location localstorage \
  -base-address http://localhost:9000
```

Runs at [localhost:9000](http://localhost:9000). Full flag reference,
including the `disabled`-auth path for local dev with no OIDC provider, is
in [`docs/RUNNING-ON-KUBERNETES.md`](docs/RUNNING-ON-KUBERNETES.md).

### Frontend interactive development

```bash
cd frontend
yarn install       # once, and whenever dependencies change
yarn run dev        # watches and recompiles on change
```

Set `HOT_RELOAD=false` to disable hot reloading. If changes stop being
picked up, raise `fs.inotify.max_user_watches` — see the
[webpack docs](https://webpack.js.org/configuration/watch/#not-enough-watchers).

## Testing

```bash
./test.sh              # everything
./test-backend.sh       # Go tests only
./test-frontend.sh      # Jest tests only
```

Cypress integration tests live in
[`frontend/packages/integration-tests-cypress`](frontend/packages/integration-tests-cypress/README.md):

```bash
cd frontend
yarn run cypress install
yarn run test-cypress-console
```

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for workflow conventions and
[`STYLEGUIDE.md`](STYLEGUIDE.md) for code style. Both predate this fork and
are still accurate for day-to-day frontend/backend development; they don't
cover anything OpenShift-specific.

Dependency versions should be pinned exactly (no `^` ranges). When updating
backend dependencies: edit `go.mod`, run `go mod tidy && go mod vendor`,
and commit the `vendor/` change separately from the code change it supports.
When updating frontend dependencies: `yarn add <package@version>` or
`yarn up <package@version>` from `frontend/`.

## Internationalization

See [`INTERNATIONALIZATION.md`](INTERNATIONALIZATION.md).

## License

Apache License 2.0, inherited from upstream. See [`LICENSE`](LICENSE) and
[`NOTICE.md`](NOTICE.md) for provenance.
