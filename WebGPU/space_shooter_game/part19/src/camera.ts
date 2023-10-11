import { mat4 } from 'gl-matrix'

export class Camera {
    private projection!: mat4;
    private view!: mat4

    public projectionViewMatrix: mat4;

    constructor(public width: number, public height: number) {
        this.projectionViewMatrix = mat4.create();
    }

    public update() {

        this.projection = mat4.ortho(mat4.create(), 0, this.width, this.height, 0, -1, 1);
        this.view = mat4.lookAt(mat4.create(), [0, 0, 1], [0, 0, 0], [0, 1, 0]);

        mat4.multiply(this.projectionViewMatrix, this.projection, this.view);
    }
}