import { SpriteRenderer } from "../sprite-renderer";
import { BulletManager } from "./bullet-manager";
import { Enemy } from "./enemy";
import { ExplosionManager } from "./explosion-manager";
import { HighScore } from "./high-score";
import { MeteorEnemy } from "./meteor-enemy";
import { Player } from "./player";



const SPAWN_INTERVAL = 1000;

export class EnemyManager {
    private timeToSpawn = 0;
    private pool: Enemy[] = [];

    constructor(private width: number, private height: number, 
        private player: Player,
        private explosionManager: ExplosionManager,
        private bulletManager: BulletManager,
        private score: HighScore) {
    }

    private spawnEnemy() {
        if (this.timeToSpawn > SPAWN_INTERVAL) {
            this.timeToSpawn = 0;

            let enemy = this.pool.find(e => !e.active);
            if (!enemy) {
                enemy = new MeteorEnemy(this.width, this.height);
                this.pool.push(enemy);
            }

            enemy.active = true;
            enemy.drawRect.x = Math.random() * (this.width - enemy.drawRect.width);
            enemy.drawRect.y = -enemy.drawRect.height;
        }
    }

    update(dt: number) {
        this.timeToSpawn += dt;
        this.spawnEnemy();

        for (let enemy of this.pool) {
            if (enemy.active) {
                enemy.update(dt);

                // bullet-enemy collision
                if(this.bulletManager.intersectsEnemy(enemy))
                {
                    enemy.active = false;
                    this.explosionManager.create(enemy.drawRect);
                    this.score.currentScore += 10;
                }                

                // player-enemy collision
                if (enemy.drawRect.intersects(this.player.drawRect)) {
                    enemy.active = false;
                    this.explosionManager.create(enemy.drawRect);
                }

                // enemy out of screen
                if (enemy.drawRect.y > this.height) {
                    enemy.active = false;
                }
            }
        }
    }

    draw(spriteRenderer: SpriteRenderer) {
        for (let enemy of this.pool) {
            if (enemy.active) {
                enemy.draw(spriteRenderer);
            }

        }
    }
}