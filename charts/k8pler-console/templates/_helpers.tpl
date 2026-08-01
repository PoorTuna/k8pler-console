{{/*
Expand the name of the chart.
*/}}
{{- define "k8pler-console.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "k8pler-console.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "k8pler-console.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "k8pler-console.labels" -}}
helm.sh/chart: {{ include "k8pler-console.chart" . }}
{{ include "k8pler-console.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "k8pler-console.selectorLabels" -}}
app.kubernetes.io/name: {{ include "k8pler-console.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "k8pler-console.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "k8pler-console.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Image tag — values.yaml defaults this to "latest" (the only tag actually
published); fall back to it here too in case someone blanks the value.
*/}}
{{- define "k8pler-console.imageTag" -}}
{{- default "latest" .Values.image.tag }}
{{- end }}

{{/*
Public base address of the console: explicit console.baseAddress, else
derived from the ingress host + TLS setting.
*/}}
{{- define "k8pler-console.baseAddress" -}}
{{- if .Values.console.baseAddress }}
{{- .Values.console.baseAddress }}
{{- else if .Values.ingress.enabled }}
{{- printf "%s://%s" (ternary "https" "http" .Values.ingress.tls.enabled) .Values.ingress.host }}
{{- else }}
{{- printf "http://localhost:%v" .Values.service.port }}
{{- end }}
{{- end }}

{{/*
Dex fullname / labels (bundled sub-component of this chart)
*/}}
{{- define "k8pler-console.dex.fullname" -}}
{{- printf "%s-dex" (include "k8pler-console.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "k8pler-console.dex.labels" -}}
{{ include "k8pler-console.labels" . }}
app.kubernetes.io/component: dex
{{- end }}

{{- define "k8pler-console.dex.selectorLabels" -}}
{{ include "k8pler-console.selectorLabels" . }}
app.kubernetes.io/component: dex
{{- end }}

{{/*
Dex issuer URL: explicit dex.issuerUrl, else derived from its ingress host.
*/}}
{{- define "k8pler-console.dex.issuerUrl" -}}
{{- if .Values.dex.issuerUrl }}
{{- .Values.dex.issuerUrl }}
{{- else if .Values.dex.ingress.enabled }}
{{- printf "%s://%s" (ternary "https" "http" .Values.dex.ingress.tls.enabled) .Values.dex.ingress.host }}
{{- else }}
{{- printf "http://%s:%v" (include "k8pler-console.dex.fullname" .) .Values.dex.service.port }}
{{- end }}
{{- end }}

{{/*
Metrics tenancy-enforcement proxy (kube-rbac-proxy + prom-label-proxy)
fullname / labels (bundled sub-component of this chart)
*/}}
{{- define "k8pler-console.metricsProxy.fullname" -}}
{{- printf "%s-metrics-proxy" (include "k8pler-console.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "k8pler-console.metricsProxy.labels" -}}
{{ include "k8pler-console.labels" . }}
app.kubernetes.io/component: metrics-proxy
{{- end }}

{{- define "k8pler-console.metricsProxy.selectorLabels" -}}
{{ include "k8pler-console.selectorLabels" . }}
app.kubernetes.io/component: metrics-proxy
{{- end }}

{{/*
Effective Prometheus/Alertmanager host:port for the *global* (non-tenant)
query path -- bundled kube-prometheus-stack's well-known operator-managed
"operated" service names (fixed by the Prometheus Operator itself,
independent of Helm release name), or monitoring.external.*Host.
Empty when monitoring.type=disabled.
*/}}
{{- define "k8pler-console.monitoring.prometheusHost" -}}
{{- if eq .Values.monitoring.type "bundled" }}
{{- printf "prometheus-operated.%s.svc:9090" .Release.Namespace }}
{{- else if eq .Values.monitoring.type "external" }}
{{- .Values.monitoring.external.prometheusHost }}
{{- end }}
{{- end }}

{{- define "k8pler-console.monitoring.prometheusScheme" -}}
{{- if eq .Values.monitoring.type "bundled" }}
{{- print "http" }}
{{- else }}
{{- default "http" .Values.monitoring.external.prometheusScheme }}
{{- end }}
{{- end }}

{{- define "k8pler-console.monitoring.alertmanagerHost" -}}
{{- if eq .Values.monitoring.type "bundled" }}
{{- printf "alertmanager-operated.%s.svc:9093" .Release.Namespace }}
{{- else if eq .Values.monitoring.type "external" }}
{{- .Values.monitoring.external.alertmanagerHost }}
{{- end }}
{{- end }}

{{- define "k8pler-console.monitoring.alertmanagerScheme" -}}
{{- if eq .Values.monitoring.type "bundled" }}
{{- print "http" }}
{{- else }}
{{- default "http" .Values.monitoring.external.alertmanagerScheme }}
{{- end }}
{{- end }}

{{/*
Tenancy (namespace-scoped) Prometheus query host: the metrics-proxy
Service, in-cluster, plain HTTP (kube-rbac-proxy handles authn/authz over
the forwarded bearer token; the proxy is ClusterIP-only, never
internet-facing, so it doesn't need its own TLS listener).
*/}}
{{- define "k8pler-console.monitoring.prometheusTenancyHost" -}}
{{- printf "%s.%s.svc:%v" (include "k8pler-console.metricsProxy.fullname" .) .Release.Namespace 8080 }}
{{- end }}
