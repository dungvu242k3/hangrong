import { Container, Graphics, Text, TextStyle, Ticker } from "pixi.js";
import { gameEmitter } from "../events/gameEmitter";

interface SlotData {
  id: string;
  x: number;
  y: number;
  productId: string | null;
  productName: string | null;
  productIcon: string | null;
  timeRemaining: number;
  totalTime: number;
  isReadyToCollect: boolean;
  coinsReward: number;
}

interface CustomerNPC {
  container: Container;
  graphics: Graphics;
  speechBubble?: Container;
  targetX: number;
  state: "walking_in" | "buying" | "leaving";
  speed: number;
  slotIndex: number; // Target slot to buy from
}

export class StallScene {
  private parentContainer: Container;
  private container: Container;
  
  // Game layers
  private bgLayer: Container;
  private stallLayer: Container;
  private productLayer: Container;
  private customerLayer: Container;
  private effectLayer: Container;

  // Level & Stats
  private stallLevel: number = 1;

  // Slots positioning (3 slots for lvl 1)
  private slots: SlotData[] = [
    { id: "slot1", x: 220, y: 380, productId: null, productName: null, productIcon: null, timeRemaining: 0, totalTime: 0, isReadyToCollect: false, coinsReward: 0 },
    { id: "slot2", x: 400, y: 380, productId: null, productName: null, productIcon: null, timeRemaining: 0, totalTime: 0, isReadyToCollect: false, coinsReward: 0 },
    { id: "slot3", x: 580, y: 380, productId: null, productName: null, productIcon: null, timeRemaining: 0, totalTime: 0, isReadyToCollect: false, coinsReward: 0 },
  ];

  // Render arrays
  private slotGraphics: Graphics[] = [];
  private slotTexts: Text[] = [];
  private activeCustomers: CustomerNPC[] = [];
  private flyingCoins: Array<{ graphics: Graphics; x: number; y: number; tx: number; ty: number; progress: number }> = [];

  // Ticker listener reference
  private updateFn: () => void;

  constructor(parentContainer: Container) {
    this.parentContainer = parentContainer;
    this.container = new Container();
    this.parentContainer.addChild(this.container);

    // Initialize layers
    this.bgLayer = new Container();
    this.stallLayer = new Container();
    this.productLayer = new Container();
    this.customerLayer = new Container();
    this.effectLayer = new Container();

    this.container.addChild(this.bgLayer);
    this.container.addChild(this.stallLayer);
    this.container.addChild(this.productLayer);
    this.container.addChild(this.customerLayer);
    this.container.addChild(this.effectLayer);

    // Setup rendering elements
    this.drawStreetBackground();
    this.drawStallTable();
    this.drawSlots();

    // Hook game ticker loop
    this.updateFn = this.update.bind(this);
    Ticker.shared.add(this.updateFn);

    // Hook Event listeners
    this.setupEventListeners();

    // Spawn customers interval
    this.startCustomerSpawnTimer();
  }

  // 1. DRAW STREET SIDELINES
  private drawStreetBackground() {
    const bg = new Graphics();
    
    // sidewalk (Slate Gray background)
    bg.rect(0, 300, 800, 300);
    bg.fill(0xE2E8F0); // light gray slate
    
    // Street curb line
    bg.rect(0, 480, 800, 10);
    bg.fill(0xCBD5E1);

    // Brick cracks/accents
    bg.rect(150, 300, 4, 180);
    bg.rect(450, 300, 4, 180);
    bg.rect(700, 300, 4, 180);
    bg.fill(0xCBD5E1);

    this.bgLayer.addChild(bg);
  }

