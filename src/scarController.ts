import { Animation, Tools, RayHelper, PointLight, PBRMetallicRoughnessMaterial, SpotLight, DirectionalLight, OimoJSPlugin, PointerEventTypes, Space, Engine, SceneLoader, Scene, Vector3, Ray, TransformNode, Mesh, Color3, Color4, UniversalCamera, Quaternion, AnimationGroup, ExecuteCodeAction, ActionManager, ParticleSystem, Texture, SphereParticleEmitter, Sound, Observable, ShadowGenerator, FreeCamera, ArcRotateCamera, EnvironmentTextureTools, Vector4, AbstractMesh, KeyboardEventTypes, int, _TimeToken, CameraInputTypes, WindowsMotionController, Camera } from "@babylonjs/core";
import { Enemy } from "./enemy";

export class ScarController {
    private _camera: FreeCamera;
    private _scene: Scene;
    private _canvas: HTMLCanvasElement;
    private _zombie: Enemy;
    private meshes: AbstractMesh;
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
    private _get: AnimationGroup; 
    private _shot: AnimationGroup;
    private _idle: AnimationGroup;
    private _recharge: AnimationGroup;
    private _aim_walk: AnimationGroup;
    private _aim_idle: AnimationGroup;
    private _aim_shot: AnimationGroup;
    private _run: AnimationGroup;
    private _hide: AnimationGroup; 
    private _walk: AnimationGroup;

