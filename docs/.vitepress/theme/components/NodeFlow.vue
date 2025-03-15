<script setup lang="ts">
import {
  Handle,
  MarkerType,
  Position,
  VueFlow,
  type Edge,
  type Node,
  type VueFlowStore,
} from "@vue-flow/core";
import { computed, ref } from "vue";

type FlowKind = "unit" | "scope" | "effect";
type Tone = "green" | "blue" | "amber" | "red" | "neutral";

interface FlowNodeData {
  title: string;
  lines: string[];
  tone: Tone;
}

interface FlowDiagram {
  title: string;
  description: string;
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
}

const props = defineProps<{
  kind: FlowKind;
}>();

const expanded = ref(false);
const previewFlow = ref<VueFlowStore | null>(null);
const fullscreenFlow = ref<VueFlowStore | null>(null);
const previewSize = { height: 90, width: 172 };
const fullscreenSize = { height: 126, width: 240 };
const previewViewport = { x: 20, y: 34, zoom: 0.78 };
const fullscreenViewport = { x: 88, y: 76, zoom: 0.56 };
const edgeColor = "#64748b";

const fullscreenPositions: Record<FlowKind, Record<string, { x: number; y: number }>> = {
  effect: {
    call: { x: 0, y: 360 },
    done: { x: 1650, y: 80 },
    execute: { x: 820, y: 360 },
    fail: { x: 1650, y: 640 },
    settle: { x: 1230, y: 360 },
    start: { x: 410, y: 360 },
  },
  scope: {
    id: { x: 480, y: 360 },
    scopeA: { x: 1030, y: 100 },
    scopeB: { x: 1030, y: 620 },
    store: { x: 0, y: 360 },
    valueA: { x: 1510, y: 100 },
    valueB: { x: 1510, y: 620 },
  },
  unit: {
    boundary: { x: 0, y: 360 },
    event: { x: 430, y: 360 },
    queue: { x: 860, y: 360 },
    reaction: { x: 1320, y: 80 },
    store: { x: 1320, y: 640 },
    subscribers: { x: 1750, y: 640 },
  },
};

const diagrams: Record<FlowKind, FlowDiagram> = {
  unit: {
    title: "A unit run moves through graph nodes",
    description:
      "Every queued work item carries a payload and a scope, so the graph can update the right state instance.",
    nodes: [
      node("boundary", 0, 142, "Boundary", ["allSettled", "event call"], "neutral"),
      node("event", 250, 142, "event.node", ["receives payload"], "green"),
      node("queue", 500, 142, "Kernel Queue", ["node", "payload", "scope"], "blue"),
      node("reaction", 780, 24, "reaction.node", ["runs rule"], "amber"),
      node("store", 780, 260, "store.node", ["commits value"], "green"),
      node("subscribers", 1030, 260, "Subscribers", ["same scope"], "neutral"),
    ],
    edges: [
      edge("boundary", "event", "run"),
      edge("event", "queue", "enqueue"),
      edge("queue", "reaction", "next"),
      edge("reaction", "store", "write"),
      edge("store", "subscribers", "notify"),
    ],
  },
  scope: {
    title: "The model is shared, values are scoped",
    description:
      "A store definition has one identity. Each scope keeps its own value for that identity.",
    nodes: [
      node("store", 0, 150, "store()", ["model field", "stable id"], "green"),
      node("id", 290, 150, "Store ID", ["symbol key"], "neutral"),
      node("scopeA", 640, 40, "Scope A", ["values map"], "blue"),
      node("valueA", 940, 40, "Value", ['"docs"'], "green"),
      node("scopeB", 640, 260, "Scope B", ["values map"], "blue"),
      node("valueB", 940, 260, "Value", ['"api"'], "green"),
    ],
    edges: [
      edge("store", "id", "owns"),
      edge("id", "scopeA", "lookup"),
      edge("id", "scopeB", "lookup"),
      edge("scopeA", "valueA", "read/write"),
      edge("scopeB", "valueB", "read/write"),
    ],
  },
  effect: {
    title: "Effects are node chains with lifecycle units",
    description:
      "The call starts lifecycle state, awaits the handler, then settles into success or failure units.",
    nodes: [
      node("call", 0, 150, "effect(params)", ["called in scope"], "neutral"),
      node("start", 260, 150, "Start Node", ["$inFlight +1", "emit started"], "green"),
      node("execute", 520, 150, "Execute Node", ["await handler", "with signal"], "blue"),
      node("settle", 780, 150, "Settle Node", ["cleanup", "$inFlight -1"], "amber"),
      node("done", 1060, 34, "Success", ["done", "doneData"], "green"),
      node("fail", 1060, 266, "Failure", ["fail", "failData"], "red"),
    ],
    edges: [
      edge("call", "start", "enqueue"),
      edge("start", "execute", "next"),
      edge("execute", "settle", "result"),
      edge("settle", "done", "status done"),
      edge("settle", "fail", "status fail"),
    ],
  },
};

