import { vec2 } from "gl-matrix";
import { SpriteRenderer } from "../sprite-renderer";
import { Content } from "../content";

export class HighScore 
{
    public currentScore = 0;

    private drawPosition = vec2.fromValues(10, 10);

    public draw(spriteRenderer: SpriteRenderer)
    {
        spriteRenderer.drawString(
            Content.spriteFont,
            "High Score: " + this.currentScore, 
            this.drawPosition,
            undefined,
            0.5);
    }
}