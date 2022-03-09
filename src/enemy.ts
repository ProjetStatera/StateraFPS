import * as BabylonViewer from '@babylonjs/viewer';
import { Engine, Tools, Space, AnimationGroup, int, AbstractMesh, float, ArcRotateCamera, OimoJSPlugin, SpotLight, HemisphericLight, Scene, Animation, Vector3, Mesh, Color3, Color4, ShadowGenerator, GlowLayer, PointLight, FreeCamera, CubeTexture, Sound, PostProcess, Effect, SceneLoader, Matrix, MeshBuilder, Quaternion, AssetsManager, StandardMaterial, PBRMaterial, Material } from "@babylonjs/core";
import { FirstPersonController } from "./FirstPersonController";
import { Player } from "./Player";

export class Enemy {
    public currentEnemyHealth: float;
    private damage: float;
    private playerDamage: float;
    private time: float;

    public camera: FreeCamera;
    public scene: Scene;
    public _canvas: HTMLCanvasElement;
    public zombie: AbstractMesh;
    public enemyList: Array<Enemy>;

    // animation trackers
    private _currentAnim: AnimationGroup = null;
    private _prevAnim: AnimationGroup;

    //animations
    private _attack: AnimationGroup;
    private _fallingBack: AnimationGroup;
    private _fallingForward: AnimationGroup;
    private _idle: AnimationGroup;
    private _run: AnimationGroup;
    private _walk: AnimationGroup;
    private _walk2: AnimationGroup;

    constructor(scene: Scene, canvas: HTMLCanvasElement, difficulty: int) {
        this.scene = scene;
        this._canvas = canvas;
        this.spawner(difficulty);
    }

    /*private async spawner(difficulty: int): Promise<any> {
        for (let i = 0; i <= 20; i++) {
            this.enemyList[i] = new Enemy(this.scene, this._canvas, difficulty);
        }
        //Adding up the chase() functions of each enemy to the render observable
        for (let i = 0; i < this.enemyList.length; i++) {
            this.scene.onBeforeRenderObservable.add(function () { this.enemyList[i].chase(); });
        }
    }*/
    private async spawner(difficulty: int): Promise<any> {
        for (let i = 0; i <= 20; i++) {
            this.CreateEnemy(new Vector3(this.getRandomInt(difficulty),0,this.getRandomInt(difficulty)));
        }
    }


    private async CreateEnemy(position: Vector3): Promise<any> {
        const result = await SceneLoader.ImportMeshAsync("", "./models/", "zombie.glb", this.scene);

        let env = result.meshes[0];
        let allMeshes = env.getChildMeshes();
        env.position = position;
        env.scaling = new Vector3(0.02, 0.02, -0.02);
        env.name = "zombie";
        this._setUpAnimations();
        this.scene.onBeforeRenderObservable.add(function () { this.chase() });

        this._attack = this.scene.getAnimationGroupByName("Zombie@Z_Attack");
        this._fallingBack = this.scene.getAnimationGroupByName("Zombie@Z_FallingBack");
        this._fallingForward = this.scene.getAnimationGroupByName("Zombie@Z_FallingForward");
        this._idle = this.scene.getAnimationGroupByName("Zombie@Z_Idle");
        this._run = this.scene.getAnimationGroupByName("Zombie@Z_Run_InPlace");
        this._walk = this.scene.getAnimationGroupByName("Zombie@Z_Walk1_InPlace");
        this._walk2 = this.scene.getAnimationGroupByName("Zombie@Z_Walk_InPlace");

    }

    private chase() {
        let zombie = this.zombie;
        let scene = this.scene;
        let camera = scene.getCameraByName("camera");

        if (zombie.isEnabled()) {
            // Calculating distances between the enemy and the player
            let initVec = zombie.position.clone();
            let distVec = Vector3.Distance(camera.position, zombie.position);
            let targetVec = camera.position.subtract(initVec);
            let targetVecNorm = Vector3.Normalize(targetVec);

            // Move enemy towards the player and stops slightly ahead
            if (distVec < 40) {
                distVec -= 0.05;
                zombie.translate(targetVecNorm, 0.05, Space.WORLD);
                this.attack();

            }

            // Enemy always faces the player
            zombie.setParent(null);
            zombie.lookAt(camera.position, Math.PI, Math.PI / 2);

        }
    }

    private attack() {
        this._currentAnim = this._attack;
        this._animatePlayer()
    }

    private _animatePlayer(): void {
        if (this._currentAnim != null && this._prevAnim !== this._currentAnim) {
            this._prevAnim.stop();
            this._currentAnim.play(this._currentAnim.loopAnimation);
            this._prevAnim = this._currentAnim;
        }
    }

    private _setUpAnimations(): void {
        //initialize current and previous
        this._currentAnim = this._walk;
        this._prevAnim = this._walk2;
    }

    private getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }
}