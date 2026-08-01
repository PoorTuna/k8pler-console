{{/*
Validation: auth.type must be a supported value. "openshift" is upstream's
default but requires an OpenShift OAuth server this fork doesn't have.
*/}}
{{- define "k8pler-console.validateAuthType" -}}
{{- $allowed := list "oidc" "disabled" }}
{{- if not (has .Values.auth.type $allowed) }}
  {{- fail (printf "auth.type must be one of %v, got: %s (note: \"openshift\" is not supported by this fork)" $allowed .Values.auth.type) }}
{{- end }}
{{- end }}

{{/*
Validation: oidc auth needs an issuer URL, either bundled Dex or an external one.
*/}}
{{- define "k8pler-console.validateOidcIssuer" -}}
{{- if eq .Values.auth.type "oidc" }}
  {{- if and (not .Values.auth.oidc.issuerUrl) (not .Values.dex.enabled) }}
    {{- fail "auth.type=oidc requires auth.oidc.issuerUrl (external OIDC provider) or dex.enabled=true (bundled Dex)" }}
  {{- end }}
  {{- if and .Values.auth.oidc.issuerUrl .Values.dex.enabled (not (eq .Values.auth.oidc.issuerUrl .Values.dex.issuerUrl)) }}
    {{- if .Values.dex.issuerUrl }}
      {{- fail "auth.oidc.issuerUrl and dex.issuerUrl are both set but don't match -- the console won't trust tokens minted by the bundled Dex" }}
    {{- end }}
  {{- end }}
  {{- if and (not .Values.auth.oidc.clientSecret) (not .Values.auth.oidc.existingSecret) }}
    {{- fail "auth.type=oidc requires auth.oidc.clientSecret or auth.oidc.existingSecret" }}
  {{- end }}
{{- end }}
{{- end }}

{{/*
Validation: disabled auth is dev-only and needs a static bearer token.
*/}}
{{- define "k8pler-console.validateAuthDisabled" -}}
{{- if eq .Values.auth.type "disabled" }}
  {{- if not .Values.auth.disabled.staticBearerToken }}
    {{- fail "auth.type=disabled requires auth.disabled.staticBearerToken (DEV ONLY -- every request runs as this token)" }}
  {{- end }}
{{- end }}
{{- end }}

{{/*
Validation: bundled Dex's default staticClients auto-wiring needs the plain
client secret value, which isn't available when auth.oidc.existingSecret is
used instead of auth.oidc.clientSecret.
*/}}
{{- define "k8pler-console.validateDexAutoWiring" -}}
{{- if and .Values.dex.enabled (not .Values.dex.staticClients) (not .Values.auth.oidc.clientSecret) }}
  {{- fail "dex.enabled=true with no dex.staticClients set needs auth.oidc.clientSecret to auto-wire the default Dex client (auth.oidc.existingSecret's value isn't visible to this chart). Set auth.oidc.clientSecret, or provide dex.staticClients yourself." }}
{{- end }}
{{- end }}

{{/*
Validation: TLS secret must be named when tls.enabled.
*/}}
{{- define "k8pler-console.validateTls" -}}
{{- if .Values.tls.enabled }}
  {{- if not .Values.tls.existingSecret }}
    {{- fail "tls.enabled requires tls.existingSecret (a Secret with tls.crt/tls.key keys)" }}
  {{- end }}
{{- end }}
{{- end }}

{{/*
Validation: monitoring.type must be a supported value.
*/}}
{{- define "k8pler-console.validateMonitoringType" -}}
{{- $allowed := list "disabled" "bundled" "external" }}
{{- if not (has .Values.monitoring.type $allowed) }}
  {{- fail (printf "monitoring.type must be one of %v, got: %s" $allowed .Values.monitoring.type) }}
{{- end }}
{{- end }}

{{/*
Validation: monitoring.type=bundled and monitoring.bundledEnabled must move
together -- bundledEnabled is what actually gates the kube-prometheus-stack
Helm dependency (Chart.yaml `condition` can only reference a plain boolean),
so a mismatch here would silently deploy (or skip) the stack while every
other template disagrees about whether monitoring is "bundled".
*/}}
{{- define "k8pler-console.validateMonitoringBundled" -}}
{{- if and (eq .Values.monitoring.type "bundled") (not .Values.monitoring.bundledEnabled) }}
  {{- fail "monitoring.type=bundled also requires monitoring.bundledEnabled=true (gates the kube-prometheus-stack dependency itself)" }}
{{- end }}
{{- if and .Values.monitoring.bundledEnabled (not (eq .Values.monitoring.type "bundled")) }}
  {{- fail "monitoring.bundledEnabled=true requires monitoring.type=bundled" }}
{{- end }}
{{- if and (eq .Values.monitoring.type "bundled") (or .Values.monitoring.external.prometheusHost .Values.monitoring.external.alertmanagerHost) }}
  {{- fail "monitoring.type=bundled ignores monitoring.external.* -- unset those, or switch to monitoring.type=external" }}
{{- end }}
{{- end }}

{{/*
Validation: monitoring.type=external needs at least the Prometheus host.
*/}}
{{- define "k8pler-console.validateMonitoringExternal" -}}
{{- if eq .Values.monitoring.type "external" }}
  {{- if not .Values.monitoring.external.prometheusHost }}
    {{- fail "monitoring.type=external requires monitoring.external.prometheusHost" }}
  {{- end }}
{{- end }}
{{- end }}

{{/*
Run all validations. Include this in every resource template.
*/}}
{{- define "k8pler-console.validate" -}}
{{- include "k8pler-console.validateAuthType" . }}
{{- include "k8pler-console.validateOidcIssuer" . }}
{{- include "k8pler-console.validateAuthDisabled" . }}
{{- include "k8pler-console.validateDexAutoWiring" . }}
{{- include "k8pler-console.validateTls" . }}
{{- include "k8pler-console.validateMonitoringType" . }}
{{- include "k8pler-console.validateMonitoringBundled" . }}
{{- include "k8pler-console.validateMonitoringExternal" . }}
{{- end }}
