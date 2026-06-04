# Project Plan - Stall NPC Visitor Buying Logic Fix

This plan details the implementation of a visitor-only buy mechanic for the stall slots. The player will not be able to manually harvest slots immediately after the timer expires; instead, the slot will wait for a customer NPC to walk up and buy the item before harvesting.

## Overview
Currently, when a slot's timer reaches 0, it changes to a "Ready to Collect" state. If the player clicks the slot, they can collect the coins immediately. Under the new logic:
1. **Waiting for Buyer State**: When the countdown timer reaches 0, the slot is marked as waiting for a buyer. It displays the product with a visual indicator (e.g., "Chờ khách...") and prevents manual click harvesting.
2. **NPC Spawning and Walk**: Customer NPCs will spawn and walk to the ready slot as before.
3. **NPC Purchase**: Once the customer NPC reaches the slot and changes state to "buying", the sale completes. The client triggers the `/api/selling/slots/{id}/collect` API, plays the flying coins animation, and resets the slot.
4. **Click Prevention**: If the player clicks a slot that is waiting for a buyer but has no customer NPC present, it will not harvest. It will show a feedback text like "Đang chờ người mua..." (Waiting for buyer...).

---

## Project Type
**WEB** (Next.js & PixiJS WebGL Canvas)

---

## Success Criteria
* Slots whose selling timers have reached 0 cannot be harvested by manual player clicks before the customer NPC arrives.
* Clicking a slot that is waiting for a buyer shows a floating feedback text: "Đang chờ người mua... 🏪".
* When the customer NPC arrives at the slot, it triggers the coin collection API, plays the coin animation, and clears the slot correctly.
* Visual indicators distinguish between a slot currently selling and a slot waiting for a buyer.

---

## Proposed File Changes

### WebGL Game Scene

#### [MODIFY] [StallScene.ts](file:///c:/Users/dungv/hangrong/frontend/src/game/scenes/StallScene.ts)
*   **Disable Manual Click Harvest**: Update `handleSlotClick` so that if `slot.isReadyToCollect` is true, it checks if a customer NPC is currently at the slot (`state === "buying"`). If not, display a floating notification text "Đang chờ người mua... 🏪" using a temporary text effect and do NOT call `harvestSlot`.
*   **Visual Indicator for "Chờ Khách"**: In `updateSlotVisual` and `update`, adjust colors or borders of ready slots to indicate they are waiting for a buyer (e.g., a pulsing yellow/blue border or a small subtext under the emoji) instead of showing the "ready to collect" green border immediately, which suggests manual action is possible.

---

## Task Breakdown

### Task 1: Update PixiJS StallScene to Block Manual Clicks & Add Waiting Visuals
*   **Description**: Modify `StallScene.ts` to check NPC arrival status before allowing `harvestSlot` via player clicks. Add floating text feedback when clicked prematurely, and adjust slot ready borders/indicator styling to represent "waiting for buyer".
*   **Agent**: `frontend-specialist`
*   **Input**: `StallScene.ts`
*   **Output**: Modified `StallScene.ts` with blocked manual click and updated visual indicators.
*   **Verify**: Place an item on the stall, wait for the timer to reach 0. Click the slot before any customer NPC arrives. Verify that it shows "Đang chờ người mua... 🏪" and does NOT harvest the slot.

### Task 2: Build & Type Validation
*   **Description**: Run TypeScript compile check.
*   **Agent**: `frontend-specialist`
*   **Input**: Frontend repository
*   **Output**: Successful compilation output
*   **Verify**: Run `npx tsc --noEmit` and confirm zero errors.

---

## Phase X: Verification

- [ ] Lint & TypeScript Check: `npx tsc --noEmit`
- [ ] Manual test: Place bread, wait for countdown to reach 0.
- [ ] Manual test: Click the slot before customer NPC arrives. Verify coins are NOT harvested and a "Đang chờ người mua..." label floats up.
- [ ] Manual test: Allow customer NPC to walk up. Verify that the NPC buys the item, triggers the `/collect` API, plays the coin animation, and resets the slot.
