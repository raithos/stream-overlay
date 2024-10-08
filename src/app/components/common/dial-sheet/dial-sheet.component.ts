import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { log } from 'util';
import { Ship } from '../../../models/Stream';

@Component({
  selector: 'app-dial-sheet',
  templateUrl: './dial-sheet.component.html',
  styleUrls: ['./dial-sheet.component.css']
})
export class DialSheetComponent implements OnInit {
  @Input() ship: Ship;

  dial = [];
  maneuvers = [];
  columns = [];
  rows = [];

  constructor() { }

  ngOnInit() {  }

  ngOnChanges() {
    
    this.maneuvers = [];
    let yasbDial = this.ship.dial;
    let convertDial = [];
    for(let speed = 0; speed < yasbDial.length; speed++){
      for (let turn = 0; turn < yasbDial[0].length; turn++){
        let turnTranslate = "";
        let speedTranslate = speed;
        switch (turn){
          case 0:
            turnTranslate = "T"
            break;
          case 1:
            turnTranslate = "B"
            break;
          case 2:
            if (speed == 0){
              turnTranslate = "O"
            }else{
              turnTranslate = "F"
            }
            break;
          case 3:
            turnTranslate = "N"
            break;
          case 4:
            turnTranslate = "Y"
            break;
          case 5:
            turnTranslate = "K"
            break;
          case 6:
            turnTranslate = "L"
            break;
          case 7:
            turnTranslate = "P"
            break;
          case 8:
            turnTranslate = "E"
            break;
          case 9:
            turnTranslate = "R"
            break;
          case 10:
            turnTranslate = "A"
            speedTranslate = -speed;
            break;
          case 11:
            turnTranslate = "S"
            speedTranslate = -speed;
            break;
          case 12:
            turnTranslate = "D"
            speedTranslate = -speed;
            break;
          default:
            break;
        }
        switch (yasbDial[speed][turn]) {
          case 0:
            break;
          case 1:
            convertDial.push(speedTranslate+turnTranslate+"B")
            break;
          case 2:
            convertDial.push(speedTranslate+turnTranslate+"W")
            break;
          case 3:
            convertDial.push(speedTranslate+turnTranslate+"R")
            break;
          case 4:
            convertDial.push(speed+turnTranslate+"P")
            break;
          default:
            break;
        }
      }
    }
    this.dial = convertDial;

    this.columns = [
      {"col":"a", "use":false},
      {"col":"b", "use":false},
      {"col":"c", "use":false},
      {"col":"d", "use":false},
      {"col":"e", "use":false},
      {"col":"f", "use":false},
      {"col":"g", "use":false},
      {"col":"h", "use":false}
    ];
    this.rows = [
      {"row":"5", "use":false},
      {"row":"4", "use":false},
      {"row":"3", "use":false},
      {"row":"2", "use":false},
      {"row":"1", "use":false},
      {"row":"0", "use":false},
      {"row":"-1", "use":false},
      {"row":"-2", "use":false}
    ];
    
    this.dial.forEach(maneuver => {
      let m = {
        'speed': parseInt(maneuver.substr(0,1)), 
        'move': this.getMoveName(maneuver.substr(1,1)), 
        'difficulty': this.getDifficultyColor(maneuver.substr(2,1)),
        'location': {'row': null, 'col': null}
      };
      this.maneuvers.push(m);
    });

    this.maneuvers.forEach(function(m,i){
      /* sets columns for maneuvers */
      switch (m['move']) {
        case "dalan-bankleft":
        case "trollleft":
          this[i]['location']['col'] = 'a';
          break;
        case "turnleft":
            this[i]['location']['col'] = 'b';
          break;
        case "bankleft":
        case "reversebankleft":
            this[i]['location']['col'] = 'c';
          break;
        case "straight":
        case "stop":
        case "reversestraight":
            this[i]['location']['col'] = 'd';
          break;
        case "bankright":
        case "reversebankright":
            this[i]['location']['col'] = 'e';
          break;
        case "turnright":
            this[i]['location']['col'] = 'f';
          break;
        case "dalan-bankright":
        case "trollright":
            this[i]['location']['col'] = 'g';
          break;  
        case "kturn":
            this[i]['location']['col'] = 'h';
          break;
        default:
          break;
      }
    }, this.maneuvers);
    
    this.maneuvers.forEach(function(m,i){
      /* sets reverse speeds to negative */
      switch (m['move']) {
        case "reversebankleft":
        case "reversebankright":
        case "reversestraight":
          this[i]['speed'] *=-1;
          break;
        default:
          break;
      }
    }, this.maneuvers);

    this.maneuvers.forEach(function(m,i){
      // sets row location for each move
      this[i].location.row = m.speed;
    }, this.maneuvers)

    this.columns.forEach(function(e,i){
      // set which columns are needed
      let needle = this.maneuvers.findIndex(function(c){ return c.location.col == e.col });   
      if(needle !== -1){
        this.columns[i].use = true;
      }
    }, this);

    this.rows.forEach(function(e,i){
      // set which rows are needed
      let needle = this.maneuvers.findIndex(function(c){ return c.location.row == e.row });   
      if(needle !== -1){
        this.rows[i].use = true;
      }
    }, this);
  }

  getShipIcon(ship){
    switch (ship.xws) {
      case "tieininterceptor":
        return "tieinterceptor";
      case "delta7baethersprite":
        return "delta7aethersprite";
      case "upsilonclassshuttle":
        return "upsilonclasscommandshuttle";
      default:
        return ship.xws;
    }
  }

  getMoveName(move:string){
    switch (move) {
      case "T":
        return "turnleft";
      case "B":
        return "bankleft";
      case "F":
        return "straight";
      case "N":
        return "bankright";
      case "Y":
        return "turnright";
      case "E":
        return "trollleft";
      case "R":
        return "trollright";
      case "K":
        return "kturn";    
      case "O":
        return "stop";    
      case "L":
        return "dalan-bankleft";
      case "P":
        return "dalan-bankright";  
      case "A":
        return "reversebankleft";
      case "S":
        return "reversestraight";
      case "D":
        return "reversebankright";
      default:
        return move;
    }
  }

  getDifficultyColor(difficulty:string){
    switch (difficulty) {
      case "B":
        return "blue";
      case "W":
        return "white";
      case "R":
        return "red";
      case "P":
        return "purple";      
      default:
        return difficulty;
    }
  }

}