  // 2. DRAW WOODEN STALL & STRIPED AWNING
  private drawStallTable() {
    this.stallLayer.removeChildren();
    
    const table = new Graphics();

    // Stall Awning poles
    table.rect(120, 180, 8, 220); // Left pole
    table.rect(670, 180, 8, 220); // Right pole
    table.fill(0x475569); // Metallic gray

    // Wooden Table base
    table.roundRect(100, 360, 600, 60, 12);
    table.fill(0xD97706); // Warm orange-brown
    table.stroke({ color: 0xB45309, width: 3 });

    // Table legs
    table.rect(150, 420, 20, 70);
    table.rect(630, 420, 20, 70);
    table.fill(0x78350F);

    // Awake awning (Striped Red & White bạt che)
    // Awning base shape
    table.moveTo(80, 180);
    table.lineTo(720, 180);
    table.lineTo(700, 130);
    table.lineTo(100, 130);
    table.closePath();
    table.fill(0xEF4444); // Red stripes default background

    // Striped overlays
    for (let i = 0; i < 7; i++) {
      if (i % 2 === 0) {
        const stripe = new Graphics();
        stripe.moveTo(100 + i * 85, 130);
        stripe.lineTo(100 + (i + 1) * 85, 130);
        stripe.lineTo(80 + (i + 1) * 90, 180);
        stripe.lineTo(80 + i * 90, 180);
        stripe.closePath();
        stripe.fill(0xFFFFFF); // White stripe overlays
        this.stallLayer.addChild(stripe);
      }
    }

    // Front scallops of awning
    for (let i = 0; i < 7; i++) {
      table.circle(125 + i * 90, 180, 12);
      table.fill(i % 2 === 0 ? 0xFFFFFF : 0xEF4444);
    }

    // Title banner: "SẠP CỦA BẠN"
    const textStyle = new TextStyle({
      fontFamily: "Arial",
      fontSize: 16,
      fontWeight: "bold",
      fill: "#FFFFFF",
      stroke: { color: "#78350F", width: 3 },
      dropShadow: { color: "#000000", alpha: 0.2, blur: 4, distance: 2 },
    });
    const bannerText = new Text({ text: `SẠP HÀNG CẤP ${this.stallLevel}`, style: textStyle });
    bannerText.x = 400 - bannerText.width / 2;
    bannerText.y = 145;

    this.stallLayer.addChild(table);
    this.stallLayer.addChild(bannerText);
  }

  // 3. DRAW EMPTY SLOT LOCATIONS
  private drawSlots() {
    this.slotGraphics.forEach((g) => this.productLayer.removeChild(g));
    this.slotTexts.forEach((t) => this.productLayer.removeChild(t));
    
    this.slotGraphics = [];
    this.slotTexts = [];

    const textStyle = new TextStyle({
      fontFamily: "Arial",
      fontSize: 11,
      fontWeight: "bold",
      fill: "#64748B",
    });

    this.slots.forEach((slot, index) => {
      const slotContainer = new Graphics();
      
      // Draw background circle
      slotContainer.circle(slot.x, slot.y, 35);
      slotContainer.fill(0xFFFFFF);
      slotContainer.stroke({ color: 0xE2E8F0, width: 3 });
      
      // Make interactive
      slotContainer.eventMode = "static";
      slotContainer.cursor = "pointer";
      slotContainer.on("pointerdown", () => this.handleSlotClick(index));

      // Draw item shadow indicator
      slotContainer.ellipse(slot.x, slot.y + 10, 20, 6);
      slotContainer.fill(0xF1F5F9);

      this.productLayer.addChild(slotContainer);
      this.slotGraphics.push(slotContainer);

      // Label text ("Trống")
      const label = new Text({ text: "TRỐNG", style: textStyle });
      label.x = slot.x - label.width / 2;
      label.y = slot.y - label.height / 2;
      this.productLayer.addChild(label);
      this.slotTexts.push(label);
    });
  }

  // 4. CUSTOMER SPONSOR CYCLE
  private startCustomerSpawnTimer() {
    const spawn = () => {
      // Limit total active customers
      if (this.activeCustomers.length < 3) {
        this.spawnCustomer();
      }
      // Re-trigger timer
      setTimeout(spawn, 5000 + Math.random() * 5000);
    };
    setTimeout(spawn, 3000);
  }

  private spawnCustomer() {
    const container = new Container();
    this.customerLayer.addChild(container);

    const graphics = new Graphics();
    
    // Choose random chibi colors
    const colors = [0xFDA4AF, 0x93C5FD, 0xA7F3D0, 0xFDE047];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Body Chibi (Cute circle)
    graphics.circle(0, -25, 20);
    graphics.fill(color);
    graphics.stroke({ color: 0x1E293B, width: 2 });

    // Eyes
    graphics.circle(-6, -28, 2.5);
    graphics.circle(6, -28, 2.5);
    graphics.fill(0x1E293B);

    // Mouth
    graphics.arc(0, -22, 4, 0, Math.PI);
    graphics.stroke({ color: 0x1E293B, width: 1.5 });

    // Little Chibi legs
    graphics.rect(-8, -5, 4, 5);
    graphics.rect(4, -5, 4, 5);
    graphics.fill(0x475569);

    container.addChild(graphics);

    // Start position (walk in from edges)
    const walkFromLeft = Math.random() > 0.5;
    container.x = walkFromLeft ? -50 : 850;
    container.y = 440;

    // Pick a random stall slot index
    const slotIndex = Math.floor(Math.random() * this.slots.length);
    const targetX = this.slots[slotIndex].x;

    const customer: CustomerNPC = {
      container,
      graphics,
      targetX,
      state: "walking_in",
      speed: 1.5 + Math.random() * 1.5,
      slotIndex,
    };

    this.activeCustomers.push(customer);
  }

