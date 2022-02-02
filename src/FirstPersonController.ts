import { Space, SceneLoader, Scene, Vector3, Ray, TransformNode, Mesh, Color3, Color4, UniversalCamera, Quaternion, AnimationGroup, ExecuteCodeAction, ActionManager, ParticleSystem, Texture, SphereParticleEmitter, Sound, Observable, ShadowGenerator, FreeCamera, ArcRotateCamera, EnvironmentTextureTools, Vector4 } from "@babylonjs/core";

export class FirstPersonController{
    public camera: FreeCamera;
    public scene: Scene;
    public _canvas: HTMLCanvasElement;

    constructor(scene: Scene, canvas: HTMLCanvasElement)
    {
        this.scene = scene;
        this._canvas = canvas;
        this.CreateController();
        this.CreatePlayer();
    }

    //Player
    public mesh: Mesh; //outer collisionbox of player

    //Animations
    private animation: AnimationGroup

    //create the camera which represents the player (FPS)
    CreateController():void
    {
    this.camera = new FreeCamera("camera",new Vector3(0,-8,0),this.scene);
    this.camera.attachControl(this._canvas, true);

    //hitbox + gravity
    this.camera.applyGravity = true;
    this.camera.checkCollisions = true;

    //define the camera as player (on his hitbox)
    this.camera.ellipsoid = new Vector3(1,1,1);

    //Movements
    this.ApplyMovementRules(this.camera);
    }

    //Movements rules
    ApplyMovementRules(camera: FreeCamera):void
    {
        camera.keysUp = [90];//z
        camera.keysDown = [83];//s
        camera.keysLeft = [81]//q
        camera.keysRight = [68];//d
        camera.keysUpward = [32];//space (jump)
        camera.angularSensibility = 1000;
        camera.speed = 3;
        camera.inertia = 0;
    }

    //create the player mesh
    async CreatePlayer():Promise<void>
    {
        const result = await SceneLoader.ImportMeshAsync("","./models/","Pistol.glb", this.scene);

        let env = result.meshes[0];
        let allMeshes = env.getChildMeshes();
        env.parent = this.camera;
        env.position = new Vector3(0.3,-0.6,1.7);
        env.scaling = new Vector3(3,3,-3);
        env.rotation = new Vector3(0,3,0);

        allMeshes.map(allMeshes=>
            {
                allMeshes.checkCollisions = true;
                allMeshes.ellipsoid = new Vector3(1,1,1);
            })
    }



}