import { Component, OnInit, Input, Output, EventEmitter  } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

//import { StreamService } from '../../../services/stream.service';
import { Options, Player, Ship, Upgrade } from '../../../models/Stream'
import { log } from 'util';

declare var $:any;
declare var xws: any;

declare var exportObj: any;
declare var require: any;

import * as manifest from 'assets/plugins/xwing-data2/data/manifest.json';

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
  pilots:any;
  pilotdata:any;
  shipdata:any;
  factiondata:any;
  upgrades:any;
  upgradedata:any;
  editXWS:boolean = false;
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
    for (let _n = 0, _len1 = this.yasbData.pilotsById.length; _n < _len1; _n++) {
      var pilot_data;
      pilot_data = this.yasbData.pilotsById[_n];
      if (pilot_data.skip == null) {
        if (pilot_data.xws == null) {
          pilot_data.xws = pilot_data.name.canonicalize();
        }
        this.yasbpilots[pilot_data.xws] = pilot_data;
      }
    }

    this.yasbupgrades = {};
    for (let _n = 0, _len1 = this.yasbData.upgradesById.length; _n < _len1; _n++) {
      var upgrade_data;
      upgrade_data = this.yasbData.upgradesById[_n];
      if (upgrade_data.skip == null) {
        if (upgrade_data.xws == null) {
          upgrade_data.xws = upgrade_data.name.canonicalize();
        }
        this.yasbupgrades[upgrade_data.xws] = upgrade_data;
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
            case "mg100starfortresssf17":
              pilot.ship = "mg100starfortress";
              break;
            case "tieinterceptor":
              pilot.ship = "tieininterceptor";
              break;
            case "upsilonclasscommandshuttle":
              pilot.ship = "upsilonclassshuttle";
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

          let data = this.pilotdata[faction][shipName];
          const singleShipData = this.yasbships[shipName];

          const singlePilotData = this.yasbpilots[pilot.name];
          const singlePilotDataOld = data.pilots[pilot.id];

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
              pilotskill: singlePilotData.skill,
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

            //Remove brackets for ship names
            singlePilotData.name = singlePilotData.name.split(" (")[0];
            
            if((singlePilotDataOld !== undefined) && (singlePilotDataOld.image !== undefined)){
              newShip.pilot.image = singlePilotDataOld.image;
            }

            if (singlePilotData.upgrades !== undefined){
              for(let upgradeName of singlePilotData.upgrades){
                let yasbData = this.yasbupgrades[upgradeName.canonicalize()];
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
                  xws: upgradeName.xws ? upgradeName.xws : upgradeName.canonicalize(),
                }
                //Remove brackets for upgrade names
                newUpgrade.name = newUpgrade.name.split(" (")[0];

                if(yasbData.charge !== undefined){
                  newUpgrade.charges = yasbData.charge;
                }
                newShip.upgrades.push(newUpgrade);
              }
            }else{
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
                    let upgrade = this.yasbupgrades[upgradeNameFixed]
                    let newUpgrade:Upgrade = {
                      name: upgrade.name, 
                      enabled: true, 
                      points: 0, 
                      type: upgradeTypeFixed.canonicalize(), 
                      xws: upgrade.xws ? upgrade.xws : upgrade.name.canonicalize()
                    }
                    let upgradeold = this.upgradedata[upgradeTypeFixed].find(u => u.xws === newUpgrade.xws)
                    if(upgradeold.sides[0].image !== undefined){
                      newUpgrade.image = upgradeold.sides[0].image;
                    }else{
                      newUpgrade.image = "";
                    }
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

      /*if (value.slice(0,3) === "http"){
        var matches, re,
        __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };
        re = __indexOf.call(value, "Z") >= 0 ? /^v(\d+)Z(.*)/ : /^v(\d+)!(.*)/;
        matches = re.exec(value);
        var game_type_abbrev, desired_points, serialized_ships, _ref1, _ref;
        _ref1 = (_ref = matches[2].split('Z'), g = _ref[0], p = _ref[1], s = _ref[2], _ref), game_type_abbrev = _ref1[0], desired_points = _ref1[1], serialized_ships = _ref1[2];

        for (let i = 0; i < serialized_ships.length; i++){
          var xwsnew = this.yasbData.pilotsById[serialized_ships[i]]
          var xwsentry = {
            id: xwsnew.xws,
            name: xwsnew.xws,
            points: xwsnew.points,
            ship: xwsnew.ship.canonicalize()
          }
          // this.player.xws["pilots"][i] = xwsentry;
          console.log(xwsentry.name);
        }
      }*/

      this.player.xws = value.xws;
      this.editXWS = false;
      this.buildShipList(this.player.xws);
      this.updateParent();
    }
    catch (e) {
      this.xwsErrorDisplay = "Error Loading XWS";
    }
  }

  onSubmitXws({value, valid}){
    try {
      this.player.xws = value.xws;
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
  }

  closeXwsErrorDisplay(){
    this.xwsErrorDisplay = null;
  }

  debugListOutput(){
    console.log(this.player);
  }

}
