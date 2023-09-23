import { vec2 } from "gl-matrix";
import { Quad } from "./quad";
import { Rect } from "./rect";
import { Sprite } from "./sprite";
import { Texture } from "./texture";
import { SpriteFont } from "./sprite-font";

export class Content {

    public static spriteFont: SpriteFont;

    public static playerTexture: Texture;
    public static ufoRedTexture: Texture;
    public static uvTexture: Texture;
    public static spriteSheet: Texture;
    public static backgroundTexture: Texture;
    public static explosionTexture: Texture;

    public static sprites: { [id: string]: Sprite } = {};

    public static async initialize(device: GPUDevice) {
        this.playerTexture = await Texture.createTextureFromURL(device, "assets/PNG/playerShip1_blue.png");
        this.ufoRedTexture = await Texture.createTextureFromURL(device, "assets/PNG/ufoRed.png");
        this.uvTexture = await Texture.createTextureFromURL(device, "assets/uv_test.png");
        this.spriteSheet = await Texture.createTextureFromURL(device,
            "assets/Spritesheet/sheet.png");


        this.explosionTexture = await Texture.createTextureFromURL(device, "assets/explosion.png");

        this.backgroundTexture = await Texture.createTextureFromURL(device, "assets/Backgrounds/purple.png");

        await this.loadSpriteSheet();

        this.spriteFont = await this.loadSnowBSpriteFont(device,"assets/SpriteFont.xml", "assets/SpriteFont.png");
    }

    private static async loadSpriteSheet() {
        const sheetXmlReq = await fetch("assets/SpriteSheet/sheet.xml");
        const sheetXmlText = await sheetXmlReq.text();

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(sheetXmlText, "text/xml");

        xmlDoc.querySelectorAll("SubTexture").forEach((subTexture) => {

            const name = subTexture.getAttribute("name")!.replace(".png", "");
            const x = parseInt(subTexture.getAttribute("x")!);
            const y = parseInt(subTexture.getAttribute("y")!);
            const width = parseInt(subTexture.getAttribute("width")!);
            const height = parseInt(subTexture.getAttribute("height")!);

            const drawRect = new Rect(0, 0, width, height);
            const sourceRect = new Rect(x, y, width, height);

            this.sprites[name] = new Sprite(this.spriteSheet, drawRect, sourceRect);

        });
    }

    public static async loadSnowBSpriteFont(
        device: GPUDevice,
        xmlPath: string,
        texturePath: string): Promise<SpriteFont> {
        const texture = await Texture.createTextureFromURL(device, texturePath);

        const xmlReq = await fetch(xmlPath);
        const xmlText = await xmlReq.text();

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        const lineHeight = parseInt(xmlDoc.querySelector("common")!.getAttribute("lineHeight")!);

        const font = new SpriteFont(texture, lineHeight);

        xmlDoc.querySelectorAll("char").forEach((char) => {

            const id = parseInt(char.getAttribute("id")!);
            const x = parseInt(char.getAttribute("x")!);
            const y = parseInt(char.getAttribute("y")!);
            const width = parseInt(char.getAttribute("width")!);
            const height = parseInt(char.getAttribute("height")!);
            const advance = parseInt(char.getAttribute("xadvance")!);
            const xOffset = parseInt(char.getAttribute("xoffset")!);
            const yOffset = parseInt(char.getAttribute("yoffset")!);

            const x1 = x / texture.width;
            const y1 = y / texture.height;
            const x2 = (x + width) / texture.width;
            const y2 = (y + height) / texture.height;

            const quad = new Quad(
                vec2.fromValues(x1, y1),
                vec2.fromValues(x2, y1),
                vec2.fromValues(x2, y2),
                vec2.fromValues(x1, y2)
            )

            font.createChar(id,
                quad,
                vec2.fromValues(width, height),
                advance,
                vec2.fromValues(xOffset, yOffset));

        });

        return font;
    }
}