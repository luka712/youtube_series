import { Engine } from "./engine";
import { Player } from "./game/player";

const engine = new Engine();
engine.initialize().then(() => {

    const player = new Player(engine.inputManager, 
        engine.gameBounds[0], engine.gameBounds[1] );

    engine.onUpdate = (dt: number) => {
        player.update(dt);
    };

    engine.onDraw = () => {

        player.draw(engine.spriteRenderer);
    };


    engine.draw()
});