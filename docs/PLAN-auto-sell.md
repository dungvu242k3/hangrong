# Project Plan - Stall Auto-Sell and NPC Interactions

This plan outlines the design and implementation for the automated customer purchase and coin collection loop.

## The New Automated Gameplay Loop
1. **Item Placement**: The player places a product on a slot (e.g. Bread).
2. **Countdown**: The countdown timer ticks down normally from the product's base duration (e.g. 60s).
3. **Ready to Collect**: When the timer hits 0:
   * The slot is marked as `isReadyToCollect = true`.
   * Instead of turning into a static "XU 💰" label requiring a manual click, the slot continues showing the product visual (emoji) with a glowing green border, indicating it is ready to be purchased.
4. **NPC Auto-Buy**: 
   * A customer NPC walks up to the ready slot.
   * Upon arrival at the slot, the customer NPC "buys" the item.
   * This automatically triggers the `collectCoins` mutation on the frontend, calling `/api/selling/slots/{id}/collect` behind the scenes.
5. **Auto-Harvest & Resolution**:
   * The coins are awarded to the player balance.
   * Flying coin animations play on screen.
   * The slot is automatically cleared back to `"TRỐNG"` (empty).
   * The customer NPC displays a happy `"❤️"` bubble and walks off-screen.

---

## Proposed Changes

### WebGL Game Scene

#### [MODIFY] [StallScene.ts](file:///c:/Users/dungv/hangrong/frontend/src/game/scenes/StallScene.ts)
*   **Ready Visuals**: Modify `triggerClaimReadyVisual` to keep showing the product emoji icon, but styled with a pulsing green ready border. Remove the static "XU 💰" text swap.
*   **Customer NPC Spawning**: Update `spawnCustomer` and the spawn timer logic. When a slot is ready to collect (`isReadyToCollect === true`), prioritize spawning a customer targeting that slot if no customer is currently heading there.
*   **Auto-Harvest Action**: In the ticker loop, when a customer NPC arrives (`state === "buying"`) at a slot that `isReadyToCollect === true`:
    *   Directly invoke `this.harvestSlot(slotIndex)` to emit `"game:coin_collected"`.
    *   This automates the collection API call without requiring the user to click the canvas slot.

### React Integration

#### [MODIFY] [stall/page.tsx](file:///c:/Users/dungv/hangrong/frontend/src/app/stall/page.tsx)
*   Ensure that the `"game:coin_collected"` listener handles the automatic callback correctly and updates the Zustand/React query cache seamlessly.

---

## Task Breakdown

### Task 1: Update PixiJS StallScene for Auto-Harvest on NPC Arrival
*   **Description**: Modify the ticker loop and NPC arrival logic in `StallScene.ts` to automatically call `harvestSlot` when a customer reaches a ready slot.
*   **Agent**: `frontend-specialist`

### Task 2: Implement Pulsing Ready Border & Spawning Prioritization
*   **Description**: Update visual styles and spawn target logic in `StallScene.ts` to guide customer NPCs to ready slots and show a pulsing green border.
*   **Agent**: `frontend-specialist`

### Task 3: Build & Type Validation
*   **Description**: Run `npx tsc --noEmit`.
*   **Agent**: `frontend-specialist`

---

## Phase X: Verification

- [ ] Lint & TypeScript Check: `npx tsc --noEmit`
- [ ] Manual test: Place bread, wait for countdown to reach 0. Verify that a customer walks up, the bread disappears, coins fly, the balance increases, and the slot resets to "TRỐNG" automatically.
