import { Application } from "pixi.js";

export interface GameAppInstance {
  app: Application;
  destroy: () => void;
}

export const createGameApp = async (
  container: HTMLDivElement
): Promise<GameAppInstance> => {
  // 1. Create a new PixiJS v8 Application
  const app = new Application();

  // 2. Initialize the application asynchronously (PixiJS v8 standard)
  await app.init({
    resizeTo: container, // Auto resize canvas to fit container element
    antialias: true,
    backgroundAlpha: 0, // Transparent backdrop to blend with Next.js warm-kem styles
    resolution: typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
    autoDensity: true,
  });

  // 3. Append the canvas element to the container DOM
  container.appendChild(app.canvas);

  // 4. Return the app instance and a clean destroy/cleanup wrapper (prevents memory leaks)
  return {
    app,
    destroy: () => {
      if (app.canvas && container.contains(app.canvas)) {
        container.removeChild(app.canvas);
      }
      app.destroy(true, { children: true, texture: true });
    },
  };
};

export default createGameApp;
