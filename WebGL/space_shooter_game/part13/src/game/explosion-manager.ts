import { Rect } from "../rect";
import { SpriteRenderer } from "../sprite-renderer";
import { Explosion } from "./explosion";

export class ExplosionManager {
    private explosions: Explosion[] = [];

    public create(drawRect: Rect) {
        // try to find one which is not playing yet
        let explosion = this.explosions.find(e => !e.playing);

        // create one if not any 
        if (!explosion) {
            explosion = new Explosion();
            this.explosions.push(explosion);
        }

        explosion.play(drawRect);
    }

    update(dt: number) {
        for (let explosion of this.explosions) {
            if (explosion.playing) {
                explosion.update(dt);
            }
        }
    }

    draw(spriteRenderer: SpriteRenderer) {
        for (let explosion of this.explosions) {
            if (explosion.playing) {
                explosion.draw(spriteRenderer);
            }
        }
    }
}