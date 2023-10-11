import { Content } from "../content";
import { Rect } from "../rect";
import { SpriteRenderer } from "../sprite-renderer";

const BACKGROUND_SCROLL_SPEED = 0.25;

export class Background 
{
    private drawRect: Rect;
    private drawRect2: Rect;

    constructor(private gameWidth: number, private gameHeight: number) {
        this.drawRect = new Rect(0, 0, gameWidth, gameHeight);
        this.drawRect2 = new Rect(0, -gameHeight, gameWidth, gameHeight);
    }

    update(dt: number)
    {
        this.drawRect.y += BACKGROUND_SCROLL_SPEED * dt;
        this.drawRect2.y = this.drawRect.y - this.gameHeight;

        if(this.drawRect.y > this.gameHeight)
        {
            const temp = this.drawRect;
            this.drawRect = this.drawRect2;
            this.drawRect2 = temp;
        }
    }

    draw(spriteRenderer: SpriteRenderer)
    {
        spriteRenderer.drawSprite(Content.backgroundTexture, this.drawRect);
        spriteRenderer.drawSprite(Content.backgroundTexture, this.drawRect2);

    }
}