const diagram = computed(() => diagrams[props.kind]);
const diagramText = computed(() => diagram.value);
const previewNodes = computed(() => cloneNodes(diagram.value.nodes, previewSize));
const previewEdges = computed(() => cloneEdges(diagram.value.edges, "preview"));
const fullscreenNodes = computed(() =>
  cloneNodes(diagram.value.nodes, fullscreenSize, fullscreenPositions[props.kind]),
);
const fullscreenEdges = computed(() => cloneEdges(diagram.value.edges, "fullscreen"));

function node(
  id: string,
  x: number,
  y: number,
  title: string,
  lines: string[],
  tone: Tone,
): Node<FlowNodeData> {
  return {
    id,
    data: { lines, title, tone },
    position: { x, y },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    type: "virentia",
  };
}

function edge(source: string, target: string, label: string): Edge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    label,
    type: "smoothstep",
    markerEnd: {
      color: edgeColor,
      height: 18,
      strokeWidth: 1.8,
      type: MarkerType.ArrowClosed,
      width: 18,
    },
    selectable: false,
    focusable: false,
    interactionWidth: 28,
    labelBgBorderRadius: 8,
    labelBgPadding: [8, 4],
    labelBgStyle: {
      fill: "var(--vp-c-bg)",
      stroke: "var(--vp-c-divider)",
    },
    labelStyle: {
      fill: "var(--vp-c-text-2)",
      fontSize: 13,
      fontWeight: 700,
    },
    style: {
      stroke: edgeColor,
      strokeWidth: 2.4,
    },
  };
}

function cloneNodes(
  nodes: Node<FlowNodeData>[],
  size: { height: number; width: number },
  positions: Record<string, { x: number; y: number }> = {},
): Node<FlowNodeData>[] {
  return nodes.map((item) => ({
    ...item,
    data: { ...item.data, lines: [...item.data.lines] },
    height: size.height,
    position: positions[item.id] ? { ...positions[item.id] } : { ...item.position },
    width: size.width,
  }));
}

function cloneEdges(edges: Edge[], mode: "preview" | "fullscreen"): Edge[] {
  const strokeWidth = mode === "fullscreen" ? 3 : 2.4;
  const fontSize = mode === "fullscreen" ? 15 : 13;

  return edges.map((item) => ({
    ...item,
    markerEnd: typeof item.markerEnd === "object" ? { ...item.markerEnd } : item.markerEnd,
    labelBgPadding: mode === "fullscreen" ? [10, 5] : item.labelBgPadding,
    labelStyle:
      typeof item.labelStyle === "object" ? { ...item.labelStyle, fontSize } : item.labelStyle,
    style: typeof item.style === "object" ? { ...item.style, strokeWidth } : item.style,
  }));
}

function onPreviewInit(flow: VueFlowStore): void {
  previewFlow.value = flow;
}

function onFullscreenInit(flow: VueFlowStore): void {
  fullscreenFlow.value = flow;
}

function zoomIn(flow: VueFlowStore | null): void {
  void flow?.zoomIn({ duration: 120 });
}

function zoomOut(flow: VueFlowStore | null): void {
  void flow?.zoomOut({ duration: 120 });
}

function fitPreviewControl(): void {
  void previewFlow.value?.fitView({
    duration: 120,
    maxZoom: 0.72,
    padding: { x: 42, y: 34 },
  });
}

function fitFullscreenControl(): void {
  void fullscreenFlow.value?.fitView({
    duration: 120,
    maxZoom: 0.72,
    padding: { x: 180, y: 160 },
  });
}
</script>

