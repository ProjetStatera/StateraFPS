import { AbstractMesh, Color3, CurrentScreenBlock, DynamicTexture, int, MeshBuilder, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import { FPSController } from "./FPSController";

export class PlayerHealth {

    _scene: Scene;
    _player_Mesh: AbstractMesh;
    public _max_Health: int;
    public _current_Health: int;

    constructor(scene: Scene, mesh: AbstractMesh, maxHealth: int)
    {
        this._scene=scene;
        this._player_Mesh=mesh;
        this._max_Health=maxHealth;
        this.HealthBar();
    }

    public takeDamages(damages:int)
    {
        this._current_Health-=damages;
    }

    public Die()
    {
        if(this._current_Health<=0)
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
	    healthBarTextMaterial.diffuseColor = Color3.Green();

        var healthBar = MeshBuilder.CreatePlane("hb1", {width:2, height:.5}, this._scene);		
	    var healthBarContainer = MeshBuilder.CreatePlane("hb2", { width: 2, height: .5}, this._scene);
	    var healthBarText = MeshBuilder.CreatePlane("hb3", { width: 2, height: 2}, this._scene);
	    healthBarText.material = healthBarMaterial;

        healthBar.position = new Vector3(0, 0, -.01);
        healthBarContainer.position = new Vector3(0, 3, 0);     
        healthBarText.position = new Vector3(1.5, -.4, 0);

        healthBar.parent = healthBarContainer;
        healthBarContainer.parent = this._player_Mesh;
        healthBarText.parent = healthBarContainer;

	    healthBar.material = healthBarMaterial;
	    healthBarContainer.material = healthBarContainerMaterial;
	    healthBarText.material = healthBarTextMaterial;


        healthBar.scaling.x = this._current_Health / this._max_Health;
        healthBar.position.x = (1- (this._current_Health/100)) * -1;

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

        if(Math.round(this._current_Health) == this._current_Health)
        {
            var textureContent = dynamicTexture.getContext();
            var size = dynamicTexture.getSize();
            var text = this._current_Health + "%";
            textureContent.clearRect(0,0, size.width, size.height);
            textureContent.font = "bold 120px Calibri";
            var textSize = textureContent.measureText(text);
            textureContent.fillStyle = "white";
            textureContent.fillText(text,(size.width - textSize.width) / 2,(size.height - 120) / 2);
            dynamicTexture.update();
        }

    }
}