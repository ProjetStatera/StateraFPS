import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders";
import "@babylonjs/materials"

import { SkyMaterial } from "@babylonjs/materials";
import { AdvancedDynamicTexture, StackPanel, Button, TextBlock, Rectangle, Control, Image } from "@babylonjs/gui";
import { FirstPersonController } from "./FirstPersonController";
import { Enemy } from "./Enemy";
import { Engine, int,KeyboardEventTypes, Tools, ArcRotateCamera, OimoJSPlugin, SpotLight, HemisphericLight, Scene, Animation, Vector3, Mesh, Color3, Color4, ShadowGenerator, GlowLayer, PointLight, FreeCamera, CubeTexture, Sound, PostProcess, Effect, SceneLoader, Matrix, MeshBuilder, Quaternion, AssetsManager, StandardMaterial, PBRMaterial, Material, float, Light } from "@babylonjs/core";

enum State { START = 0, GAME = 1, LOSE = 2, CUTSCENE = 3 }

class App {
    // General Entire Application
    private _scene: Scene;
    public _canvas: HTMLCanvasElement;
    public _engine: Engine;
    private fps: FirstPersonController;
    private zombie: Enemy;
    private difficulty: int;
    private velocity: float;
    private _transition: boolean = false;
    private light1: Light;
    private skyboxMaterial: SkyMaterial;
    private zombies:Array<Enemy>;

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
        var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 1), this._scene); //white light

        this.zombies = []
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
                    this.KeyboardInput();
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
        let scene = new Scene(this._engine);
        scene.clearColor = new Color4(0, 0, 0, 1);
        let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
        camera.setTarget(Vector3.Zero());

        //create a fullscreen ui for all of our GUI elements
        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        guiMenu.idealHeight = 720; //fit our fullscreen ui to this height

        //background image
        const imageRect = new Rectangle("titleContainer");
        imageRect.width = 0.8;
        imageRect.thickness = 0;
        guiMenu.addControl(imageRect);

        const startbg = new Image("startbg", "/sprites/start.jpg");
        imageRect.addControl(startbg);

        const title = new TextBlock("title", "Statera");
        title.resizeToFit = true;
        title.fontFamily = "Ceviche One";
        title.fontSize = "64px";
        title.color = "white";
        title.resizeToFit = true;
        title.top = "14px";
        title.width = 0.8;
        title.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        title.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        imageRect.addControl(title);

        //create a simple button
        const startBtn = Button.CreateSimpleButton("start", "PLAY");
        startBtn.width = 1;
        startBtn.height = "150px";
        startBtn.color = "white";
        startBtn.top = "-14px";
        startBtn.thickness = 0;
        startBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        guiMenu.addControl(startBtn);

        // difficulties - easy
        const easy = new Image("easy", "/sprites/easy.png");
        easy.width = "5%";
        easy.stretch = Image.STRETCH_UNIFORM;
        easy.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        easy.left = -200;
        easy.paddingBottomInPixels = 620;
        guiMenu.addControl(easy);
        easy.onPointerDownObservable.add(() => {
            easy.width = "8%";
            medium.width = "5%";
            hard.width = "5%";
            this.difficulty = 400;
            this.velocity = 0.4;
        });

        //medium
        const medium = new Image("medium", "/sprites/medium.png");
        medium.width = "5%";
        medium.stretch = Image.STRETCH_UNIFORM;
        medium.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        medium.left = -100;
        medium.paddingBottomInPixels = 620;
        guiMenu.addControl(medium);
        medium.onPointerDownObservable.add(() => {
            easy.width = "5%";
            medium.width = "8%";
            hard.width = "5%";
            this.difficulty = 250;
            this.velocity = 0.7;
        });

        //hard
        const hard = new Image("hard", "/sprites/hard.png");
        hard.width = "5%";
        hard.stretch = Image.STRETCH_UNIFORM;
        hard.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        hard.paddingBottomInPixels = 620;
        guiMenu.addControl(hard);
        hard.onPointerDownObservable.add(() => {
            easy.width = "5%";
            medium.width = "5%";
            hard.width = "8%";
            this.difficulty = 100;
            this.velocity = 1.2;
        });

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

    private async CreateMap(): Promise<void> {
        var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(0, 1, 0), this._scene); //white light
        light1.intensity = 0.05;
        light1.range = 100;
        this.light1 = light1;

        // Sky material
        var skyboxMaterial = new SkyMaterial("skyMaterial", this._scene);
        skyboxMaterial.backFaceCulling = false;

        // Sky mesh (box)
        var skybox = Mesh.CreateBox("skyBox", 1000.0, this._scene);
        skybox.material = skyboxMaterial;
        skyboxMaterial.luminance = 0;
        this.skyboxMaterial = skyboxMaterial;

        // Manually set the sun position
        skyboxMaterial.useSunPosition = false; // Do not set sun position from azimuth and inclination
        skyboxMaterial.sunPosition = new Vector3(0, 100, 0);

        const result = await SceneLoader.ImportMeshAsync("", "./models/", "SampleScene.glb", this._scene);

        let env = result.meshes[0];
        let allMeshes = env.getChildMeshes();

        //this._scene.getTextureByUniqueID(457).level = 0; //delete shadows

        //hitbox
        allMeshes.map(allMeshes => {
            allMeshes.checkCollisions = true;
        })
    }

    private KeyboardInput(): void {
        this._scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    switch (kbInfo.event.key) {
                        case 'n':
                            if (this.light1.intensity != 1) {
                                this.skyboxMaterial.luminance = 1;
                                this.light1.intensity = 1;
                                this.skyboxMaterial.useSunPosition = true; // Do not set sun position from azimuth and inclination
                                this.skyboxMaterial.sunPosition = new Vector3(0, 100, 0);
                            } else {
                                this.skyboxMaterial.luminance = 0;
                                this.light1.intensity = 0.05;
                                this.skyboxMaterial.useSunPosition = false;
                            }
                            break;
                    }
                    break;
            }
        })
    }

    private createEnemies()
    {
        this.zombies = [new Enemy(this._gameScene, this._canvas, this.difficulty, this.velocity),
            new Enemy(this._gameScene, this._canvas, this.difficulty, this.velocity),
            new Enemy(this._gameScene, this._canvas, this.difficulty, this.velocity),
            new Enemy(this._gameScene, this._canvas, this.difficulty, this.velocity),
            new Enemy(this._gameScene, this._canvas, this.difficulty, this.velocity),
            new Enemy(this._gameScene, this._canvas, this.difficulty, this.velocity),
            new Enemy(this._gameScene, this._canvas, this.difficulty, this.velocity),
        ]
    }
    /**
     * launch FirstPersonController.ts
     */
    private async goToGame() {
        let scene = new Scene(this._engine);
        this._gameScene = scene;
        this._scene.detachControl();
        this.createEnemies();

        this.fps = new FirstPersonController(this._gameScene, this._canvas,this.zombies);

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

    public async goToLose(): Promise<void> {
        this._engine.displayLoadingUI();

        //--SCENE SETUP--
        this._scene.detachControl();
        let scene = new Scene(this._engine);
        scene.clearColor = new Color4(0, 0, 0, 1);
        let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
        camera.setTarget(Vector3.Zero());

        //--GUI--
        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        guiMenu.idealHeight = 720;

        //background image
        const image = new Image("lose", "sprites/lose.jpeg");
        image.autoScale = true;
        guiMenu.addControl(image);

        const panel = new StackPanel();
        guiMenu.addControl(panel);

        const text = new TextBlock();
        text.fontSize = 24;
        text.color = "white";
        text.height = "100px";
        text.width = "100%";
        panel.addControl(text);

        text.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
        text.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_CENTER;
        text.text = "You died !";
        const dots = new TextBlock();
        dots.color = "white";
        dots.fontSize = 24;
        dots.height = "100px";
        dots.width = "100%";
        dots.text = "...."

        const mainBtn = Button.CreateSimpleButton("mainmenu", "MAIN MENU");
        mainBtn.width = 0.2;
        mainBtn.height = "40px";
        mainBtn.color = "white";
        panel.addControl(mainBtn);

        Effect.RegisterShader("fade",
            "precision highp float;" +
            "varying vec2 vUV;" +
            "uniform sampler2D textureSampler; " +
            "uniform float fadeLevel; " +
            "void main(void){" +
            "vec4 baseColor = texture2D(textureSampler, vUV) * fadeLevel;" +
            "baseColor.a = 1.0;" +
            "gl_FragColor = baseColor;" +
            "}");

        let fadeLevel = 1.0;
        this._transition = false;
        scene.registerBeforeRender(() => {
            if (this._transition) {
                fadeLevel -= .05;
                if (fadeLevel <= 0) {
                    // this._goToCutScene();
                    this.goToStart();
                    this._transition = false;
                }
            }
        })

        //this handles interactions with the start button attached to the scene
        mainBtn.onPointerUpObservable.add(() => {
            //todo: add fade transition & selection sfx
            scene.detachControl();
            guiMenu.dispose();
            // this._goToStart();
            this._transition = true;
        });

        //--SCENE FINISHED LOADING--
        await scene.whenReadyAsync();
        this._engine.hideLoadingUI(); //when the scene is ready, hide loading
        //lastly set the current state to the lose state and set the scene to the lose scene
        this._scene.dispose();
        this._scene = scene;
        this._state = State.LOSE;
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