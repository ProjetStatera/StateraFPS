import { Animation, Space, SceneLoader, Scene, Vector3, Ray, TransformNode, Mesh, Color3, Color4, UniversalCamera, Quaternion, AnimationGroup, ExecuteCodeAction, ActionManager, ParticleSystem, Texture, SphereParticleEmitter, Sound, Observable, ShadowGenerator, FreeCamera, ArcRotateCamera, EnvironmentTextureTools, Vector4, AbstractMesh, KeyboardEventTypes, int } from "@babylonjs/core";

enum animationState { IDLE = 0, WALK = 1, RUN = 2, AIM = 3, FIRE = 4, RELOAD = 5}

export class firstPersonController {
    public camera: FreeCamera;
    public scene: Scene;
    public _canvas: HTMLCanvasElement;
    public animation: AnimationGroup;
    public mesh: AbstractMesh;
    public currentWeapon: int; // 1=pistol, 2=assault rifle,
    public currentAnimationState: int;

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
        this.camera = new FreeCamera("camera", new Vector3(0, 2, 0), this.scene);
        this.camera.attachControl(this._canvas, true);

        //hitbox + gravity
        this.camera.applyGravity = true;
        this.camera.checkCollisions = true;

        //define the camera as player (on his hitbox)
        this.camera.ellipsoid = new Vector3(1, 1, 1);

        this.camera.minZ = 0.45;
        this.camera.speed = 0.75;
        this.camera.angularSensibility = 4000;

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
        camera.angularSensibility = 1000;
        camera.speed = 4;
        camera.inertia = 0;
    }

    Animation(): void {
        this.scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    switch (kbInfo.event.key) {
                        case 'z':
                        case 's':
                        case 'q':
                        case 'd':
                            this.animationIdle();
                            break;
                        case "shift":
                            this.scene.animationGroups[0].stop();
                            this.scene.animationGroups[0].start(false,1.0,0,0.3);
                            break;
                    }
                    break;
            }
        })
    }

    /**
     * create the player mesh
     */
    async CreatePlayer(): Promise<any> {
        const result = await SceneLoader.ImportMeshAsync("", "./models/", "Pistol.glb", this.scene);

        let env = result.meshes[0];
        let allMeshes = env.getChildMeshes();
        env.parent = this.camera;
        env.position = new Vector3(0.3, -0.6, 1.7);
        env.scaling = new Vector3(3, 3, -3);
        env.rotation = new Vector3(0, 3, 0);

        allMeshes.map(allMeshes => {
            allMeshes.checkCollisions = true;
            allMeshes.ellipsoid = new Vector3(1, 1, 1);
        })

        return {
            mesh: env as Mesh,
            animationGroups: result.animationGroups
        }
    }

    animationIdle()
    {
        this.scene.animationGroups[0].stop();
        this.scene.animationGroups[0].start(true,0.3,7.8,8.8);
    }


}