    //Keys
    private zPressed: boolean = false;
    private qPressed: boolean = false;
    private sPressed: boolean = false;
    private dPressed: boolean = false;
    private controlPressed: boolean = false;   
    private controlIPressed: int = 0; 
    private rightClickPressed: boolean = false;



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
        //this.setPosition();
        this.update();
    }
    /**
     * launched every 60ms 
     */
    private update() {
        this._scene.onReadyObservable.addOnce(() => {
            setInterval(() => {
                console.log("test");
                switch (this._camera.speed) {
                    case 0:
                        this.manageAnimation(this._idle);
                        break;
                    case this.walkSpeed:
                        this.manageAnimation(this._walk);
                        break;
                    /*case this.runSpeed:
                        /.manageAnimation(this._run);
                        break;*/
                    case this.sprintSpeed:
                        this.manageAnimationSprint();
                        break;
                    default:
                        clearInterval();
                }
            }, 60);
        })
    }
    private manageAnimation(animation) {
        this._currentAnim = animation;
        this._animatePlayer();
        if(this.controlPressed)
        {
            this.controlIPressed=0;
        }
        if(this._currentAnim===this._run)
        {
            this._currentAnim.loopAnimation=false;
            this._currentAnim=this._walk;
            this._animatePlayer();
            /*else
            { 
                this._currentAnim.onAnimationEndObservable.add(()=>{
                    this._currentAnim===this._idle;
                })
            }*/
        }
    }

    private manageAnimationSprint() {
        if (this.zPressed){
            if (this.controlPressed && this.controlIPressed===0 && !this.qPressed && !this.dPressed) {
                if(this.controlPressed)
                {
                    this._prevAnim = this._run;
                    this._currentAnim = this._run;
                    this._currentAnim.loopAnimation = true;
                    this._currentAnim.play(this._currentAnim.loopAnimation);
                }
                this.controlIPressed=1;
            }
            if (!this.controlPressed && this.controlIPressed===1) {
                if (this._currentAnim === this._run) {
                    this._currentAnim.loopAnimation = false;
                    this._currentAnim.onAnimationEndObservable.add(()=>{
                            if(this.zPressed)
                            {
                                this.walk(3);
                            }
                            else if(!this.zPressed)
                            {
                                this.walk(0);
                            }
                        })
                }
                this.controlIPressed=0;
            }
        }
        else if(!this.zPressed)
        {
            if(this.controlPressed && this.controlIPressed===0)
            {
                if(this.zPressed)
                {
                    this._prevAnim = this._run;
                    this._currentAnim = this._run;
                    this._currentAnim.loopAnimation = true;
                    this._currentAnim.play(this._currentAnim.loopAnimation);
                }
            }
            if(!this.controlPressed)
            {
                if (this._currentAnim === this._run) {
                    this._currentAnim.loopAnimation = false;
                    this._currentAnim.onAnimationEndObservable.add(()=>{
                        if(this.zPressed)
                        {
                            this.walk(3);
                        }
                        else if(!this.zPressed)
                        {
                            this.walk(0);
                        }
                    })
                }
                this.controlIPressed=0;
            }
        }
    }
    

    private delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
                            if(this.controlPressed)
                            {
                                this.walk(this.sprintSpeed);
                            }
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
                            if(!this.qPressed && !this.dPressed)
                            {
                                this.walk(this.sprintSpeed);
                                this.controlPressed = true;
                            }
                    
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
                            this.controlPressed = false;
                            this.allUnpressed();
                            break;
                    }
                    break;
            }
        })
        this._scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case PointerEventTypes.POINTERDOWN:
                    if(pointerInfo.event.button === 0)
                    {
                        this.fire();
                    }
                    else if(pointerInfo.event.button == 2)
                    {
                        this.rightClickPressed=true;
                        this.fire();
                    }
                    break;
            }
        })
    }

    private allUnpressed() {
        if (!this.zPressed && !this.qPressed && !this.sPressed && !this.dPressed) {
            this.walk(0);
        }
        if(this.controlPressed && this.zPressed)
        {
            this.walk(this.sprintSpeed);
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
        if(!this.rightClickPressed)
        {
            this._shot.play(false);
        }
        else{
            this._aim_shot.play(false);
            this.rightClickPressed=false;
        }

        for (let i = 0; i < this._zMeshes.length; i++) {
            if (hit.pickedMesh.name == this._zMeshes[i]) {
                this._zombie.die();
            }
        }
    }

    private async CreatePlayer(): Promise<any> {
        const result = await SceneLoader.ImportMeshAsync("", "./models/", "ak.glb", this._scene);

        let env = result.meshes[0];
        let allMeshes = env.getChildMeshes();
        env.parent = this._camera;
        env.position = new Vector3(0, -0.1, 0);
        env.scaling = new Vector3(0.3, 0.3, -0.3);
        for(let i = 1; i < 4; i++)
        {
            result.meshes[i].renderingGroupId = 2;
        }/*
        result.meshes[0].position = new Vector3(0, -6.70, 1);
        result.meshes[0].rotation = new Vector3(0, 0, 0);
        result.meshes[0].scaling = new Vector3(4, 4, -3);*/

        //audio effect 
        this._ak47Sound = new Sound("ak47Sound", "sounds/ak47shot.mp3", this._scene);
        this._flashlightSound = new Sound("flashlightSound", "sounds/flashlight.mp3", this._scene);
        
        //animations
        this._hide = this._scene.getAnimationGroupByName("Hands_Automatic_rifle.Hide");
        this._shot = this._scene.getAnimationGroupByName("Hands_Automatic_rifle.Singl_Shot");
        this._idle = this._scene.getAnimationGroupByName("Hands_Automatic_rifle.Idle");
        this._recharge = this._scene.getAnimationGroupByName("Hands_Automatic_rifle.Recharge");
        this._run = this._scene.getAnimationGroupByName("Hands_Automatic_rifle.Run");
        this._get = this._scene.getAnimationGroupByName("Hands_Automatic_rifle.Get");
        this._walk = this._scene.getAnimationGroupByName("Hands_Automatic_rifle.Walk");
        this._aim_walk = this._scene.getAnimationGroupByName("Hands_Automatic_rifle.Aiming_Walk");
        this._aim_shot = this._scene.getAnimationGroupByName("Hands_Automatic_rifle.Aiming_Shot");
        this._aim_idle = this._scene.getAnimationGroupByName("Hands_Automatic_rifle.Aiming_Idle");
        this._run.loopAnimation = true;
        this._idle.loopAnimation = true;
        this._walk.loopAnimation = true;
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
        this._currentAnim = this._get;
        this._prevAnim = this._hide;
    }

    private _animatePlayer(): void {
        if (this._currentAnim != null && this._prevAnim !== this._currentAnim) {
            this._prevAnim.stop();
            this._currentAnim.play(this._currentAnim.loopAnimation);
            this._prevAnim = this._currentAnim;
        }
    }
}