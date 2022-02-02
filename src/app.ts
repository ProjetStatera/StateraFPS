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
        //assign the canvas
        this._canvas = this._createCanvas();

        // initialize babylon + disable pointer scene and engine
        this._engine = new Engine(this._canvas, true);
        this._scene = new Scene(this._engine);
        this._scene.onPointerDown = (evt)=>
        {
            if(evt.button === 0 )//left click
            {
                this._engine.enterPointerlock();
            } 
            if(evt.button === 1)//middle click
            {
                this._engine.exitPointerlock();
            }
        }

        //stable framerate for using gravity
        const framesPerSecond = 60;
        const gravity = -9.81; //earth one
        this._scene.gravity = new Vector3(0, gravity/framesPerSecond, 0);
        this._scene.collisionsEnabled = true;

        //Create the light
        var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 1), this._scene); //white light

        //Generate the map mesh
        this.CreateMap();

        //launch FirstPersonController.ts
        this.goToGame();

        //debugger 
        this._scene.debugLayer.show();


        //for development: make inspector visible/invisible
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
        
        //hitbox
        allMeshes.map(allMeshes=>
        {
            allMeshes.checkCollisions = true;
        })
    }

    //launch FirstPersonController.ts
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