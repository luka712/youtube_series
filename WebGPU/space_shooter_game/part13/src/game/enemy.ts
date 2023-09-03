import { Rect } from "../rect";
import { SpriteRenderer } from "../sprite-renderer";

export interface Enemy {
    active: boolean;
    drawRect: Rect;

    update(dt: number): void;
    draw(spriteRenderer: SpriteRenderer): void;
}