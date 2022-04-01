import { Animation, Tools, RayHelper, PointLight, PBRMetallicRoughnessMaterial, SpotLight, DirectionalLight, OimoJSPlugin, PointerEventTypes, Space, Engine, SceneLoader, Scene, Vector3, Ray, TransformNode, Mesh, Color3, Color4, UniversalCamera, Quaternion, AnimationGroup, ExecuteCodeAction, ActionManager, ParticleSystem, Texture, SphereParticleEmitter, Sound, Observable, ShadowGenerator, FreeCamera, ArcRotateCamera, EnvironmentTextureTools, Vector4, AbstractMesh, KeyboardEventTypes, int, _TimeToken, CameraInputTypes, WindowsMotionController } from "@babylonjs/core";
import { Enemy } from "./Enemy";

export class FirstPersonController {
    private _camera: FreeCamera;
    private _scene: Scene;
    private _canvas: HTMLCanvasElement;
    private _zombie: Enemy;
    private _zMeshes: Array<String>;

    //sounds
    private _ak47Sound: Sound;
    private _flashlightSound: Sound;

    private _ambianceSound: Sound;

    //headLight
    private _light: SpotLight;

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

    //Keys
    private zPressed: boolean = false;
    private qPressed: boolean = false;
    private sPressed: boolean = false;
    private dPressed: boolean = false;
    private controlPressed: boolean = false;

    //speed
    walkSpeed = 3;
    runSpeed = 4;
    sprintSpeed = 5;

    //soon an Array of Enemy instead of a simple zombie
    constructor(scene: Scene, canvas: HTMLCanvasElement, zombie: Enemy) {
        this._scene = scene;
        this._canvas = canvas;
        this._zombie = zombie;
        this.CreatePlayer();
        this.CreateController();
        this.KeyboardInput();
        this.setupFlashlight();
        this.setupAllMeshes();
        this.update();
    }
    /**
     * launched every 60ms 
     */
    private update() {
        this._scene.onReadyObservable.addOnce(() => {
            setInterval(() => {
                switch (this._camera.speed) {
                    case 0:
                        this.manageAnimation(this._idle);
                        break;
                    case this.walkSpeed:
                        this.manageAnimation(this._walk);
                        break;
                    case this.runSpeed:
                        this.manageAnimation(this._run);
                        break;
                    case this.sprintSpeed:
                        break;
                    default:
                        clearInterval();
                }
            }, 60);
        })
    }
    private manageAnimation(animation)
    {
        this._currentAnim = animation;
        this._animatePlayer();
    }


    private delay(ms: number) {
        return new Promise( resolve => setTimeout(resolve, ms) );
    }
    
    /**
     * create the camera which represents the player (FPS)
     */
    private CreateController(): void {
        this._camera = new FreeCamera("camera", new Vector3(0, 3, 0), this._scene);
        this._camera.attachControl(this._canvas, true);

        //hitbox + gravity
        this._camera.applyGravity = true;
        this._camera.checkCollisions = true;

        //define the camera as player (on his hitbox)
        this._camera.ellipsoid = new Vector3(1, 1.1, 1);

        //Movements
        this.ApplyMovementRules(this._camera);
    }

    /**
     * Movements rules
     * @param camera this camera
     */
    ApplyMovementRules(camera: FreeCamera): void {
        camera.keysUp.push(90);//z
        camera.keysDown.push(83);//s
        camera.keysLeft.push(81)//q
        camera.keysRight.push(68);//d*
        camera.minZ = 0.45;
        camera.angularSensibility = 2000;
        camera.inertia = 0.1;
    }

