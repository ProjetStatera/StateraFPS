import * as BabylonViewer from '@babylonjs/viewer';
import { Engine, Tools, KeyboardEventTypes, Space, AnimationGroup, int, AbstractMesh, float, ArcRotateCamera, OimoJSPlugin, SpotLight, HemisphericLight, Scene, Animation, Vector3, Mesh, Color3, Color4, ShadowGenerator, GlowLayer, PointLight, FreeCamera, CubeTexture, Sound, PostProcess, Effect, SceneLoader, Matrix, MeshBuilder, Quaternion, AssetsManager, StandardMaterial, PBRMaterial, Material } from "@babylonjs/core";
import { FPSController } from "./FPSController";
import { Player } from "./Player";
import { PlayerHealth } from './PlayerHealth';

export class Enemy {

    protected velocity: float;
    protected _max_Health=100;
    protected _current_Health:int;
    protected _damages= 10;
    protected isDead: Boolean;
    protected isAttacking:Boolean;
    
    public static hitPlayer:boolean;
    public camera: FreeCamera;
    public scene: Scene;
    public _canvas: HTMLCanvasElement;
    public zombieMeshes: AbstractMesh;
    public name:string;
    public enemyList: Array<Enemy>; //coming soon

    // animation trackers
    protected _currentAnim: AnimationGroup = null;
    protected _prevAnim: AnimationGroup;

    //animations
    protected _attack: AnimationGroup;
    protected _fallingBack: AnimationGroup;
    protected _hit: AnimationGroup;
    protected _idle: AnimationGroup;
    protected _run: AnimationGroup;
    protected _walk: AnimationGroup;
    protected _walk2: AnimationGroup;
    protected _scream: AnimationGroup;
    

    constructor(scene: Scene, canvas: HTMLCanvasElement, difficulty, velocity: int, name: string) {
        this.scene = scene;
        this._canvas = canvas;
        this.velocity = velocity;
        this.name = name;
        this.spawner(difficulty);
        this.update();
        Enemy.hitPlayer = false;
        this._current_Health=this._max_Health;
    }

    protected async spawner(difficulty: int): Promise<any> {
        this.CreateEnemy(new Vector3(this.getRandomInt(difficulty), 0, this.getRandomInt(difficulty)));
    }

    //signature
    public async CreateEnemy(position: Vector3): Promise<any> {
    }

    /**
     * launched every 60ms 
     */
     protected update() {
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


    public getHit(damagesTaken: int) {
        this._current_Health-=damagesTaken;
        this._currentAnim=this._hit;
        this._animateZombie();
    }

    public die() {
        if (this._current_Health<=0) {
            this.isDead = true;
            this._currentAnim = this._fallingBack;
            this.zombieMeshes.setEnabled(false);
        }
    }

    /**
     * chasing the player 
     * @param velocity zombie's one
     */
     protected chase(velocity: float) {
        let zombie = this.zombieMeshes;
        let scene = this.scene;
        let camera = scene.getCameraByName("camera");

        if (zombie.isEnabled() && !this.isAttacking) {
            // Calculating distances between the enemy and the player
            let initVec = zombie.position.clone();
            let distVec = Vector3.Distance(camera.position, zombie.position);
            let targetVec = camera.position.subtract(initVec);
            let targetVecNorm = Vector3.Normalize(targetVec);

            if (distVec <= 6) {
                this.isAttacking = true;
                velocity = 0;
                this.attack();
                this.stunPlayer()
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
            else if (velocity > 0.05 && velocity < 0.6) {
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

    protected async stunPlayer()
    {
        Enemy.hitPlayer = true;
        await Tools.DelayAsync(5000);
        this._currentAnim = this._scream;
        this._animateZombie();
        Enemy.hitPlayer = false;
        await Tools.DelayAsync(10000);
        this.isAttacking = false;
        await Tools.DelayAsync(1000);
    }

    protected attack() {
        if (!this.isDead && !this._attack.isPlaying)
            this._currentAnim = this._attack;
            PlayerHealth._current_Health-=this._damages;
            this._animateZombie();
    }

    protected _animateZombie(): void {
        if (this._currentAnim != null && this._prevAnim !== this._currentAnim) {
            this._prevAnim.stop();
            this._currentAnim.play(this._currentAnim.loopAnimation);
            this._prevAnim = this._currentAnim;
        }
    }

    protected _setUpAnimations(): void {
        //initialize current and previous
        this._currentAnim = this._idle;
        this._prevAnim = this._fallingBack;
        this._run.loopAnimation = true;
        this._idle.loopAnimation = true;
        this._walk.loopAnimation = true;
        this._walk2.loopAnimation = true;
        this._attack.loopAnimation = false;
        this._walk2.speedRatio = 2;
    }

    /**
     * 
     * @param max 
     * @returns randint(max) like
     */
     protected getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }
}