---
author: "Ian Bull"
pubDatetime: 2025-12-08
title: "How Much Can You Ask an LLM to Track? Finding the Working Memory Cliff"
postSlug: working-memory-cliff
featured: false
tags:
 - ai
 - llm
description: "A short, practical look at how far you can push an LLM's working memory before accuracy falls off a cliff."
---
When building applications with LLMs, one of the most practical questions is: _how much data can I ask the model to work with before it starts making mistakes?_

This is not a criticism of LLMs. We already have sorting algorithms for sorting. The goal is to understand the model's working memory limits so we can design better systems.

## The Experiment

I asked GPT-5.1 to sort arrays of random integers (1–10,000) at various sizes, with 10 trials per size. The task is simple: return the array in ascending order. I then checked if the result was an exact match.

List sorting is a nice proxy for "can the model keep track of all these items and manipulate them consistently" and similar list sorting tasks are used in research on language model reasoning and code execution.[ACL Anthology+1](https://aclanthology.org/2023.findings-acl.308.pdf?utm_source=chatgpt.com)

Here are the results:

| Size | Pass Rate | Pattern    |
| ---- | --------- | ---------- |
| 10   | 100%      | ✅✅✅✅✅✅✅✅✅✅ |
| 20   | 100%      | ✅✅✅✅✅✅✅✅✅✅ |
| 30   | 90%       | ✅✅✅✅✅✅❌✅✅✅ |
| 40   | 60%       | ✅✅✅✅❌❌❌✅❌✅ |
| 50   | 50%       | ❌❌✅✅✅✅❌❌✅❌ |
| 60   | 60%       | ✅✅❌❌✅❌✅✅❌✅ |
| 70   | 20%       | ❌✅❌❌❌❌❌✅❌❌ |
| 80   | 20%       | ❌❌❌✅❌❌❌❌❌✅ |
| 90   | 30%       | ✅❌❌❌❌❌❌✅❌✅ |
| 100  | 10%       | ✅❌❌❌❌❌❌❌❌❌ |
| 110  | 10%       | ❌✅❌❌❌❌❌❌❌❌ |
| 120  | 0%        | ❌❌❌❌❌❌❌❌❌❌ |
| 130  | 0%        | ❌❌❌❌❌❌❌❌❌❌ |
| 140  | 0%        | ❌❌❌❌❌❌❌❌❌❌ |
| 150  | 0%        | ❌❌❌❌❌❌❌❌❌❌ |

## The Pattern

- **10–20 items**: Perfect accuracy (100%)
- **30 items**: First errors appear (90%)
- **40–70 items**: Coin flip territory (20–60%)
- **100+ items**: Near-total failure (0–10%)

The "cliff" appears around **30–40 items**. Beyond that, accuracy degrades rapidly.

This is consistent with broader evidence from long context evaluations. Studies like _Lost in the Middle_ show that even when models can technically accept long inputs, their ability to reliably use information across many items or positions decays, especially when relevant information is buried in the middle of a long sequence.[MIT Press Direct+1](https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00638/119630/Lost-in-the-Middle-How-Language-Models-Use-Long?utm_source=chatgpt.com) Benchmarks such as BABILong and similar suites also report that tasks involving long lists or many facts expose limits in how much structure a model can maintain at once.[CEUR-WS+1](https://ceur-ws.org/Vol-4112/104_main_long.pdf?utm_source=chatgpt.com)

## The Human Comparison

Psychologist George Miller famously argued that human short term memory holds about **7 ± 2 items**.[PubMed+1](https://pubmed.ncbi.nlm.nih.gov/13310704/?utm_source=chatgpt.com) Later work by Nelson Cowan and others refines that estimate, suggesting a core capacity closer to **4 ± 1 chunks** once you control for rehearsal and grouping strategies.[Cambridge University Press & Assessment+1](https://www.cambridge.org/core/journals/behavioral-and-brain-sciences/article/magical-number-4-in-shortterm-memory-a-reconsideration-of-mental-storage-capacity/44023F1147D4A1D44BDC0AD226838496?utm_source=chatgpt.com)

If you asked a person to look at 100 random numbers once and then write them in sorted order, they would likely fail unless they used external tools or very clever chunking.

By that standard, LLMs perform _remarkably well_:
- **Humans**: ~4–7 items in bare working memory, extended to more only via chunking, rehearsal, and external aids
- **GPT-5.1 (in this experiment)**: ~20–30 items with perfect accuracy, with graceful degradation out toward ~100 items

This is not a failure. It is an impressive working memory capacity for a purely text based model that is not explicitly designed as a symbolic working memory system. Recent work on "LLM working memory" reaches a similar conclusion: models can juggle several interacting pieces of information, but tasks that require consistent tracking of many distinct items or time intervals push them into error quite quickly.[ACL Anthology+1](https://aclanthology.org/2024.emnlp-main.938.pdf?utm_source=chatgpt.com)

The real question is how to design systems that work _with_ these limits rather than against them.

## Practical Recommendations

When building LLM powered applications, consider these guidelines:

### ≤30 items: Direct processing

You can usually ask the model to work with this data directly. Examples:
- Processing a short list of search results
- Analyzing a handful of customer reviews
- Comparing a few options

This is where the model's "native" working memory is strongest and where experiments like the one above show near perfect behavior.

### 30–100 items: Expect errors, consider chunking

The model will still work, but you should expect occasional mistakes and subtle inconsistencies. For critical tasks:
- Split the data into smaller batches and aggregate results outside the model
- Verify results programmatically when possible (for example, re check that a model provided sort is actually sorted)
- Use retrieval or filtering to narrow down the list before asking for detailed reasoning

Long context research suggests that context windows are not "flat RAM." Position and salience matter; models tend to use information at the beginning and end of a long prompt more reliably than details buried in the middle.[MIT Press Direct+1](https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00638/119630/Lost-in-the-Middle-How-Language-Models-Use-Long?utm_source=chatgpt.com) Designing prompts and chunking schemes with that in mind often matters more than simply increasing context length.

### 100+ items: Use tools or code execution

At this point you should treat the LLM as a _planner_ and _orchestrator_, not as the thing that manipulates every item directly.

Instead:
- Have the model generate code to process the data (for example, a small Python function that sorts, filters, or aggregates)
- Use function calls or tool APIs so the model can delegate to deterministic components like calculators, databases, or search systems
- Stream results through the model in smaller chunks and let it summarize or explain rather than directly compute over the entire raw list

There is a growing body of work on tool use and code execution that explicitly follows this pattern. Toolformer trains language models to decide when to call external tools such as calculators and search APIs instead of trying to carry out those operations in tokens.[OpenReview+1](https://openreview.net/pdf?id=Yacmpz84TH&utm_source=chatgpt.com) Other work integrates dedicated calculator or code execution modules into LLM systems to get reliable arithmetic and list operations where plain prompting is brittle.[arXiv+1](https://arxiv.org/html/2501.00684v1?utm_source=chatgpt.com) Numeric benchmarks like NumericBench and related studies repeatedly find that even strong LLMs are surprisingly error prone on arithmetic and numerical reasoning, which further supports the case for tool use rather than pure text based computation.[Hugging Face+1](https://huggingface.co/papers/2502.11075?utm_source=chatgpt.com)

## The Bigger Picture

This experiment reinforces a key insight about LLM system design:

> **The model should describe the computation, not perform it.**

You can think of the model as an expert that knows _what_ needs to be done, how to decompose the problem, and how to wire together tools that will execute the plan reliably.

- LLMs excel at understanding goals, constraints, and edge cases and at writing or modifying code, prompts, and queries.
- They struggle when asked to manually manipulate large amounts of data token by token, especially when many small elements have to be tracked consistently.

This is exactly the direction that research systems have been moving in: LLMs are increasingly used as controllers or "central executives" that orchestrate external tools, rather than as monolithic black boxes that must do everything internally.[OpenReview+1](https://openreview.net/pdf?id=Yacmpz84TH&utm_source=chatgpt.com)

The best LLM applications reflect this architecture and use the model for reasoning and orchestration, while delegating data heavy operations to code execution, databases, search, and specialized services.

## Conclusion

Understanding LLM working memory limits is not about finding failure cases. It is about building better systems.

Just as we do not criticize calculators for not writing poetry, we should not expect LLMs to be high throughput data processing engines.

The sweet spot is clear:

- Let LLMs reason about _what_ to do with data
- Let code or tools _actually do it_

When you structure your applications this way, you get the best of both worlds: the flexibility of natural language reasoning and the reliability of deterministic computation.

---

_The code for this experiment is available at [github.com/irbull/llm-codegen-benchmark](https://github.com/irbull/llm-codegen-benchmark)._

## Further Reading

A few of the references that inform the discussion above:

- Human working memory
    - George A. Miller, "The magical number seven, plus or minus two: some limits on our capacity for processing information." _Psychological Review_, 1956.[PubMed+1](https://pubmed.ncbi.nlm.nih.gov/13310704/?utm_source=chatgpt.com)
    - Nelson Cowan, "The magical number 4 in short term memory: a reconsideration of mental storage capacity." _Behavioral and Brain Sciences_, 2001.[Cambridge University Press & Assessment+1](https://www.cambridge.org/core/journals/behavioral-and-brain-sciences/article/magical-number-4-in-shortterm-memory-a-reconsideration-of-mental-storage-capacity/44023F1147D4A1D44BDC0AD226838496?utm_source=chatgpt.com)
- Long context and LLM working memory
    - Nelson F. Liu et al., "Lost in the Middle: How Language Models Use Long Contexts." _Transactions of the ACL_, 2024.[MIT Press Direct](https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00638/119630/Lost-in-the-Middle-How-Language-Models-Use-Long?utm_source=chatgpt.com)
    - F. Tamburini et al., "BABILong-ITA: a new benchmark for testing Large Language Models' context length capabilities." 2025.[CEUR-WS](https://ceur-ws.org/Vol-4112/104_main_long.pdf?utm_source=chatgpt.com)
    - C. Zhang et al., "Working Memory Identifies Reasoning Limits in Language Models." EMNLP 2024.[ACL Anthology](https://aclanthology.org/2024.emnlp-main.938.pdf?utm_source=chatgpt.com)
- List sorting, code execution, and numerical reasoning
    - C. Liu et al., "Code Execution with Pre-trained Language Models." Findings of ACL 2023.[ACL Anthology](https://aclanthology.org/2023.findings-acl.308.pdf?utm_source=chatgpt.com)
    - "Structure Development in List Sorting Transformers." Under review at TMLR, 2025.[OpenReview](https://openreview.net/pdf/394930aa5da406a718e29f12e55fc189ab897430.pdf?utm_source=chatgpt.com)
    - Haoyang Li et al., "A Benchmark to Evaluate Fundamental Numerical Abilities in Large Language Models (NumericBench)." Findings of ACL 2025.[ACL Anthology+1](https://aclanthology.org/2025.findings-acl.1026.pdf?utm_source=chatgpt.com)
- Tool use and calculators
    - Timo Schick et al., "Toolformer: Language Models Can Teach Themselves to Use Tools." 2023.[OpenReview+1](https://openreview.net/pdf?id=Yacmpz84TH&utm_source=chatgpt.com)
    - Florian Dietz and Dietrich Klakow, "IGC: Integrating a Gated Calculator into an LLM to Solve Arithmetic Tasks Reliably and Efficiently." 2025.[arXiv](https://arxiv.org/html/2501.00684v1?utm_source=chatgpt.com)
    - UCSD PEARLS Lab, "Tool Use" project overview.[PEARLS Lab @ UCSD](https://pearls-lab.github.io/projects/tooluse/?utm_source=chatgpt.com)


