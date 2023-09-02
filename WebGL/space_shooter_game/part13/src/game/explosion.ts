import { Content } from "../content";
import { Rect } from "../rect";
import { SpriteRenderer } from "../sprite-renderer";


const TIME_TO_NEXT_FRAME = 1000 / 30;

export class Explosion {
    
    public playing = false;
    private time = 0;

    private sourceRect: Rect;
    private drawRect: Rect;

    private currentCol = 0;
    private currentRow = 0;

    private readonly cols = 4;
    private readonly rows = 4;

    constructor() {
        this.sourceRect = new Rect(0, 0, 32, 32);
        this.drawRect = new Rect(0, 0, 32, 32);
    }

    public play(drawRect: Rect) {
        this.playing = true;
        this.time = 0;
        this.currentCol = 0;
        this.currentRow = 0;
        this.drawRect = drawRect.copy();
    }

    public update(dt: number) {
        if (this.playing) {
            this.time += dt;

            if (this.time > TIME_TO_NEXT_FRAME) {
                this.time = 0;

                this.currentCol++;
                if (this.currentCol >= this.cols) {
                    this.currentCol = 0;
                    this.currentRow++;
                }

                if (this.currentRow >= this.rows) {
                    this.currentRow = 0;
                    this.playing = false;
                }
            }
        }
    }

    public draw(spriteRenderer: SpriteRenderer) {

        this.sourceRect.x = this.currentCol * this.sourceRect.width;
        this.sourceRect.y = this.currentRow * this.sourceRect.height;

        spriteRenderer.drawSpriteSource(Content.explosionTexture, this.drawRect, this.sourceRect);
    }
}