import assert from "node:assert";

// Re-implement the pure fingerprint and merge functions for Node ESM testing
const ENGINE_METADATA_DENYLIST = new Set([
  "gateId",
  "gate_id",
  "fileId",
  "file_id",
  "id",
  "timestamp",
  "createdAt",
  "created_at",
]);

function canonicalStringify(obj) {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return JSON.stringify(obj) ?? "";
  }
  if (Array.isArray(obj)) {
    return `[${obj.map(canonicalStringify).join(",")}]`;
  }
  const keys = Object.keys(obj).sort();
  const pairs = keys
    .filter((k) => !ENGINE_METADATA_DENYLIST.has(k))
    .filter((k) => obj[k] !== undefined && obj[k] !== null)
    .map((k) => `${JSON.stringify(k)}:${canonicalStringify(obj[k])}`);
  return `{${pairs.join(",")}}`;
}

function fnv1a(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}

function computeEventFingerprint(event) {
  const type = event.type;
  const data = (event.data ?? {});
  const step = data?.stepIndex != null ? `step:${data.stepIndex}` : "";

  switch (type) {
    case "approval_gate": {
      const target = data?.pendingAction?.target ?? data?.pending_action?.target ?? "";
      const gateDesc = data?.title ? `${data.title}:${target}` : fnv1a(canonicalStringify(data?.payload ?? {}));
      return `approval_gate:${step}:${gateDesc}`;
    }
    case "file_created":
      return `file_created:${data?.fileName || data?.file_name || data?.fileUrl || data?.file_url || fnv1a(canonicalStringify(data))}`;
    case "checklist":
      return `checklist:${step}:${data?.title || fnv1a(canonicalStringify(data?.items ?? data))}`;
    case "progress":
      return `progress:${data?.stepIndex ?? data?.stepDescription ?? data?.step_description ?? "active"}`;
    default:
      return `${type}:${step}:${fnv1a(canonicalStringify(data))}`;
  }
}

function mergeEventData(existing = {}, incoming = {}) {
  const result = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    if (value !== undefined && value !== null) {
      result[key] = value;
    }
  }
  return result;
}

function mergeStreamEvents(current, incoming) {
  const incomingFingerprint = computeEventFingerprint(incoming.event);
  const index = current.findIndex(
    (e) => computeEventFingerprint(e.event) === incomingFingerprint || e.id === incoming.id,
  );

  if (index === -1) {
    return [...current, incoming];
  }

  const existing = current[index];
  const updatedEvent = {
    ...existing,
    ...incoming,
    event: {
      ...existing.event,
      ...incoming.event,
      data: mergeEventData(existing.event.data, incoming.event.data),
    },
  };

  const updated = [...current];
  updated[index] = updatedEvent;
  return updated;
}

// -------------------------------------------------------------
// TESTS
// -------------------------------------------------------------

console.log("Starting Stream Resilience & Deduplication Unit Tests...\n");

// Test 1: stepIndex null vs undefined parity for approval_gate
{
  const sseGate = {
    id: "sse-uuid-1",
    activityId: "act_123",
    timestamp: "2026-08-17T12:00:00Z",
    event: {
      type: "approval_gate",
      data: {
        title: "Post July Accruals",
        pendingAction: { target: "qbo", args: { account: "1000" } },
        payload: { lines: [{ amount: 500 }] },
        // stepIndex omitted / undefined
      },
    },
  };

  const queueGate = {
    id: "queue-gate-db-999",
    activityId: "act_123",
    timestamp: "2026-08-17T12:00:01Z",
    event: {
      type: "approval_gate",
      data: {
        gateId: "gate_999",
        title: "Post July Accruals",
        pendingAction: { target: "qbo", args: { account: "1000" } },
        payload: { lines: [{ amount: 500 }] },
        stepIndex: null, // from DB nullable column
      },
    },
  };

  const fp1 = computeEventFingerprint(sseGate.event);
  const fp2 = computeEventFingerprint(queueGate.event);
  assert.strictEqual(fp1, fp2, `Fingerprints should match: ${fp1} === ${fp2}`);

  // Merge in both orders
  let list = [sseGate];
  list = mergeStreamEvents(list, queueGate);
  assert.strictEqual(list.length, 1, "Queue gate should merge into existing SSE gate without duplicate");
  assert.strictEqual(list[0].event.data.gateId, "gate_999", "gateId should be enriched from queue gate");

  console.log("✓ Test 1 Passed: stepIndex null vs undefined parity & deduplication verified.");
}

