import { Rect } from "./rect";

export class CircleCollider 
{
    public radius: number = 0;
    public x: number = 0;
    public y: number = 0;

    update(drawRect: Rect)
    {
        let radius = drawRect.width / 2;

        if(drawRect.height < drawRect.width)
        {
            radius = drawRect.height / 2;
        }

        this.x = drawRect.x + this.radius;
        this.y = drawRect.y + this.radius;
        this.radius = radius;
    }

    public intersects(other: CircleCollider): boolean
    {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const d = Math.sqrt(dx * dx + dy * dy);

        const r = this.radius + other.radius;
        return d < r;
    }
}