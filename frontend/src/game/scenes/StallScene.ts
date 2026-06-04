import { Container, Graphics, Text, TextStyle, Ticker, Application } from "pixi.js";
import { gameEmitter } from "../events/gameEmitter";
import { getProductVisual } from "../../shared/lib/productHelper";

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
  private app: Application;
  private container: Container;
  private resizeFn: () => void;
  
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

  constructor(parentContainer: Container, app: Application) {
    this.parentContainer = parentContainer;
    this.app = app;
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

    // Hook resize listener for fully responsive scaling
    this.resizeFn = this.resize.bind(this);
    window.addEventListener("resize", this.resizeFn);
    this.resize();

    // Notify React that PixiJS game scene is loaded and ready to receive slots sync
    setTimeout(() => {
      gameEmitter.emit("game:ready");
    }, 50);
  }

  // 0. RESPONSIVE CONTAINER SCALING LOOP
  private resize() {
    if (!this.app || !this.app.screen) return;
    const designWidth = 800;
    const designHeight = 600;

    const actualWidth = this.app.screen.width;
    const actualHeight = this.app.screen.height;

    const scaleX = actualWidth / designWidth;
    const scaleY = actualHeight / designHeight;
    const scale = Math.min(scaleX, scaleY);

    this.container.scale.set(scale);

    // Center game viewport inside canvas element
    this.container.x = (actualWidth - designWidth * scale) / 2;
    this.container.y = (actualHeight - designHeight * scale) / 2;
  }

  // 1. DRAW STREET SIDELINES
  private drawStreetBackground() {
    const bg = new Graphics();
    
    // 1. Sky (0 to 140)
    bg.rect(-1000, 0, 3000, 140);
    bg.fill(0xBAE6FD); // Light blue sky

    // Clouds
    bg.circle(120, 60, 20);
    bg.circle(150, 60, 25);
    bg.circle(180, 60, 20);
    bg.circle(580, 50, 15);
    bg.circle(600, 50, 20);
    bg.circle(620, 50, 15);
    // Draw extra clouds on the sides so it feels natural when panning/wider screens
    bg.circle(-220, 50, 18);
    bg.circle(-200, 50, 22);
    bg.circle(-180, 50, 18);
    bg.circle(920, 60, 15);
    bg.circle(940, 60, 20);
    bg.circle(960, 60, 15);
    bg.fill(0xFFFFFF);

    // 2. Far city buildings & power lines
    // Left side buildings
    bg.rect(-360, 85, 80, 55);
    bg.rect(-240, 95, 70, 45);
    bg.rect(-120, 80, 90, 60);
    // Original buildings
    bg.rect(40, 95, 80, 45);
    bg.rect(160, 100, 60, 40);
    bg.rect(260, 80, 100, 60);
    bg.rect(480, 95, 70, 45);
    bg.rect(680, 85, 90, 55);
    // Right side buildings
    bg.rect(880, 90, 80, 50);
    bg.rect(1000, 80, 100, 60);
    bg.rect(1160, 100, 70, 40);
    bg.fill(0xE2E8F0); // Light gray silhouette

    bg.moveTo(-1000, 110);
    bg.lineTo(2000, 110);
    bg.stroke({ color: 0x94A3B8, width: 1 });
    bg.moveTo(-1000, 120);
    bg.lineTo(2000, 125);
    bg.stroke({ color: 0x94A3B8, width: 1 });

    // 3. Iconic Hanoi Colonial House (x: 200 to 600, y: 120 to 300)
    bg.rect(200, 140, 400, 160);
    bg.fill(0xE0F2FE); // Classic light blue house walls
    bg.stroke({ color: 0x475569, width: 2 });

    // Red tiled roof (tiled triangle)
    bg.moveTo(180, 140);
    bg.lineTo(620, 140);
    bg.lineTo(590, 110);
    bg.lineTo(210, 110);
    bg.closePath();
    bg.fill(0xEF4444);
    bg.stroke({ color: 0x991B1B, width: 2 });

    // Roof tile lines
    for (let x = 220; x < 580; x += 30) {
      bg.moveTo(x, 140);
      bg.lineTo(x - 5, 110);
      bg.stroke({ color: 0xB91C1C, width: 1.5 });
    }

    // Green wooden doors & windows
    // Center double-door
    bg.rect(360, 200, 80, 100);
    bg.fill(0x047857); // Green wood
    bg.stroke({ color: 0x064E3B, width: 2 });
    bg.rect(370, 210, 25, 40);
    bg.rect(405, 210, 25, 40);
    bg.fill(0xBAE6FD); // glass panels
    bg.stroke({ color: 0x064E3B, width: 1.5 });

    // Left window
    bg.rect(250, 180, 60, 60);
    bg.fill(0x047857);
    bg.stroke({ color: 0x064E3B, width: 2 });
    bg.rect(260, 190, 40, 40);
    bg.fill(0xBAE6FD);
    bg.stroke({ color: 0x064E3B, width: 1.5 });

    // Right window
    bg.rect(490, 180, 60, 60);
    bg.fill(0x047857);
    bg.stroke({ color: 0x064E3B, width: 2 });
    bg.rect(500, 190, 40, 40);
    bg.fill(0xBAE6FD);
    bg.stroke({ color: 0x064E3B, width: 1.5 });

    // Left metal fence (extended from -1000 to 200)
    bg.rect(-1000, 220, 1200, 80);
    bg.fill(0xCCFBF1);
    bg.stroke({ color: 0x0D9488, width: 2 });
    for (let fx = -985; fx < 200; fx += 15) {
      bg.moveTo(fx, 220);
      bg.lineTo(fx, 300);
      bg.stroke({ color: 0x0D9488, width: 1.5 });
    }

    // Right metal fence (extended from 600 to 2000)
    bg.rect(600, 220, 1400, 80);
    bg.fill(0xCCFBF1);
    bg.stroke({ color: 0x0D9488, width: 2 });
    for (let fx = 615; fx < 2000; fx += 15) {
      bg.moveTo(fx, 220);
      bg.lineTo(fx, 300);
      bg.stroke({ color: 0x0D9488, width: 1.5 });
    }

    // Ivy foliage green bushes
    // Left extended bushes
    bg.circle(-260, 220, 15);
    bg.circle(-240, 210, 20);
    bg.circle(-220, 220, 15);
    bg.circle(-100, 220, 18);
    bg.circle(-80, 215, 22);
    bg.circle(-60, 225, 15);
    // Original bushes
    bg.circle(40, 220, 15);
    bg.circle(60, 210, 20);
    bg.circle(80, 220, 15);
    bg.circle(700, 220, 18);
    bg.circle(725, 210, 22);
    bg.circle(750, 225, 15);
    // Right extended bushes
    bg.circle(880, 220, 15);
    bg.circle(900, 210, 20);
    bg.circle(920, 220, 15);
    bg.circle(1040, 220, 18);
    bg.circle(1065, 210, 22);
    bg.circle(1090, 225, 15);
    bg.fill(0x10B981);

    // 4. Utility Pole with Speakers & Camera (x: 740)
    const poleX = 740;
    bg.rect(poleX - 5, 80, 10, 370);
    bg.fill(0x94A3B8); // gray concrete
    bg.stroke({ color: 0x475569, width: 1.5 });

    // Speaker horns
    bg.moveTo(poleX, 100);
    bg.lineTo(poleX - 25, 90);
    bg.lineTo(poleX - 25, 110);
    bg.closePath();
    bg.moveTo(poleX, 100);
    bg.lineTo(poleX + 25, 90);
    bg.lineTo(poleX + 25, 110);
    bg.closePath();
    bg.fill(0x64748B);
    bg.stroke({ color: 0x334155, width: 1.5 });

    // Security camera
    bg.rect(poleX - 15, 130, 20, 8);
    bg.fill(0x475569);
    bg.rect(poleX - 5, 138, 4, 6);
    bg.fill(0x475569);

    // 5. Sidewalk (Light Gray y: 300 to 460)
    bg.rect(-1000, 300, 3000, 160);
    bg.fill(0xF8FAFC);
    bg.stroke({ color: 0xE2E8F0, width: 1 });
    for (let sx = -980; sx < 2000; sx += 120) {
      bg.moveTo(sx, 300);
      bg.lineTo(sx - 10, 460);
      bg.stroke({ color: 0xE2E8F0, width: 1.5 });
    }

    // 6. Nostalgic Tea Grandpa mat & character easter egg
    bg.ellipse(80, 445, 35, 12);
    bg.fill(0xFEF08A); // Straw mat yellow
    bg.stroke({ color: 0xCA8A04, width: 1.5 });

    // Grandpa head
    bg.circle(80, 415, 12);
    bg.fill(0xFFEDD5);
    bg.stroke({ color: 0x1E293B, width: 1.5 });
    bg.circle(77, 412, 1.5);
    bg.circle(81, 412, 1.5);
    bg.fill(0x1E293B);

    // Beard
    bg.moveTo(76, 421);
    bg.lineTo(80, 429);
    bg.lineTo(84, 421);
    bg.closePath();
    bg.fill(0xFFFFFF);

    // Khăn đóng (Black headwear)
    bg.arc(80, 408, 12, Math.PI, 0);
    bg.fill(0x1E293B);

    // Traditional shirt body (sitting)
    bg.roundRect(68, 427, 24, 18, 4);
    bg.fill(0x1E293B);
    bg.stroke({ color: 0x000000, width: 1 });

    // Teacup
    bg.circle(100, 442, 3);
    bg.fill(0x10B981);

    // 7. Yellow/Black Painted Street Curb (y: 460 to 480)
    bg.rect(-1000, 460, 3000, 20);
    bg.fill(0x1E293B); // Dark slate base
    for (let cx = -960; cx < 2000; cx += 160) {
      bg.rect(cx, 460, 80, 20);
      bg.fill(0xEAB308); // Yellow stripe segments
    }
    bg.stroke({ color: 0x0F172A, width: 1.5 });

    // 8. Asphalt Road (y: 480 to 600)
    bg.rect(-1000, 480, 3000, 120);
    bg.fill(0x334155);
    // dashed white lines
    for (let rx = -960; rx < 2000; rx += 100) {
      bg.rect(rx, 540, 40, 6);
      bg.fill(0xFFFFFF);
    }

    this.bgLayer.addChild(bg);
  }

  // 2. DRAW WOODEN STALL & STRIPED AWNING
  private drawStallTable() {
    this.stallLayer.removeChildren();
    
    const table = new Graphics();
    
    // Choose dynamic visual style colors based on level
    let tableColor = 0xD97706; // Warm orange-brown
    let tableStrokeColor = 0xB45309;
    let legsColor = 0x78350F;
    let stripeColor1 = 0xEF4444; // Red stripes
    let stripeColor2 = 0xFFFFFF; // White stripes
    let bannerTitle = `SẠP HÀNG CẤP ${this.stallLevel}`;

    if (this.stallLevel === 2) {
      tableColor = 0x3B82F6; // Blue theme
      tableStrokeColor = 0x1D4ED8;
      legsColor = 0x1E3A8A;
      stripeColor1 = 0x3B82F6;
      stripeColor2 = 0xFFFFFF;
    } else if (this.stallLevel === 3) {
      tableColor = 0x10B981; // Green theme
      tableStrokeColor = 0x047857;
      legsColor = 0x064E3B;
      stripeColor1 = 0x10B981;
      stripeColor2 = 0xFFFFFF;
    } else if (this.stallLevel >= 4) {
      // Golden mahogany royal theme
      tableColor = 0x78350F; // Dark wood
      tableStrokeColor = 0xEAB308; // Gold stroke
      legsColor = 0x451A03;
      stripeColor1 = 0x991B1B; // Crimson
      stripeColor2 = 0xEAB308; // Gold stripes
      bannerTitle = `👑 SIÊU SẠP CẤP ${this.stallLevel} 👑`;
    }

    // Stall Awning poles
    table.rect(120, 180, 8, 220); // Left pole
    table.rect(670, 180, 8, 220); // Right pole
    table.fill(0x475569); // Metallic gray

    // Wooden Table base
    table.roundRect(100, 360, 600, 60, 12);
    table.fill(tableColor);
    table.stroke({ color: tableStrokeColor, width: 3 });

    // Table legs
    table.rect(150, 420, 20, 70);
    table.rect(630, 420, 20, 70);
    table.fill(legsColor);

    // Awning base shape
    table.moveTo(80, 180);
    table.lineTo(720, 180);
    table.lineTo(700, 130);
    table.lineTo(100, 130);
    table.closePath();
    table.fill(stripeColor1);

    // Striped overlays
    for (let i = 0; i < 7; i++) {
      if (i % 2 === 0) {
        const stripe = new Graphics();
        stripe.moveTo(100 + i * 85, 130);
        stripe.lineTo(100 + (i + 1) * 85, 130);
        stripe.lineTo(80 + (i + 1) * 90, 180);
        stripe.lineTo(80 + i * 90, 180);
        stripe.closePath();
        stripe.fill(stripeColor2);
        this.stallLayer.addChild(stripe);
      }
    }

    // Front scallops of awning
    for (let i = 0; i < 7; i++) {
      table.circle(125 + i * 90, 180, 12);
      table.fill(i % 2 === 0 ? stripeColor2 : stripeColor1);
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
    const bannerText = new Text({ text: bannerTitle, style: textStyle });
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
      const label = new Text({
        text: "TRỐNG",
        style: new TextStyle({
          fontFamily: "Arial",
          fontSize: 10,
          fontWeight: "bold",
          fill: "#64748B",
        }),
      });
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
    
    // Choose random colors for shirts
    const shirtColors = [0xEF4444, 0x3B82F6, 0x10B981, 0xF59E0B, 0xEC4899];
    const shirtColor = shirtColors[Math.floor(Math.random() * shirtColors.length)];

    // 1. Chibi Legs (little rectangles)
    graphics.rect(-6, -6, 4, 6);
    graphics.rect(2, -6, 4, 6);
    graphics.fill(0x475569); // legs/shoes

    // 2. Chibi Body (shirt and shorts)
    graphics.roundRect(-10, -22, 20, 16, 4); // shirt
    graphics.fill(shirtColor);
    graphics.stroke({ color: 0x1E293B, width: 1.5 });

    graphics.rect(-10, -10, 20, 4); // pants
    graphics.fill(0x1E293B);

    // 3. Chibi Head (Skin tone)
    graphics.circle(0, -32, 12);
    graphics.fill(0xFFEDD5); // skin color
    graphics.stroke({ color: 0x1E293B, width: 1.5 });

    // 4. Hair & Hat (random styles)
    const hairStyle = Math.floor(Math.random() * 3);
    if (hairStyle === 0) {
      // Style 0: Black hair cap
      graphics.arc(0, -34, 12, Math.PI, 0);
      graphics.fill(0x1E293B);
    } else if (hairStyle === 1) {
      // Style 1: Cute cap (mũ lưỡi trai)
      graphics.arc(0, -34, 12, Math.PI, 0);
      graphics.fill(0xEF4444); // red cap
      // cap brim (vành mũ)
      graphics.ellipse(6, -36, 10, 3);
      graphics.fill(0xEF4444);
    } else {
      // Style 2: Conical Hat (Nón lá)
      graphics.moveTo(-16, -38);
      graphics.lineTo(0, -50);
      graphics.lineTo(16, -38);
      graphics.closePath();
      graphics.fill(0xFEF08A); // straw color
      graphics.stroke({ color: 0xCA8A04, width: 1.5 });
    }

    // 5. Eyes
    graphics.circle(-4, -32, 1.5);
    graphics.circle(4, -32, 1.5);
    graphics.fill(0x1E293B);

    // 6. Mouth (Smiling)
    graphics.arc(0, -28, 3, 0, Math.PI);
    graphics.stroke({ color: 0x1E293B, width: 1.2 });

    container.addChild(graphics);

    // Start position (walk in from edges, dynamically computed based on screen boundaries)
    const scale = this.container.scale.x || 1;
    const leftEdge = -this.container.x / scale;
    const rightEdge = (this.app.screen.width - this.container.x) / scale;
    const walkFromLeft = Math.random() > 0.5;
    container.x = walkFromLeft ? Math.min(leftEdge - 50, -50) : Math.max(rightEdge + 50, 850);
    container.y = 440;

    // Pick a target slot prioritizing ready slots, then active products
    const currentTargetedSlotIndices = this.activeCustomers.map((c) => c.slotIndex);
    
    // 1. Prioritize slots that are ready to collect
    let eligibleIndices = this.slots
      .map((slot, idx) => ({ slot, idx }))
      .filter(({ slot, idx }) => slot.isReadyToCollect && !currentTargetedSlotIndices.includes(idx))
      .map(({ idx }) => idx);
      
    // 2. If no ready slots, prioritize slots with active products
    if (eligibleIndices.length === 0) {
      eligibleIndices = this.slots
        .map((slot, idx) => ({ slot, idx }))
        .filter(({ slot, idx }) => slot.productId !== null && !slot.isReadyToCollect && !currentTargetedSlotIndices.includes(idx))
        .map(({ idx }) => idx);
    }
    
    // 3. Fallback to untargeted slots
    if (eligibleIndices.length === 0) {
      eligibleIndices = this.slots
        .map((_, idx) => idx)
        .filter((idx) => !currentTargetedSlotIndices.includes(idx));
    }
    
    // 4. Ultimate fallback to a random slot
    const slotIndex = eligibleIndices.length > 0
      ? eligibleIndices[Math.floor(Math.random() * eligibleIndices.length)]
      : Math.floor(Math.random() * this.slots.length);
      
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
  public placeProduct(slotId: string, name: string, iconName: string, durationSeconds: number, coinsReward: number) {
    const slot = this.slots.find((s) => s.id === slotId);
    if (!slot) return;

    slot.productId = `p_${Date.now()}`;
    slot.productName = name;
    slot.productIcon = iconName;
    slot.totalTime = durationSeconds;
    slot.timeRemaining = durationSeconds;
    slot.isReadyToCollect = false;
    slot.coinsReward = coinsReward;

    this.updateSlotVisual(slot);
  }

  private updateSlotVisual(slot: SlotData) {
    const index = this.slots.findIndex((s) => s.id === slot.id);
    if (index === -1) return;

    const g = this.slotGraphics[index];
    const textLabel = this.slotTexts[index];

    g.clear();
    
    if (slot.productId) {
      // Redraw containing product (soft orange outline if selling, glowing green if ready to collect)
      const borderColor = slot.isReadyToCollect ? 0x10B981 : 0xF97316;
      const borderSize = slot.isReadyToCollect ? 4 : 3;
      const bgFill = slot.isReadyToCollect ? 0xF0FDF4 : 0xFFFAF0;

      g.circle(slot.x, slot.y, 35);
      g.fill(bgFill);
      g.stroke({ color: borderColor, width: borderSize });

      // Draw item shadow
      g.ellipse(slot.x, slot.y + 10, 20, 6);
      g.fill(slot.isReadyToCollect ? 0xDCFCE7 : 0xFED7AA);

      // Update text to emoji icon
      textLabel.text = slot.productIcon ? getProductVisual(slot.productIcon).emoji : "🥖";
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
      textLabel.style.fontSize = 10;
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
        g.moveTo(slot.x, slot.y - 35);
        g.stroke({ color: 0x10B981, width: 3 });
        g.arc(slot.x, slot.y, 35, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progressPercentage));
        g.stroke();

        if (slot.timeRemaining === 0) {
          slot.isReadyToCollect = true;
          this.triggerClaimReadyVisual(index);
          
          // Instantly spawn a customer NPC to buy the ready slot
          if (this.activeCustomers.length < 3) {
            this.spawnCustomer();
          }
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

        // Remove if off-screen (dynamically computed based on screen boundaries)
        const scale = this.container.scale.x || 1;
        const rightEdge = (this.app.screen.width - this.container.x) / scale;
        if (container.x > Math.max(rightEdge + 50, 850)) {
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
    this.updateSlotVisual(slot);
  }

  // Draw speech bubbles for NPC customers
  private customerBuyAction(customer: CustomerNPC) {
    const slot = this.slots[customer.slotIndex];
    const isOccupied = slot && slot.productId !== null;

    const bubble = new Container();
    customer.container.addChild(bubble);
    customer.speechBubble = bubble;

    const bg = new Graphics();
    bg.roundRect(-30, -60, 60, 20, 6); // slightly wider to fit empty text comfortably
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
    
    // Custom label text depending on slot occupancy
    const bubbleText = isOccupied
      ? `MUA ${slot.productIcon ? getProductVisual(slot.productIcon).emoji : "🥖"}!`
      : "HẾT HÀNG? 😢";

    const label = new Text({ text: bubbleText, style: textStyle });
    label.x = -label.width / 2;
    label.y = -55;

    bubble.addChild(bg);
    bubble.addChild(label);

    // If slot is ready to collect, trigger auto-harvest now!
    const isReady = slot && slot.isReadyToCollect;
    if (isReady) {
      setTimeout(() => {
        this.harvestSlot(customer.slotIndex);
      }, 150); // slight delay so they arrive and show speech bubble first
    }

    const duration = isOccupied ? 4000 : 2500; // Shorter wait if out of stock

    // Let customer buy or look, then walk off screen
    setTimeout(() => {
      if (customer.speechBubble) {
        customer.container.removeChild(customer.speechBubble);
      }
      
      // Swap speech bubble to resolution emoji (heart for buying, sad face for out of stock)
      const resolutionBubble = new Container();
      customer.container.addChild(resolutionBubble);
      customer.speechBubble = resolutionBubble;
      
      const resBg = new Graphics();
      resBg.circle(0, -50, 10);
      resBg.fill(isOccupied ? 0xFDF2F8 : 0xF1F5F9);
      resBg.stroke({ color: isOccupied ? 0xF43F5E : 0x64748B, width: 1.5 });
      
      const emojiStyle = new TextStyle({ fontFamily: "Arial", fontSize: 10 });
      const emojiText = new Text({ text: isOccupied ? "❤️" : "😢", style: emojiStyle });
      emojiText.x = -emojiText.width / 2;
      emojiText.y = -56;

      resolutionBubble.addChild(resBg);
      resolutionBubble.addChild(emojiText);

      customer.state = "leaving";
      customer.speed = isOccupied ? 2.5 : 2.0; // Walk away faster if bought

      // Remove bubble after 1.5s
      setTimeout(() => {
        if (customer.speechBubble) {
          customer.container.removeChild(customer.speechBubble);
        }
      }, 1500);

    }, duration);
  }

  // Listen to events from React side
  private setupEventListeners() {
    gameEmitter.on("react:place_product", (data) => {
      this.placeProduct(data.slotId, data.name, data.iconName, data.durationSeconds, data.coinsReward);
    });

    gameEmitter.on("react:sync_slots", (data: { slots: Partial<SlotData>[], stallLevel: number }) => {
      this.stallLevel = data.stallLevel;
      this.drawStallTable();
      
      const numSlots = data.slots.length;
      let xPositions = [220, 400, 580];
      let yPositions = [380, 380, 380];

      if (numSlots === 4) {
        xPositions = [170, 320, 470, 620];
        yPositions = [380, 380, 380, 380];
      } else if (numSlots === 5) {
        xPositions = [140, 270, 400, 530, 660];
        yPositions = [380, 380, 380, 380, 380];
      } else if (numSlots === 6) {
        // Stack layout: 3 slots top, 3 slots bottom
        xPositions = [220, 400, 580, 220, 400, 580];
        yPositions = [345, 345, 345, 395, 395, 395];
      }

      this.slots = data.slots.map((newSlot, idx) => {
        const x = xPositions[idx] || (220 + idx * 100);
        const y = yPositions[idx] || 380;
        return {
          id: newSlot.id || `slot${idx + 1}`,
          x: x,
          y: y,
          productId: newSlot.productId || null,
          productName: newSlot.productName || null,
          productIcon: newSlot.productIcon || null,
          timeRemaining: newSlot.timeRemaining || 0,
          totalTime: newSlot.totalTime || 0,
          isReadyToCollect: newSlot.isReadyToCollect || false,
          coinsReward: newSlot.coinsReward || 0,
        };
      });

      this.drawSlots();

      this.slots.forEach((slot) => {
        this.updateSlotVisual(slot);
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
    window.removeEventListener("resize", this.resizeFn);
    gameEmitter.off("react:place_product");
    gameEmitter.off("react:sync_slots");
    gameEmitter.off("react:upgrade_stall");
    gameEmitter.off("react:help_stall");
    gameEmitter.off("react:prank_stall");
    this.container.destroy({ children: true });
  }
}
export default StallScene;
