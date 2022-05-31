import { AbstractMesh, Color3, CurrentScreenBlock, DynamicTexture, int, MeshBuilder, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
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
        this.HealthBar();
    }

    public takeDamages(damages:int)
    {
        PlayerHealth._current_Health-=damages;
    }

    public Die()
    {
        if(PlayerHealth._current_Health<=0)
        {

        }
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

        var healthBarTextMaterial = new StandardMaterial("hb3mat", this._scene);
	    healthBarTextMaterial.diffuseTexture = dynamicTexture;
	    healthBarTextMaterial.backFaceCulling = false;
	    healthBarTextMaterial.diffuseColor = Color3.Black();

        var healthBar = MeshBuilder.CreatePlane("hb1", {width: 1.5, height:.15}, this._scene);		
	    var healthBarContainer = MeshBuilder.CreatePlane("hb2", { width: 1.5, height: .15}, this._scene);
	    var healthBarText = MeshBuilder.CreatePlane("hb3", { width: .2, height: .15}, this._scene);
	    healthBarText.material = healthBarMaterial;

        healthBar.renderingGroupId = 2;
	    healthBarText.renderingGroupId = 2;
	    healthBarContainer.renderingGroupId = 2;


        healthBar.position = new Vector3(0, 0, .001);
        healthBarContainer.position = new Vector3(0, 2.340, -2);     
        healthBarText.position = new Vector3(0, -0.03, 0.002);

        healthBar.parent = healthBarContainer;
        healthBarContainer.parent = this._player_Mesh;
        healthBarText.parent = healthBarContainer;
        
	    healthBar.material = healthBarMaterial;
	    healthBarContainer.material = healthBarContainerMaterial;
	    healthBarText.material = healthBarTextMaterial;
        
        var currenthealth = PlayerHealth._current_Health;
        var maxhealth = this._max_Health;
        this._scene.registerBeforeRender(function(){
            healthBar.scaling.x = currenthealth / maxhealth;
            healthBar.position.x = (1- (currenthealth/maxhealth));
        
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
            
            if(Math.round(currenthealth) == currenthealth)
            {
                var textureContent = dynamicTexture.getContext();
                var size = dynamicTexture.getSize();
                var text = currenthealth/2 + "%";
                textureContent.clearRect(0,0, size.width, size.height);
                textureContent.font = "bold 120px Calibri";
                var textSize = textureContent.measureText(text);
                textureContent.fillStyle = "white";
                textureContent.fillText(text,(size.width - textSize.width) / 2,(size.height - 120) / 2);
                dynamicTexture.update();
            }
        })
    }
}