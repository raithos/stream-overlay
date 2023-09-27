import { Component, OnInit, Input, Output, EventEmitter  } from '@angular/core';
import { HttpClient } from '@angular/common/http';

//import { StreamService } from '../../../services/stream.service';
import { Options, Player, Ship, Upgrade } from '../../../models/Stream'

declare var exportObj: any;
declare var require: any;

import * as manifest from 'assets/plugins/xwing-data2/data/manifest.json';
import { isNumber } from 'util';

@Component({
  selector: 'app-player-list',
  templateUrl: './player-list.component.html',
  styleUrls: ['./player-list.component.css']
})
export class PlayerListComponent implements OnInit {
  @Input() player: Player;
  @Input() opponent: Player;
  @Input() points: number;
  @Input() maxPoints: number;
  @Input() options: Options;
  @Output() updatedPlayer = new EventEmitter<Player>();
  @Output() updatedCards = new EventEmitter<String[]>();
  @Output() updatedDial = new EventEmitter<Ship>();

  yasbData:any;
  yasbpilots:any;
  yasbships:any;
  yasbupgrades:any;
  yasbupgradesxws:any;
  pilots:any;
  pilotdata:any;
  shipdata:any;
  factiondata:any;
  upgrades:any;
  upgradedata:any;
  editXWS:boolean = false;
  editYASB:boolean = false;
  showPlayerNameEditInput:boolean = false;
  showPlayerSubTextEditInput:boolean = false;
  xwsErrorDisplay:string;
  cards:string[];
  
  constructor(
    private http:HttpClient
  ) { }

  ngOnInit() {
    this.upgradedata = [];
    this.pilotdata = [];
    this.factiondata = [];

    this.yasbData = exportObj.basicCardData();

    this.yasbships = {};
    for (var ship_data in this.yasbData.ships) {
      var shipinfo = this.yasbData.ships[ship_data];
      var newshipname = shipinfo.name.canonicalize();
      this.yasbships[newshipname] = shipinfo;
    }

    this.yasbpilots = {};
    var name_parse;
    var pilot_data;
    for (let _n = 0, _len1 = this.yasbData.pilotsById.length; _n < _len1; _n++) {
      pilot_data = this.yasbData.pilotsById[_n];
      if (pilot_data.skip == null) {
        if (pilot_data.xws == null) {
          name_parse =  pilot_data.name.split("(")

          if (pilot_data.xwsaddon != null) {
            pilot_data.xws = name_parse[0].canonicalize() + "-" + pilot_data.xwsaddon;
          } else {
            if (name_parse[1] == null){
              pilot_data.xws = pilot_data.name.canonicalize();
            } else {
              pilot_data.xws = name_parse[0].canonicalize() + "-" + pilot_data.ship.canonicalize(); 
            }
          }
        }
        if (!isNumber(pilot_data.skill)){
          pilot_data.skill = 0;
        }
        if (pilot_data.restriction_func != undefined){
          pilot_data.restriction_func = "";
        }
        this.yasbpilots[pilot_data.xws] = pilot_data;
      }
    }

    this.yasbupgradesxws = {};
    var upgrade_data;
    for (let _n = 0, _len1 = this.yasbData.upgradesById.length; _n < _len1; _n++) {
      upgrade_data = this.yasbData.upgradesById[_n];
      if (upgrade_data.skip == null) {
        if (upgrade_data.xws == null) {
          name_parse =  upgrade_data.name.split("(")

          if (upgrade_data.xwsaddon != null) {
            upgrade_data.xws = name_parse[0].canonicalize() + "-" + upgrade_data.xwsaddon;
          } else {
            if (name_parse[1] == null){
              upgrade_data.xws = upgrade_data.name.canonicalize();
            } else {
              upgrade_data.xws = name_parse[0].canonicalize() + "-" + upgrade_data.slot.canonicalize(); 
            }
          }
        }
    this.yasbupgradesxws[upgrade_data.xws] = upgrade_data;
      }
    }

    this.yasbupgrades = {};
    for (let _n = 0, _len1 = this.yasbData.upgradesById.length; _n < _len1; _n++) {
      var upgrade_data;
      upgrade_data = this.yasbData.upgradesById[_n];
      if (upgrade_data.skip == null) {
        this.yasbupgrades[upgrade_data.name] = upgrade_data;
      }
    }

    manifest['upgrades'].forEach(upgrade => {
      this.upgradedata[upgrade.replace("data/upgrades/", "").replace(".json", "")] = require('assets/plugins/xwing-data2/'+upgrade);
    });

    manifest['pilots'].forEach(pilots => {
      this.pilotdata[pilots.faction] = [];
      pilots.ships.forEach(ship => {
        var temp = require('assets/plugins/xwing-data2/'+ship);  
        this.pilotdata[pilots.faction][temp['xws']] = temp;
        temp['pilots'].forEach(pilot => {
          this.pilotdata[pilots.faction][temp['xws']]['pilots'][pilot['xws']] = pilot;
        });
      });
    });

    this.factiondata = require('assets/plugins/xwing-data2/data/factions/factions.json');

  }

