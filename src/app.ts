import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders";

import { FirstPersonController } from "./FirstPersonController";

import { Engine, ArcRotateCamera, HemisphericLight, Scene, Vector3, Mesh, Color3, Color4, ShadowGenerator, GlowLayer, PointLight, FreeCamera, CubeTexture, Sound, PostProcess, Effect, SceneLoader, Matrix, MeshBuilder, Quaternion, AssetsManager } from "@babylonjs/core";

class App {
    // General Entire Application
    private _scene: Scene;
    public _canvas: HTMLCanvasElement;
    private _engine: Engine;
    private fps: FirstPersonController
    
    constructor() {
        this._canvas = this._createCanvas();
        // initialize babylon scene and engine
        this._engine = new Engine(this._canvas, true);
        this._scene = new Scene(this._engine);

        //create camera + light
        //var camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), this._scene);
        //camera.attachControl(this._canvas, true);

        var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 1), this._scene); //white light

        //generate map + player
        //this.CreatePlayer();
        this.CreateMap();

        this.goToGame();
        this._scene.debugLayer.show();


        //**for development: make inspector visible/invisible
        window.addEventListener("keydown", (ev) => {
            //Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                if (this._scene.debugLayer.isVisible()) {
                    this._scene.debugLayer.hide();
                } else {
                    this._scene.debugLayer.show();
                }
            }
        });
        // run the main render loop
        this._engine.runRenderLoop(() => {
            this._scene.render();
        });
    }

    //Create the map
    async CreateMap():Promise<void>
    {
        const result = await SceneLoader.ImportMeshAsync("","./models/","Map.glb", this._scene);

        let env = result.meshes[0];
        let allMeshes = env.getChildMeshes();
    }

    private goToGame()
    {
        this.fps = new FirstPersonController(this._scene, this._canvas);
    }


    //set up the canvas
    private _createCanvas(): HTMLCanvasElement {

        //Commented out for development
        document.documentElement.style["overflow"] = "hidden";
        document.documentElement.style.overflow = "hidden";
        document.documentElement.style.width = "100%";
        document.documentElement.style.height = "100%";
        document.documentElement.style.margin = "0";
        document.documentElement.style.padding = "0";
        document.body.style.overflow = "hidden";
        document.body.style.width = "100%";
        document.body.style.height = "100%";
        document.body.style.margin = "0";
        document.body.style.padding = "0";

        //create the canvas html element and attach it to the webpage
        this._canvas = document.createElement("canvas");
        this._canvas.style.width = "100%";
        this._canvas.style.height = "100%";
        this._canvas.id = "gameCanvas";
        document.body.appendChild(this._canvas);

        return this._canvas;
    }
}
new App();