import { iPlayerState } from "./iPlayerState";

export abstract class playerState implements iPlayerState
{
    abstract handleInput(_inputData): void;
    abstract updateState(_player): iPlayerState;
    abstract onEnter(_player):void;
    abstract onExit(_player):void;
}

export class IdlePlayerState extends playerState
{
    override handleInput(_inputData):void
    {
        
    }
    override updateState(_player):iPlayerState
    {
        return null;
    }
    override onEnter(_player):void
    {

    }
    override onExit(_player):void
    {

    }
}

