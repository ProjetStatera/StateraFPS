import { Animation, PointLight, PBRMetallicRoughnessMaterial, SpotLight, DirectionalLight, OimoJSPlugin, PointerEventTypes, Space, Engine, SceneLoader, Scene, Vector3, Ray, TransformNode, Mesh, Color3, Color4, UniversalCamera, Quaternion, AnimationGroup, ExecuteCodeAction, ActionManager, ParticleSystem, Texture, SphereParticleEmitter, Sound, Observable, ShadowGenerator, FreeCamera, ArcRotateCamera, EnvironmentTextureTools, Vector4, AbstractMesh, KeyboardEventTypes, int } from "@babylonjs/core";

enum animationState { IDLE = 0, WALK = 1, RUN = 2, AIM = 3, FIRE = 4, RELOAD = 5 }

export class firstPersonController {
    public camera: FreeCamera;
    public scene: Scene;
    public _canvas: HTMLCanvasElement;
    public mesh: AbstractMesh;
    public currentAnimationState: int;
    
    //headLight
    private light:SpotLight;

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



    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        this.scene = scene;
        this._canvas = canvas;
        this.CreatePlayer();
        this.CreateController();
        this.KeyboardInput();

        this.light = new SpotLight("spotLight", new Vector3(0, 1, 0), new Vector3(0, 0, 1), Math.PI / 3, 2, scene);
        this.light.intensity = 5000;
        this.light.parent = this.camera;
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
                            this.runAnim(3,this._walk);
                            break;
                        case 'Shift':
                            this.runAnim(5,this._run);
                            break;
                        case 'Control':
                            this.runAnim(6,this._run2);
                            break;
                        case 'r':
                            this.runAnim(3,this._reloadEmpty);
                            break;
                        case 'f':
                            if(this.light.intensity == 5000)
                            {
                                this.light.intensity = 0;
                            }
                            else{
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
                            this.runAnim(3,this._idle);
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


    private runAnim(speed: int, animation: AnimationGroup)
    {
        this.camera.speed = speed;
        this._currentAnim = animation;
        this._animatePlayer();
    }


    private fire() {
        this.runAnim(3,this._fire);
        this._fire.play(false);
    }



    private async CreatePlayer(): Promise<any> {
        const result = await SceneLoader.ImportMeshAsync("", "./models/", "FPS.glb", this.scene);

        let env = result.meshes[0];
        let allMeshes = env.getChildMeshes();
        env.parent = this.camera;
        env.position = new Vector3(0, -0.1, 0);
        env.scaling = new Vector3(0.3, 0.3, -0.3);

        //animations
        this._end = this.scene.animationGroups[0];
        this._fire = this.scene.animationGroups[1];
        this._idle = this.scene.animationGroups[2];
        this._reload = this.scene.animationGroups[3];
        this._reloadEmpty = this.scene.animationGroups[4];
        this._reloadEmpty2 = this.scene.animationGroups[5];
        this._run = this.scene.animationGroups[6];
        this._run2 = this.scene.animationGroups[7];
        this._run2_end = this.scene.animationGroups[8];
        this._run2_start = this.scene.animationGroups[9];
        this._start = this.scene.animationGroups[10];
        this._walk = this.scene.animationGroups[11];
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