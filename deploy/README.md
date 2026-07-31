# Deploying k8pler-console

Plain-Kubernetes manifests for the console + a Dex OIDC provider. Apply in
order (numeric prefixes matter — RBAC/config before the workloads that need
them):

```
kubectl apply -f deploy/00-namespace.yaml
kubectl apply -f deploy/01-dex-configmap.yaml
kubectl apply -f deploy/02-dex-deployment.yaml
kubectl apply -f deploy/03-dex-ingress.yaml
kubectl apply -f deploy/04-console-rbac.yaml
kubectl apply -f deploy/05-console-secret.yaml
kubectl apply -f deploy/06-console-deployment.yaml
kubectl apply -f deploy/07-console-ingress.yaml
```

## Before you apply

1. **Pick real hostnames** and replace `dex.k8pler.example.com` /
   `console.k8pler.example.com` throughout `deploy/*.yaml`.
2. **Generate the OIDC client secret** (must match in two places):
   ```
   SECRET=$(openssl rand -base64 32)
   ```
   Put it in `deploy/01-dex-configmap.yaml` (`staticClients[0].secret`) and
   `deploy/05-console-secret.yaml` (`client-secret`).
3. **Replace the demo password hash** in `deploy/01-dex-configmap.yaml`, or
   better, swap `staticPasswords` for a real connector (LDAP, GitHub,
   upstream OIDC, SAML — see https://dexidp.io/docs/connectors/). The static
   password list is a bootstrap/demo mechanism only.
4. **Build and push the console image**: `docker build -t <your-registry>/k8pler-console:latest .`
   and update the `image:` field in `deploy/06-console-deployment.yaml`.
5. **Ingress annotations** assume `ingressClassName: nginx` and
   `cert-manager.io/cluster-issuer: letsencrypt`. Adjust for your cluster's
   actual ingress controller / TLS setup. Both hostnames must serve valid
   TLS — OIDC issuer URLs and redirect URIs must be `https`.

## Cluster-side prerequisite: apiserver OIDC trust

For per-user RBAC to apply (so each Dex-authenticated user's own
permissions govern what they see, not a shared service account), the
**kube-apiserver itself** must trust the same OIDC issuer. This is a
cluster-admin change outside this repo, e.g. (flags vary by how you run
the apiserver — kubeadm, a managed distro, etc.):

```
--oidc-issuer-url=https://dex.k8pler.example.com
--oidc-client-id=console
--oidc-username-claim=email
--oidc-groups-claim=groups
```

Then grant RoleBindings/ClusterRoleBindings to the resulting
`oidc:<email>` (or however you configure the username prefix) subjects.

Without this step, the console still logs users in via Dex and the bridge
still validates their tokens (via the `system:auth-delegator` binding in
`04-console-rbac.yaml`), but the API server will reject the tokens as
unrecognized users unless it's separately configured to trust them.

## What's intentionally not here

- No OLM/OperatorHub — dropped from this fork entirely.
- No OpenShift monitoring stack wiring (Thanos/Alertmanager). If you want
  the Observe dashboards populated, deploy kube-prometheus-stack and pass
  `--prometheus-public-url` / `--grafana-public-url` /
  `--k8s-mode-off-cluster-thanos` (dev) or the equivalent in-cluster flags
  to the bridge. See `docs/RUNNING-ON-KUBERNETES.md`.
