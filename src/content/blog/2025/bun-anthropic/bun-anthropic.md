---
author: "Ian Bull"
pubDatetime: 2025-12-05
title: "Why Embedding a JavaScript Runtime Inside an LLM Is a Big Deal"
postSlug: bun-anthropic
featured: false
tags:
 - llm
 - ai
 - typescript
description: "This post explains why giving LLMs a built-in JavaScript runtime unlocks far more accurate, scalable, and flexible computation than traditional tool-calling approaches."

---
Anthropic recently announced that it has acquired **Bun**, the ultra-fast JavaScript and TypeScript runtime. On the surface this looks like an investment in developer tooling for Claude Code. Under the surface it signals something much larger.  

**LLMs are about to gain first-class, built-in computation.**

This shift has major implications for how we design agentic systems, how we reason about tool calling, and how we build AI-powered workflows.

In this post I explain why having a JavaScript runtime inside the inference engine will fundamentally change the way we build with AI. I also explain why generating and executing small TypeScript snippets is often better than making multiple tool calls through MCP or similar mechanisms.

---

## **1. Tool Calls Are Useful, but They Are Not Always the Right Abstraction**

The Model Context Protocol (MCP) is currently the standard way to allow AI models to interact with external systems. Tools are essential for reaching out to APIs, databases, ticketing systems, and any other environment where real-world effects matter.

However, many everyday tasks do not need external systems. Examples include:

- Filtering a dataset
- Computing aggregates
- Running a quick simulation
- Transforming nested JSON
- Reconciling intermediate results

Tool calls feel heavy for these types of operations. Each tool requires a schema, validation logic, serialization, a round trip to a server, and error handling. In practice this can turn simple computational steps into a full RPC workflow.

Meanwhile the model already knows how to express these operations in JavaScript and TypeScript. There is no need to force it through a tool interface for something it could express directly.

This is where a built-in JavaScript runtime changes everything.

---
## **2. Code Snippets as Core Reasoning Primitives**

Suppose as part of a larger task, an LLM needs to:

> "Filter out all events where `duration < 50ms`, group by `userId`, and compute averages."

Instead of orchestrating several tool calls, the model could simply write:

``` typescript
const filtered = events.filter(e => e.duration >= 50); 
const grouped = Object.groupBy(filtered, e => e.userId);
const result = Object.entries(grouped).map(([id, group]) => ({
  id,
  avg: group.reduce((a, b) => a + b.duration, 0) / group.length
}));
```

A sandboxed runtime executes this snippet, the model reads the result, and the reasoning continues.

This approach is often:

- Faster, because no network hop is required
- Simpler, because there is no schema to maintain
- More flexible, because the model is already fluent in TS
- More composable, because snippets can be chained together in a single environment

For many tasks it is more natural to let the model generate a small piece of code and run it directly. In effect, JavaScript becomes the computation tool by default.

---
## **3. The Context Window Is Not for Data**

One might ask: "Why not just load the data into the model's context window and let it compute directly?"

Modern models have context windows of 100K, 200K, or even 1M+ tokens. But this does not mean we should fill them with raw data. Here is why.

### **The math does not work**

Consider our event filtering example with real-world scale:

| Events | ~Tokens (at 50 per event) | Fits in 128K context? |
|--------|---------------------------|------------------------|
| 100 | 5,000 | ✅ Yes |
| 1,000 | 50,000 | ⚠️ Barely |
| 10,000 | 500,000 | ❌ No |
| 1,000,000 | 50,000,000 | ❌ Impossible |

Even if the data fits, the model struggles to perform reliable arithmetic across thousands of items. LLMs are not calculators—they are pattern matchers trained on text.

### **Empirical evidence**

I tested this directly using GPT-5.1 with the same filter-group-average task:

| Events | Tokens Used | Latency | Accuracy | Status |
|--------|-------------|---------|----------|--------|
| 10 | 282 | 1.7s | 100% | ✅ Correct |
| 100 | 1,511 | 3.8s | 90% | ⚠️ Partial errors |
| 1,000 | 10,614 | 7.1s | 0% | ❌ Wrong |

At just 100 events, accuracy begins to degrade. At 1,000 events, the model produces completely wrong results. Even the latest GPT-5.1 cannot reliably perform arithmetic across large datasets.

### **The code-generation alternative**

Compare this to the code-generation approach, where the model writes a TypeScript snippet and a runtime like Bun executes it:

| Events | Tokens Used | Latency | Accuracy |
|--------|-------------|---------|----------|
| 100 | 360* | 44ms | 100% |
| 1,000 | — | 37ms | 100% |
| 10,000 | — | 41ms | 100% |
| 100,000 | — | 58ms | 100% |
| 1,000,000 | — | 228ms | 100% |

*\*Code generation is a one-time cost (~2.5s). The same code executes on all dataset sizes.*

The model generates 360 tokens of code once. The runtime handles the rest with perfect accuracy, regardless of dataset size.

Here is the actual code GPT-5.1 generated:

