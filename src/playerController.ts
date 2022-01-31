import { Scene, Vector3, Ray, TransformNode, Mesh, Color3, Color4, UniversalCamera, Quaternion, AnimationGroup, ExecuteCodeAction, ActionManager, ParticleSystem, Texture, SphereParticleEmitter, Sound, Observable, ShadowGenerator } from "@babylonjs/core";
import {PlayerInput} from "./inputController";

export class Player extends TransformNode{
    public camera: UniversalCamera;
    public scene: Scene;
    private _input: PlayerInput;

    //Player
    public mesh: Mesh; //outer collisionbox of player

    //Camera
    private _camRoot: TransformNode;
    private _Ytilt: TransformNode;

    //Animations
    private animation: AnimationGroup;

     //An array with all animation keys
    

}