# k8pler-console Helm Chart

Deploys [k8pler-console](https://github.com/PoorTuna/k8pler-console) — a
de-OpenShift-ed fork of the OpenShift Console (release-4.16 UI) for plain
Kubernetes clusters — with OIDC authentication.

## What gets deployed

| Resource | Toggle | Default |
|---|---|---|
| Console `Deployment` + `Service` | — | always |
| Console `ServiceAccount` | `serviceAccount.create` | `true` |
| `system:auth-delegator` `ClusterRoleBinding` | `serviceAccount.bindAuthDelegator` | `true` |
| Console `Ingress` | `ingress.enabled` | `false` |
| OIDC client secret `Secret` | `auth.oidc.clientSecret` set and no `auth.oidc.existingSecret` | — |
| Custom logo `ConfigMap` (bundled k8pler mark by default) | `console.customLogo.enabled` | `true` |
| Bundled Dex (`Deployment`, `Service`, config `Secret`, RBAC) | `dex.enabled` | `false` |
| Dex `Ingress` | `dex.ingress.enabled` | `false` |
| Bundled `kube-prometheus-stack` (Prometheus, Alertmanager, Grafana, node-exporter, kube-state-metrics, CRDs) | `monitoring.type=bundled` (+ `monitoring.bundledEnabled=true`) | `false` |
| Metrics tenancy proxy (`Deployment`, `Service`, RBAC — kube-rbac-proxy + prom-label-proxy) | `monitoring.type != disabled` | `false` |
| Compat recording rules `PrometheusRule` | `monitoring.type=bundled` | `false` |

## Prerequisites

- Kubernetes >= 1.24
- Helm >= 3.10
- An OIDC provider (bundled Dex, or your own — Keycloak, Okta, upstream OIDC...)
  unless running with `auth.type=disabled` for local dev
- To get real per-user RBAC (not just login), the cluster's **kube-apiserver**
  must independently trust the same OIDC issuer (`--oidc-issuer-url`,
  `--oidc-client-id`, `--oidc-username-claim`). This is a cluster-admin
  change outside any namespace and outside what this chart can do — see the
  NOTES printed after `helm install`.

## Quick start

```bash
# Fastest: no OIDC, no ingress, single bearer token (local dev only)
helm install k8pler-console ./charts/k8pler-console \
  -f charts/k8pler-console/examples/minimal-values.yaml

# Full OIDC login flow via bundled Dex
helm install k8pler-console ./charts/k8pler-console \
  -f charts/k8pler-console/examples/dex-quickstart-values.yaml \
  -n k8pler-console --create-namespace

# Production: external OIDC, TLS ingress, resource limits
helm install k8pler-console ./charts/k8pler-console \
  -f charts/k8pler-console/examples/production-values.yaml \
  -n k8pler-console --create-namespace
```

## Examples

| File | Description |
|---|---|
| [`minimal-values.yaml`](examples/minimal-values.yaml) | `auth.type=disabled`, no ingress — quickest local smoke test |
| [`dex-quickstart-values.yaml`](examples/dex-quickstart-values.yaml) | Bundled Dex with one static demo user, ingress for both |
| [`production-values.yaml`](examples/production-values.yaml) | External OIDC, TLS ingress, resource limits, anti-affinity |
| [`monitoring-quickstart-values.yaml`](examples/monitoring-quickstart-values.yaml) | Bundled kube-prometheus-stack, sized for a single-node cluster |

## Helm tests

```bash
helm test k8pler-console -n k8pler-console
```

Runs `wget --spider` against the console's (and, if `dex.enabled`, Dex's)
health/discovery endpoints.

## Configuration

All parameters are documented inline in [`values.yaml`](values.yaml). Key ones:

### Console

| Parameter | Description | Default |
|---|---|---|
| `console.branding` | Masthead branding (`okd`, `openshift`, `ocp`, ...) | `okd` |
| `console.customProductName` | Overrides the branded product name | `k8pler` |
| `console.customLogo.enabled` | Replace the masthead logo. `false` falls back to the stock `console.branding` mark | `true` |
| `console.customLogo.data` | Base64-encoded logo override; empty uses the bundled `files/logo.png` | — |
| `console.userSettingsLocation` | `localstorage` avoids needing a ConfigMap in the `openshift-console-user-settings` namespace, which doesn't exist on plain k8s | `localstorage` |
| `console.baseAddress` | Public URL; auto-derived from `ingress.host` when unset | — |
| `console.plugins` | Map of dynamic-plugin `name: endpoint` | `{}` |

### Auth

| Parameter | Description | Default |
|---|---|---|
| `auth.type` | `oidc` or `disabled` (`openshift` from upstream is not supported by this fork) | `oidc` |
| `auth.oidc.issuerUrl` | External OIDC issuer. When `dex.enabled=true`, the console always uses Dex's own issuer instead — leave this unset, or set it to match `dex.issuerUrl` exactly (a mismatch fails validation) | — |
| `auth.oidc.clientSecret` / `auth.oidc.existingSecret` | Exactly one must be set when `auth.type=oidc` | — |
| `auth.disabled.staticBearerToken` | DEV ONLY — every request runs as this token | — |

