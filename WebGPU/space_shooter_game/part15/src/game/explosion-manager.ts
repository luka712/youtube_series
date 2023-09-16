import { Rect } from "../rect";
import { SpriteRenderer } from "../sprite-renderer";
import { Explosion } from "./explosion";

export class ExplosionManager {
    private pool: Explosion[] = [];

    public create(drawRect: Rect) {
        let explosion = this.pool.find(e => !e.playing);

        // if not found, create a new one
        if (!explosion) {
            explosion = new Explosion();
            this.pool.push(explosion);
        }

        explosion.play(drawRect);
    }

    public update(dt: number) {
        for (const explosion of this.pool) {
            if (explosion.playing) {
                explosion.update(dt);
            }
        }
    }

    public draw(spriteRenderer: SpriteRenderer) {
        for (const explosion of this.pool) {
            if (explosion.playing) {
                explosion.draw(spriteRenderer);
            }
        }
    }
}