    private KeyboardInput(): void {
        this._scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    switch (kbInfo.event.key) {
                        case 'z':
                            this.zPressed = true;
                            this.walk(this.walkSpeed);
                            break;
                        case 's':
                            this.sPressed = true;
                            this.walk(this.walkSpeed);
                            break;
                        case 'q':
                            this.qPressed = true;
                            this.walk(this.walkSpeed);
                            break;
                        case 'd':
                            this.dPressed = true;
                            this.walk(this.walkSpeed);
                            break;
                        case 'Shift':
                            this.walk(this.runSpeed);
                            break;
                        case 'Control':
                            if(this.zPressed)
                            {
                                this.walk(this.sprintSpeed);
                                if(!this.controlPressed)
                                {
                                    this._currentAnim = this._run2_start;
                                    this._currentAnim.play(this._currentAnim.loopAnimation);
                                    this._currentAnim.onAnimationEndObservable.add(()=>{
                                        this._prevAnim = this._run2_start
                                        this._currentAnim = this._run2;
                                        this._currentAnim.loopAnimation = true;
                                        this._currentAnim.play(this._currentAnim.loopAnimation);
                                    })
                                    this.controlPressed = true;
                                }
                                else if(this.controlPressed)
                                {
                                    if(this._currentAnim === this._run2)
                                    {
                                        this._currentAnim.loopAnimation = false;
                                        this._currentAnim = this._run2_end;
                                        this._prevAnim = this._run2_end
                                        this._currentAnim.play(this._currentAnim.loopAnimation);
                                        this.controlPressed = false;
                                    }
                                }
                            }
                            break;
                        case 'r':
                            // reload
                            break;
                        case 'f':
                            this._flashlightSound.play();
                            if (this._light.intensity == 5000) {
                                this._light.intensity = 0;
                            }
                            else {
                                this._light.intensity = 5000;
                            }
                    }
                    break;
            }
        })
        this._scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYUP:
                    switch (kbInfo.event.key) {
                        case 'z':
                            this.zPressed = false;
                            this.allUnpressed();
                            break;
                        case 's':
                            this.sPressed = false;
                            this.allUnpressed();
                            break;
                        case 'q':
                            this.qPressed = false;
                            this.allUnpressed();
                            break;
                        case 'd':
                            this.dPressed = false;
                            this.allUnpressed();
                            break;
                        case 'Control':
                            //this._animatePlayer();
                            break;
                    }
                    break;
            }
        })
        this._scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case PointerEventTypes.POINTERDOWN:
                    this.fire();
                    break;
            }
        })
    }

    private allUnpressed() {
        if (!this.zPressed && !this.qPressed && !this.sPressed && !this.dPressed) {
            this.walk(0);
        }
    }
    /**
     * create the flashlight
     */
    private setupFlashlight() {
        this._light = new SpotLight("spotLight", new Vector3(0, 1, 0), new Vector3(0, 0, 1), Math.PI / 3, 2, this._scene);
        this._light.intensity = 0;
        this._light.parent = this._camera;
    }

    /**
     * zombie's meshes, used to know if the zombie is hit
     */
    private setupAllMeshes() {
        this._zMeshes = ["node8", "node10", "node12", "node14", "node16", "node18", "node20", "node22",
            "node24", "node26", "node28", "node30", "node32", "node34",];
    }

    /**
     * Launch the animation
     * @param speed velocity of the player
     * @param animation launch this animation
     */
    private walk(speed: int) {
        this._camera.speed = speed;
    }

    /**
     * coordinate transform of enemy
     * @param vector 
     * @param mesh 
     * @returns 
     */
    private vecToLocal(vector, mesh) {
        var m = mesh.getWorldMatrix();
        var v = Vector3.TransformCoordinates(vector, m);
        return v;
    }

    //left and right click to set fire 
    private fire() {
        var zombie = this._zombie;
        var origin = this._camera.position;

        this._ak47Sound.play(); //sound
        var forward = new Vector3(0, 0, 1);
        forward = this.vecToLocal(forward, this._camera);

        var direction = forward.subtract(origin);
        direction = Vector3.Normalize(direction);

        var length = 100;

        var ray = new Ray(origin, direction, length);

        var hit = this._scene.pickWithRay(ray);

        //animation
        //set animation
        this._fire.play(false);

        for (let i = 0; i < this._zMeshes.length; i++) {
            if (hit.pickedMesh.name == this._zMeshes[i]) {
                this._zombie.die();
            }
        }
    }

    private async CreatePlayer(): Promise<any> {
        const result = await SceneLoader.ImportMeshAsync("", "./models/", "FPS.glb", this._scene);

        let env = result.meshes[0];
        let allMeshes = env.getChildMeshes();
        env.parent = this._camera;
        env.position = new Vector3(0, -0.1, 0);
        env.scaling = new Vector3(0.3, 0.3, -0.3);

        //audio effect 
        this._ak47Sound = new Sound("ak47Sound", "sounds/ak47shot.mp3", this._scene);
        this._flashlightSound = new Sound("flashlightSound", "sounds/flashlight.mp3", this._scene);

        //animations
        this._end = this._scene.getAnimationGroupByName("metarig|end");
        this._fire = this._scene.getAnimationGroupByName("metarig|Fire");
        this._idle = this._scene.getAnimationGroupByName("metarig|idle");
        this._reload = this._scene.getAnimationGroupByName("metarig|Reload");
        this._reloadEmpty = this._scene.getAnimationGroupByName("metarig|Reload_empty");
        this._reloadEmpty2 = this._scene.getAnimationGroupByName("metarig|Reload_empty2");
        this._run = this._scene.getAnimationGroupByName("metarig|run");
        this._run2 = this._scene.getAnimationGroupByName("metarig|run2");
        this._run2_end = this._scene.getAnimationGroupByName("metarig|run2_end");
        this._run2_start = this._scene.getAnimationGroupByName("metarig|run2_start");
        this._start = this._scene.getAnimationGroupByName("metarig|start");
        this._walk = this._scene.getAnimationGroupByName("metarig|walk");
        this._run.loopAnimation = true;
        this._idle.loopAnimation = true;
        this._walk.loopAnimation = true;
        this._run2.loopAnimation = true;
        this._run2_start.loopAnimation = false;
        this._setUpAnimations();
        this._animatePlayer();

        //physics rules
        const framesPerSecond = 60;
        const gravity = -9.81; //earth one
        this._scene.enablePhysics(new Vector3(0, gravity / framesPerSecond, 0), new OimoJSPlugin());

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
        this._scene.stopAllAnimations();

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