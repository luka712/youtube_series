import { vec2 } from "gl-matrix";
import { Rect } from "../rect";
import { Texture } from "../texture";
import { InputManager } from "../input-manager";
import { Content } from "../content";
import { SpriteRenderer } from "../sprite-renderer";

const SPEED = 0.25;

export class Player {
    private movementDirection = vec2.create();
    private drawRect: Rect;
    private sourceRect: Rect;
    private texture: Texture;

    constructor(private inputManager: InputManager, private width: number, private height: number) {
        const playerSprite = Content.sprites["playerShip1_blue"];
        this.texture = playerSprite.texture;
        this.drawRect = playerSprite.drawRect.copy();
        this.sourceRect = playerSprite.sourceRect.copy();
    }

    public update(dt: number) {
        this.movementDirection[0] = 0;
        this.movementDirection[1] = 0;

        if (this.inputManager.isKeyDown("ArrowUp")) {
            this.movementDirection[1] = -1;
        }
        if (this.inputManager.isKeyDown("ArrowDown")) {
            this.movementDirection[1] = 1;
        }
        if (this.inputManager.isKeyDown("ArrowLeft")) {
            this.movementDirection[0] = -1;
        }
        if (this.inputManager.isKeyDown("ArrowRight")) {
            this.movementDirection[0] = 1;
        }

        vec2.normalize(this.movementDirection, this.movementDirection);
        vec2.scale(this.movementDirection, this.movementDirection, SPEED * dt);
        this.drawRect.x += this.movementDirection[0];
        this.drawRect.y += this.movementDirection[1];

        // keep player in game bounds
        if(this.drawRect.x < 0)
        {
            this.drawRect.x = 0;
        } 
        else if(this.drawRect.x > this.width - this.drawRect.width)
        {
            this.drawRect.x = this.width - this.drawRect.width;
        }

        if(this.drawRect.y < 0)
        {
            this.drawRect.y = 0;
        }
        else if(this.drawRect.y > this.height - this.drawRect.height)
        {
            this.drawRect.y = this.height - this.drawRect.height;
        }
    }

    public draw(spriteRenderer: SpriteRenderer) {
        spriteRenderer.drawSpriteSource(this.texture, this.drawRect, this.sourceRect);
    }
}