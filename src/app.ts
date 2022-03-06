import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders";
import "@babylonjs/materials"

import { SkyMaterial } from "@babylonjs/materials";
import { AdvancedDynamicTexture, StackPanel, Button, TextBlock, Rectangle, Control, Image } from "@babylonjs/gui";
import { firstPersonController } from "./firstPersonController";
import { Engine, ArcRotateCamera, HemisphericLight, Scene, Animation, Vector3, Mesh, Color3, Color4, ShadowGenerator, GlowLayer, PointLight, FreeCamera, CubeTexture, Sound, PostProcess, Effect, SceneLoader, Matrix, MeshBuilder, Quaternion, AssetsManager } from "@babylonjs/core";

enum State { START = 0, GAME = 1, LOSE = 2, CUTSCENE = 3 }

class App {
    // General Entire Application
    private _scene: Scene;
    public _canvas: HTMLCanvasElement;
    private _engine: Engine;
    private fps: firstPersonController;
    private _gameScene: Scene;

    //Scene - related
    private _state: number = 0;

    constructor() {
        //assign the canvas and engine
        this._canvas = this._createCanvas();
        this._engine = new Engine(this._canvas, true);
        this._scene = new Scene(this._engine);

        var camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), this._scene);
        camera.attachControl(this._canvas, true);
        this._scene.debugLayer.show(); //debugger
        var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 1), this._scene); //white light

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
        this._engine.displayLoadingUI();
        this._scene.detachControl(); //dont detect any inputs from this ui while the game is loading
        let scene = new Scene(this._engine);
        scene.clearColor = new Color4(0, 0, 0, 1);
        let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
        camera.setTarget(Vector3.Zero());

        //create a fullscreen ui for all of our GUI elements
        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        guiMenu.idealHeight = 1080; //fit our fullscreen ui to this height

        //create a simple button
        const startBtn = Button.CreateSimpleButton("start", "PLAY");
        startBtn.width = 1;
        startBtn.height = "150px";
        startBtn.color = "white";
        startBtn.top = "-14px";
        startBtn.thickness = 0;
        startBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        guiMenu.addControl(startBtn);

        //this handles interactions with the start button attached to the scene
        startBtn.onPointerDownObservable.add(() => {
            this.goToGame();
            scene.detachControl(); //observables disabled
        });
        //--SCENE FINISHED LOADING--
        await scene.whenReadyAsync();
        this._engine.hideLoadingUI();
        //lastly set the current state to the start state and set the scene to the start scene
        this._scene.dispose();
        this._scene = scene;
        this._state = State.GAME;

    }

    /**
     * Create the map
     */
    async CreateMap(): Promise<void> {
        var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(0, 1, 0), this._scene); //white light
        light1.intensity = 2;
        light1.range = 100;

        // Sky material
        var skyboxMaterial = new SkyMaterial("skyMaterial", this._scene);
        skyboxMaterial.backFaceCulling = false;
        //skyboxMaterial._cachedDefines.FOG = true;

        // Sky mesh (box)
        var skybox = Mesh.CreateBox("skyBox", 1000.0, this._scene);
        skybox.material = skyboxMaterial;
        skyboxMaterial.luminance = 0.1;
        // Manually set the sun position
        skyboxMaterial.useSunPosition = true; // Do not set sun position from azimuth and inclination
        skyboxMaterial.sunPosition = new Vector3(0, 100, 0);

        const result = await SceneLoader.ImportMeshAsync("", "./models/", "SampleScene.glb", this._scene);

        let env = result.meshes[0];
        let allMeshes = env.getChildMeshes();

        //hitbox
        allMeshes.map(allMeshes => {
            allMeshes.checkCollisions = true;
        })
    }

    /**
     * launch FirstPersonController.ts
     */
    private async goToGame() {
        let scene = new Scene(this._engine);
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
        this._gameScene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
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