```typescript
const result = Object.entries(
  events
    .filter(event => event.duration >= 50)
    .reduce<Record<string, { sum: number; count: number }>>((acc, { userId, duration }) => {
      if (!acc[userId]) {
        acc[userId] = { sum: 0, count: 0 };
      }
      acc[userId].sum += duration;
      acc[userId].count += 1;
      return acc;
    }, {})
).map(([id, { sum, count }]) => ({
  id,
  avg: Math.round((sum / count) * 100) / 100
})).sort((a, b) => a.id.localeCompare(b.id));
```

This is the key insight: **the model should describe the computation, not perform it.**

---

## **4. Streaming Data Formats and the Runtime**

Real-world data often lives in streaming-friendly formats like Apache Avro, Parquet, or NDJSON. These formats are designed for high-throughput data pipelines, not for loading into LLM context windows.

A runtime like Bun can read these formats directly:

```typescript
import avro from "avsc";

// Stream events from an Avro file
const decoder = avro.createFileDecoder("events.avro");
const events: Event[] = [];

decoder.on("data", (record) => events.push(record));
decoder.on("end", () => {
  // Process with the generated code
  const filtered = events.filter(e => e.duration >= 50);
  const grouped = Object.groupBy(filtered, e => e.userId);
  // ...
});
```

This pattern is powerful for several reasons:

- **Separation of concerns**: The LLM generates processing logic; the runtime handles I/O
- **Scalability**: Streaming processes data incrementally without loading everything into memory
- **Compatibility**: Works with the same data formats used in production pipelines (Kafka, Spark, etc.)

The model does not need to see your data. It just needs to describe how to process it. The runtime handles the rest.

---
## **5. Why Bun Fits This Future Better Than Other Runtimes**

Node or Deno could have served as the execution layer, but Bun brings several characteristics that make it ideal for LLM integration.

### ✔ **Very fast startup time**

Agent loops often involve many short snippets. Cold-start cost matters a great deal.

### ✔ **A single binary that includes runtime, bundler, package manager, and test runner**

This creates a small, predictable surface area for embedding in an AI system.

### ✔ **Excellent TypeScript support**

Since LLMs are already strong at TypeScript, the feedback loop is smooth and efficient.

### ✔ **Used internally by Claude Code today**

Anthropic confirmed that Bun already powers Claude Code’s execution engine. Acquiring Bun gives Anthropic deep control over the entire “generate code, run code, reflect on output” process.

### ✔ **A foundation for AI-specific extensions**

Once Anthropic controls the runtime they can introduce:

- Safer filesystem operations
- Sandboxed networking
- Custom developer-focused syscalls
- Better observability hooks

This turns Bun into an **AI-native computation substrate**, rather than simply a faster replacement for Node.

---

## **6. Computation During the Thinking Stage**

Hidden reasoning traces, sometimes called the “thinking tokens,” offer another interesting opportunity. Nothing prevents an LLM from generating a hypothesis and testing it with a short snippet of JavaScript during its internal reasoning process.

The model can:

1. Form an idea
2. Write a small piece of code
3. Run it inside the runtime
4. Observe the output
5. Update its idea before responding to the user

This allows for:

- Internal self-debugging
- Precise numerical computation
- Small internal simulations
- Iterative refinement inside the chain of thought

The result is a hybrid form of reasoning where statistical inference and program execution support one another.

---

## **7. When Code Snippets Are Better Than Tools, and When Tools Still Matter**

A clear boundary is beginning to emerge.

### **Choose JavaScript snippets for:**

- Transforming data you already have
- Pure computations
- Local reasoning
- Small brute-force or search tasks
- Formatting or parsing text
- Building glue logic around tool outputs

### **Choose MCP tools for:**

- Interacting with external systems
- Operations that affect real data
- Authenticated access to services
- Long-running or heavyweight tasks
- Workflows that must be auditable and deterministic
- Systems used by multiple teams

Many agent designs spend tool calls on tasks that do not require them. A built-in runtime solves this by allowing pure computation to stay local.

---

## **8. The Larger Direction This Signals**

If we assemble all of these pieces, a future architecture becomes easy to imagine.

- The model proposes a next action.
- The runtime executes the code and returns exact results.
- The model uses those results to refine its plan.
- The model only reaches for MCP tools when external systems or side effects are required.

In this world, internal computation becomes cheap and reliable. It becomes part of the inference loop itself rather than a separate system.

Anthropic’s acquisition of Bun strongly suggests they see this future as well. It is a natural evolution of agentic AI systems, and it opens the door to much more capable reasoning.

Allowing an LLM to run its own code in a safe, fast, local environment is a foundational upgrade to what these models can do.

---

## **Final Thoughts**

I have spent a lot of time working with LLM-driven agents, tool calling, and context engineering. Every year we get a step closer to models that do not only describe solutions but compute and verify them too.

Adding a runtime like Bun directly into the inference engine is a major step. Models gain the ability to execute precise logic whenever they need it, even during internal thinking.

This is a significant shift, and I believe it is only the beginning.

The code used in this post is available on GitHub: [https://github.com/irbull/llm-codegen-benchmark](https://github.com/irbull/llm-codegen-benchmark)

Or just wait for the [Fireship video to drop](https://www.youtube.com/watch?v=5JMiNsV7P3Y) 😉