<template>
  <figure class="node-flow">
    <figcaption class="node-flow-caption">
      <span>
        <strong>{{ diagramText.title }}</strong>
        <span>{{ diagramText.description }}</span>
      </span>
      <button class="node-flow-open" type="button" @click="expanded = true">Full screen</button>
    </figcaption>

    <div class="node-flow-canvas node-flow-preview">
      <VueFlow
        :key="`${props.kind}-preview`"
        class="node-flow-instance"
        :nodes="previewNodes"
        :edges="previewEdges"
        :default-viewport="previewViewport"
        :fit-view-on-init="false"
        :min-zoom="0.45"
        :max-zoom="1.4"
        :nodes-draggable="false"
        :nodes-connectable="false"
        :elements-selectable="false"
        :nodes-focusable="false"
        :edges-focusable="false"
        :zoom-on-scroll="false"
        :zoom-on-pinch="true"
        :pan-on-scroll="false"
        :pan-on-drag="true"
        :zoom-on-double-click="true"
        :prevent-scrolling="false"
        @init="onPreviewInit"
      >
        <template #node-virentia="{ data }">
          <div class="node-flow-card" :class="`tone-${data.tone}`">
            <Handle class="node-flow-handle" type="target" :position="Position.Left" />
            <strong>{{ data.title }}</strong>
            <span v-for="line in data.lines" :key="line">{{ line }}</span>
            <Handle class="node-flow-handle" type="source" :position="Position.Right" />
          </div>
        </template>
      </VueFlow>
      <div class="node-flow-controls" aria-label="Diagram controls">
        <button type="button" aria-label="Zoom out" @click="zoomOut(previewFlow)">-</button>
        <button type="button" aria-label="Zoom in" @click="zoomIn(previewFlow)">+</button>
        <button class="node-flow-fit" type="button" @click="fitPreviewControl">Fit</button>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="expanded" class="node-flow-fullscreen">
        <div class="node-flow-fullscreen-header">
          <span>
            <strong>{{ diagramText.title }}</strong>
            <span>{{ diagramText.description }}</span>
          </span>
          <button class="node-flow-close" type="button" @click="expanded = false">Close</button>
        </div>

        <div class="node-flow-canvas node-flow-fullscreen-canvas">
          <VueFlow
            :key="`${props.kind}-fullscreen`"
            class="node-flow-instance"
            :nodes="fullscreenNodes"
            :edges="fullscreenEdges"
            :default-viewport="fullscreenViewport"
            :fit-view-on-init="false"
            :min-zoom="0.35"
            :max-zoom="1.2"
            :nodes-draggable="false"
            :nodes-connectable="false"
            :elements-selectable="false"
            :nodes-focusable="false"
            :edges-focusable="false"
            :zoom-on-scroll="true"
            :zoom-on-pinch="true"
            :pan-on-scroll="true"
            :pan-on-drag="true"
            :zoom-on-double-click="true"
            @init="onFullscreenInit"
          >
            <template #node-virentia="{ data }">
              <div class="node-flow-card node-flow-card-full" :class="`tone-${data.tone}`">
                <Handle class="node-flow-handle" type="target" :position="Position.Left" />
                <strong>{{ data.title }}</strong>
                <span v-for="line in data.lines" :key="line">{{ line }}</span>
                <Handle class="node-flow-handle" type="source" :position="Position.Right" />
              </div>
            </template>
          </VueFlow>
          <div class="node-flow-controls node-flow-controls-full" aria-label="Diagram controls">
            <button type="button" aria-label="Zoom out" @click="zoomOut(fullscreenFlow)">-</button>
            <button type="button" aria-label="Zoom in" @click="zoomIn(fullscreenFlow)">+</button>
            <button class="node-flow-fit" type="button" @click="fitFullscreenControl">Fit</button>
          </div>
        </div>
      </div>
    </Teleport>
  </figure>
</template>

<style scoped>
.node-flow {
  --node-flow-edge: color-mix(in srgb, var(--vp-c-text-3) 86%, transparent);
  --node-flow-shadow: 0 16px 46px color-mix(in srgb, var(--vp-c-black) 12%, transparent);

  margin: 28px 0;
}

.node-flow-caption,
.node-flow-fullscreen-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}

.node-flow-caption {
  margin-bottom: 12px;
}

.node-flow-caption strong,
.node-flow-fullscreen-header strong {
  display: block;
  color: var(--vp-c-text-1);
  font-size: 16px;
  line-height: 1.35;
}

.node-flow-caption span span,
.node-flow-fullscreen-header span span {
  display: block;
  max-width: 680px;
  margin-top: 4px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.5;
}

.node-flow-open,
.node-flow-close {
  flex: 0 0 auto;
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 7px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 13px;
  font-weight: 650;
  line-height: 1;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

.node-flow-open:hover,
.node-flow-close:hover {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-alt);
}

.node-flow-canvas {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background:
    linear-gradient(var(--vp-c-bg), var(--vp-c-bg)),
    radial-gradient(circle at 1px 1px, var(--vp-c-divider) 1px, transparent 0);
  background-size:
    100% 100%,
    22px 22px;
}

.node-flow-preview {
  height: 360px;
}

.node-flow-instance {
  width: 100%;
  height: 100%;
}

.node-flow-controls {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 5;
  display: flex;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: color-mix(in srgb, var(--vp-c-bg) 92%, transparent);
  box-shadow: 0 10px 28px color-mix(in srgb, var(--vp-c-black) 10%, transparent);
}

.node-flow-controls button {
  min-width: 34px;
  height: 34px;
  padding: 0 10px;
  border-right: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  font-size: 14px;
  font-weight: 760;
  line-height: 1;
}