  // 5. EVENT CORRELATIONS & TRIGGER INTERFACES
  private handleSlotClick(index: number) {
    const slot = this.slots[index];
    
    // Trigger collect if ready
    if (slot.isReadyToCollect) {
      this.harvestSlot(index);
    } else {
      // Emit click to React to open inventory panel
      gameEmitter.emit("game:slot_clicked", {
        slotId: slot.id,
        isEmpty: slot.productId === null,
        hasProduct: slot.productId !== null,
        isReadyToCollect: slot.isReadyToCollect,
        productName: slot.productName || undefined,
      });
    }
  }

  // Place product action (React calls this via emitter)
  public placeProduct(slotId: string, name: string, iconName: string, durationSeconds: number) {
    const slot = this.slots.find((s) => s.id === slotId);
    if (!slot) return;

    slot.productId = `p_${Date.now()}`;
    slot.productName = name;
    slot.productIcon = iconName;
    slot.totalTime = durationSeconds;
    slot.timeRemaining = durationSeconds;
    slot.isReadyToCollect = false;
    slot.coinsReward = 150 + Math.floor(Math.random() * 80); // random mock reward

    this.updateSlotVisual(slot);
  }

  private updateSlotVisual(slot: SlotData) {
    const index = this.slots.findIndex((s) => s.id === slot.id);
    if (index === -1) return;

    const g = this.slotGraphics[index];
    const textLabel = this.slotTexts[index];

    g.clear();
    
    if (slot.productId) {
      // Redraw containing product (soft orange outline)
      g.circle(slot.x, slot.y, 35);
      g.fill(0xFFFAF0);
      g.stroke({ color: 0xF97316, width: 3 });

      // Draw item shadow
      g.ellipse(slot.x, slot.y + 10, 20, 6);
      g.fill(0xFED7AA);

      // Update text to emoji icon
      textLabel.text = slot.productIcon || "🥖";
      textLabel.style.fontSize = 28;
      textLabel.x = slot.x - textLabel.width / 2;
      textLabel.y = slot.y - textLabel.height / 2;
    } else {
      // Redraw empty
      g.circle(slot.x, slot.y, 35);
      g.fill(0xFFFFFF);
      g.stroke({ color: 0xE2E8F0, width: 3 });

      // Draw item shadow
      g.ellipse(slot.x, slot.y + 10, 20, 6);
      g.fill(0xF1F5F9);

      textLabel.text = "TRỐNG";
      textLabel.style.fontSize = 11;
      textLabel.style.fill = "#64748B";
      textLabel.x = slot.x - textLabel.width / 2;
      textLabel.y = slot.y - textLabel.height / 2;
    }
  }

  // Harvest and spawn flying coins
  private harvestSlot(index: number) {
    const slot = this.slots[index];
    if (!slot.isReadyToCollect) return;

    // Emit event back to React Query (optimistic update coins)
    gameEmitter.emit("game:coin_collected", {
      slotId: slot.id,
      amount: slot.coinsReward,
    });

    // Spawn 5 flying coins effects
    for (let i = 0; i < 5; i++) {
      this.spawnFlyingCoin(slot.x, slot.y);
    }

    // Reset slot to empty
    slot.productId = null;
    slot.productName = null;
    slot.productIcon = null;
    slot.timeRemaining = 0;
    slot.isReadyToCollect = false;

    this.updateSlotVisual(slot);
  }

  private spawnFlyingCoin(x: number, y: number) {
    const coin = new Graphics();
    coin.circle(0, 0, 8);
    coin.fill(0xEAB308);
    coin.stroke({ color: 0xD97706, width: 1.5 });

    // Center star detail
    coin.circle(0, 0, 4);
    coin.fill(0xFFFFFF);

    coin.x = x + (Math.random() * 20 - 10);
    coin.y = y + (Math.random() * 20 - 10);

    this.effectLayer.addChild(coin);

    // Target coordinates (gần góc trên bên phải HUD ví xu trên di động)
    this.flyingCoins.push({
      graphics: coin,
      x: coin.x,
      y: coin.y,
      tx: 650 + Math.random() * 50,
      ty: 40,
      progress: 0,
    });
  }

