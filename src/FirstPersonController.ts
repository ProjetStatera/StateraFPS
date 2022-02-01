import { SceneLoader, Scene, Vector3, Ray, TransformNode, Mesh, Color3, Color4, UniversalCamera, Quaternion, AnimationGroup, ExecuteCodeAction, ActionManager, ParticleSystem, Texture, SphereParticleEmitter, Sound, Observable, ShadowGenerator, FreeCamera, ArcRotateCamera } from "@babylonjs/core";
import { application } from "express";
import {PlayerInput} from "./inputController";

export class FirstPersonController{
    public camera: FreeCamera;
    public scene: Scene;
    private _input: PlayerInput;
    public _canvas: HTMLCanvasElement;

    constructor(scene: Scene){
        this._canvas = this._createCanvas();
        this.scene = scene;
        //this.CreateController();
        this.CreatePlayer();
        this._createCanvas();
    }

    //Player
    public mesh: Mesh; //outer collisionbox of player

    //Animations
    private animation: AnimationGroup

    //create the camera which represents the player (FPS)
    CreateController():void{
    this.camera = new FreeCamera("camera",new Vector3(0,0,0),this.scene);
    this.camera.attachControl(this._canvas, true);
    }

    //create the player mesh
    async CreatePlayer():Promise<void>
    {
        const result = await SceneLoader.ImportMeshAsync("","./models/","Pistol.glb", this.scene);

        let env = result.meshes[0];
        let allMeshes = env.getChildMeshes();
        env.parent = this.camera;
    }

        //set up the canvas
        private _createCanvas(): HTMLCanvasElement {

            //Commented out for development
            document.documentElement.style["overflow"] = "hidden";
            document.documentElement.style.overflow = "hidden";
            document.documentElement.style.width = "100%";
            document.documentElement.style.height = "100%";
            document.documentElement.style.margin = "0";
            document.documentElement.style.padding = "0";
            document.body.style.overflow = "hidden";
            document.body.style.width = "100%";
            document.body.style.height = "100%";
            document.body.style.margin = "0";
            document.body.style.padding = "0";
    
            //create the canvas html element and attach it to the webpage
            this._canvas = document.createElement("canvas");
            this._canvas.style.width = "100%";
            this._canvas.style.height = "100%";
            this._canvas.id = "gameCanvas";
            document.body.appendChild(this._canvas);
    
            return this._canvas;
        }
}