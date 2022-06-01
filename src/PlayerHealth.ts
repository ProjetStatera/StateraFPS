import { AbstractMesh, Color3, CurrentScreenBlock, DynamicTexture, int, Mesh,  MeshBuilder, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import { CubeMapToSphericalPolynomialTools } from "babylonjs";
import { FPSController } from "./FPSController";

export class PlayerHealth {

    _scene: Scene;
    public _player_Mesh: AbstractMesh;
    public _max_Health: int;
    public static _current_Health: int;

    constructor(scene: Scene, mesh: AbstractMesh, maxHealth: int)
    {
        this._scene=scene;
        this._player_Mesh=mesh;
        this._max_Health=maxHealth;
        PlayerHealth._current_Health=maxHealth;
    }

    public HealthBar()
    {
        var healthBarMaterial = new StandardMaterial("hb1mat", this._scene);
	    healthBarMaterial.diffuseColor = Color3.Green();
	    healthBarMaterial.backFaceCulling = false;

        var healthBarContainerMaterial = new StandardMaterial("hb2mat", this._scene);
        healthBarContainerMaterial.diffuseColor = Color3.Blue();
        healthBarContainerMaterial.backFaceCulling = false;    
        
        var dynamicTexture = new DynamicTexture("dt1", 512, this._scene, true);
	    dynamicTexture.hasAlpha = true;
        var dynamicTextureAmmo = new DynamicTexture("dt2", 512, this._scene, true);
	    dynamicTexture.hasAlpha = true;

        var healthBarTextMaterial = new StandardMaterial("hb3mat", this._scene);
	    healthBarTextMaterial.diffuseTexture = dynamicTexture;
	    healthBarTextMaterial.backFaceCulling = false;
	    healthBarTextMaterial.diffuseColor = Color3.Black();

        var ammoTextMaterial = new StandardMaterial("ammo4mat", this._scene);
	    ammoTextMaterial.diffuseTexture = dynamicTextureAmmo;
	    ammoTextMaterial.backFaceCulling = false;
	    ammoTextMaterial.diffuseColor = Color3.White();

        var healthBar = MeshBuilder.CreatePlane("hb1", {width: .3, height: .7}, this._scene);		
	    var healthBarContainer = MeshBuilder.CreatePlane("hb2", { width: .3, height: .7}, this._scene);
	    var healthBarText = MeshBuilder.CreatePlane("hb3", { width: .1, height: .10}, this._scene);
        var ammoText = MeshBuilder.CreatePlane("ammo4",{width : .1, height : .10}, this._scene);
	    healthBarText.material = healthBarMaterial;
        ammoText.material = ammoTextMaterial;

        healthBar.renderingGroupId = 3;
	    healthBarText.renderingGroupId = 3;
        ammoText.renderingGroupId = 3;
	    healthBarContainer.renderingGroupId = 3;


        healthBar.position = new Vector3(0, 0, .001);
        healthBarContainer.position = new Vector3(-1.3, 2.2, -2);     
        healthBarText.position = new Vector3(0, -0.02, 0.002);
        ammoText.position = new Vector3(.1,-0.2,0.002);

        healthBar.parent = healthBarContainer;
        healthBarContainer.parent = this._player_Mesh;
        healthBarText.parent = healthBarContainer;
        ammoText.parent = healthBarContainer;
        
	    healthBar.material = healthBarMaterial;
	    healthBarContainer.material = healthBarContainerMaterial;
	    healthBarText.material = healthBarTextMaterial;
        ammoText.material = ammoTextMaterial;
        
        var currenthealth = PlayerHealth._current_Health;
        var maxhealth = this._max_Health;
        this._scene.registerAfterRender(function(){
            healthBar.scaling.x = PlayerHealth._current_Health / maxhealth;
            healthBar.position.x = (1- (PlayerHealth._current_Health/maxhealth));
        
            if(healthBar.scaling.x < .6666)
            {
                healthBarMaterial.diffuseColor = Color3.Yellow();
                healthBarTextMaterial.diffuseColor = Color3.Yellow();
            }
            else if(healthBar.scaling.x < .3333)
            {
                healthBarMaterial.diffuseColor = Color3.Red();
                healthBarTextMaterial.diffuseColor = Color3.Red();
            }
            
            if(Math.round(PlayerHealth._current_Health) == PlayerHealth._current_Health)
            {
                var textureContent = dynamicTexture.getContext();
                var size = dynamicTexture.getSize();
                var text = PlayerHealth._current_Health/2 + "%";
                textureContent.clearRect(0,0, size.width, size.height);
                textureContent.font = "bold 150px Calibri";
                var textSize = textureContent.measureText(text);
                textureContent.fillStyle = "white";
                textureContent.fillText(text,(size.width - textSize.width) / 2,(size.height - 120) / 2);
                dynamicTexture.update();
            }

            var textureContentAmmo = dynamicTextureAmmo.getContext();
            var sizeAmmo = dynamicTextureAmmo.getSize();
            var textAmmo = FPSController._ammo + "";
            textureContentAmmo.clearRect(0,0,sizeAmmo.width,sizeAmmo.height);
            textureContentAmmo.font = "bold 120px Calibri";
            var textSizeAmmo = textureContentAmmo.measureText(textAmmo);
            textureContentAmmo.fillStyle = "white";
            textureContentAmmo.fillText(textAmmo,(sizeAmmo.width - textSizeAmmo.width) / 2,(sizeAmmo.height - 120) / 2);
            dynamicTextureAmmo.update();
        })
    }

}