  // 6. REAL-TIME TICKER TICK LOOPS (ANIMATIONS)
  private update() {
    const delta = Ticker.shared.deltaTime;

    // A. Update Active Orders Timers & Slot Bars
    this.slots.forEach((slot, index) => {
      if (slot.productId && !slot.isReadyToCollect) {
        slot.timeRemaining = Math.max(slot.timeRemaining - (delta / 60), 0);
        
        // Draw progress circle/bar inside slots
        const g = this.slotGraphics[index];
        this.updateSlotVisual(slot); // redraw basic
        
        // Draw green progress border arc
        const progressPercentage = (slot.totalTime - slot.timeRemaining) / slot.totalTime;
        g.stroke({ color: 0x10B981, width: 3 });
        g.arc(slot.x, slot.y, 35, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progressPercentage));
        g.stroke();

        if (slot.timeRemaining === 0) {
          slot.isReadyToCollect = true;
          this.triggerClaimReadyVisual(index);
        }
      }
    });

    // B. Animate Customer walking sequences
    this.activeCustomers.forEach((customer, index) => {
      const container = customer.container;
      
      if (customer.state === "walking_in") {
        const diffX = customer.targetX - container.x;
        if (Math.abs(diffX) > 5) {
          container.x += Math.sign(diffX) * customer.speed;
          // Bobbing walk effect
          container.y = 440 + Math.sin(container.x * 0.08) * 3;
        } else {
          // Arrived! Start buying
          customer.state = "buying";
          this.customerBuyAction(customer);
        }
      } else if (customer.state === "leaving") {
        container.x += customer.speed;
        container.y = 440 + Math.sin(container.x * 0.08) * 3;

        // Remove if off-screen
        if (container.x > 850) {
          this.customerLayer.removeChild(container);
          this.activeCustomers.splice(index, 1);
        }
      }
    });

