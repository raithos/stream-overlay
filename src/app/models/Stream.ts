export interface Upgrade{
    name?:string;
    enabled?:boolean;
    points?:number;
    type?:string;
    xws?:string;
    charges?:number;
    image?:string;
}


export interface Pilot{
    name?:string;
    id?:number;
    unique?:string;
    ship?:string;
    skill?:number;
    points?:number;
    force?:number;
    canonical_name?:string;
    slots?:string[];
    text?:string;
    image?:string;
    faction?:string;
    xws?:string;
    upgrades?:string[];
}

export interface Ship{
    name?:string;
    pilot?:Pilot;
    pilotskill?:number;
    points?:number;
    hasLostHalfPoints?:boolean;
    hull?:number;
    starthull?:number;
    shields?:number;
    startshields?:number;
    upgrades?:Upgrade[];
    color?:string;
    xws?:string;
    base?:string;
    enabled?:boolean;
    crits?:string[];
    faction?:string;
    force?:number;
    dial?:number[][];
    
}


export interface Player{
    name?:string;
    subText?:string;
    xws?:string;
    yasb?:string;
    ships?:Ship[];
    dice?:string[];
    listPoints?:number;
    pointsLost?:number;
    faction?:string;
    hasInitiative?:boolean;
    objectivePoints?:number;
}

export interface Timer{
    duration?:number;
    minutesRemaining?:number;
    secondsRemaining?:number;
    running?:boolean;
    countup?:boolean;
    paused?:boolean;
    target?:number;
    size?:number;
}

export interface Options{
    dropShadow:boolean,
    shipIcons:boolean,
    upgradeIcons?:boolean,
    showTimer:boolean,
    font?:string,
    showPoints?:boolean,
    showShipPoints?:boolean,
    showDice?:boolean,
    showLogo?:boolean,
    showCards?:boolean,
    showPS?:boolean,
    textColor?:string,
    shipNameFontSize?:number,
    shipUpgradeFontSize?:number,
    shipStatFontSize?:number,
    playerNameFontSize?:number,
    pointsFontSize?:number,
    cardSize?:number,
    showForceCharges?:boolean,
    showUpgradeCharges?:boolean,
    healthAsIcons?:boolean,
    shipPSLocation?:string,
    showSubText?:boolean,
    shipDestroyedStrikethrough?:boolean,
    shipDestroyedOpacity?:number,
    maxPoints?:number,
    scenarioName?:string,
    showScenario?:boolean,
    scenarioFontSize?:number,
    scenarioYAdjustment?:number,
    turnNumber?:number,
    turnNumberMax?:number,
    showTurnTracker?:boolean,
    turnTrackerFontSize?:number,
    scoringHalfHealthShips?:string;
}

export interface Stream{
    key?:string;
    user?:string;
    name?:string;
    players?:Player[];
    options?:Options;
    timer?:Timer;
    cards?:string[];
    dial?:Ship;
}
