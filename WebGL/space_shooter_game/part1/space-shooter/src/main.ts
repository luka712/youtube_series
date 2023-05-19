

class Renderer 
{
    private canvas :HTMLCanvasElement;
    private gl: WebGL2RenderingContext;

    constructor()
    {
        this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
        this.gl = this.canvas.getContext("webgl2")!;
    }

    public draw(): void
    {
        this.gl.clearColor(1, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        window.requestAnimationFrame(() => this.draw());
    }

}

const renderer = new Renderer();

renderer.draw();