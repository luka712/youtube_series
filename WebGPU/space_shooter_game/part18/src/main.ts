import { vec2 } from "gl-matrix";
import { Content } from "./content";
import { Engine } from "./engine";
import { Background } from "./game/background";
import { BulletManager } from "./game/bullet-manager";
import { EnemyManager } from "./game/enemy-manager";
import { ExplosionManager } from "./game/explosion-manager";
import { Player } from "./game/player";
import { Color } from "./color";
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

    const postProcessEffect = await engine.effectsFactory.createBlurEffect();
        postProcessEffect.doHorizontalPass = true;
        postProcessEffect.doVerticalPass = true;

    document.getElementById("horizontal")?.addEventListener("click", (e) => {
        postProcessEffect.doHorizontalPass = !postProcessEffect.doHorizontalPass;
        (e.target as HTMLInputElement).checked = postProcessEffect.doHorizontalPass;
    });

    document.getElementById("vertical")?.addEventListener("click", (e) => {
        postProcessEffect.doVerticalPass = !postProcessEffect.doVerticalPass;
        (e.target as HTMLInputElement).checked = postProcessEffect.doVerticalPass;
    });

    engine.onUpdate = (dt: number) => {
        player.update(dt);
        background.update(dt);
        enemyManager.update(dt);
        explosionManager.update(dt);
        bulletManager.update(dt);
    };

    engine.onDraw = () => {

        if (postProcessEffect.getRenderTexture()) {
            engine.setDestinationTexture(postProcessEffect.getRenderTexture()!.texture);
        }
        else {
            engine.setDestinationTexture(null);
        }
        background.draw(engine.spriteRenderer);
        player.draw(engine.spriteRenderer);
        enemyManager.draw(engine.spriteRenderer);
        bulletManager.draw(engine.spriteRenderer);
        explosionManager.draw(engine.spriteRenderer);

        highScore.draw(engine.spriteRenderer);

        if (postProcessEffect.getRenderTexture()) {
            postProcessEffect.draw(engine.getCanvasTexture().createView());
        }
    };



    engine.draw()
});