
import { vec2 } from "gl-matrix";
import { Color } from "./color";
import { Content } from "./content";
import { Rect } from "./rect";
import { SpriteRenderer } from "./sprite-renderer";

export class Engine {
    private canvas!: HTMLCanvasElement;
    private gl!: WebGL2RenderingContext;

    private spriteRenderer!: SpriteRenderer;


    constructor() {

    }

    public async initialize() {
        this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
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

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0.8, 0.8, 0.8, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.spriteRenderer.begin();

        const playerSprite =  Content.sprites["playerShip1_blue"];

        playerSprite.drawRect.x += 1;
        playerSprite.drawRect.y += 1;

        this.spriteRenderer.drawSpriteSource(
            playerSprite.texture,
            playerSprite.drawRect,
            playerSprite.sourceRect);

        const shieldSprite = Content.sprites["shield3"];

        shieldSprite.drawRect.x = playerSprite.drawRect.x - 22;
        shieldSprite.drawRect.y = playerSprite.drawRect.y - 25;

        this.spriteRenderer.drawSpriteSource(
            shieldSprite.texture,
            shieldSprite.drawRect,
            shieldSprite.sourceRect,
            new Color(0,1,1));

        const size = 742;
        this.rotation += 0.01;
        const origin = vec2.fromValues(1,1);
        this.spriteRenderer.drawSpriteSource(
            Content.testUvTexture,
            new Rect(100, 100, 100, 100),
            new Rect(0, 0, size, size),
            undefined,
            this.rotation,
            origin);

            this.spriteRenderer.drawSprite(
                Content.testUvTexture,
                new Rect(200, 200, 100, 100),
                undefined,
                this.rotation,
                origin);

     
        this.spriteRenderer.end();

        // start game loop 
        window.requestAnimationFrame(() => this.draw());
    }

}