export class InputManager 
{
    private keyDown: { [key: string]: boolean } = {};

    constructor()
    {
        window.addEventListener("keydown", (e) => this.keyDown[e.key] = true);
        window.addEventListener("keyup", (e) => this.keyDown[e.key] = false);
    }

    public isKeyDown(key: string): boolean 
    {
        return this.keyDown[key];
    }

    public isKeyUp(key: string): boolean 
    {
        return !this.keyDown[key];
    }
}