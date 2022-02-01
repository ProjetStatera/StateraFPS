import { SceneLoader, Scene, Vector3, Ray, TransformNode, Mesh, Color3, Color4, UniversalCamera, Quaternion, AnimationGroup, ExecuteCodeAction, ActionManager, ParticleSystem, Texture, SphereParticleEmitter, Sound, Observable, ShadowGenerator, FreeCamera, ArcRotateCamera, EnvironmentTextureTools } from "@babylonjs/core";
import { application } from "express";
import {PlayerInput} from "./inputController";

export class FirstPersonController{
    public camera: FreeCamera;
    public scene: Scene;
    private _input: PlayerInput;
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
    CreateController():void{
    this.camera = new FreeCamera("camera",new Vector3(0,-8,0),this.scene);
    this.camera.attachControl(this._canvas, true);
    }

    //create the player mesh
    async CreatePlayer():Promise<void>
    {
        const result = await SceneLoader.ImportMeshAsync("","./models/","Pistol.glb", this.scene);

        let env = result.meshes[0];
        let allMeshes = env.getChildMeshes();
        env.parent = this.camera;
        env.rotation = Vector3.Zero();
        env.scaling = new Vector3(1,1,1);
        env.position = new Vector3(0,0,0);
    }

}