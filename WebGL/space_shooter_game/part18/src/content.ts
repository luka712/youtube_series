import { vec2 } from "gl-matrix";
import { Rect } from "./rect";
import { Sprite } from "./sprite";
import { Texture } from "./texture";
import { Quad } from "./quad";
import { SpriteFont } from "./sprite-font";
import { Sound } from "./sound";

export class Content {
    // sound
    private static audioContext = new AudioContext();
    public static laserSound: Sound;

    private static spriteSheet: Texture;

    public static sprites: { [id: string]: Sprite } = {};
    public static testUvTexture: Texture;
    public static backgroundTexture: Texture;
    public static explosionTexture: Texture;
    public static spriteFont: SpriteFont;
    public static iceTexture: Texture;

    public static async initialize(gl: WebGL2RenderingContext) {
        this.spriteSheet = await Texture.loadTexture(gl, "assets/Spritesheet/sheet.png");
        this.testUvTexture = await Texture.loadTexture(gl, "assets/test_uv.jpg");
        this.backgroundTexture = await Texture.loadTexture(gl, "assets/Backgrounds/purple.png");
        this.explosionTexture = await Texture.loadTexture(gl, "assets/explosion.png");

        this.laserSound = await this.loadSound("assets/Bonus/sfx_laser1.ogg");

        this.spriteFont = await this.loadSnowBSpriteFont(gl, 
            "assets/SpriteFont.xml",
            "assets/SpriteFont.png");

        this.iceTexture = await Texture.loadTexture(gl, "assets/ice01.jpg");

        await this.loadSpriteSheet();
    }

    private static async loadSpriteSheet() {
        const sheetXmlReq = await fetch("assets/Spritesheet/sheet.xml");
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
            const sourceRect = new Rect(x, y, width - 1, height - 1);


            this.sprites[name] = new Sprite(this.spriteSheet, drawRect, sourceRect);
        });
    }

    public static async loadSnowBSpriteFont(gl: WebGL2RenderingContext,
        xmlPath: string, texturePath: string) {
        const texture = await Texture.loadTexture(gl, texturePath);

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
            const xAdvance = parseInt(char.getAttribute("xadvance")!);
            const xOffset = parseInt(char.getAttribute("xoffset")!);
            const yOffset = parseInt(char.getAttribute("yoffset")!);

            const x1 = x / texture.width;
            const y1 = 1 - (y / texture.height);
            const x2 = (x + width) / texture.width;
            const y2 = 1 - ((y + height) / texture.height);

            const quad = new Quad(
                vec2.fromValues(x1, y1),
                vec2.fromValues(x2, y1),
                vec2.fromValues(x2, y2),
                vec2.fromValues(x1, y2)
            )

            font.createChar(id,
                quad,
                vec2.fromValues(width, height),
                xAdvance,
                vec2.fromValues(xOffset, yOffset));
        });

        return font;
    }

    private static async loadSound(path: string)
    {
        const req = await fetch(path);
        const buffer = await req.arrayBuffer();

        return new Sound(this.audioContext, buffer);
    }
}