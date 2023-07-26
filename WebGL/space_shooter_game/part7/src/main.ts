import { Engine } from './engine';

const renderer = new Engine();
renderer.initialize().then(() => {
    renderer.draw();
});