  updateParent(){
    this.updatedPlayer.emit(this.player);
  }

  togglePlayerInitiative() {
    this.player.hasInitiative = !this.player.hasInitiative;
    this.updateParent();
  }

  updatePlayerName(){
    this.showPlayerNameEditInput = false;
    this.updateParent();
  }

  updatePlayerSubText(){
    this.showPlayerSubTextEditInput = false;
    this.updateParent();
  }

  updateShip(ship:Ship, i:number){
    this.player.ships[i] = ship;
    this.calcPointsLost(); 
    //this.updateParent();
  }

  moveShipUp(i:number){
    [this.player.ships[i], this.player.ships[i-1]] =  [this.player.ships[i-1], this.player.ships[i]];
    this.updateParent();
  }

  moveShipDown(i:number){
    [this.player.ships[i], this.player.ships[i+1]] =  [this.player.ships[i+1], this.player.ships[i]];
    this.updateParent();
  }

  updateCards(ship:Ship){
    this.cards = [];
    this.cards.push(ship.pilot.image);
    if(ship.upgrades && (ship.pilot.upgrades == undefined)){
      ship.upgrades.forEach(u => {
        this.cards.push(u.image);
      });
    }
    this.updatedCards.emit(this.cards);
    this.updatedDial.emit(null);
  }

  updateDial(ship:Ship){
    this.cards = [];
    this.updatedCards.emit(this.cards);
    this.updatedDial.emit(ship);
  }


  calcPointsLost(){
    let runningTotal:number = 0;
    for (let ship of this.player.ships){
      if(!ship.enabled) {
        runningTotal += ship.points;
      }else if( (((ship.hull+ship.shields) <= Math.floor((ship.starthull+ship.startshields)/2)) || ship.hasLostHalfPoints) && this.options.scoringHalfHealthShips=="Half"){
        ship.hasLostHalfPoints = true;
        runningTotal += Math.floor(ship.points/2);
      }
    }
    runningTotal += this.maxPoints - this.player.listPoints;
    this.player.pointsLost = runningTotal;
    this.updateParent();
  }

  pointsToLead(){
    if(this.player.objectivePoints+this.opponent.pointsLost > this.opponent.objectivePoints+this.player.pointsLost){
      return 'Leading by ' + (this.player.objectivePoints+this.opponent.pointsLost-this.opponent.objectivePoints-this.player.pointsLost);
    }else{
      return 'Needs ' + (this.opponent.objectivePoints+this.player.pointsLost-this.player.objectivePoints-this.opponent.pointsLost+1)+' to lead';
    }
  }

  listPoints(){
    if(this.player.listPoints){
      return this.player.listPoints;
    }else{
      return 0;
    }
  }

  decrementObjectivePoints(){
    if(this.player.objectivePoints > 0) {
      this.player.objectivePoints--;
    }
    this.updateParent();
  }

  incrementObjectivePoints(){
    this.player.objectivePoints++;
    this.updateParent();
  }


