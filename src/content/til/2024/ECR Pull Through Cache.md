---
pubDatetime: 2024-10-08
title: Use ECR as a Pull Through Cache
postSlug: ecr-pull-through-cache
tags:
  - TIL
  - aws
description: Today I learned that the ECR Registry can function as a pull-through cache for Docker images or any OCI-compatible artifact, requiring a valid GitHub username/token with package READ access for configuration.
---

The _ECR Registry_ can be used as a pull-through cache for Docker images or any OCI-compatible artifact. You must include a valid GitHub `username`/`token` with package READ access. Once configured, you can use your container registry, and it will pull through any missing images. I used it for [Trivy DB images](https://github.com/aquasecurity/trivy-db).
