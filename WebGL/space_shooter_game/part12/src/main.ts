import { Engine } from "./engine";
import { Background } from "./game/background";
import { EnemyManager } from "./game/enemy-manager";
import { Player } from "./game/player";


const engine = new Engine();
engine.initialize().then(() => 
{
    const player = new Player(engine.inputManager, engine.clientBounds[0], engine.clientBounds[1]);
    const background = new Background(engine.clientBounds[0], engine.clientBounds[1])
    const enemyManager = new EnemyManager(engine.clientBounds[0], engine.clientBounds[1]);

    engine.onUpdate = (dt) => {
        background.update(dt);
        player.update(dt);
        enemyManager.update(dt);
    }

    engine.onDraw = () => {

        engine.spriteRenderer.begin();

        background.draw(engine.spriteRenderer);
        player.draw(engine.spriteRenderer);
        enemyManager.draw(engine.spriteRenderer);

        engine.spriteRenderer.end();

    }

    engine.draw();
});

