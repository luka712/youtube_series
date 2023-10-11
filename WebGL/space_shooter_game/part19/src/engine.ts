

import { Content } from "./content";
import { SpriteRenderer } from "./sprite-renderer";
import { InputManager } from "./input-manager";
import { vec2 } from "gl-matrix";
import { EffectsFactory } from "./effects-factory";

export class Engine {
    private canvas!: HTMLCanvasElement;
    private gl!: WebGL2RenderingContext;
    private lastTime = 0;

    public spriteRenderer!: SpriteRenderer;
    public inputManager = new InputManager();
    public effectsFactory!:  EffectsFactory;

    public clientBounds = vec2.create();

    public onUpdate = (dt: number) => {};
    public onDraw = () => {};

    constructor() {

    }

    public async initialize() {
        this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
        this.inputManager.initialize();
        this.gl = this.canvas.getContext("webgl2", {
            alpha: false,
        })!;
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

        this.clientBounds[0] = this.canvas.width;
        this.clientBounds[1] = this.canvas.height;

        await Content.initialize(this.gl);

        this.spriteRenderer = new SpriteRenderer(this.gl, this.canvas.width, this.canvas.height);
        await this.spriteRenderer.initialize();

        this.effectsFactory = new EffectsFactory(this.gl, this.canvas.width, this.canvas.height);
    }

    rotation = 0;

    public draw(): void {

        const now = performance.now();
        const dt = now - this.lastTime;
        this.lastTime = now; 

        this.onUpdate(dt);

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0,0,0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.onDraw();

        // start game loop 
        window.requestAnimationFrame(() => this.draw());
    }

}