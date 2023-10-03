export class Rect 
{
    constructor(public x: number, public y: number, public width: number, public height: number)
    {

    }

    public copy() : Rect 
    {
        return new Rect(this.x, this.y, this.width, this.height);
    }

    public intersects(other: Rect) : boolean
    {
        return this.x < other.x + other.width 
        && this.x + this.width > other.x 
        && this.y < other.y + other.height 
        && this.y + this.height > other.y;
    }
}