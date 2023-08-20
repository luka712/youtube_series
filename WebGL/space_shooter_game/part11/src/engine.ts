
import { vec2 } from "gl-matrix";
import { Color } from "./color";
import { Content } from "./content";
import { Rect } from "./rect";
import { SpriteRenderer } from "./sprite-renderer";
import { InputManager } from "./input-manager";

export class Engine {
    private canvas!: HTMLCanvasElement;
    private gl!: WebGL2RenderingContext;
    private lastTime = 0;

    public spriteRenderer!: SpriteRenderer;
    public inputManager = new InputManager();

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

        await Content.initialize(this.gl);

        this.spriteRenderer = new SpriteRenderer(this.gl, this.canvas.width, this.canvas.height);
        await this.spriteRenderer.initialize();

    }

    rotation = 0;

    public draw(): void {

        const now = performance.now();
        const dt = now - this.lastTime;
        this.lastTime = now; 

        this.onUpdate(dt);

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0.8, 0.8, 0.8, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.onDraw();

        // start game loop 
        window.requestAnimationFrame(() => this.draw());
    }

}