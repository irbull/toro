---
pubDatetime: 2024-10-07
title: Multiple Pipelines in Gitlab
postSlug: gitlab-multiple-jobs
tags:
  - TIL
  - Gitlab
  - devops
description: "Today I share a solution for avoiding duplicate pipelines in GitLab by configuring workflow rules to differentiate between branch and merge request pipelines."
---

I've been struggling with duplicate pipelines in GitLab.

> If you get duplicate pipelines in merge requests, your pipeline might be configured to run for both branches and merge requests at the same time. Adjust your pipeline configuration to [avoid duplicate pipelines](https://docs.gitlab.com/ee/ci/jobs/job_rules.html#avoid-duplicate-pipelines). You can add `workflow:rules` to [switch from branch pipelines to merge request pipelines](https://docs.gitlab.com/ee/ci/yaml/workflow.html#switch-between-branch-pipelines-and-merge-request-pipelines). After a merge request is open on the branch, the pipeline switches to a merge request pipeline.

A few places suggest using a workflow and not starting a branch build if a MR is open, however there is a timing issue here when the MR is first opened. Instead, we now use the following workflow:

```yaml
workflow:
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: "$CI_COMMIT_BRANCH && $CI_OPEN_MERGE_REQUESTS"
      when: never
    - if: '$CI_COMMIT_BRANCH =~ /^mr-\.*/'
      when: never
    - if: "$CI_COMMIT_BRANCH || $CI_COMMIT_TAG"
```

This will create a pipeline:

- If it's a merge request
- If a merge request is already open, it **WILL NOT** create a branch pipeline
- If the branch starts with `mr-` if **WILL NOT** create a branch pipeline
- Otherwise if it's a branch or tag it will
