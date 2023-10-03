import { Content } from "../content";
import { Rect } from "../rect";
import { SpriteRenderer } from "../sprite-renderer";

const BACKGROUND_SCROLL_SPEED = 0.25;

export class Background 
{
    private drawRect: Rect;
    private drawRect2: Rect;

    constructor(private width: number, private height: number)
    {
        this.drawRect = new Rect(0, 0, width,height);
        this.drawRect2 = new Rect(0, 0, width,height);
    }

    public update(dt: number)
    {
        this.drawRect.y += BACKGROUND_SCROLL_SPEED * dt;
        this.drawRect2.y = this.drawRect.y - this.height;
        if(this.drawRect.y > this.height || this.drawRect2.y  > this.height)
        {
            const temp = this.drawRect;
            this.drawRect = this.drawRect2;
            this.drawRect2 = temp;
        }
    }

    public draw(spriteRenderer: SpriteRenderer)
    {
        spriteRenderer.drawSprite(Content.backgroundTexture, this.drawRect);
        spriteRenderer.drawSprite(Content.backgroundTexture, this.drawRect2);
    }

}