// Test 2: Non-clobbering merge preserves gateId on subsequent SSE event
{
  const queueGate = {
    id: "queue-gate-db-999",
    activityId: "act_123",
    event: {
      type: "approval_gate",
      data: {
        gateId: "gate_999",
        title: "Confirm Fixed Assets",
        pendingAction: { target: "qbo" },
      },
    },
  };

  const lateSseGateWithoutGateId = {
    id: "sse-uuid-2",
    activityId: "act_123",
    event: {
      type: "approval_gate",
      data: {
        title: "Confirm Fixed Assets",
        pendingAction: { target: "qbo" },
        gateId: undefined, // SSE copy lacks gateId
      },
    },
  };

  let list = [queueGate];
  list = mergeStreamEvents(list, lateSseGateWithoutGateId);
  assert.strictEqual(list.length, 1, "Should merge into single event");
  assert.strictEqual(
    list[0].event.data.gateId,
    "gate_999",
    "gateId from queue must survive when late SSE event arrives without it",
  );

  console.log("✓ Test 2 Passed: Non-clobbering merge preserves engine gateId.");
}

// Test 3: Engine metadata denylist prevents hash divergence
{
  const payload1 = {
    amount: 1500,
    memo: "Prepaid Software",
    id: "msg_123",
    gateId: "gate_abc",
    fileId: "file_xyz",
    createdAt: "2026-08-17T12:00:00Z",
  };

  const payload2 = {
    memo: "Prepaid Software",
    amount: 1500,
    // keys in different order, missing engine IDs
  };

  const hash1 = fnv1a(canonicalStringify(payload1));
  const hash2 = fnv1a(canonicalStringify(payload2));
  assert.strictEqual(hash1, hash2, `Canonical hashes should match regardless of engine keys and order: ${hash1} === ${hash2}`);

  console.log("✓ Test 3 Passed: Canonical hasher excludes engine denylist and handles key reordering.");
}

// Test 4: Distinct tables/schedules with same stepIndex do not collapse
{
  const scheduleA = {
    id: "table-1",
    activityId: "act_1",
    event: {
      type: "table",
      data: {
        stepIndex: 1,
        title: "Amortization Schedule",
        columns: ["Month", "Amount"],
        rows: [["Jan", 100], ["Feb", 100]],
      },
    },
  };

  const scheduleB = {
    id: "table-2",
    activityId: "act_1",
    event: {
      type: "table",
      data: {
        stepIndex: 1,
        title: "Amortization Schedule",
        columns: ["Month", "Amount"],
        rows: [["Mar", 200], ["Apr", 200]],
      },
    },
  };

  const fpA = computeEventFingerprint(scheduleA.event);
  const fpB = computeEventFingerprint(scheduleB.event);
  assert.notStrictEqual(fpA, fpB, "Distinct schedules with different row data must produce distinct fingerprints");

  let list = [scheduleA];
  list = mergeStreamEvents(list, scheduleB);
  assert.strictEqual(list.length, 2, "Both distinct schedules must be preserved");

  console.log("✓ Test 4 Passed: Content-hash fallback prevents schedule collision.");
}

// Test 5: In-place plan updates (checklist with same title)
{
  const draftPlan = {
    id: "plan-1",
    activityId: "act_1",
    event: {
      type: "checklist",
      data: {
        title: "Proposed Plan",
        items: [{ text: "Step 1: Parse CSV", done: false }],
      },
    },
  };

  const revisedPlan = {
    id: "plan-2",
    activityId: "act_1",
    event: {
      type: "checklist",
      data: {
        title: "Proposed Plan",
        items: [
          { text: "Step 1: Parse CSV", done: true },
          { text: "Step 2: Match GL entries", done: false },
        ],
      },
    },
  };

  let list = [draftPlan];
  list = mergeStreamEvents(list, revisedPlan);
  assert.strictEqual(list.length, 1, "Proposed Plan updates in-place");
  assert.strictEqual(list[0].event.data.items.length, 2, "Items updated to revised plan");

  console.log("✓ Test 5 Passed: In-place checklist plan updates verified.");
}

console.log("\nALL 5 TESTS PASSED SUCCESSFULLY! 🎉");
