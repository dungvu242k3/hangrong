# Project Plan - Stall Customer Buying Logic Fix

This plan details the implementation of a more realistic customer NPC behavior logic on the stall page. Customers will target slots correctly based on whether they contain items, and display appropriate reactions (happy buying for occupied slots, disappointed look for empty slots).

## Overview
Currently, customer NPCs select a slot to visit completely at random. When they arrive, they automatically say they want to buy the default fallback item (bread) even if that slot is empty. We will fix this logic so that:
1. Customers target a specific slot.
2. If the slot has a product, they buy it, display a "MUA [Vật phẩm]!" bubble, wait, and leave happily (showing a heart "❤️" bubble).
3. If the slot is empty, they walk to it, see it is empty, display a "HẾT HÀNG... ❌" or "TRỐNG TRƠN... 🔍" bubble, wait a shorter duration, and leave disappointed (showing a sad "😢" bubble).

---

## Project Type
**WEB** (Next.js & PixiJS WebGL Canvas)

---

## Tech Stack
*   **PixiJS v8**: Renders the 2D game scene and NPC graphics/animations.
*   **eventemitter3**: Coordinates events between React and PixiJS.

---

## Success Criteria
*   Customers stop at the chosen slot.
*   If the slot contains an item, the speech bubble displays the correct item name/emoji, and they leave happily.
*   If the slot is empty, they display a disappointment bubble and leave.
*   Zero compilation errors or runtime crashes.

---

## Proposed File Changes

### WebGL Game Scene

#### [MODIFY] [StallScene.ts](file:///c:/Users/dungv/hangrong/frontend/src/game/scenes/StallScene.ts)
*   Update `customerBuyAction` to check if `slot.productId !== null`.
*   If occupied, display `MUA ${emoji}!` and happy resolution with `❤️`.
*   If empty, display `HẾT HÀNG... ❌` and disappointed resolution with `😢` after a shorter timeout (2.5s instead of 4s).

---

## Task Breakdown

### Task 1: Decouple & Refactor Customer NPC Decision Logic
*   **Description**: Modify `StallScene.ts` to implement conditional customer speech bubbles and animations based on slot occupancy.
*   **Agent**: `frontend-specialist`
*   **Input**: `StallScene.ts`
*   **Output**: Modified `StallScene.ts`
*   **Verify**: Check that both the occupied slot bubble (MUA!) and the empty slot bubble (HẾT HÀNG...) display correctly based on slot state.

### Task 2: Build & Type Validation
*   **Description**: Run TypeScript compile check.
*   **Agent**: `frontend-specialist`
*   **Input**: Frontend repository
*   **Output**: Successful compilation output
*   **Verify**: Run `npx tsc --noEmit` and confirm zero errors.

---

## Phase X: Verification

- [ ] Lint & TypeScript Check: `npx tsc --noEmit`
- [ ] No purple/violet color hex codes added
- [ ] Manual test: Refresh, check empty sạp behavior, place item, check occupied sạp behavior.
