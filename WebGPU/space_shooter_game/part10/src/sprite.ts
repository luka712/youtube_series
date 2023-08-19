import { Rect } from "./rect";
import { Texture } from "./texture";

export class Sprite 
{
    constructor(public texture: Texture, 
        public drawRect: Rect, 
        public sourceRect: Rect) 
    {
    }
}
