import { Texture } from "./texture";

export class Content 
{
    public static playerTexture: Texture;
    public static ufoRedTexture: Texture;

    public static async initialize(device: GPUDevice)
    {
        this.playerTexture = await Texture.createTextureFromURL(device, "assets/PNG/playerShip1_blue.png");
        this.ufoRedTexture = await Texture.createTextureFromURL(device, "assets/PNG/ufoRed.png");
    }
}