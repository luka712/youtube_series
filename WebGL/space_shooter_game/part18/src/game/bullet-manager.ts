import { Content } from "../content";
import { SpriteRenderer } from "../sprite-renderer";
import { Bullet } from "./bullet";
import { Enemy } from "./enemy";
import { Player } from "./player";

const SPAWN_TIME = 250;

export class BulletManager 
{
    private bullets: Bullet[] = [];
    private time = 0;

    constructor(private player :Player)
    {

    }

    public intersectsEnemy(enemy: Enemy)
    {
        for (let bullet of this.bullets) {
            if (bullet.active && bullet.drawRect.intersects(enemy.drawRect)) {
                bullet.active = false;
                return true;
            }
        }

        return false;
    }

    public create() 
    {
        let bullet = this.bullets.find(b => !b.active);
        if (!bullet) {
            bullet = new Bullet();
            this.bullets.push(bullet);
        }

        bullet.spawn(this.player);
        Content.laserSound.play();
    }

    public update(dt: number) 
    {
        this.time += dt;
        if(this.time > SPAWN_TIME)
        {
            this.time = 0;
            this.create();
        }

        for (let bullet of this.bullets) {
            if (bullet.active) {
                bullet.update(dt);
            }
        }
    }

    public draw(spriteRenderer: SpriteRenderer)
    {
        for (let bullet of this.bullets) {
            if (bullet.active) {
                bullet.draw(spriteRenderer);
            }
        }
    }
}