import { Animation, Tools,RayHelper, PointLight, PBRMetallicRoughnessMaterial, SpotLight, DirectionalLight, OimoJSPlugin, PointerEventTypes, Space, Engine, SceneLoader, Scene, Vector3, Ray, TransformNode, Mesh, Color3, Color4, UniversalCamera, Quaternion, AnimationGroup, ExecuteCodeAction, ActionManager, ParticleSystem, Texture, SphereParticleEmitter, Sound, Observable, ShadowGenerator, FreeCamera, ArcRotateCamera, EnvironmentTextureTools, Vector4, AbstractMesh, KeyboardEventTypes, int, _TimeToken } from "@babylonjs/core";
import { Timeline } from "@babylonjs/inspector/components/actionTabs/tabs/propertyGrids/animations/timeline";
import { Enemy } from "./enemy";

export class FirstPersonController {
    public camera: FreeCamera;
    public scene: Scene;
    public _canvas: HTMLCanvasElement;
    public mesh: Mesh;
    public zombie: Enemy;
    public engine: Engine;
    zMeshes: Array<String>;

    //headLight
    private light: SpotLight;

    // animation trackers
    private _currentAnim: AnimationGroup = null;
    private _prevAnim: AnimationGroup;

    //animations
    private _end: AnimationGroup;
    private _fire: AnimationGroup;
    private _idle: AnimationGroup;
    private _reload: AnimationGroup;
    private _reloadEmpty: AnimationGroup;
    private _reloadEmpty2: AnimationGroup;
    private _run: AnimationGroup;
    private _run2: AnimationGroup;
    private _run2_end: AnimationGroup;
    private _run2_start: AnimationGroup;
    private _start: AnimationGroup;
    private _walk: AnimationGroup;

    constructor(scene: Scene, canvas: HTMLCanvasElement, zombie:Enemy) {
        this.scene = scene;
        this._canvas = canvas;
        this.zombie = zombie;
        this.CreatePlayer();
        this.CreateController();
        this.KeyboardInput();
        this.setupFlashlight();
        this.setupAllMeshes();
    }

    /**
     * create the camera which represents the player (FPS)
     */
    private CreateController(): void {
        this.camera = new FreeCamera("camera", new Vector3(0, 3, 0), this.scene);
        this.camera.attachControl(this._canvas, true);

        //hitbox + gravity
        this.camera.applyGravity = true;
        this.camera.checkCollisions = true;

        //define the camera as player (on his hitbox)
        this.camera.ellipsoid = new Vector3(1, 1.1, 1);

        //Movements
        this.ApplyMovementRules(this.camera);
    }

    /**
     * Movements rules
     * @param camera this camera
     */
    ApplyMovementRules(camera: FreeCamera): void {
        camera.keysUp.push(90);//z
        camera.keysDown.push(83);//s
        camera.keysLeft.push(81)//q
        camera.keysRight.push(68);//d
        this.camera.minZ = 0.45;
        this.camera.speed = 2;
        this.camera.angularSensibility = 2000;
        camera.inertia = 0.1;
    }

