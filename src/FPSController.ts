import { Animation, Tools, RayHelper, PointLight, PBRMetallicRoughnessMaterial, SpotLight, DirectionalLight, OimoJSPlugin, PointerEventTypes, Space, Engine, SceneLoader, Scene, Vector3, Ray, TransformNode, Mesh, Color3, Color4, UniversalCamera, Quaternion, AnimationGroup, ExecuteCodeAction, ActionManager, ParticleSystem, Texture, SphereParticleEmitter, Sound, Observable, ShadowGenerator, FreeCamera, ArcRotateCamera, EnvironmentTextureTools, Vector4, AbstractMesh, KeyboardEventTypes, int, _TimeToken, CameraInputTypes, WindowsMotionController, Camera } from "@babylonjs/core";
import { Enemy } from "./Enemy";

export class FPSController {
    private _camera: FreeCamera;
    private _scene: Scene;
    private _canvas: HTMLCanvasElement;
    private _zombie: Enemy;
    private _zMeshes: Array<String>;

    //weapons
    private _weapon: AbstractMesh;

    //cooldown to shot
    private _cooldown_fire: int;
    private _cooldown_time: int;


    //sounds
    private _weaponSound: Sound;
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
    private _aim_walk: AnimationGroup;
    private _aim_shot: AnimationGroup;
    private _aim_idle: AnimationGroup;
    private _look: AnimationGroup;

    //Keys
    private zPressed: boolean = false;
    private qPressed: boolean = false;
    private sPressed: boolean = false;
    private dPressed: boolean = false;
    private controlPressed: boolean = false;
    private controlIPressed: int = 0;
    private rightClickPressed = false;

    //speed
    walkSpeed = 3;
    runSpeed = 4;
    sprintSpeed = 5;

