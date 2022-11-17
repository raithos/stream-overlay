import { Component, OnInit, Input } from '@angular/core';
import { NgSwitch } from '@angular/common';
import { Ship, Pilot, Upgrade, Options } from '../../../models/Stream';


@Component({
  selector: 'app-playback-ship',
  templateUrl: './playback-ship.component.html',
  styleUrls: ['./playback-ship.component.css']
})
export class PlaybackShipComponent implements OnInit {
@Input() ship:Ship;
@Input() isShipRight:boolean = false;
@Input() options:Options;

hullArray = [];
shieldArray = [];


  constructor() { }

  ngOnInit() {
    this.hullArray = Array(this.ship.hull).fill(0).map((x,i)=>i);
    this.shieldArray = Array(this.ship.shields).fill(0).map((x,i)=>i);
  }

  getUpgradeIcon(upgrade){
    switch (upgrade) {
      case "configuration":
        return "config";
      case "ept":
        return "talent";
      case "force-power":
        return "forcepower";
      case "tactical-relay":
        return "tacticalrelay";
    
      default:
        return upgrade;
    }
  }


  getShipIcon(ship){
    switch (ship) {
      case "tieininterceptor":
        return "tieinterceptor";
      case "delta7baethersprite":
        return "delta7aethersprite";
      case "upsilonclassshuttle":
        return "upsilonclasscommandshuttle";
      default:
        return ship;
    }
  }

}