    private KeyboardInput(): void {
        this.scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    switch (kbInfo.event.key) {
                        case 'z':
                        case 's':
                        case 'q':
                        case 'd':
                            this.runAnim(3, this._walk);
                            break;
                        case 'Shift':
                            this.runAnim(5, this._run);
                            break;
                        case 'Control':
                            this.runAnim(6, this._run2);
                            break;
                        case 'r':
                            this.runAnim(3, this._reloadEmpty);
                            break;
                        case 'f':
                            if (this.light.intensity == 5000) {
                                this.light.intensity = 0;
                            }
                            else {
                                this.light.intensity = 5000;
                            }
                    }
                    break;
            }
        })
        this.scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYUP:
                    switch (kbInfo.event.key) {
                        case 'z':
                        case 's':
                        case 'q':
                        case 'd':
                            this.runAnim(3, this._idle);
                            break;
                    }
                    break;
            }
        })
        this.scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case PointerEventTypes.POINTERDOWN:
                    this.fire();
                    break;
            }
        })
    }

    private setupFlashlight(){
        this.light = new SpotLight("spotLight", new Vector3(0, 1, 0), new Vector3(0, 0, 1), Math.PI / 3, 2, this.scene);
        this.light.intensity = 0;
        this.light.parent = this.camera;
    }

    private setupAllMeshes() {
        this.zMeshes = ["node8", "node10", "node12", "node14", "node16", "node18", "node20", "node22",
            "node24", "node26", "node28", "node30", "node32", "node34",];
    }


    private runAnim(speed: int, animation: AnimationGroup) {
        this.camera.speed = speed;
        this._currentAnim = animation;
        this._animatePlayer();
    }

    private stopAnim() {
        if (this._prevAnim != this._walk) {
            this.runAnim(3, this._idle);
        }
    }

    private vecToLocal(vector, mesh) {
        var m = mesh.getWorldMatrix();
        var v = Vector3.TransformCoordinates(vector, m);
        return v;
    }

    private fire() {
        var zombie = this.zombie;
        var origin = this.camera.position;


        var forward = new Vector3(0, 0, 1);
        forward = this.vecToLocal(forward, this.camera);

        var direction = forward.subtract(origin);
        direction = Vector3.Normalize(direction);

        var length = 100;

        var ray = new Ray(origin, direction, length);

        let rayHelper = new RayHelper(ray);
        rayHelper.show(this.scene);

        var hit = this.scene.pickWithRay(ray);
        //animation
        this.runAnim(3, this._fire);
        this._fire.play(false);

        //const idUnique = this.scene.getMeshByName("zombie").uniqueId;
        for (let i = 0; i < this.zMeshes.length; i++) {
            if (hit.pickedMesh.name == this.zMeshes[i]) {
                this.zombie.die();
            }
        }
    }


    private async CreatePlayer(): Promise<any> {
        const result = await SceneLoader.ImportMeshAsync("", "./models/", "FPS.glb", this.scene);

        let env = result.meshes[0];
        let allMeshes = env.getChildMeshes();
        env.parent = this.camera;
        env.position = new Vector3(0, -0.1, 0);
        env.scaling = new Vector3(0.3, 0.3, -0.3);

        //animations
        this._end = this.scene.getAnimationGroupByName("metarig|end");
        this._fire = this.scene.getAnimationGroupByName("metarig|Fire");
        this._idle = this.scene.getAnimationGroupByName("metarig|idle");
        this._reload = this.scene.getAnimationGroupByName("metarig|Reload");
        this._reloadEmpty = this.scene.getAnimationGroupByName("metarig|Reload_empty");
        this._reloadEmpty2 = this.scene.getAnimationGroupByName("metarig|Reload_empty2");
        this._run = this.scene.getAnimationGroupByName("metarig|run");
        this._run2 = this.scene.getAnimationGroupByName("metarig|run2");
        this._run2_end = this.scene.getAnimationGroupByName("metarig|run2_end");
        this._run2_start = this.scene.getAnimationGroupByName("metarig|run2_start");
        this._start = this.scene.getAnimationGroupByName("metarig|start");
        this._walk = this.scene.getAnimationGroupByName("metarig|walk");
        this._run.loopAnimation = true;
        this._idle.loopAnimation = true;
        this._walk.loopAnimation = true;
        this._run2.loopAnimation = true;
        this._setUpAnimations();
        this._animatePlayer();

        //physics rules
        const framesPerSecond = 60;
        const gravity = -9.81; //earth one
        this.scene.enablePhysics(new Vector3(0, gravity / framesPerSecond, 0), new OimoJSPlugin());

        allMeshes.map(allMeshes => {
            allMeshes.checkCollisions = true;
            allMeshes.ellipsoid = new Vector3(1, 1, 1);
        })

        return {
            mesh: env as Mesh,
            animationGroups: result.animationGroups
        }
    }

    private _setUpAnimations(): void {
        this.scene.stopAllAnimations();

        //initialize current and previous
        this._currentAnim = this._start;
        this._prevAnim = this._end;
    }

    private _animatePlayer(): void {
        if (this._currentAnim != null && this._prevAnim !== this._currentAnim) {
            this._prevAnim.stop();
            this._currentAnim.play(this._currentAnim.loopAnimation);
            this._prevAnim = this._currentAnim;
        }
    }


}