  buildShipList(xws:string){
      const x = JSON.parse(xws);
      const faction = x.faction;
      this.player.faction = faction;
      if(faction){
        let singleFactionData = this.factiondata.find(f => f.xws === faction); 
        this.player.subText = singleFactionData.name;
      }
      this.player.ships = [];

      if(x.points){
        this.player.listPoints = x.points;
      }else{
        this.player.listPoints = 0;
      }
      
      try {
        var nonUniqueCount = 0;
        var shipColor = "#FFFFFF";
        var multipleShips = false;
        var currentShip = 0;
        var shipCheck = 0;

        for (let pilot of x.pilots) {
          //caters for mismatch between external xws and xwing-data2
          switch (pilot.ship) {
            case "scavengedyt1300lightfreighter":
              pilot.ship = "scavengedyt1300";
              break;
            case "tieinterceptor":
              pilot.ship = "tieininterceptor";
              break;
            case "upsilonclassshuttle":
              pilot.ship = "upsilonclasscommandshuttle";
              break;
            default:
              break;
          }

          switch (pilot.id) {
            case "padmeamidala-nabooroyaln1starfighter":
              pilot.id = "padmeamidala";
              break;
            default:
              break;
          }

          const shipName = pilot.ship;
          const singleShipData = this.yasbships[shipName];
          const singlePilotData = this.yasbpilots[pilot.name];

          shipColor = "#FFFFFF";
                    
          if(shipName) {
            //check to see if other ship exists
            multipleShips = false;
            shipCheck = 0;
            for (let p of x.pilots) {
              if ((p.ship == shipName) && (currentShip != shipCheck)){
                multipleShips = true;
                break;
              }
              shipCheck++;
            }
            currentShip++;

            if (multipleShips == true){
              switch (nonUniqueCount) {
                case 0:
                  shipColor = "#f20000";
                  break;
                case 1:
                  shipColor = "#f7f109";
                  break;
                case 2:
                  shipColor = "#007800";
                  break;
                case 3:
                  shipColor = "#0100e4";
                  break;
                case 4:
                  shipColor = "#e903ae";
                  break;
                case 5:
                  shipColor = "#7e3b0e";
                  break;
                case 6:
                  shipColor = "#fbf3f0";
                  break;
                case 7:
                  shipColor = "#7a7770";
                  break;
              }
              nonUniqueCount++;
            }

            let newShip:Ship = {
              name: singleShipData.name,
              pilot: singlePilotData,
              pilotskill: (singlePilotData.skill != null) ? singlePilotData.skill : 0,
              points: (singlePilotData.points != null) ? singlePilotData.points : 0,
              hasLostHalfPoints: false,
              hull: (singlePilotData.ship_override != null) ? ((singlePilotData.ship_override.hull != null ? singlePilotData.ship_override.hull : ((singleShipData.hull != null) ? singleShipData.hull : 0))) : ((singleShipData.hull != null) ? singleShipData.hull : 0),
              shields: (singlePilotData.ship_override != null) ? ((singlePilotData.ship_override.shields != null ? singlePilotData.ship_override.shields : ((singleShipData.shields != null) ? singleShipData.shields : 0))) : ((singleShipData.shields != null) ? singleShipData.shields : 0),
              upgrades: [],
              color: shipColor,
              xws: shipName,
              force: singlePilotData.force ? singlePilotData.force : 0,
              enabled:true,
              base: (singleShipData.base != null) ? singleShipData.base : "Small",
              crits: new Array<string>(),
              faction: faction,
              dial: singleShipData.maneuvers
            }

            //Natash Pup exception
            if (newShip.pilot.name == "Nashtah Pup"){
              for (let p of x.pilots){
                for (let u in p.upgrades){
                  if (u == "title"){
                    if (p.upgrades[u][0] == "houndstooth"){
                      newShip.pilotskill = this.yasbpilots[p.name].skill;
                      break;
                    }
                  }
                } 
              }
            }

            //Remove brackets for ship names
            singlePilotData.name = singlePilotData.name.split(" (")[0];
            
            if (singlePilotData.upgrades !== undefined){
              newShip.pilot.image = "https://infinitearenas.com/xw2/images/quickbuilds/" + (pilot.name) + ".png"
              for(let upgradeName of singlePilotData.upgrades){
                let yasbData = this.yasbupgrades[upgradeName];
                //fix type problems
                let upgradeTypeFixed;
                switch (yasbData.slot){
                  case "Force":
                    upgradeTypeFixed = "forcepower";
                    break;
                  case "Tactical Relay":
                    upgradeTypeFixed = "tactical-relay";
                    break;
                  default:
                    upgradeTypeFixed = yasbData.slot;
                    break;
                }
                let newUpgrade:Upgrade = {
                  name: upgradeName, 
                  enabled: true, 
                  points: 0, 
                  type: upgradeTypeFixed, 
                  xws: yasbData.xws ? yasbData.xws : upgradeName.canonicalize(),
                }
                //Remove brackets for upgrade names
                newUpgrade.name = newUpgrade.name.split(" (")[0];

                if(yasbData.charge !== undefined){
                  newUpgrade.charges = yasbData.charge;
                }
                newShip.upgrades.push(newUpgrade);
              }
            }else{
              newShip.pilot.image = "https://infinitearenas.com/xw2/images/pilots/" + (pilot.name) + ".png"

              //iterate upgrade types
              for(let upgradeType in pilot.upgrades) {
                // Caters for "mod"->"modification" mapping
                let upgradeTypeFixed;
                switch (upgradeType) {
                  case "tacticalrelay":
                    upgradeTypeFixed = "tactical-relay";
                    break;
                  default:
                    upgradeTypeFixed = upgradeType;
                    break;
                }

                //iterate upgrades in type
                for(let upgradeName in pilot.upgrades[upgradeType]) {
                  
                  //fix for phantom title
                  let upgradeNameFixed = pilot.upgrades[upgradeType][upgradeName];

                  if(upgradeTypeFixed !== "hardpoint"){
                    let upgrade = this.yasbupgradesxws[upgradeNameFixed]
                    let newUpgrade:Upgrade = {
                      name: upgrade.name, 
                      enabled: true, 
                      points: 0, 
                      type: upgradeTypeFixed.canonicalize(), 
                      xws: upgradeNameFixed
                    }
                    newUpgrade.image = "https://infinitearenas.com/xw2/images/upgrades/" + (upgradeNameFixed) + ".png"
                    if(upgrade.charge !== undefined){
                      newUpgrade.charges = upgrade.charge;
                    }

                    if(upgrade.modifier_func !== undefined) {
                      let statCheck = {
                        hull:newShip.hull,
                        shields:newShip.shields,
                        actions:[],
                        force:newShip.force,
                        maneuvers:[]
                      };
                      upgrade.modifier_func(statCheck);
                      newShip.hull = statCheck.hull;
                      newShip.shields = statCheck.shields;
                      newShip.force = statCheck.force;
                    }
                    newShip.upgrades.push(newUpgrade);
                  }
                }
              }
            };
            newShip.starthull = newShip.hull;
            newShip.startshields = newShip.shields;
            
            this.player.ships.push(newShip);
            this.calcPointsLost(); 
            this.updateParent();
          } 
        }
      }
      catch(e){
        this.xwsErrorDisplay = e;
      } 
  }

  onSubmitYASB({value, valid}){
    try {
      var xwsoutput = value.yasb.serialtoxws();
      this.player.yasb = value.yasb;
      this.editXWS = false;
      this.editYASB = false;
      this.buildShipList(xwsoutput);
      this.updateParent();
      console.log(xwsoutput);
    }
    catch (e) {
      this.xwsErrorDisplay = "Error Loading YASB Link";
    }
  }

  onSubmitXws({value, valid}){
    try {
      this.player.xws = value.xws;
      this.editYASB = false;
      this.editXWS = false;
      this.buildShipList(this.player.xws);
      this.updateParent();
    }
    catch (e) {
      this.xwsErrorDisplay = "Error Loading XWS";
    }
  }

  cancelXWSEdit(){
    this.editXWS = false;
    this.editYASB = false;
  }

  cancelYASBEdit(){
    this.editXWS = false;
    this.editYASB = false;
  }

  closeXwsErrorDisplay(){
    this.xwsErrorDisplay = null;
  }

  debugListOutput(){
    console.log(this.player);
  }

}
