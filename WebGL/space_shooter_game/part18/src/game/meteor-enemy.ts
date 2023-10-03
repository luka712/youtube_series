import { vec2 } from "gl-matrix";
import { Content } from "../content";
import { Rect } from "../rect";
import { SpriteRenderer } from "../sprite-renderer";
import { Texture } from "../texture";
import { Enemy } from "./enemy";


const METEOR_KEYS = [
    "meteorBrown_big1",
    "meteorBrown_big2",
    "meteorBrown_big3",
    "meteorBrown_big4",
    "meteorBrown_med1",
    "meteorBrown_med3",
	"meteorGrey_big1",
    "meteorGrey_big2",
    "meteorGrey_big3",
    "meteorGrey_big4",
    "meteorGrey_med1", 
    "meteorGrey_med2",
]

const METEOR_MIN_SPEED = 0.05;
const METEOR_MAX_SPEED = 0.25;

export class MeteorEnemy implements Enemy 
{
    public active: boolean = true;
    public drawRect: Rect;

    public texture: Texture;
    public sourceRect: Rect;

    public rotationOrigin = vec2.fromValues(0.5, 0.5);
    public rotation = 0;
    public rotationSpeed = 0;
    public speed: number;

    constructor(public gameWidth: number, public gameHeight: number)
    {
        const key = METEOR_KEYS[Math.floor(Math.random() * METEOR_KEYS.length)];

        this.drawRect = Content.sprites[key].drawRect.copy();
        this.sourceRect = Content.sprites[key].sourceRect.copy();
        this.texture = Content.sprites[key].texture;

        this.speed = Math.random() * (METEOR_MAX_SPEED - METEOR_MIN_SPEED) + METEOR_MIN_SPEED;
        this.rotationSpeed = (Math.random() - 0.5) * 0.005;
    }


    update(dt: number): void {
        this.drawRect.y += this.speed * dt; 
        this.rotation += this.rotationSpeed * dt;
    }

    draw(spriteRenderer: SpriteRenderer): void {
        spriteRenderer.drawSpriteSource(this.texture, this.drawRect, this.sourceRect, undefined,
           this.rotation, this.rotationOrigin );
    }
}