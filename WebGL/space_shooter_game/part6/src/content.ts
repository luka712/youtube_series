import { Texture } from "./texture";

export class Content 
{
    public static playerTexture: Texture;
    public static ufoBlue: Texture;

    public static async initialize(gl: WebGL2RenderingContext)
    {
        this.playerTexture = await Texture.loadTexture(gl, "assets/PNG/playerShip1_orange.png");
        this.ufoBlue = await Texture.loadTexture(gl, "assets/PNG/ufoBlue.png");
    }
}