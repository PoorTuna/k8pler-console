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
| Custom logo `ConfigMap` | `console.customLogo` | — |
| Bundled Dex (`Deployment`, `Service`, config `Secret`, RBAC) | `dex.enabled` | `false` |
| Dex `Ingress` | `dex.ingress.enabled` | `false` |

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
| `console.userSettingsLocation` | `localstorage` avoids needing the OpenShift-only `user.openshift.io` API | `localstorage` |
| `console.baseAddress` | Public URL; auto-derived from `ingress.host` when unset | — |
| `console.plugins` | Map of dynamic-plugin `name: endpoint` | `{}` |

### Auth

| Parameter | Description | Default |
|---|---|---|
| `auth.type` | `oidc` or `disabled` (`openshift` from upstream is not supported by this fork) | `oidc` |
| `auth.oidc.issuerUrl` | External OIDC issuer. Ignored when `dex.enabled=true` (Dex's own issuer is used) | — |
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
- No OpenShift monitoring stack wiring (Thanos/Alertmanager). Point
  `monitoring.prometheusPublicUrl` / `monitoring.grafanaPublicUrl` at your own
  kube-prometheus-stack if you want the Observe dashboards populated.