### Bundled Dex (`dex.*`)

Meant for quick starts and demos. For production, run Dex (or any other OIDC
provider) yourself and point `auth.oidc.issuerUrl` at it instead of setting
`dex.enabled`.

| Parameter | Description | Default |
|---|---|---|
| `dex.enabled` | Deploy a bundled Dex instance | `false` |
| `dex.staticClients` | Dex OIDC clients. Auto-generates one matching `auth.oidc.*` when left empty | `[]` |
| `dex.staticPasswords` | Dev-only bcrypt password list. Use `dex.connectors` for anything real | `[]` |
| `dex.connectors` | Raw [Dex connector](https://dexidp.io/docs/connectors/) config (LDAP, GitHub, SAML, upstream OIDC...) | `[]` |

### Monitoring (`monitoring.*`)

Wires the Nodes list's CPU/Memory/Filesystem/Pods columns, the cluster/project
Utilization dashboards, and the Observe pages to a real Prometheus. Three
mutually exclusive modes, `disabled` by default (those pages render an empty
"not available" state, no crashes):

| `monitoring.type` | What it does |
|---|---|
| `disabled` | Default. No metrics wiring; Observe/Utilization pages stay empty. |
| `bundled` | Deploys `kube-prometheus-stack` (Prometheus, Alertmanager, Grafana, node-exporter, kube-state-metrics) as a real Helm dependency. Also requires `monitoring.bundledEnabled=true` — Helm's dependency `condition` can only read a plain boolean, so this second flag is what actually gates the subchart; `helm template`/`install` fails loudly if the two disagree. Run `helm dependency update` after enabling. |
| `external` | Points at a Prometheus/Alertmanager you already run. Set `monitoring.external.prometheusHost` (required) / `.prometheusScheme` / `.alertmanagerHost` / `.alertmanagerScheme` — all in-cluster `host:port` form, e.g. `prometheus-operated.monitoring.svc:9090`. |

**Tenancy enforcement.** Whenever `monitoring.type != disabled`, the chart
also deploys a small proxy (`kube-rbac-proxy` + `prom-label-proxy`, the same
pair OpenShift's `thanos-querier` uses) in front of the effective Prometheus,
and routes the console's namespace-scoped queries through it instead of
straight to Prometheus. For every request, it checks — via
`SubjectAccessReview` — that the caller can `get` the `namespaces` resource
named in the request's `namespace=` query param (the same check a `view`
RoleBinding in that namespace already satisfies), then injects that
namespace as a real PromQL label matcher before forwarding upstream. Without
this, anyone who can log in would see cluster-wide metrics through the
"per-namespace" API paths too.

This enforcement covers **Prometheus only**. Alertmanager's tenancy path
(`monitoring.external.alertmanagerHost`, or the bundled Alertmanager) is a
plain host mapping with no equivalent proxy in front of it — Alertmanager's
API doesn't support the same label-injection trick. Accepted gap, not a bug.

**Known gap on k3s:** the Nodes list's request/limit columns come from
`kube_pod_resource_request`/`kube_pod_resource_limit`, which need the
kube-scheduler's `/metrics/resources` endpoint scraped. k3s's embedded
scheduler may not expose this reliably — those two columns can stay blank
even with `monitoring.type=bundled`, independent of everything else working.

**Missing recording rules.** A few metrics the console frontend queries are
OpenShift `cluster-monitoring-operator` additions that vanilla
`kube-prometheus-stack` doesn't ship. When `monitoring.type=bundled`, this
chart bundles a `PrometheusRule` re-deriving vanilla-Prometheus equivalents
(`templates/monitoring-recording-rules.yaml`) — for `monitoring.type=external`,
add the same `expr`s to your own Prometheus's rule files (see that template
for the full list).

### Networking / platform

| Parameter | Description | Default |
|---|---|---|
| `ingress.enabled` / `ingress.host` / `ingress.tls.enabled` | Console Ingress | `false` |
| `tls.enabled` / `tls.existingSecret` | Serve HTTPS directly from the bridge instead of/in addition to Ingress TLS | `false` |
| `serviceAccount.bindAuthDelegator` | Grants `system:auth-delegator` — required, the bridge always validates bearer tokens via TokenReview | `true` |
| `resources`, `nodeSelector`, `tolerations`, `affinity` | Standard pod scheduling knobs | `{}` |
| `extraArgs` | Raw bridge CLI flags appended verbatim, for anything not modeled above | `[]` |

## What's intentionally not here

- No OLM/OperatorHub — dropped from this fork entirely.
- No OpenShift `Route` — pure-Kubernetes `Ingress` only.
- No Thanos — `monitoring.type=bundled`/`external` point the console straight
  at a single Prometheus/Alertmanager (see the Monitoring section above for
  what that does and doesn't cover).
