# NOTICE

This repository is a private derivative of the OpenShift Console.

- **Upstream:** https://github.com/openshift/console
- **Branch:** `release-4.16`
- **Snapshotted commit:** `da1bb649bdff0937f926c26a7eef514b1e022265` (2026-07-03)
- **License:** Apache License 2.0 (see `LICENSE`, unmodified from upstream)
- **Import method:** clean snapshot — upstream git history was not carried over;
  this repo starts from a single initial commit of the above tree.

## Purpose of this fork

The upstream console targets OpenShift and depends on OpenShift-exclusive APIs
and services (OAuth server, Projects, Routes, ImageStreams, BuildConfigs,
DeploymentConfigs, Templates, OLM/OperatorHub, integrated
Prometheus/Thanos/Alertmanager, `user.openshift.io` settings, etc.).

This fork adapts the console to run against **plain upstream Kubernetes**:

- Authentication via **OIDC** (Dex/Keycloak) instead of the OpenShift OAuth server.
- **Namespaces** substituted for Projects, **Ingress** substituted for Routes.
- OpenShift-only features with no sane Kubernetes equivalent are **removed**:
  OLM/OperatorHub, ImageStreams, BuildConfigs/Builds, DeploymentConfigs,
  Templates, OAuth Users/Groups/Identities admin pages.

See the plan/README for details as they land.
