import * as BabylonViewer from '@babylonjs/viewer';
import { Engine, Tools, KeyboardEventTypes, Space, AnimationGroup, int, AbstractMesh, float, ArcRotateCamera, OimoJSPlugin, SpotLight, HemisphericLight, Scene, Animation, Vector3, Mesh, Color3, Color4, ShadowGenerator, GlowLayer, PointLight, FreeCamera, CubeTexture, Sound, PostProcess, Effect, SceneLoader, Matrix, MeshBuilder, Quaternion, AssetsManager, StandardMaterial, PBRMaterial, Material } from "@babylonjs/core";
import { FirstPersonController } from "./FirstPersonController";
import { Player } from "./Player";

export class Enemy {
    private currentEnemyHealth: float;
    private damage: float;
    private playerDamage: float;
    private time: float;
    private velocity: float;

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

    constructor(scene: Scene, canvas: HTMLCanvasElement, difficulty, velocity: int) {
        this.scene = scene;
        this._canvas = canvas;
        this.velocity = velocity;
        this.spawner(difficulty);
        this.KeyboardInput();
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
        this.CreateEnemy(new Vector3(this.getRandomInt(difficulty), 0, this.getRandomInt(difficulty)));
    }


    private async CreateEnemy(position: Vector3): Promise<any> {
        const result = await SceneLoader.ImportMeshAsync("", "./models/", "zombie.glb", this.scene);

        let env = result.meshes[0];
        let allMeshes = env.getChildMeshes();
        env.position = position;
        env.scaling = new Vector3(0.02, 0.02, 0.02);
        env.name = "zombie";
        this.zombie = env;


        this._attack = this.scene.getAnimationGroupByName("Zombie@Z_Attack");
        this._fallingBack = this.scene.getAnimationGroupByName("Zombie@Z_FallingBack");
        this._fallingForward = this.scene.getAnimationGroupByName("Zombie@Z_FallingForward");
        this._idle = this.scene.getAnimationGroupByName("Zombie@Z_Idle");
        this._run = this.scene.getAnimationGroupByName("Zombie@Z_Run_InPlace");
        this._walk = this.scene.getAnimationGroupByName("Zombie@Z_Walk1_InPlace");
        this._walk2 = this.scene.getAnimationGroupByName("Zombie@Z_Walk_InPlace");
        this._setUpAnimations();
        this._animatePlayer()

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
                            this.chase(this.velocity*1.1);
                            break;
                        case 'Shift':
                            this.chase(this.velocity*2);
                            break;
                        case 'Control':
                            this.chase(this.velocity*3);
                            break;
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
                        this.chase(this.velocity);
                        this._currentAnim = this._idle;
                    }
                    break;
            }
        })
    }



    private chase(velocity: float) {
        let zombie = this.zombie;
        let scene = this.scene;
        let camera = scene.getCameraByName("camera");

        if (zombie.isEnabled()) {
            // Calculating distances between the enemy and the player
            let initVec = zombie.position.clone();
            let distVec = Vector3.Distance(camera.position, zombie.position);
            let targetVec = camera.position.subtract(initVec);
            let targetVecNorm = Vector3.Normalize(targetVec);

            if(distVec < 6)
            {
                this.attack();
            }
            // Move enemy towards the player and stops slightly ahead
            if (velocity >= 0.5) {
                this._currentAnim = this._run;
                this._animatePlayer();
            }
            else if(velocity == 0){
                this._currentAnim = this._idle;
                this._animatePlayer();
            }
            else if (velocity > 0 && velocity < 0.5)  {
                
                this._currentAnim = this._walk;
                this._animatePlayer();
            }
            distVec -= velocity;
            zombie.translate(new Vector3(targetVecNorm._x, 0, targetVecNorm._z,), velocity, Space.WORLD);

            // Enemy always faces the player
            zombie.setParent(null);
            zombie.lookAt(camera.position);
        }
    }

    private attack() {
        if(!this._attack.isPlaying)
        this._attack.play();
        else {
            this.velocity = 0;
            this._attack.play();
        }

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
        this._currentAnim = this._idle;
        this._prevAnim = this._fallingBack;
        this._run.loopAnimation = true;
        this._idle.loopAnimation = true;
        this._walk.loopAnimation = true;
        this._walk2.loopAnimation = true;
        this._attack.loopAnimation = true;
        this._walk2.speedRatio = 2;
    }

    private getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }
}