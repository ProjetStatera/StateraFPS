import { Engine,AnimationGroup,int,AbstractMesh,float, ArcRotateCamera,OimoJSPlugin, SpotLight,HemisphericLight, Scene, Animation, Vector3, Mesh, Color3, Color4, ShadowGenerator, GlowLayer, PointLight, FreeCamera, CubeTexture, Sound, PostProcess, Effect, SceneLoader, Matrix, MeshBuilder, Quaternion, AssetsManager, StandardMaterial, PBRMaterial, Material } from "@babylonjs/core";
import { firstPersonController } from "./firstPersonController";
import { player } from "./player";

export class enemy{
    currentEnemyHealth: float;
    damage:float;
    playerDamage: float;

    public camera: FreeCamera;
    public scene: Scene;
    public _canvas: HTMLCanvasElement;
    public mesh: AbstractMesh;

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

    constructor(){
        
    }

    private async CreateEnemy(): Promise<any> {
        const result = await SceneLoader.ImportMeshAsync("", "./models/", "zombie.glb", this.scene);

        let env = result.meshes[0];
        let allMeshes = env.getChildMeshes();
        env.position = new Vector3(0, -0.1, 0);
        env.scaling = new Vector3(0.3, 0.3, -0.3);
    }
}