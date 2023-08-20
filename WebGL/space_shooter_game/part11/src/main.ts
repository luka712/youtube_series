import { Engine } from "./engine";
import { Player } from "./game/player";


const engine = new Engine();
engine.initialize().then(() => 
{
    const player = new Player(engine.inputManager);

    engine.onUpdate = (dt) => {
        player.update(dt);
    }

    engine.onDraw = () => {

        engine.spriteRenderer.begin();

        player.draw(engine.spriteRenderer);

        engine.spriteRenderer.end();

    }

    engine.draw();
});

