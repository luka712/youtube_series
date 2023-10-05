import { Engine } from "./engine";
import { Background } from "./game/background";
import { BulletManager } from "./game/bullet-manager";
import { EnemyManager } from "./game/enemy-manager";
import { ExplosionManager } from "./game/explosion-manager";
import { Player } from "./game/player";
import { HighScore } from "./game/high-score";

const engine = new Engine();
engine.initialize().then(async () => {

    const player = new Player(engine.inputManager,
        engine.gameBounds[0], engine.gameBounds[1]);

    const background = new Background(engine.gameBounds[0], engine.gameBounds[1]);
    const explosionManager = new ExplosionManager();
    const bulletManager = new BulletManager(player);
    const highScore = new HighScore();
    const enemyManager = new EnemyManager(player,
        explosionManager,
        bulletManager,
        engine.gameBounds[0], engine.gameBounds[1],
        highScore);

    const blurEffect = await engine.effectsFactory.createBlurEffect();

    document.getElementById("horizontal")?.addEventListener("click", (e) => {
        blurEffect.doHorizontalPass = !blurEffect.doHorizontalPass;
        (e.target as HTMLInputElement).checked = blurEffect.doHorizontalPass;
    });

    document.getElementById("vertical")?.addEventListener("click", (e) => {
        blurEffect.doVerticalPass = !blurEffect.doVerticalPass;
        (e.target as HTMLInputElement).checked = blurEffect.doVerticalPass;
    });


    engine.onUpdate = (dt: number) => {
        player.update(dt);
        background.update(dt);
        enemyManager.update(dt);
        explosionManager.update(dt);
        bulletManager.update(dt);
    };

    engine.onDraw = () => {

        if (blurEffect.doVerticalPass || blurEffect.doHorizontalPass) {
            engine.setDestinationTexture(blurEffect.getRenderTexture()!.texture);
        }
        else {
            engine.setDestinationTexture(undefined);
        }

        background.draw(engine.spriteRenderer);
        player.draw(engine.spriteRenderer);
        enemyManager.draw(engine.spriteRenderer);
        bulletManager.draw(engine.spriteRenderer);
        explosionManager.draw(engine.spriteRenderer);

        highScore.draw(engine.spriteRenderer);

        if (blurEffect.doVerticalPass || blurEffect.doHorizontalPass) {
            blurEffect.draw(engine.getCanvasTexture().createView());
        }
    };



    engine.draw()
});