import { Animation, Space, SceneLoader, Scene, Vector3, Ray, TransformNode, Mesh, Color3, Color4, UniversalCamera, Quaternion, AnimationGroup, ExecuteCodeAction, ActionManager, ParticleSystem, Texture, SphereParticleEmitter, Sound, Observable, ShadowGenerator, FreeCamera, ArcRotateCamera, EnvironmentTextureTools, Vector4, AbstractMesh, KeyboardEventTypes } from "@babylonjs/core";

export class FirstPersonController {
    public camera: FreeCamera;
    public scene: Scene;
    public _canvas: HTMLCanvasElement;
    public animation: AnimationGroup;
    public mesh: AbstractMesh;

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
        this.camera = new FreeCamera("camera", new Vector3(0, -8, 0), this.scene);
        this.camera.attachControl(this._canvas, true);

        //hitbox + gravity
        this.camera.applyGravity = true;
        this.camera.checkCollisions = true;

        //define the camera as player (on his hitbox)
        this.camera.ellipsoid = new Vector3(1, 1, 1);

        //Movements
        this.ApplyMovementRules(this.camera);
    }

    /**
     * Movements rules
     * @param camera this camera
     */
    ApplyMovementRules(camera: FreeCamera): void {
        camera.keysUp = [90];//z
        camera.keysDown = [83];//s
        camera.keysLeft = [81]//q
        camera.keysRight = [68];//d
        camera.keysUpward = [32];//space (jump)
        camera.angularSensibility = 1000;
        camera.speed = 3;
        camera.inertia = 0;
    }

    Animation(): void {
        this.scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    switch (kbInfo.event.key) {
                        case "a":
                            this.scene.animationGroups[0].start(true,1.0,0.3,1);
                            this.scene.animationGroups[0].goToFrame(0.3);
                            //console.log("KEY DOWN: ", kbInfo.event.key)
                            break;
                        case "b":
                            this.scene.animationGroups[0].stop();
                            this.scene.animationGroups[0].start(false,1.0,0,0.3);
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
        //this.mesh = env;

        allMeshes.map(allMeshes => {
            allMeshes.checkCollisions = true;
            allMeshes.ellipsoid = new Vector3(1, 1, 1);
        })

        return {
            mesh: env as Mesh,
            animationGroups: result.animationGroups
        }
    }
}