    // C. Animate flying coin effects
    for (let i = this.flyingCoins.length - 1; i >= 0; i--) {
      const coin = this.flyingCoins[i];
      coin.progress += 0.04 * delta;

      if (coin.progress >= 1) {
        this.effectLayer.removeChild(coin.graphics);
        coin.graphics.destroy();
        this.flyingCoins.splice(i, 1);
      } else {
        // Easing interpolation quadratic bezier
        const t = coin.progress;
        coin.graphics.x = (1 - t) * coin.x + t * coin.tx;
        coin.graphics.y = (1 - t) * coin.y + t * coin.ty - Math.sin(t * Math.PI) * 100; // arched path
        coin.graphics.scale.set(1 - t * 0.4); // shrink as it gets closer
      }
    }
  }

  private triggerClaimReadyVisual(index: number) {
    const slot = this.slots[index];
    const g = this.slotGraphics[index];

    g.clear();
    
    // Draw glowing green aura
    g.circle(slot.x, slot.y, 35);
    g.fill(0xF0FDF4); // light green
    g.stroke({ color: 0x10B981, width: 4 }); // emerald green border

    // Blinking bounce text
    const textLabel = this.slotTexts[index];
    textLabel.text = "XU 💰";
    textLabel.style.fontSize = 18;
    textLabel.style.fill = "#10B981";
    textLabel.x = slot.x - textLabel.width / 2;
    textLabel.y = slot.y - textLabel.height / 2;
  }

  // Draw speech bubbles for NPC customers
  private customerBuyAction(customer: CustomerNPC) {
    const bubble = new Container();
    customer.container.addChild(bubble);
    customer.speechBubble = bubble;

    const bg = new Graphics();
    bg.roundRect(-25, -60, 50, 20, 6);
    bg.fill(0xFFFFFF);
    bg.stroke({ color: 0x475569, width: 1.5 });
    
    // Bubble pointer
    bg.moveTo(0, -40);
    bg.lineTo(5, -35);
    bg.lineTo(-5, -35);
    bg.closePath();
    bg.fill(0xFFFFFF);
    bg.stroke({ color: 0x475569, width: 1.5 });

    const textStyle = new TextStyle({
      fontFamily: "Arial",
      fontSize: 9,
      fontWeight: "bold",
      fill: "#1E293B",
    });
    
    const label = new Text({ text: "MUA 🥖!", style: textStyle });
    label.x = -label.width / 2;
    label.y = -55;

    bubble.addChild(bg);
    bubble.addChild(label);

    // Let customer buy for 4 seconds, then happily walk off screen
    setTimeout(() => {
      if (customer.speechBubble) {
        customer.container.removeChild(customer.speechBubble);
      }
      
      // Swap speech bubble to happy heart emoji
      const happyBubble = new Container();
      customer.container.addChild(happyBubble);
      customer.speechBubble = happyBubble;
      
      const happyBg = new Graphics();
      happyBg.circle(0, -50, 10);
      happyBg.fill(0xFDF2F8);
      happyBg.stroke({ color: 0xF43F5E, width: 1.5 });
      
      const emojiStyle = new TextStyle({ fontFamily: "Arial", fontSize: 10 });
      const emojiText = new Text({ text: "❤️", style: emojiStyle });
      emojiText.x = -emojiText.width / 2;
      emojiText.y = -56;

      happyBubble.addChild(happyBg);
      happyBubble.addChild(emojiText);

      customer.state = "leaving";
      customer.speed = 2.5; // Walk away faster

      // Remove bubble after 1.5s
      setTimeout(() => {
        if (customer.speechBubble) {
          customer.container.removeChild(customer.speechBubble);
        }
      }, 1500);

    }, 4000);
  }

  // Listen to events from React side
  private setupEventListeners() {
    gameEmitter.on("react:place_product", (data) => {
      this.placeProduct(data.slotId, data.name, data.iconName, data.durationSeconds);
    });

    gameEmitter.on("react:sync_slots", (data: { slots: Partial<SlotData>[], stallLevel: number }) => {
      this.stallLevel = data.stallLevel;
      this.drawStallTable();
      data.slots.forEach((newSlot, idx) => {
        if (idx < this.slots.length) {
          this.slots[idx] = { ...this.slots[idx], ...newSlot };
          this.updateSlotVisual(this.slots[idx]);
        }
      });
    });

    gameEmitter.on("react:upgrade_stall", (data) => {
      this.stallLevel = data.newLevel;
      this.drawStallTable();
      // Add visual upgrade glow
      const glow = new Graphics();
      glow.rect(100, 360, 600, 60);
      glow.fill(0xFFFFFF);
      glow.alpha = 0.6;
      this.effectLayer.addChild(glow);

      // Fade out glow quickly
      let alpha = 0.6;
      const fade = () => {
        alpha -= 0.05;
        glow.alpha = alpha;
        if (alpha <= 0) {
          this.effectLayer.removeChild(glow);
          glow.destroy();
        } else {
          setTimeout(fade, 30);
        }
      };
      fade();
    });

    gameEmitter.on("react:help_stall", () => {
      const glow = new Graphics();
      glow.rect(100, 360, 600, 60);
      glow.fill(0x10B981); // Emerald green help glow
      glow.alpha = 0.5;
      this.effectLayer.addChild(glow);
      
      let alpha = 0.5;
      const fade = () => {
        alpha -= 0.04;
        glow.alpha = alpha;
        if (alpha <= 0) {
          this.effectLayer.removeChild(glow);
          glow.destroy();
        } else {
          setTimeout(fade, 30);
        }
      };
      fade();
    });

    gameEmitter.on("react:prank_stall", () => {
      const dustContainer = new Container();
      this.effectLayer.addChild(dustContainer);
      
      for (let i = 0; i < 15; i++) {
        const dust = new Graphics();
        dust.circle(0, 0, 10 + Math.random() * 15);
        dust.fill(0x64748B); // Slate gray soot/dust
        dust.alpha = 0.7;
        dust.x = 120 + Math.random() * 560;
        dust.y = 350 + Math.random() * 80;
        dustContainer.addChild(dust);
      }
      
      let alpha = 0.7;
      const fade = () => {
        alpha -= 0.03;
        dustContainer.alpha = alpha;
        if (alpha <= 0) {
          this.effectLayer.removeChild(dustContainer);
          dustContainer.destroy({ children: true });
        } else {
          setTimeout(fade, 40);
        }
      };
      fade();
    });
  }

  public destroy() {
    Ticker.shared.remove(this.updateFn);
    gameEmitter.off("react:place_product");
    gameEmitter.off("react:sync_slots");
    gameEmitter.off("react:upgrade_stall");
    gameEmitter.off("react:help_stall");
    gameEmitter.off("react:prank_stall");
    this.container.destroy({ children: true });
  }
}
export default StallScene;
