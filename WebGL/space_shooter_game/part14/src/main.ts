import { vec2 } from "gl-matrix";
import { Content } from "./content";
import { Engine } from "./engine";
import { Background } from "./game/background";
import { BulletManager } from "./game/bullet-manager";
import { EnemyManager } from "./game/enemy-manager";
import { ExplosionManager } from "./game/explosion-manager";
import { Player } from "./game/player";
import { Color } from "./color";


const engine = new Engine();
engine.initialize().then(() => 
{
    const player = new Player(engine.inputManager, engine.clientBounds[0], engine.clientBounds[1]);
    const background = new Background(engine.clientBounds[0], engine.clientBounds[1]);
    const explosionManager = new ExplosionManager();
    const bulletManager = new BulletManager(player);
    const enemyManager = new EnemyManager(engine.clientBounds[0], 
        engine.clientBounds[1], 
        player,
        explosionManager,
        bulletManager);



    engine.onUpdate = (dt) => {
        background.update(dt);
        player.update(dt);
        enemyManager.update(dt);
        explosionManager.update(dt);
        bulletManager.update(dt);
    }

    engine.onDraw = () => {

        engine.spriteRenderer.begin();

        background.draw(engine.spriteRenderer);
        player.draw(engine.spriteRenderer);
        enemyManager.draw(engine.spriteRenderer);
        bulletManager.draw(engine.spriteRenderer);
        explosionManager.draw(engine.spriteRenderer);

        engine.spriteRenderer.drawString(Content.spriteFont, 
            "Hello World!", 
            vec2.fromValues(100,100),
            new Color(1,1,0),
            0.75)

        engine.spriteRenderer.end();

    }

    engine.draw();
});

