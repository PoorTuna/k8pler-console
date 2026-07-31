# Running on plain Kubernetes

The bridge (`cmd/bridge`) needs no source changes to run against vanilla
Kubernetes — every OpenShift-specific behavior is opt-in via flags. Do **not**
set `-service-ca-file`, `-k8s-mode-off-cluster-thanos`,
`-k8s-mode-off-cluster-alertmanager`, or `-k8s-mode-off-cluster-gitops` and
none of the OpenShift monitoring/GitOps proxies get wired up.

## Development (off-cluster)

```
./bin/bridge \
  -k8s-mode off-cluster \
  -k8s-mode-off-cluster-endpoint https://<api-server-host>:6443 \
  -k8s-mode-off-cluster-skip-verify-tls \
  -user-auth oidc \
  -user-auth-oidc-issuer-url https://<dex-or-keycloak-issuer> \
  -user-auth-oidc-client-id console \
  -user-auth-oidc-client-secret <client-secret> \
  -user-settings-location localstorage \
  -base-address http://localhost:9000 \
  -branding okd \
  -custom-product-name k8pler
```

`-user-settings-location localstorage` is required: the upstream default
(`configmap`) persists user preferences to a `user.openshift.io` resource that
doesn't exist on plain k8s.

## In-cluster (deployed)

Same auth flags, but:
- `-k8s-mode in-cluster` (default) — reads the in-cluster CA/token, talks to
  `kubernetes.default.svc` directly.
- Leave `-service-ca-file` unset so the OpenShift monitoring/GitOps proxy
  branch in `cmd/bridge/main.go` (`if *fServiceCAFile != ""`) is skipped
  entirely.
- Optional: point `-prometheus-public-url` / `-grafana-public-url` at your own
  kube-prometheus-stack if you want the monitoring pages populated. Left
  unset, those pages render empty rather than erroring.

## Auth modes (`-user-auth`)

- `oidc` — real per-user login against any OIDC provider (Dex, Keycloak, …).
  Requires `-user-auth-oidc-issuer-url`, `-user-auth-oidc-client-id`, and one
  of `-user-auth-oidc-client-secret` / `-user-auth-oidc-client-secret-file`.
  **This is what we use** — see `deploy/` for a Dex-backed example.
- `disabled` — no login UI, every request uses `-k8s-auth-bearer-token`
  (dev only).
- `openshift` — upstream default, requires an OpenShift OAuth server. Not
  applicable here.

## Known non-issues (verified in `cmd/bridge/main.go`)

- `MonitoringDashboardConfigMapLister` queries the `openshift-config-managed`
  namespace. This namespace won't exist on plain k8s, but the lister is lazy
  (`pkg/server/resource_lister.go`) — it only errors the specific request
  that hits it, not startup.
- `KnativeEventSourceCRDLister` / `KnativeChannelCRDLister` list CRDs by label
  and simply return empty results if Knative isn't installed — no crash.
