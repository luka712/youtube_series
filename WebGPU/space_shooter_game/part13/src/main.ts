import { Engine } from "./engine";
import { Background } from "./game/background";
import { EnemyManager } from "./game/enemy-manager";
import { Player } from "./game/player";

const engine = new Engine();
engine.initialize().then(() => {

    const player = new Player(engine.inputManager, 
        engine.gameBounds[0], engine.gameBounds[1] );

    const background = new Background(engine.gameBounds[0], engine.gameBounds[1]);
    const enemyManager = new EnemyManager(engine.gameBounds[0], engine.gameBounds[1]);
    
    engine.onUpdate = (dt: number) => {
        player.update(dt);
        background.update(dt);
        enemyManager.update(dt);
    };

    engine.onDraw = () => {
        background.draw(engine.spriteRenderer);
        player.draw(engine.spriteRenderer);
        enemyManager.draw(engine.spriteRenderer);
    };


    engine.draw()
});