import { Renderer } from './renderer';

const renderer = new Renderer();
renderer.initialize().then(() => {
    renderer.draw();
});