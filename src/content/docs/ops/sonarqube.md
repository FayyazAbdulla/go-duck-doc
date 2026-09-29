---
title: SonarQube
description: The SonarQube service and benchmark script generated with every project.
---

Generated projects include a SonarQube Community Edition service and a benchmark script.

```bash
docker compose -f devops/services.yml up -d sonarqube
./sonar_benchmark.sh
```

The container is `sonarqube:community` on port **9000**, with `SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true` and persistent volumes. Kubernetes output includes `k8s/sonarqube.yaml`. That port is the same number as the default Kratos gRPC address (`:9000`). They are different processes.

`sonar-project.properties` is set up for Go: `coverage.out`, test discovery, and exclusions for generated Protobuf, docs, and Kubernetes manifests. The script is written to the project root and to `devops/`, mode `0755`.

`./sonar_benchmark.sh`:

1. Runs `go test -coverprofile=coverage.out`.
2. Runs SonarScanner from the local CLI or from Docker image `sonarsource/sonar-scanner-cli`.
3. Writes `sonarqube_benchmark_report.html` (quality gate, bugs, vulnerabilities, ratings, coverage, duplication, and a table of controllers and models).

The generated test suite is a smoke test, `main_test.go`, which checks that `config.LoadConfig()` succeeds. It does not assert entity behavior. The CI workflow must call `go test -v ./...`. An earlier generator bug emitted the shell builtin `test -v ./...` instead.
