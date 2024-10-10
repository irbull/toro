---
pubDatetime: 2024-10-09
title: Kubernetes Cron Jobs Concurrency-Policy
slug: k8s-cron-concurrency
tags:
  - TIL
  - k8s
description: "Today I learned that by using the `concurrency-policy` in a CronJob specification, you can control whether jobs are allowed to run concurrently, ensuring that subsequent jobs do not start before the previous ones are completed."
---

To avoid cron jobs from starting a subsequent job while the first one is still running, you can use the `concurrency-policy`.

The spec may specify only one of the following concurrency policies:

- `Allow` (default): The CronJob allows concurrently running Jobs
- `Forbid`: The CronJob does not allow concurrent runs; if it is time for a new Job run and the previous Job run hasn't finished yet, the CronJob skips the new Job run. Also note that when the previous Job run finishes, `.spec.startingDeadlineSeconds` is still taken into account and may result in a new Job run.
- `Replace`: If it is time for a new Job run and the previous Job run hasn't finished yet, the CronJob replaces the currently running Job run with a new Job run

Note that concurrency policy only applies to the Jobs created by the same CronJob. If there are multiple CronJobs, their respective Jobs are always allowed to run concurrently.

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: name
spec:
  schedule: "*/5 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: name
              image: ...
  concurrencyPolicy: Forbid | Allow | Replace
```

Details: [https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/#concurrency-policy](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/#concurrency-policy)
