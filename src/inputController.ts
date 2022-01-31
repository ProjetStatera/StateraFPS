import { Scene, ActionManager, ExecuteCodeAction, Observer, Scalar } from '@babylonjs/core';

export class PlayerInput{
    public inputMap: any;
    private _scene: Scene;

    //Simple movement
    public horizontal: number = 0;
    public vertical: number = 0;
    //tracks whether or not there is movement in that axis
    public horizontalAxis: number = 0;
    public verticalAxis: number = 0;

    //jumping & sprint
    public jumpKeyDown: boolean = false;
    public sprintKeyDown: boolean = false;

    constructor(scene: Scene){
        //scene action manager to detecte inputs
        this._scene.actionManager = new ActionManager(this._scene);

        this.inputMap = {};
        this._scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }))
        this._scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }))

        //add to the scene an observable that calls updateFromKeyboard before rendering
        scene.onBeforeRenderObservable.add(() => {
            this._updateFromKeyboard();
        })
    }

    //keyboard controls
    private _updateFromKeyboard():void
    {
        //forward - backwards movement
        if ((this.inputMap["ArrowUp"])) 
        {
            this.verticalAxis = 1;
            this.vertical = Scalar.Lerp(this.vertical, 1, 0.2);

        } else if ((this.inputMap["ArrowDown"])) 
        {
            this.vertical = Scalar.Lerp(this.vertical, -1, 0.2);
            this.verticalAxis = -1;
        } else {
            this.vertical = 0;
            this.verticalAxis = 0;
        }

        //left - right movement
        if ((this.inputMap["ArrowLeft"])) 
        {
            //lerp will create a scalar linearly interpolated amt between start and end scalar
            //taking current horizontal and how long you hold, will go up to -1(all the way left)
            this.horizontal = Scalar.Lerp(this.horizontal, -1, 0.2);
            this.horizontalAxis = -1;

        } else if ((this.inputMap["ArrowRight"] )) 
        {
            this.horizontal = Scalar.Lerp(this.horizontal, 1, 0.2);
            this.horizontalAxis = 1;
        }
        else 
        {
            this.horizontal = 0;
            this.horizontalAxis = 0;
        }

        //Jump Checks (SPACE)
        if ((this.inputMap[" "] )) {
            this.jumpKeyDown = true;
        } else {
            this.jumpKeyDown = false;
        }
    }

}