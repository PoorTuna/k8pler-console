##################################################
#
# go backend build
FROM golang:1.21-bookworm AS gobuilder
RUN mkdir -p /go/src/github.com/openshift/console/
ADD . /go/src/github.com/openshift/console/
WORKDIR /go/src/github.com/openshift/console/
RUN ./build-backend.sh

##################################################
#
# nodejs frontend build
FROM node:22-bookworm AS nodebuilder

ADD . /workspace
WORKDIR /workspace/frontend
ENV CYPRESS_INSTALL_BINARY=0

RUN node .yarn/releases/yarn-4.12.0.cjs install --immutable && \
    node .yarn/releases/yarn-4.12.0.cjs build

##################################################
#
# actual base image for final product
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /opt/bridge/bin
COPY --from=gobuilder /go/src/github.com/openshift/console/bin/bridge /opt/bridge/bin
COPY --from=nodebuilder /workspace/frontend/public/dist /opt/bridge/static
COPY --from=gobuilder /go/src/github.com/openshift/console/pkg/graphql/schema.graphql /pkg/graphql/schema.graphql

WORKDIR /
# doesn't require a root user.
USER 1001

ENTRYPOINT [ "/opt/bridge/bin/bridge", "--public-dir=/opt/bridge/static" ]

LABEL \
        io.k8s.description="Kubernetes web console (k8pler-console), a de-OpenShift-ed fork of the OpenShift Console." \
        name="k8pler-console" \
        License="Apache 2.0" \
        io.k8s.display-name="k8pler Console"
