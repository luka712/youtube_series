export class Rect 
{
    constructor(public x: number,public y: number,public width: number, public height: number) 
    {
    }

    public copy(): Rect 
    {
        return new Rect(this.x, this.y, this.width, this.height);
    }

}