import * as BabylonViewer from '@babylonjs/viewer';
import { Engine, Tools, KeyboardEventTypes, Space, AnimationGroup, int, AbstractMesh, float, ArcRotateCamera, OimoJSPlugin, SpotLight, HemisphericLight, Scene, Animation, Vector3, Mesh, Color3, Color4, ShadowGenerator, GlowLayer, PointLight, FreeCamera, CubeTexture, Sound, PostProcess, Effect, SceneLoader, Matrix, MeshBuilder, Quaternion, AssetsManager, StandardMaterial, PBRMaterial, Material } from "@babylonjs/core";
import { FirstPersonController } from "./FirstPersonController";
import { Player } from "./Player";

export class Enemy {

    private velocity: float;
    private isDead: Boolean;

    public camera: FreeCamera;
    public scene: Scene;
    public _canvas: HTMLCanvasElement;
    public zombieMeshes: AbstractMesh;
    public name:string;
    public enemyList: Array<Enemy>; //coming soon

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

    constructor(scene: Scene, canvas: HTMLCanvasElement, difficulty, velocity: int, name:string) {
        this.scene = scene;
        this._canvas = canvas;
        this.velocity = velocity;
        this.name = name;
        this.spawner(difficulty);
        this.update();
    }

    private async spawner(difficulty: int): Promise<any> {
        this.CreateEnemy(new Vector3(this.getRandomInt(difficulty), 0, this.getRandomInt(difficulty)));
    }


    private async CreateEnemy(position: Vector3): Promise<any> {
        const result = await SceneLoader.ImportMeshAsync("", "./models/", "zombie.glb", this.scene);

        let env = result.meshes[0];
        let allMeshes = env.getChildMeshes();
        env.position = position;
        env.scaling = new Vector3(0.02, 0.02, 0.02);
        env.name = this.name;
        this.zombieMeshes = env;

        this._attack = this.scene.getAnimationGroupByName("Zombie@Z_Attack");
        this._fallingBack = this.scene.getAnimationGroupByName("Zombie@Z_FallingBack");
        this._fallingForward = this.scene.getAnimationGroupByName("Zombie@Z_FallingForward");
        this._idle = this.scene.getAnimationGroupByName("Zombie@Z_Idle");
        this._run = this.scene.getAnimationGroupByName("Zombie@Z_Run_InPlace");
        this._walk = this.scene.getAnimationGroupByName("Zombie@Z_Walk1_InPlace");
        this._walk2 = this.scene.getAnimationGroupByName("Zombie@Z_Walk_InPlace");
        this._setUpAnimations();
        this._animateZombie()

        allMeshes.map(allMeshes => {
            allMeshes.checkCollisions = true;
            allMeshes.ellipsoid = new Vector3(1, 1, 1);
        })

    }

    /**
     * launched every 60ms 
     */
    private update() {
        this.scene.onReadyObservable.addOnce(() => {
        setInterval(() => {
            if(!this.isDead){
                this.chase(this.velocity);
            }
            else {
                clearInterval();
            }
        }, 60);
    })
}


    public getHit() {
        this._currentAnim = this._fallingBack;
        this._animateZombie();
    }

    public die() {
        if (!this.isDead) {
            this.isDead = true;
            this.getHit();
        }
        else {
            this.zombieMeshes.dispose();
        }
    }

    /**
     * chasing the player 
     * @param velocity zombie's one
     */
    private chase(velocity: float) {
        let zombie = this.zombieMeshes;
        let scene = this.scene;
        let camera = scene.getCameraByName("camera");

        if (zombie.isEnabled()) {
            // Calculating distances between the enemy and the player
            let initVec = zombie.position.clone();
            let distVec = Vector3.Distance(camera.position, zombie.position);
            let targetVec = camera.position.subtract(initVec);
            let targetVecNorm = Vector3.Normalize(targetVec);

            if (distVec < 6) {
                velocity = 0;
                this.attack();
            }
            // Move enemy towards the player and stops slightly ahead
            else if (velocity >= 0.6) {
                this._currentAnim = this._run;
                this._animateZombie();
            }
            else if (velocity == 0) {
                this._currentAnim = this._idle;
                this._animateZombie();
            }
            else if (velocity > 0 && velocity < 0.6) {
                this._currentAnim = this._walk2;
                this._animateZombie();
            }
            distVec -= velocity;
            zombie.translate(new Vector3(targetVecNorm._x, 0, targetVecNorm._z,), velocity, Space.WORLD);

            // Enemy always faces the player
            zombie.setParent(null);
            zombie.lookAt(camera.position);
        }
    }

    private attack() {
        if (!this.isDead && !this._attack.isPlaying)
            this._currentAnim = this._attack;
            this._animateZombie();
    }

    private _animateZombie(): void {
        if (this._currentAnim != null && this._prevAnim !== this._currentAnim) {
            this._prevAnim.stop();
            this._currentAnim.play(this._currentAnim.loopAnimation);
            this._prevAnim = this._currentAnim;
        }
    }

    private _setUpAnimations(): void {
        //initialize current and previous
        this._currentAnim = this._idle;
        this._prevAnim = this._fallingBack;
        this._run.loopAnimation = true;
        this._idle.loopAnimation = true;
        this._walk.loopAnimation = true;
        this._walk2.loopAnimation = true;
        this._attack.loopAnimation = true;
        this._walk2.speedRatio = 2;
    }

    /**
     * 
     * @param max 
     * @returns randint(max) like
     */
    private getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }
}