.node-flow-controls button:last-child {
  border-right: 0;
}

.node-flow-controls button:hover {
  background: var(--vp-c-bg-soft);
}

.node-flow-controls .node-flow-fit {
  min-width: 42px;
  font-size: 12px;
}

.node-flow-controls-full {
  right: 18px;
  bottom: 18px;
}

.node-flow-card {
  box-sizing: border-box;
  width: 172px;
  min-height: 90px;
  padding: 14px 16px;
  overflow: hidden;
  border: 2px solid var(--node-border);
  border-radius: 8px;
  background: var(--node-bg);
  box-shadow: var(--node-flow-shadow);
  color: var(--vp-c-text-1);
}

.node-flow-card strong {
  display: block;
  margin-bottom: 8px;
  overflow-wrap: anywhere;
  color: var(--vp-c-text-1);
  font-size: 18px;
  font-weight: 760;
  line-height: 1.18;
}

.node-flow-card span {
  display: block;
  overflow-wrap: anywhere;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 620;
  line-height: 1.28;
}

.node-flow-card-full {
  width: 240px;
  min-height: 126px;
  padding: 20px 22px;
}

.node-flow-card-full strong {
  margin-bottom: 10px;
  font-size: 22px;
}

.node-flow-card-full span {
  font-size: 15px;
  line-height: 1.34;
}

.tone-green {
  --node-bg: #ecfdf5;
  --node-border: #10b981;
}

.tone-blue {
  --node-bg: #eff6ff;
  --node-border: #3b82f6;
}

.tone-amber {
  --node-bg: #fffbeb;
  --node-border: #d97706;
}

.tone-red {
  --node-bg: #fef2f2;
  --node-border: #ef4444;
}

.tone-neutral {
  --node-bg: #f8fafc;
  --node-border: #64748b;
}

.node-flow-fullscreen {
  position: fixed;
  z-index: 9999;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--vp-c-bg);
}

.node-flow-fullscreen-header {
  flex: 0 0 auto;
  padding: 18px 22px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

.node-flow-fullscreen-canvas {
  flex: 1 1 auto;
  min-height: 0;
  border: 0;
  border-radius: 0;
}

.node-flow :deep(.vue-flow),
.node-flow-fullscreen :deep(.vue-flow) {
  --vf-node-bg: transparent;
  --vf-node-color: transparent;
  --vf-node-text: var(--vp-c-text-1);
  --vf-handle: transparent;

  background: transparent;
}

.node-flow :deep(.vue-flow__node),
.node-flow-fullscreen :deep(.vue-flow__node) {
  border: 0;
  background: transparent;
  box-shadow: none;
}

.node-flow :deep(.vue-flow__node-virentia),
.node-flow-fullscreen :deep(.vue-flow__node-virentia) {
  width: auto;
  padding: 0;
  border: 0;
  background: transparent;
}

.node-flow :deep(.vue-flow__handle),
.node-flow-fullscreen :deep(.vue-flow__handle) {
  width: 1px;
  height: 1px;
  border: 0;
  opacity: 0;
  pointer-events: none;
}

.node-flow :deep(.vue-flow__edge-path),
.node-flow-fullscreen :deep(.vue-flow__edge-path) {
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.node-flow :deep(.vue-flow__edge-text),
.node-flow-fullscreen :deep(.vue-flow__edge-text) {
  fill: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 700;
}

.node-flow :deep(.vue-flow__edge-textbg),
.node-flow-fullscreen :deep(.vue-flow__edge-textbg) {
  fill: var(--vp-c-bg);
  stroke: var(--vp-c-divider);
  stroke-width: 1px;
}

.node-flow :deep(.vue-flow__attribution),
.node-flow-fullscreen :deep(.vue-flow__attribution) {
  display: none;
}

.node-flow-fullscreen :deep(.vue-flow__edge-text) {
  font-size: 15px;
}

.dark .node-flow-card.tone-green {
  --node-bg: #10251d;
  --node-border: #10b981;
}

.dark .node-flow-card.tone-blue {
  --node-bg: #101f35;
  --node-border: #3b82f6;
}

.dark .node-flow-card.tone-amber {
  --node-bg: #2d220f;
  --node-border: #d97706;
}

.dark .node-flow-card.tone-red {
  --node-bg: #2f1518;
  --node-border: #ef4444;
}

.dark .node-flow-card.tone-neutral {
  --node-bg: #191b20;
  --node-border: #64748b;
}

@media (max-width: 640px) {
  .node-flow-caption,
  .node-flow-fullscreen-header {
    align-items: stretch;
    flex-direction: column;
  }

  .node-flow-open,
  .node-flow-close {
    width: max-content;
  }

  .node-flow-preview {
    height: 330px;
  }
}
</style>