    //soon an Array of Enemy instead of a simple zombie
    constructor(scene: Scene, canvas: HTMLCanvasElement, zombie: Enemy) {
        this._scene = scene;
        this._canvas = canvas;
        this._zombie = zombie;
        this.CreateScar();
        this.CreateController();
        this.KeyboardInput();
        this.setupFlashlight();
        this.setupAllMeshes();
        this.update();
        this.i = 0;
        this._cooldown_time = 0;

    }
    /**
     * launched every 60ms 
     */
    private update() {
        this._scene.onReadyObservable.addOnce(() => {
            setInterval(() => {
                if(this._cooldown_time<99999999)
                {
                    this._cooldown_time+=1
                }
                else{
                    this._cooldown_time=0;
                }
                console.log(this._cooldown_time);
                switch (this._camera.speed) {
                    case 0:
                        if(!this.rightClickPressed)
                        {
                            this.manageAnimation(this._idle);
                        }
                        else{
                            this.manageAnimation(this._aim_idle);
                        }
                        break;
                    case this.walkSpeed:
                        if(!this.rightClickPressed)
                        {
                            this.manageAnimation(this._walk);
                        }
                        else{
                            this.manageAnimation(this._aim_walk);
                        }
                        break;
                    case this.runSpeed:
                        this.manageAnimation(this._run);
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

    private i : int;

    private swap(lastWeapon) {
        lastWeapon.dispose();
        console.log(this.i);
        switch (this.i)
        {
            case 0 : 
                this.CreateAxe();
                this.i++;
                break;
            case 1 : 
                this.CreateMac10();
                this.i++;
                break;
            case 2 : 
                this.CreatePistol();
                this.i++;
                break;
            case 3 : 
                this.CreateSniper();
                this.i++;
                break;
            case 4 : 
                this.CreateScar();
                this.i = 0;
                break;
        }
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
                            break;
                        case 'p':
                            this.swap(this._weapon);
                            break;
                        case '&':
                            if(this._cooldown_fire<=this._cooldown_time/60)
                            {
                                this.fire();
                                this._cooldown_time=0;
                            }
                            break;

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
                        case 'Shift':
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
                        if(this._cooldown_fire<=this._cooldown_time/60)
                        {
                            this.fire();
                            this._cooldown_time=0;
                        }
                        console.log("click gauche down");
                    }
                    else if(pointerInfo.event.button == 2)
                    {
                        if(!this.rightClickPressed)
                        {
                            this.rightClickPressed=true;
                        }
                        else{
                            this.rightClickPressed=false;
                        }
                        console.log("click droit down");
                    }
                    break;
                case PointerEventTypes.POINTERUP:
                    if(pointerInfo.event.button === 2)
                    {
                        console.log("click droit up");
                    }
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

        this._weaponSound.play(); //sound
        var forward = new Vector3(0, 0, 1);
        forward = this.vecToLocal(forward, this._camera);

        var direction = forward.subtract(origin);
        direction = Vector3.Normalize(direction);

        var length = 1000;

        var ray = new Ray(origin, direction, length);

        var hit = this._scene.pickWithRay(ray);

        //animation
        //set animation
        if(!this.rightClickPressed)
        {
            this._fire.play(false);
        }
        else{
            this._aim_shot.play(false);
            this._animatePlayer();
        }


        for (let i = 0; i < this._zMeshes.length; i++) {
            if (hit.pickedMesh.name == this._zMeshes[i]) {
                this._zombie.die();
            }
        }
    }

    private async CreateScar(): Promise<any> {
        const result = await SceneLoader.ImportMeshAsync("", "./models/", "scar.glb", this._scene);

        let env = result.meshes[0];
        let allMeshes = env.getChildMeshes();
        env.parent = this._camera;
        this._weapon = env;
        for (let i = 1; i < 4; i++) {
            result.meshes[i].renderingGroupId = 2;
        }
        result.meshes[0].position = new Vector3(0, -6.70, 1);
        result.meshes[0].rotation = new Vector3(0, 0, 0);
        result.meshes[0].scaling = new Vector3(4, 4, -3);

        //audio effect 
        this._weaponSound = new Sound("ak47Sound", "sounds/ak47shot.mp3", this._scene);
        this._flashlightSound = new Sound("flashlightSound", "sounds/flashlight.mp3", this._scene);

        //animations
        this._end = this._scene.getAnimationGroupByName("Hands_Automatic_rifle.Hide");
        this._fire = this._scene.getAnimationGroupByName("Hands_Automatic_rifle.Singl_Shot");
        this._idle = this._scene.getAnimationGroupByName("Hands_Automatic_rifle.Idle");
        this._reload = this._scene.getAnimationGroupByName("Hands_Automatic_rifle.Recharge");
        this._run = this._scene.getAnimationGroupByName("Hands_Automatic_rifle.Run");
        this._start = this._scene.getAnimationGroupByName("Hands_Automatic_rifle.Get");
        this._walk = this._scene.getAnimationGroupByName("Hands_Automatic_rifle.Walk");
        this._aim_walk = this._scene.getAnimationGroupByName("Hands_Automatic_rifle.Aiming_Walk");
        this._aim_shot = this._scene.getAnimationGroupByName("Hands_Automatic_rifle.Aiming_Shot");
        this._aim_idle = this._scene.getAnimationGroupByName("Hands_Automatic_rifle.Aiming_Idle");
        this._run.loopAnimation = true;
        this._idle.loopAnimation = true;
        this._walk.loopAnimation = true;
        this._aim_walk.loopAnimation=true;
        this._setUpAnimations();
        this._animatePlayer();
        this._cooldown_fire = 0.15;

        return {
            mesh: env as Mesh,
            animationGroups: result.animationGroups
        }
    }

    private async CreateAxe(): Promise<any> {
        const result = await SceneLoader.ImportMeshAsync("", "./models/", "axe.glb", this._scene);

        let env = result.meshes[0];
        let allMeshes = env.getChildMeshes();
        env.parent = this._camera;
        this._weapon = env;
        for (let i = 1; i < 4; i++) {
            result.meshes[i].renderingGroupId = 2;
        }
        result.meshes[0].position = new Vector3(0, -6.90, 1);
        result.meshes[0].rotation = new Vector3(0, 0, 0);
        result.meshes[0].scaling = new Vector3(4, 4, -3);

        //audio effect 
        this._weaponSound = new Sound("ak47Sound", "sounds/ak47shot.mp3", this._scene);

        //animations
        this._end = this._scene.getAnimationGroupByName("Hands_Axe.Hide");
        this._fire = this._scene.getAnimationGroupByName("Hands_Axe.Attack");
        this._aim_shot = this._scene.getAnimationGroupByName("Hands_Axe.Attack2");
        this._idle = this._scene.getAnimationGroupByName("Hands_Axe.Idle");
        this._run = this._scene.getAnimationGroupByName("Hands_Axe.Run");
        this._start = this._scene.getAnimationGroupByName("Hands_Axe.Get");
        this._walk = this._scene.getAnimationGroupByName("Hands_Axe.Walk");
        this._look = this._scene.getAnimationGroupByName("Hands_Axe.Idle_Other");
        this._run.loopAnimation = true;
        this._idle.loopAnimation = true;
        this._walk.loopAnimation = true;
        this._cooldown_fire = 1.70;
        this._setUpAnimations();
        this._animatePlayer();

        return {
            mesh: env as Mesh,
            animationGroups: result.animationGroups
        }
    }

    private async CreateMac10(): Promise<any> {
        const result = await SceneLoader.ImportMeshAsync("", "./models/", "mac10.glb", this._scene);

        let env = result.meshes[0];
        let allMeshes = env.getChildMeshes();
        env.parent = this._camera;
        this._weapon = env;
        for (let i = 1; i < 4; i++) {
            result.meshes[i].renderingGroupId = 1;
        }
        result.meshes[0].position = new Vector3(0, -6.70, 1);
        result.meshes[0].rotation = new Vector3(0, 0, 0);
        result.meshes[0].scaling = new Vector3(4, 4, -3);

        //audio effect 
        this._weaponSound = new Sound("ak47Sound", "sounds/ak47shot.mp3", this._scene);

        //animations
        this._end = this._scene.getAnimationGroupByName("Hands_Tommy_gun.Hide");
        this._fire = this._scene.getAnimationGroupByName("Hands_Automatic_rifle.Singl_Shot");
        this._idle = this._scene.getAnimationGroupByName("Hands_Tommy_gun.Idle");
        this._reload = this._scene.getAnimationGroupByName("Hands_Tommy_gun.Reloading");
        this._run = this._scene.getAnimationGroupByName("Hands_Tommy_gun.Run");
        this._start = this._scene.getAnimationGroupByName("Hands_Tommy_gun.Get");
        this._walk = this._scene.getAnimationGroupByName("Hands_Tommy_gun.Walk");
        this._aim_walk = this._scene.getAnimationGroupByName("Hands_Tommy_gun.Aiming_Walk");
        this._aim_shot = this._scene.getAnimationGroupByName("Hands_Tommy_gun.Aiming_Shot");
        this._aim_idle = this._scene.getAnimationGroupByName("Hands_Tommy_gun.Aiming_Idle");
        this._look = this._scene.getAnimationGroupByName("Hands_Tommy_gun.Idle_Other");
        this._run.loopAnimation = true;
        this._idle.loopAnimation = true;
        this._walk.loopAnimation = true;
        this._aim_walk.loopAnimation=true;
        this._cooldown_fire = 0.13;
        this._setUpAnimations();
        this._animatePlayer();

        return {
            mesh: env as Mesh,
            animationGroups: result.animationGroups
        }
    }

    private async CreatePistol(): Promise<any> {
        const result = await SceneLoader.ImportMeshAsync("", "./models/", "pistol.glb", this._scene);

        let env = result.meshes[0];
        let allMeshes = env.getChildMeshes();
        env.parent = this._camera;
        this._weapon = env;
        for (let i = 1; i < 4; i++) {
            result.meshes[i].renderingGroupId = 1;
        }
        result.meshes[0].position = new Vector3(0, -6.70, 1);
        result.meshes[0].rotation = new Vector3(0, 0, 0);
        result.meshes[0].scaling = new Vector3(4, 4, -3);

        //audio effect 
        this._weaponSound = new Sound("ak47Sound", "sounds/ak47shot.mp3", this._scene);

        //animations
        this._end = this._scene.getAnimationGroupByName("Hands_Gun.Hide");
        this._fire = this._scene.getAnimationGroupByName("Hands_Gun.Shot");
        this._idle = this._scene.getAnimationGroupByName("Hands_Gun.Idle");
        this._reload = this._scene.getAnimationGroupByName("Hands_Gun.Recharge");
        this._run = this._scene.getAnimationGroupByName("Hands_Gun.Run");
        this._start = this._scene.getAnimationGroupByName("Hands_Gun.Get");
        this._walk = this._scene.getAnimationGroupByName("Hands_Gun.Walk");
        this._aim_walk = this._scene.getAnimationGroupByName("Hands_Gun.Aiming_Walk");
        this._aim_shot = this._scene.getAnimationGroupByName("Hands_Gun.Aiming_Shot");
        this._aim_idle = this._scene.getAnimationGroupByName("Hands_Gun.Aiming_Idle");
        this._look = this._scene.getAnimationGroupByName("Hands_Gun.Idle_other");
        this._run.loopAnimation = true;
        this._idle.loopAnimation = true;
        this._walk.loopAnimation = true;
        this._aim_walk.loopAnimation=true;
        this._cooldown_fire = 0.30;
        this._setUpAnimations();
        this._animatePlayer();

        return {
            mesh: env as Mesh,
            animationGroups: result.animationGroups
        }
    }

    private async CreateSniper(): Promise<any> {
        const result = await SceneLoader.ImportMeshAsync("", "./models/", "sniper.glb", this._scene);

        let env = result.meshes[0];
        let allMeshes = env.getChildMeshes();
        env.parent = this._camera;
        this._weapon = env;
        for (let i = 1; i < 9; i++) {
            result.meshes[i].renderingGroupId = 1;
        }
        result.meshes[0].position = new Vector3(0, -6.70, 1);
        result.meshes[0].rotation = new Vector3(0, 0, 0);
        result.meshes[0].scaling = new Vector3(4, 4, -3);

        //audio effect 
        this._weaponSound = new Sound("ak47Sound", "sounds/ak47shot.mp3", this._scene);

        //animations
        this._end = this._scene.getAnimationGroupByName("Hands_Sniper_Rifle.Hide");
        this._fire = this._scene.getAnimationGroupByName("Hands_Sniper_Rifle.Shot");
        this._idle = this._scene.getAnimationGroupByName("Hands_Sniper_Rifle.Idel");
        this._reload = this._scene.getAnimationGroupByName("Hands_Sniper_Rifle.Recharge");
        this._run = this._scene.getAnimationGroupByName("Hands_Sniper_Rifle.Run");
        this._start = this._scene.getAnimationGroupByName("Hands_Sniper_Rifle.Get");
        this._walk = this._scene.getAnimationGroupByName("Hands_Sniper_Rifle.Walk");
        this._aim_walk = this._scene.getAnimationGroupByName("Hands_Sniper_Rifle.Aiming_Walk");
        this._aim_shot = this._scene.getAnimationGroupByName("Hands_Sniper_Rifle.Aiming_Shot");
        this._aim_idle = this._scene.getAnimationGroupByName("Hands_Sniper_Rifle.Aiming_Idle");
        this._run.loopAnimation = true;
        this._idle.loopAnimation = true;
        this._walk.loopAnimation = true;
        this._aim_walk.loopAnimation=true;
        this._cooldown_fire = 2;
        this._setUpAnimations();
        this._animatePlayer();

        return {
            mesh: env as Mesh,
            animationGroups: result.animationGroups
        }
    }

    private _setUpAnimations(): void {
        this._scene.stopAllAnimations();
        //initialize current and previous
        this._currentAnim = this._start;
        this._currentAnim.loopAnimation=false;
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