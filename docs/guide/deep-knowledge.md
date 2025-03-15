# Deep Knowledge

This page explains how Virentia works under the public API. You do not need it for ordinary application code. It is useful when you are writing adapters, debugging execution order, or deciding where a new primitive belongs.

## Units Are Graph Nodes

The public API talks about stores, events, effects, and reactions. Internally, each of them owns or creates graph nodes. A node is a small piece of executable graph work. Nodes are linked through `next`, so one unit can trigger another unit without knowing what it is connected to.

<NodeFlow kind="unit" />

When a boundary runs an event, Virentia does not immediately walk the whole graph by recursion. It creates work for the kernel queue. That work item contains the node, the payload, the scope, and execution contexts. The queue then flushes nodes in order.

This is why payload and scope travel together. The payload tells the next node what happened. The scope tells stores where values should be read or written.

## Stores Are Definitions, Scopes Hold Values

A store is not the value itself. The store owns a stable identity and knows how to read and write through that identity. The scope owns the actual values map.

<NodeFlow kind="scope" />

When code reads `query.value`, the store takes the scope from the current execution context, then looks up its own store id in that scope. If the value is missing, the store returns its initial value.

When code writes `query.value = "docs"`, the store runs its node in the current scope. The node commits the new value into `scope.values` and notifies subscribers that are watching that same scope.

This split is the reason model code is reusable. The model can be imported once, while each app instance, request, test, or cached screen gets its own value map.

## Reactions Are Edges With Behavior

An explicit reaction attaches a reaction node to the source unit.

For example, when a reaction listens to `queryChanged`, Virentia adds the reaction node to `queryChanged.node.next`. When the event runs, the kernel eventually reaches that reaction node with the same payload and scope. The reaction body can then write stores, call effects, or run other model logic.

Automatic reactions are the default mode for most model rules. At creation time, they run once and collect stores read during that run. Those store nodes become dependencies. When one dependency changes later, the reaction runs again and refreshes the dependency list.

Explicit reactions remain the alternative for places where the trigger itself matters: an event, effect, or lifecycle unit. In that form `on` makes the source and payload part of the rule.

## Effects Are Node Chains

An effect is not just an async function. It is a small graph around an async function.

<NodeFlow kind="effect" />

The start node increments `$inFlight`, updates `$pending`, and emits `started`. The execute node awaits the handler. The settle node decrements `$inFlight`, updates `$pending`, and emits success or failure units.

That lifecycle is available as normal units: `done`, `doneData`, `fail`, `failData`, `settled`, `$pending`, and `$inFlight`. Model code can react to those units exactly like it reacts to events.

Abort support is tied to each running call. The handler receives an `AbortSignal`, and disposing an owner can abort effect calls created inside that owner.

## The Kernel Queue

The kernel queue gives graph execution a controlled order. A node can return a value, stop the current branch, fail the current branch, or enqueue downstream nodes.

Each queued item carries:

- the node to run;
- the payload that entered this branch;
- the current value produced by the previous node;
- the scope;
- execution contexts;
- metadata used by integrations.

The scope is always part of the queued work. That is the important bit: once a unit starts in a scope, downstream nodes receive that same scope unless a lower-level integration intentionally changes it.

## Boundaries And Scope Context

`allSettled(unit, { scope })` is the cleanest boundary because scope is explicit. It creates graph work with the given scope and waits until async graph work settles.

`scoped(scope, fn)` is a short execution frame. It puts the scope into the current execution context so store reads and writes can happen in plain code. When the callback returns, the previous scope context is restored.

If the callback returns a promise, `scoped(scope, fn)` keeps that scope for the promise chain until it settles. It is useful for application-owned async work, but it should not be treated as a universal async context system for every parallel flow.

`scoped(scope).wrap(fn)` is the integration tool. It captures a scope once and reopens it when another library calls your callback later.

## Owners And Cleanup

Owners exist because runtime-created models need a way to detach work. Reactions, subscriptions, and cleanup callbacks registered inside an owner are tied to that owner.

When the owner is disposed, Virentia runs cleanup callbacks and detaches graph edges created inside it. This keeps dynamic models from leaving reactions behind after a modal, tab, or cached screen is removed.

## Practical Value

Most application code should not think about nodes. It should talk in stores, events, effects, reactions, scopes, and owners.

The node model matters when you build framework bindings, compatibility layers, persistence helpers, test helpers, devtools, or a new primitive. At that level, the key questions are always the same: what node runs, what payload travels, which scope owns the values, and who cleans up the edges later?
