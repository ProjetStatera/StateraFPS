import { Animation, Space, Engine, SceneLoader, Scene, Vector3, Ray, TransformNode, Mesh, Color3, Color4, UniversalCamera, Quaternion, AnimationGroup, ExecuteCodeAction, ActionManager, ParticleSystem, Texture, SphereParticleEmitter, Sound, Observable, ShadowGenerator, FreeCamera, ArcRotateCamera, EnvironmentTextureTools, Vector4, AbstractMesh, KeyboardEventTypes, int } from "@babylonjs/core";

enum animationState { IDLE = 0, WALK = 1, RUN = 2, AIM = 3, FIRE = 4, RELOAD = 5 }

export class firstPersonController {
    public camera: FreeCamera;
    public scene: Scene;
    public _canvas: HTMLCanvasElement;
    public mesh: AbstractMesh;
    public currentAnimationState: int;

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
        this.CreateController();
        this.CreatePlayer();
        this.Animation();
    }


    /**
     * create the camera which represents the player (FPS)
     */
    CreateController(): void {
        this.camera = new FreeCamera("camera", new Vector3(0, 3, 0), this.scene);
        this.camera.attachControl(this._canvas, true);

        //hitbox + gravity
        this.camera.applyGravity = true;
        this.camera.checkCollisions = true;

        //define the camera as player (on his hitbox)
        this.camera.ellipsoid = new Vector3(1, 1.3, 1);

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
        camera.keysUpward.push(32);//space (jump)
        this.camera.minZ = 0.45;
        this.camera.speed = 2;
        this.camera.angularSensibility = 2000;
        camera.inertia = 0.1;
    }

    private Animation(): void {
        this.scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    switch (kbInfo.event.key) {
                        case 'z':
                        case 's':
                        case 'q':
                        case 'd':
                            this.walk();
                            break;
                        case 'Shift':
                            this.run();
                            break;
                    }
                    break;
            }
        })
    }

    private walk()
    {
        this.camera.speed = 3;
        this._currentAnim = this._walk;
        this._animatePlayer();
    }

    private run()
    {
        this.camera.speed = 5;
        this._currentAnim = this._run;
        this._animatePlayer();
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
        this._setUpAnimations();
        this._animatePlayer();

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