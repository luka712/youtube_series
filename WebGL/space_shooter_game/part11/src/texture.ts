export class Texture {


    constructor(public texture: WebGLTexture, public width: number, public height: number) {
    }


    public static async loadTexture(gl: WebGL2RenderingContext, uri: string): Promise<Texture> {


        const promise = new Promise<Texture>((resolve, reject) => {

            const image = new Image();
            image.src = uri;
            image.onload = () => {

                const texture = gl.createTexture()!;
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    image);
                gl.generateMipmap(gl.TEXTURE_2D);

                resolve(new Texture(texture, image.width, image.height));
            }

            image.onerror = () => {
                const msg = `Failed to load image ${uri}`;
                console.error(msg);
                alert(msg);
                reject();
            }

        });

        return promise;

    }
}