import "@babylonjs/core/Debug/debugLayer";
import * as GUI from "@babylonjs/gui";
import * as MATERIAL from "@babylonjs/materials"
import * as BABYLON from "@babylonjs/core"
import { firstPersonController } from "./firstPersonController";

enum State { START = 0, GAME = 1, LOSE = 2, CUTSCENE = 3 }

class App {
    // General Entire Application
    private _scene: BABYLON.Scene;
    public _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private fps: firstPersonController;
    private _gameScene: BABYLON.Scene;

    //Scene - related
    private _state: number = 0;

    constructor() {
        //assign the canvas and engine
        this._canvas = this._createCanvas();
        this._engine = new BABYLON.Engine(this._canvas, true);
        this._scene = new BABYLON.Scene(this._engine);

        var camera: BABYLON.ArcRotateCamera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, BABYLON.Vector3.Zero(), this._scene);
        camera.attachControl(this._canvas, true);
        this._scene.debugLayer.show(); //debugger
        var light1: BABYLON.HemisphericLight = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 1), this._scene); //white light

        this.main();
    }

    private async main(): Promise<void> {
        await this.goToStart();

        // Register a render loop to repeatedly render the scene
        this._engine.runRenderLoop(() => {
            switch (this._state) {
                case State.START:
                    this._scene.render();
                    break;
                case State.CUTSCENE:
                    this._scene.render();
                    break;
                case State.GAME:
                    this._scene.render();
                    break;
                case State.LOSE:
                    this._scene.render();
                    break;
                default: break;
            }
        });

        //resize if the screen is resized/rotated
        window.addEventListener('resize', () => {
            this._engine.resize();
        });
    }

    private async goToStart() {
        this._scene.detachControl(); //dont detect any inputs from this ui while the game is loading
        let scene = new BABYLON.Scene(this._engine);
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
        let camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 0, 0), scene);
        camera.setTarget(BABYLON.Vector3.Zero());

        //create a fullscreen ui for all of our GUI elements
        const guiMenu = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        guiMenu.idealHeight = 1080; //fit our fullscreen ui to this height

        //background image
        const imageRect = new GUI.Rectangle("titleContainer");
        imageRect.width = 0.8;
        imageRect.thickness = 0;
        guiMenu.addControl(imageRect);

        const startbg = new GUI.Image("startbg", "/sprites/start.jpg");
        imageRect.addControl(startbg);

        const title = new GUI.TextBlock("title", "Statera");
        title.resizeToFit = true;
        title.fontFamily = "Ceviche One";
        title.fontSize = "64px";
        title.color = "white";
        title.resizeToFit = true;
        title.top = "14px";
        title.width = 0.8;
        title.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        title.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        imageRect.addControl(title);

        //create a simple button
        const startBtn = GUI.Button.CreateSimpleButton("start", "PLAY");
        startBtn.width = 1;
        startBtn.height = "150px";
        startBtn.color = "white";
        startBtn.top = "-14px";
        startBtn.thickness = 0;
        startBtn.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        guiMenu.addControl(startBtn);

        //this handles interactions with the start button attached to the scene
        startBtn.onPointerDownObservable.add(() => {
            this.goToGame();
            scene.detachControl(); //observables disabled
        });
        //--SCENE FINISHED LOADING--
        await scene.whenReadyAsync();
        //lastly set the current state to the start state and set the scene to the start scene
        this._scene.dispose();
        this._scene = scene;
        this._state = State.GAME;

    }

    /**
     * Create the map
     */
    async CreateMap(): Promise<void> {
        var light1: BABYLON.HemisphericLight = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), this._scene); //white light
        light1.intensity = 1;
        light1.range = 100;

        // Sky material
        var skyboxMaterial = new MATERIAL.SkyMaterial("skyMaterial", this._scene);
        skyboxMaterial.backFaceCulling = false;

        // Sky mesh (box)
        var skybox = BABYLON.Mesh.CreateBox("skyBox", 1000.0, this._scene);
        skybox.material = skyboxMaterial;
        skyboxMaterial.luminance = 1;

        // Manually set the sun position
        skyboxMaterial.useSunPosition = true; // Do not set sun position from azimuth and inclination
        skyboxMaterial.sunPosition = new BABYLON.Vector3(0, 100, 0);

        const result = await BABYLON.SceneLoader.ImportMeshAsync("", "./models/", "SampleScene.glb", this._scene);

        let env = result.meshes[0];
        let allMeshes = env.getChildMeshes();

        this._scene.getTextureByUniqueID(240).level = 0; //delete shadows

        //hitbox
        allMeshes.map(allMeshes => {
            allMeshes.checkCollisions = true;
        })
    }

    /**
     * launch FirstPersonController.ts
     */
    private async goToGame() {
        let scene = new BABYLON.Scene(this._engine);
        this._gameScene = scene;
        this._scene.detachControl();
        this.fps = new firstPersonController(this._gameScene, this._canvas);
        this._gameScene.onPointerDown = (evt) => {
            if (evt.button === 0)//left click
            {
                this._engine.enterPointerlock();
            }
            if (evt.button === 1)//middle click
            {
                this._engine.exitPointerlock();
            }
        }
        //stable framerate for using gravity
        const framesPerSecond = 60;
        const gravity = -9.81; //earth one
        this._gameScene.gravity = new BABYLON.Vector3(0, gravity / framesPerSecond, 0);
        this._gameScene.collisionsEnabled = true;
        //get rid of start scene, switch to gamescene and change states
        this._scene.dispose();
        this._state = State.GAME;
        this._scene = this._gameScene;
        this._engine.displayLoadingUI();
        this.CreateMap();
        await this._scene.whenReadyAsync();
        this._engine.hideLoadingUI();
        this._scene.debugLayer.show();
    }


    /**
     * set up the canvas
     * @returns this canvas
     */
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