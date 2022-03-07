import { Engine,float, ArcRotateCamera,OimoJSPlugin, SpotLight,HemisphericLight, Scene, Animation, Vector3, Mesh, Color3, Color4, ShadowGenerator, GlowLayer, PointLight, FreeCamera, CubeTexture, Sound, PostProcess, Effect, SceneLoader, Matrix, MeshBuilder, Quaternion, AssetsManager, StandardMaterial, PBRMaterial, Material } from "@babylonjs/core";
import { firstPersonController } from "./firstPersonController";
import { player } from "./player";

export class enemy{
    currentEnemyHealth: float;
    damage:float;
    playerDamage: float;

    constructor(){
        
    }

}