import React, { Component } from 'react';
import Navbar from "./components/Navbar/Navbar";
import * as THREE from "three";
import Stats from "stats.js";
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import solveMiddleLogic from './solvers/solveMiddleLogic'

class App extends Component {
  state = {
    cubes : [],           // Contains visual cube
    rubiksObject : [],    // Contains memory cube
    speed : 7.5,          // Control individual piece rotation speed (don't change)
    rotationSpeed : 350,  // Controls visual rotation speed
    start : 7.5,          // Start value for a rotation or set of rotations
    end : 0,              // End value for a roation or set of rotations
    turnDirection : 0,    // Dictates whether the rotation is clockwise or counterclockwise
    face : 0,             // The face being turned
    cameraX : 5,          // Camera position x
    cameraY : -5,         // Camera position y
    cameraZ : 2,          // Camera position z
    currentFunc : "None", // Variable used to display current function
    moveLog : "",         // Keeps a log of all moves
    moveSet : [],         // Algorithms queue moves through this variable
    angle : 3.9,          // Camera angle
    cubeDimension : 3,    // Cube dimensions. Ex: 3 => 3x3x3 cube
    cubeDepth : 1,        // Used to determine rotation depth on cubes greater than 3
    currentSpeed:"Medium",// Displays which speed is selected
    moves : 0,            // Used by scramble functions
    reload : false,       // Lets animate know when to reload the cube (after every move)
    solveState : -1,      // Dictates progression of solve function
    solveMoves : "",
    facePosX : null,
    facePosY : null,
    facePosZ : null,
    mouseFace : null,
    mouseDown : false,
    undoIndex : 0,
    blockMoveLog : false,
    previousPiece : null,
    rubiksIndex : 0,
    middles : []
    //anisotropy : false
  };

  // Generates the inital solved state of rubiksObject
  generateSolved = (_x,_y,_z) =>{
    let tempArr = [];
    let tempMiddles = [
      [], // white
      [], // yellow
      [], // blue
      [], // green
      [], // orange
      []  // red
    ];

    for(let j = 0; j < _y; j++){      // Move back along the y-axis
      for(let k = _z-1; k >= 0; k--){ // Move down through the z-axis
        for(let i = 0; i < _x; i++){  // Traverse across the x-axis
          let side0 = "black";
          let side1 = "black";
          let side2 = "black";
          let side3 = "black";
          let side4 = "black";
          let side5 = "black";
          if(i===_x-1) side2 = "red";
          else if (i===0) side4 ="orange";
          if(j===_y-1) side3 = "yellow";
          else if (j===0) side0 ="white";
          if(k===_z-1) side1 = "blue";
          else if (k===0) side5 ="green";
          let tempCount = 0;
          if(j===0 || j === _y-1) tempCount++;
          if(k===0 || k === _z-1) tempCount++;
          if(i===0 || i === _x-1) tempCount ++;
          let tempType = "none";
          if(tempCount===1) {
            tempType = "middle";
            if(j===0) tempMiddles[0].push(tempArr.length);
            if(j===_y-1) tempMiddles[1].push(tempArr.length);
            if(k===_z-1) tempMiddles[2].push(tempArr.length);
            if(k===0) tempMiddles[3].push(tempArr.length);
            if(i===0) tempMiddles[4].push(tempArr.length);
            if(i===_x-1) tempMiddles[5].push(tempArr.length);
          }
          else if(tempCount===2) tempType = "edge";
          else if(tempCount===3) tempType = "corner";
          tempArr.push([side0,side1,side2,side3,side4,side5,i,j,k,i,j,k,tempType]);//Twice for solved state
        }
      }
    }
    console.log(tempMiddles);
    let middles=[];
    for(let i = 0; i < 6; i++){
      for(let j = 0; j < (_x-2)*(_x-2); j++){
        middles.push(tempMiddles[i][j]);
      }
    }
    //console.log(middles);
    this.setState({middles});
    return tempArr;
  }

  // For visual cube
  rotatePoint = (c1,c2,direction,p1,p2,rotation) =>{
    let theta = rotation*Math.PI/180;
    if(direction < 0) theta*=-1; 
    return { p1 : (Math.cos(theta) * (p1-c1) - Math.sin(theta) * (p2-c2) + c1),
             p2 : (Math.sin(theta) * (p1-c1) + Math.cos(theta) * (p2-c2) + c2)}
  }

  // For memory cube
  rotatePoint2 = (c1,c2,direction,p1,p2) =>{
    let theta = Math.PI/2;
    if(direction < 0) theta*=-1; 
    return { p1 : (- Math.sin(theta) * (p2-c2) + c1),
             p2 :   (Math.sin(theta) * (p1-c1) + c2)}
  }

  // rotate colors on face
  rotateFace = (cubeFace,direction,cubeDepth) => {
    let centerPoint = this.state.cubeDimension/2-.5;
    let rubiksObject = this.state.rubiksObject;
    let degrees = 90;

    if(direction < 0)  degrees *=-1;

    // Side 0 (white center piece)
    if (cubeFace === 0){
        for(let i = 0; i < rubiksObject.length; i++){

            // white side is y===0
            if (rubiksObject[i][7] > cubeDepth-2 &&
                rubiksObject[i][7] < cubeDepth){

                // Rotate rubiksObject pieces to new location generated by rotatePoint2
                let newPoint = this.rotatePoint2(centerPoint,
                                                 centerPoint,
                                                 degrees,
                                                 rubiksObject[i][6],
                                                 rubiksObject[i][8]);
                rubiksObject[i][6] = newPoint.p1;
                rubiksObject[i][8] = newPoint.p2;

                // Unfortunately chunky
                // Swaps colors around on the face to match rotations
                if(direction === 0){
                    let tempFace = rubiksObject[i][1];
                    rubiksObject[i][1] = rubiksObject[i][2];
                    rubiksObject[i][2] = rubiksObject[i][5];
                    rubiksObject[i][5] = rubiksObject[i][4];
                    rubiksObject[i][4] = tempFace;
                } else {
                    let tempFace = rubiksObject[i][1];
                    rubiksObject[i][1] = rubiksObject[i][4];
                    rubiksObject[i][4] = rubiksObject[i][5];
                    rubiksObject[i][5] = rubiksObject[i][2];
                    rubiksObject[i][2] = tempFace;
                }
            }
        }
    }

    // Side 1 (blue center piece)
    if (cubeFace === 1){
        for(let i = 0; i < rubiksObject.length; i++){
            if (rubiksObject[i][8] < this.state.cubeDimension+1-cubeDepth &&
                rubiksObject[i][8]>this.state.cubeDimension-1-cubeDepth){
                let newPoint = this.rotatePoint2(centerPoint,
                                                 centerPoint,
                                                 degrees,
                                                 rubiksObject[i][6],
                                                 rubiksObject[i][7]);
                rubiksObject[i][6] = newPoint.p1;
                rubiksObject[i][7] = newPoint.p2;
                if(direction === 0){
                    let tempFace = rubiksObject[i][3];
                    rubiksObject[i][3] = rubiksObject[i][2];
                    rubiksObject[i][2] = rubiksObject[i][0];
                    rubiksObject[i][0] = rubiksObject[i][4];
                    rubiksObject[i][4] = tempFace;
                } else {
                    let tempFace = rubiksObject[i][3];
                    rubiksObject[i][3] = rubiksObject[i][4];
                    rubiksObject[i][4] = rubiksObject[i][0];
                    rubiksObject[i][0] = rubiksObject[i][2];
                    rubiksObject[i][2] = tempFace;
                }
            }
        }
    }
    // Side 2 (red center piece)
    if (cubeFace === 2){
        for(let i = 0; i < rubiksObject.length; i++){
            if (rubiksObject[i][6] < this.state.cubeDimension+1-cubeDepth &&
                rubiksObject[i][6]>this.state.cubeDimension-1-cubeDepth){
                let newPoint = this.rotatePoint2(centerPoint,
                                                 centerPoint,
                                                 degrees,
                                                 rubiksObject[i][7],
                                                 rubiksObject[i][8]);
                rubiksObject[i][7] = newPoint.p1;
                rubiksObject[i][8] = newPoint.p2;
                if(direction === 0){
                    let tempFace = rubiksObject[i][3];
                    rubiksObject[i][3] = rubiksObject[i][5];
                    rubiksObject[i][5] = rubiksObject[i][0];
                    rubiksObject[i][0] = rubiksObject[i][1];
                    rubiksObject[i][1] = tempFace;
                } else {
                    let tempFace = rubiksObject[i][3];
                    rubiksObject[i][3] = rubiksObject[i][1];
                    rubiksObject[i][1] = rubiksObject[i][0];
                    rubiksObject[i][0] = rubiksObject[i][5];
                    rubiksObject[i][5] = tempFace;
                }
            }
        }
    }
    // Side 3 (yellow center piece)
    if (cubeFace === 3){
        for(let i = 0; i < rubiksObject.length; i++){
            if (rubiksObject[i][7] < this.state.cubeDimension+1-cubeDepth && rubiksObject[i][7]>this.state.cubeDimension-1-cubeDepth){
                let newPoint = this.rotatePoint2(centerPoint,centerPoint,degrees,rubiksObject[i][6],rubiksObject[i][8]);
                rubiksObject[i][6] = newPoint.p1;
                rubiksObject[i][8] = newPoint.p2;
                if(direction === -1){
                    let tempFace = rubiksObject[i][1];
                    rubiksObject[i][1] = rubiksObject[i][4];
                    rubiksObject[i][4] = rubiksObject[i][5];
                    rubiksObject[i][5] = rubiksObject[i][2];
                    rubiksObject[i][2] = tempFace;
                } else {
                    let tempFace = rubiksObject[i][1];
                    rubiksObject[i][1] = rubiksObject[i][2];
                    rubiksObject[i][2] = rubiksObject[i][5];
                    rubiksObject[i][5] = rubiksObject[i][4];
                    rubiksObject[i][4] = tempFace;
                }
            }
        }
    }
    // Side 4 (orange center piece)
    if (cubeFace === 4){
        for(let i = 0; i < rubiksObject.length; i++){
            if (rubiksObject[i][6] > cubeDepth-2 && rubiksObject[i][6] < cubeDepth){
                let newPoint = this.rotatePoint2(centerPoint,centerPoint,degrees,rubiksObject[i][7],rubiksObject[i][8]);
                rubiksObject[i][7] = newPoint.p1;
                rubiksObject[i][8] = newPoint.p2;
                if(direction === -1){
                    let tempFace = rubiksObject[i][3];
                    rubiksObject[i][3] = rubiksObject[i][1];
                    rubiksObject[i][1] = rubiksObject[i][0];
                    rubiksObject[i][0] = rubiksObject[i][5];
                    rubiksObject[i][5] = tempFace;
                } else {
                    let tempFace = rubiksObject[i][3];
                    rubiksObject[i][3] = rubiksObject[i][5];
                    rubiksObject[i][5] = rubiksObject[i][0];
                    rubiksObject[i][0] = rubiksObject[i][1];
                    rubiksObject[i][1] = tempFace;
                }
            }
        } 
    }
    // Side 5 (green center piece)
    if (cubeFace === 5){
        for(let i = 0; i < rubiksObject.length; i++){
            if (rubiksObject[i][8] > cubeDepth-2 && rubiksObject[i][8] < cubeDepth){
                let newPoint = this.rotatePoint2(centerPoint,centerPoint,degrees,rubiksObject[i][6],rubiksObject[i][7]);
                rubiksObject[i][6] = newPoint.p1;
                rubiksObject[i][7] = newPoint.p2;
                if(direction === -1){
                    let tempFace = rubiksObject[i][3];
                    rubiksObject[i][3] = rubiksObject[i][4];
                    rubiksObject[i][4] = rubiksObject[i][0];
                    rubiksObject[i][0] = rubiksObject[i][2];
                    rubiksObject[i][2] = tempFace;
                } else {
                    let tempFace = rubiksObject[i][3];
                    rubiksObject[i][3] = rubiksObject[i][2];
                    rubiksObject[i][2] = rubiksObject[i][0];
                    rubiksObject[i][0] = rubiksObject[i][4];
                    rubiksObject[i][4] = tempFace;
                }
            }
        } 
    }

    //add the move updates to state
    this.setState({rubiksObject : rubiksObject}, () =>{
    });
  };

  // rotate pieces attached to face
  rotatePieces = (rotate,tempCubes) => {
    this.setState({reload : true});

    // state variables asigned for shorter names
    let centerPoint = this.state.cubeDimension/2-.5;
    let cubes = this.state.cubes;
    let turnDirection = this.state.turnDirection;
    let speed = this.state.speed;
    let start = this.state.start;
    let face = this.state.face;
    let cubeDepth = this.state.cubeDepth;

    this.setState({start : start+speed});

    //Rotate white center piece Face
    if(face === 0){
      for(let i = 0; i<this.state.rubiksObject.length;i++){
        if(cubes[i].position.y > cubeDepth-2 && cubes[i].position.y < cubeDepth){
          
          // Turn piece based on rotation direction
          turnDirection<0 ? cubes[i].rotation.y += .1745*speed/10 : cubes[i].rotation.y -= .1745*speed/10;

          // Calculate circular movement
          let newPoint = rotate(centerPoint,centerPoint,turnDirection,cubes[i].position.x,cubes[i].position.z,speed);

          // corrects rounding errors
          if(start % 90 === 0){
            newPoint.p1 = Math.round(newPoint.p1);
            newPoint.p2 = Math.round(newPoint.p2);
          }
          
          // set new locations for face 0
          cubes[i].position.x = newPoint.p1;
          cubes[i].position.z = newPoint.p2;
        }
      }     
    }
    // blue
    if(face === 1){
      for(let i = 0; i<this.state.rubiksObject.length;i++){
        if(cubes[i].position.z < this.state.cubeDimension + 1 - cubeDepth && cubes[i].position.z > this.state.cubeDimension - 1 - cubeDepth){
          turnDirection<0 ? cubes[i].rotation.z -= .1745*speed/10 : cubes[i].rotation.z += .1745*speed/10;
          let newPoint = rotate(centerPoint,centerPoint,turnDirection,cubes[i].position.x,cubes[i].position.y,10*speed/10);
          if(start % 90 === 0){
            newPoint.p1 = Math.round(newPoint.p1);
            newPoint.p2 = Math.round(newPoint.p2);
          }
          cubes[i].position.x = newPoint.p1;
          cubes[i].position.y = newPoint.p2;
        }
      }
    }
    // red
    if(face === 2){
      for(let i = 0; i<this.state.rubiksObject.length;i++){
        if(tempCubes[i].position.x < this.state.cubeDimension + 1 - cubeDepth && cubes[i].position.x > this.state.cubeDimension - 1 - cubeDepth){
          turnDirection<0 ? tempCubes[i].rotation.x -= .1745*speed/10 : tempCubes[i].rotation.x += .1745*speed/10;
          let newPoint = rotate(centerPoint,centerPoint,turnDirection,tempCubes[i].position.y,tempCubes[i].position.z,10*speed/10);
          if(start % 90 === 0){
            newPoint.p1 = Math.round(newPoint.p1);
            newPoint.p2 = Math.round(newPoint.p2);
          }
          tempCubes[i].position.y = newPoint.p1;
          tempCubes[i].position.z = newPoint.p2;
        }
      }
    }
    // yellow
    if(face === 3){
      for(let i = 0; i<this.state.rubiksObject.length;i++){
        if(tempCubes[i].position.y < this.state.cubeDimension + 1 - cubeDepth && cubes[i].position.y > this.state.cubeDimension - 1 - cubeDepth){
          turnDirection<0 ? tempCubes[i].rotation.y += .1745*speed/10 : tempCubes[i].rotation.y -= .1745*speed/10;
          let newPoint = rotate(centerPoint,centerPoint,turnDirection,tempCubes[i].position.x,tempCubes[i].position.z,10*speed/10);
          if(start % 90 === 0){
            newPoint.p1 = Math.round(newPoint.p1);
            newPoint.p2 = Math.round(newPoint.p2);
          }
          tempCubes[i].position.x = newPoint.p1;
          tempCubes[i].position.z = newPoint.p2;
        }
      }
    }
    // orange
    if(face === 4){
      for(let i = 0; i<this.state.rubiksObject.length;i++){
        if(tempCubes[i].position.x > cubeDepth-2 && cubes[i].position.x < cubeDepth){
          turnDirection<0 ? tempCubes[i].rotation.x -= .1745*speed/10 : tempCubes[i].rotation.x += .1745*speed/10;
          let newPoint = rotate(centerPoint,centerPoint,turnDirection,tempCubes[i].position.y,tempCubes[i].position.z,10*speed/10);              
          if(start % 90 === 0){
            newPoint.p1 = Math.round(newPoint.p1);
            newPoint.p2 = Math.round(newPoint.p2);
          }
          tempCubes[i].position.y = newPoint.p1;
          tempCubes[i].position.z = newPoint.p2;
        }
      }
    }
    // green
    if(face === 5){
      for(let i = 0; i<this.state.rubiksObject.length;i++){
        if(tempCubes[i].position.z > cubeDepth-2 && cubes[i].position.z < cubeDepth){
          turnDirection<0 ? tempCubes[i].rotation.z -= .1745*speed/10 : tempCubes[i].rotation.z += .1745*speed/10;
          let newPoint = rotate(centerPoint,centerPoint,turnDirection,tempCubes[i].position.x,tempCubes[i].position.y,10*speed/10);
          if(start % 90 === 0){
            newPoint.p1 = Math.round(newPoint.p1);
            newPoint.p2 = Math.round(newPoint.p2);
          }
          tempCubes[i].position.x = newPoint.p1;
          tempCubes[i].position.y = newPoint.p2;
        }
      }
    } 
  }

  // Functions to change speed
  changeSpeed = (_speed,_rotationSpeed,_name) => {
    if(this.state.currentFunc !== "None") return;
    this.setState({currentSpeed: _name,speed: _speed, start: _speed, end: 0, rotationSpeed: _rotationSpeed});
  }

  rotateCamera = (key) => {
    let y = this.state.cameraY;
    //let x = this.state.cameraX;
    //let z = this.state.cameraZ;
    //let formula = this.state.cubeDimension+2+(y+1)/20;
    if(key === 37){ // left
      this.setState({angle: this.state.angle+.075}); 
    }
    if(key === 38){ // up
      // fix so that cube stays at same distance from camera
      
      if(y < this.state.cubeDimension+2) this.setState({cameraY: y + .5});//, cameraX : formula, cameraZ : -formula});
      console.log(`UP - CameraX: ${this.state.cameraX}, CameraY: ${this.state.cameraY}, CameraZ: ${this.state.cameraZ}`);
    }
    if(key === 39){ // right
      this.setState({angle: this.state.angle-.075});
    }
    if(key === 40){ // down
      // fix so that cube stays at same distance from camera
      
      if(y > -(this.state.cubeDimension+2)) this.setState({cameraY: y - .5});//, cameraX : formula, cameraZ : -formula});
      console.log(`DOWN - CameraX: ${this.state.cameraX}, CameraY: ${this.state.cameraY}, CameraZ: ${this.state.cameraZ}`);
    }
  }

  keyBinds = key => {
    switch (key){

      case 'R':
        this.rotateOneFace(key+"'",[2,0,1]);
        break;
      case 'r':
        this.rotateOneFace(key.toUpperCase(),[2,-1,1]);
        break;

      case 'L':
        this.rotateOneFace(key+"'",[4,0,1]);
        break;
      case 'l':
        this.rotateOneFace(key.toUpperCase(),[4,-1,1]);
        break;

      case 'F':
        this.rotateOneFace(key+"'",[0,0,1]);
        break;
      case 'f':
        this.rotateOneFace(key.toUpperCase(),[0,-1,1]);
        break;

      case 'U':
        this.rotateOneFace(key+"'",[1,0,1]);
        break;
      case 'u':
        this.rotateOneFace(key.toUpperCase(),[1,-1,1]);
        break;

      case 'D':
        this.rotateOneFace(key+"'",[5,0,1]);
        break;
      case 'd':
        this.rotateOneFace(key.toUpperCase(),[5,-1,1]);
        break;

      case 'B':
        this.rotateOneFace(key+"'",[3,0,1]);
        break;
      case 'b':
        this.rotateOneFace(key.toUpperCase(),[3,-1,1]);
        break;

      default:
    }
  }

  keyHandling = e => {
    e.keyCode > 36 && e.keyCode < 41 ?
     this.rotateCamera(e.keyCode) : this.keyBinds(e.key);
  }

  undo = () => {
    if(this.state.currentFunc !== "None") return;
    let undoIndex = this.state.undoIndex;
    let moveString = this.state.moveLog;
    if(moveString === "") return;

    const moveArray = this.moveStringToArray(moveString);

    this.setState({blockMoveLog : true});

    if(moveArray.length-1-undoIndex >= 0)
      this.setState({currentFunc : "Undo",
                     moveSet : [moveArray[moveArray.length-1-undoIndex]],
                     undoIndex : undoIndex + 1});
  }

  redo = () => {
    if(this.state.currentFunc !== "None") return;
    let undoIndex = this.state.undoIndex;
    let moveString = this.state.moveLog;
    if(moveString === "") return;
    
    const moveArray = this.moveStringToArray(moveString);
    
    let backwardsMove = moveArray[moveArray.length-undoIndex];
    try{
      backwardsMove.includes("'") ? backwardsMove = backwardsMove.substring(0,3) : backwardsMove += "'";
    }catch(err){
      return;
    }

    this.setState({blockMoveLog : true});

    if(undoIndex > 0)
      this.setState({currentFunc : "Redo",
                     moveSet : [backwardsMove],
                     undoIndex : undoIndex - 1});
  }

  // Control when rotation buttons can be clicked
  rotateOneFace = (e,vals) => {
    if(this.state.currentFunc === "None") {
      this.setState({currentFunc: e});
      this.rotateCubeFace(vals[0],vals[1],vals[2]);
    }
  }

  // Changes values in state to trigger face rotation
  rotateCubeFace = (face,direction,cubeDepth) => {
    if(this.state.currentFunc !== "Reverse Moves" && !this.state.blockMoveLog){
      let tempMove = "";
      cubeDepth<10 ? tempMove+="0"+cubeDepth : tempMove += cubeDepth;
      if(face === 0) tempMove += "F";
      else if(face === 1) tempMove += "U";
      else if(face === 2) tempMove += "R";
      else if(face === 3) tempMove += "B";
      else if(face === 4) tempMove += "L";
      else if(face === 5) tempMove += "D";
      if(direction === -1) tempMove += "'";
      this.state.moveLog.length > 0 ?
        this.setState({moveLog : this.state.moveLog + " " + tempMove}) :
        this.setState({moveLog : this.state.moveLog + tempMove});
      if(this.state.solveState > -1) 
        this.setState({solveMoves : this.state.solveMoves.length ? this.state.solveMoves + " " + tempMove : this.state.solveMoves + tempMove});
    }

    this.setState({blockMoveLog:false});

    // Faces on opposite side of cube rotate backwards
    if(face>2 && direction === -1) direction = 0;

    else if (face>2 && direction === 0) direction = -1;

    // change state so animate function kicks in
    this.setState({face : face,
                   turnDirection : direction,
                   end : this.state.end + 90,
                   cubeDepth : cubeDepth},
                   () =>{
      this.rotateFace(face,direction,cubeDepth);
    });
  }

  // Slows the scramble function down to keep from breaking the cube
  // Consider removing this and using moveSetTimed
  timingScramble = () => {

    this.setState({moves:this.state.moves+1});

    let maxDepth = Math.ceil((this.state.cubeDimension/2));
    let randFace = Math.floor((Math.random() * 6));
    let randTurn = Math.floor((Math.random() * 2)-1);
    let randDepth = 1;

    if(this.state.cubeDimension>2) 
      randDepth = Math.floor((Math.random() * maxDepth)) + 1;

    this.rotateCubeFace(randFace, randTurn,randDepth);
  }

  // Converts move string to move array
  // handle move short hand characters. ex: fx => 01Fx 02Fx; x = "" or "'" or "2"
  moveStringToArray = str => {
    let tempArray = str.split(" ");
    let moveArray = [];

    // Run through split string and create duplicates where needed
    // Handle other short hands
    for(let i = 0; i < tempArray.length;i++){
      if(tempArray[i].length === 4 && tempArray[i].slice(3,4)==="2") {
        let tempMove = tempArray[i].slice(0,3);
        moveArray.push(tempMove);
        moveArray.push(tempMove);
      }
      else {
        moveArray.push(tempArray[i]);
      }
    }
    return moveArray;
  }

  // Algorithm for Checkerboard
  checkerBoard = () => {
    if(this.state.currentFunc !== "None") return;
    let moveString = "01U2 01D2 01R2 01L2 01F2 01B2";
    const moveArray = this.moveStringToArray(moveString);
    this.setState({currentFunc : "Checkerboard", moveSet : moveArray});
  }

  // Algorithm for Checkerboard1
  checkerBoard1 = () => {
    if(this.state.currentFunc !== "None") return;
    let moveString = "01U' 01R2 01L2 01F2 01B2 01U' 01R 01L 01F 01B' 01U 01F2 01D2 01R2 01L2 01F2 01U2 01F2 01U' 01F2";
    const moveArray = this.moveStringToArray(moveString);
    this.setState({currentFunc : "Checkerboard1", moveSet : moveArray});
  }

  // Algorithm for Cube in a cube in a cube
  cubeInACube = () => {
    if(this.state.currentFunc !== "None") return;
    let moveString = "";
    if(this.state.cubeDimension < 4)
      moveString = "01U' 01L' 01U' 01F' 01R2 01B' 01R 01F 01U 01B2 01U 01B' 01L 01U' 01F 01U 01R 01F'";
    if(this.state.cubeDimension === 4)
      moveString = "01B' 02R2 02L2 01U2 02R2 02L2 01B 01F2 01R 01U' 01R 01U 01R2 01U 01R2 01F' 01U 01F' 01U 02U 01L 02L 01U' 02U' 01F2 02F2 01D 02D 01R' 02R' 01U 02U 01F 02F 01D2 02D2 01R2 02R2";

    const moveArray = this.moveStringToArray(moveString);
    this.setState({currentFunc : "Cube x3", moveSet : moveArray});
  }

  // Algorithm for Cube in a cube
  cubeIn = () => {
    if(this.state.currentFunc !== "None") return;
    let moveString = "01F 01L 01F 01U' 01R 01U 01F2 01L2 01U' 01L' 01B 01D' 01B' 01L2 01U";
    const moveArray = this.moveStringToArray(moveString);
    this.setState({currentFunc : "Cube x2", moveSet : moveArray});
  }

  // Algorithm for isolating middles
  sixSpots = () => {
    if(this.state.currentFunc !== "None") return;
    let moveString = "01U 01D' 01R 01L' 01F 01B' 01U 01D'"
    const moveArray = this.moveStringToArray(moveString);
    this.setState({currentFunc : "Six Spots", moveSet : moveArray});
  }

  // Algorithm for coss
  cross = () => {
    if(this.state.currentFunc !== "None") return;
    let moveString = "01R2 01L' 01D 01F2 01R' 01D' 01R' 01L 01U' 01D 01R 01D 01B2 01R' 01U 01D2";
    const moveArray = this.moveStringToArray(moveString);
    this.setState({currentFunc : "Cross", moveSet : moveArray});
  }

  // Generalized time move function. Takes in move array and creates small delay between moves
  moveSetTimed = (moveArray,length, start, solving) =>{
    //if(typeof moveArray === 'string') moveArray = [moveArray];
    let shifted = moveArray.shift();

    let tempFace = 0;
    let tempDirection = -1;
    let tempDepth = 1;

    if(shifted.length === 4) tempDirection=0;
    tempDepth = parseInt(shifted.slice(0,2));

    if(shifted.slice(2,3) === "U") tempFace = 1;
    else if(shifted.slice(2,3) === "F") tempFace = 0;
    else if(shifted.slice(2,3) === "B") tempFace = 3;
    else if(shifted.slice(2,3) === "R") tempFace = 2;
    else if(shifted.slice(2,3) === "L") tempFace = 4;
    else if(shifted.slice(2,3) === "D") tempFace = 5;

    this.rotateCubeFace(tempFace,tempDirection,tempDepth);

  }

  // Scrambles the cube
  scramble = () => {
    if(this.state.currentFunc === "None") this.setState({currentFunc : "Scrambling"});
  }

  // Rewinds all moves that have been done to the cube since unsolved state
  reverseMoves = () => {
    if(this.state.currentFunc !== "None") return;
    if(!this.state.moveLog.length) return;
    let moveString = this.state.moveLog;
    this.setState({moveLog : "",currentFunc : "Reverse Moves"});

    const tempArray = this.moveStringToArray(moveString);
    const moveArray = [];

    for(let i = tempArray.length-1-this.state.undoIndex; i >= 0; i--)
      moveArray.push(tempArray[i]);

    this.setState({moveSet : moveArray});
  }

  // Refreshes page to reset cube
  reset = () => {
    window.location.reload();
  }

  // Incase of rendering conflicts, reload cube color positions
  reloadCubes = (pos) => {
    let cubes = [...this.state.cubes];
    
    for(let i = 0; i<this.state.rubiksObject.length;i++){
      let cube = {...cubes[i]};
      if((cube.rotation.x !== 0 || cube.rotation.y !== 0 || cube.rotation.z !== 0) || pos === cube.position){
        cube.material[0].color = new THREE.Color(this.state.rubiksObject[i][2]);
        cube.material[1].color = new THREE.Color(this.state.rubiksObject[i][4]);
        cube.material[2].color = new THREE.Color(this.state.rubiksObject[i][3]);
        cube.material[3].color = new THREE.Color(this.state.rubiksObject[i][0]);
        cube.material[4].color = new THREE.Color(this.state.rubiksObject[i][1]);
        cube.material[5].color = new THREE.Color(this.state.rubiksObject[i][5]);
        cube.rotation.x = 0; cube.rotation.y = 0; cube.rotation.z = 0;
        cubes[i] = cube;
        
      }
    }
    this.setState({cubes,reload : false});
  }

  beginSolve = () => {
    if(this.state.currentFunc !== "None") return;
    this.setState({currentFunc : "Solving",solveState : 0});
  }

  solveMiddles = () => {
    let dim = this.state.cubeDimension;
    let index = this.state.rubiksIndex;
    if(dim===2) {
      this.setState({solveState : 1});
      return;
    }

    let moveString = "";
    let cube = this.state.rubiksObject;

    if(dim===3){
      if(cube[4][7] === 0 && cube[10][8] === 2){
      }
      else{
        if(cube[4][8]===2){ //U
          cube[12][6]===0 ? moveString+="02R'" : moveString+="02U'";
        }
        else if(cube[4][6]===0){//L
          cube[10][8]===2 ? moveString+="02U'" : moveString+="02R'";
        }
        else if(cube[4][6]===2){//R
          cube[10][8]===2 ? moveString+="02U" : moveString+="02R'";
        }
        else if(cube[4][8]===0){//D
          cube[12][6]===0 ? moveString+="02R" : moveString+="02U'";
        }
        else if(cube[4][7]===2){//B
          cube[10][8]===2 ? moveString+="02U2" : moveString+="02F'";
        }
        else moveString+="02B'"//F
      }
    }
    else if(dim>3){
      let middles=this.state.middles;
      index = this.state.rubiksIndex;
      let whiteMiddleError = false;
      let yellowMiddleError = false;

      //Check for misplacement errors in white middle solve
      for(let i = 0; i<index&&i<(dim-2)*(dim-2)-1;i++){
        if(cube[middles[i]][6]!==cube[middles[i]][9]&&
           cube[middles[i]][7]!==cube[middles[i]][10]&&
           cube[middles[i]][8]!==cube[middles[i]][11]){
            whiteMiddleError=true;
           }
      }
      for(let i = (dim-2)*(dim-2); i<index&&((dim-2)*(dim-2))*2-1;i++){
        console.log("checking "+ i)
        if(cube[middles[i]][6]!==cube[middles[i]][9]&&
           cube[middles[i]][7]!==cube[middles[i]][10]&&
           cube[middles[i]][8]!==cube[middles[i]][11]){
             console.log(cube[middles[i]]);
            yellowMiddleError=true;
           }
      }
      if(!whiteMiddleError && !yellowMiddleError && index<((dim-2)*(dim-2))*2){
        console.log(`Index: ${index}, Piece: ${middles[index]}`);
        moveString = solveMiddleLogic(dim,cube[middles[index]],index);
        console.log(moveString)
      }
      else if(whiteMiddleError){
        console.log("Exiting early due to an earlier solved piece being displaced on face 0");
        index=1000000000;
      }
      else if(yellowMiddleError){
        console.log("Exiting early due to an earlier solved piece being displaced on face 3");
        index=1000000000;
      }
    }
    const moveArray = this.moveStringToArray(moveString);

    if(dim<4){
      moveString.length ? 
        this.setState({moveSet : moveArray}) :
        this.setState({solveState:1});
    }
    else{
      if(index<((dim-2)*(dim-2))*2){
        if(moveString.length) this.setState({moveSet : moveArray});
        else {
          this.setState({rubiksIndex: index+1});
          console.log("keep solving\n");
        }
      }

      else{
        console.log(index);
        console.log("move on");
        this.setState({solveState:-1,currentFunc:"None",rubiksIndex:0});
      }
    }
  }

  // function to solves edges on cubes greater than 3x3x3
  solveMultipleEdges = () =>{
    // code here
  }

  // Solves white (front) cross for 3x3 and greater.
  solveWhiteCross = () => {

    let moveString = "";
    let cube = this.state.rubiksObject;
    let space = "";
    let solvedEdges = 0;

    let dim = this.state.cubeDimension;

    if(dim === 2) solvedEdges = 4;

    let pieceOne = Math.floor(dim/2);
    let pieceTwo = dim * pieceOne;
    let pieceThree = pieceTwo + (dim -1);
    let pieceFour = dim * dim - Math.ceil(dim/2);

    for(let i = 0; i < cube.length; i++){
      if(moveString.length) space = " ";
      if(cube[i].includes("white")){

        let emptyCount = 0;
        let whiteSide = -1;
        let cubeX = cube[i][6];
        let cubeY = cube[i][7];
        let cubeZ = cube[i][8];
        

        for(let j = 0; j < 6; j++){
          if (cube[i][j] === "black") emptyCount++;
          else {
            if(cube[i][j] === "white") whiteSide = j;
          }
        }

        // If edge piece
        if(emptyCount === 4) {
          if(i===pieceOne && solvedEdges === 0 ){
            if(cubeX===1 && cubeY===0 && cubeZ===2)
              !whiteSide ? solvedEdges++ : moveString+= space + "01U' 01R' 01F'";
            
            else if(cubeX===2 && cubeY===0 && cubeZ===1)
              !whiteSide ? moveString+= space + "01F'" : moveString+= space + "01R 01U";
            
            else if(cubeX===1 && cubeY===0 && cubeZ===0)
              !whiteSide ? moveString+= space + "01F2" : moveString+= space + "01D 01R 01F'";

            else if(cubeX===0 && cubeY===0 && cubeZ===1)
              !whiteSide ? moveString+= space + "01F" : moveString+= space + "01L' 01U'";

            //If piece one is in y section 1
            else if(cubeX===0 && cubeY===1 && cubeZ===2)
              whiteSide===1 ? moveString+= space + "01L 01F" : moveString+= space + "01U'";
            
            else if(cubeX===2 && cubeY===1 && cubeZ===2)
              whiteSide===1 ? moveString+= space + "01R' 01F'" : moveString+= space + "01U";
            
            else if(cubeX===2 && cubeY===1 && cubeZ===0)
              whiteSide===2 ? moveString+= space + "01D' 01F2" : moveString+= space + "01R 01F'";
            
            else if(cubeX===0 && cubeY===1 && cubeZ===0)
              whiteSide===4 ? moveString+= space + "01D 01F2" : moveString+= space + "01L' 01F";
            

            //If piece one is in y section 2
            else if(cubeX===1 && cubeY===2 && cubeZ===2)
              whiteSide===3 ? moveString+= space + "01U2" : moveString+= space + "01B 01L 01U'";
            
            else if(cubeX===2 && cubeY===2 && cubeZ===1)
              whiteSide===3 ? moveString+= space + "01R2 01F'" : moveString+= space + "01R' 01U";
            
            else if(cubeX===1 && cubeY===2 && cubeZ===0)
              whiteSide===3 ? moveString+= space + "01B2 01U2" : moveString+= space + "01B' 01L 01U'";
            
            else if(cubeX===0 && cubeY===2 && cubeZ===1)
              whiteSide===3 ? moveString+= space + "01B' 01U2" : moveString+= space + "01L 01U'";
            
          }
          if(i===pieceTwo && solvedEdges === 1){
            
            if(cubeX===0 && cubeY===0 && cubeZ===1)
              !whiteSide ? solvedEdges++ : moveString+= space + "01L' 01R 01U' 01R'";
            
            else if(cubeX===1 && cubeY===0 && cubeZ===0)
              !whiteSide ? moveString+= space + "01D' 01F' 01D 01F" : moveString+= space + "01D' 01L'";
            
            else if(cubeX===2 && cubeY===0 && cubeZ===1)
              !whiteSide ? moveString+= space + "01R 01F2 01R' 01F2" : moveString+= space + "01R 01F 01U 01F'";
            

            //If piece two is in y section 1
            if(cubeX===0 && cubeY===1 && cubeZ===2)
              whiteSide===1 ? moveString+= space + "01L" : moveString+= space + "01F 01U' 01F'";
            
            else if(cubeX===2 && cubeY===1 && cubeZ===2)
              whiteSide===1 ? moveString+= space + "01F2 01R' 01F2" : moveString+= space + "01U 01F' 01U'";
            
            else if(cubeX===2 && cubeY===1 && cubeZ===0)
              whiteSide===2 ? moveString+= space + "01F' 01D' 01F" : moveString+= space + "01F2 01R 01F2";
            
            else if(cubeX===0 && cubeY===1 && cubeZ===0)
              whiteSide===4 ? moveString+= space + "01F' 01D 01F" : moveString+= space + "01L'";
            

            //If piece two is in y section 2
            if(cubeX===1 && cubeY===2 && cubeZ===2)
              whiteSide===3 ? moveString+= space + "01F 01U2 01F'" : moveString+= space + "01U' 01L 01U";
            
            else if(cubeX===2 && cubeY===2 && cubeZ===1)
              whiteSide===3 ? moveString+= space + "01B2 01L2" : moveString+= space + "01R' 01F 01U 01F'";
            
            else if(cubeX===1 && cubeY===2 && cubeZ===0)
              whiteSide===3 ? moveString+= space + "01F' 01D2 01F" : moveString+= space + "01D 01L'";
            
            else if(cubeX===0 && cubeY===2 && cubeZ===1)
              whiteSide===3 ? moveString+= space + "01L2" : moveString+= space + "01B' 01U' 01L 01U";
            
          }
          if(i===pieceThree && solvedEdges === 2){
  
            if(cubeX===1 && cubeY===0 && cubeZ===0)
              !whiteSide ? moveString+= space + "01D 01F 01D' 01F'" : moveString+= space + "01D 01R";
            
            else if(cubeX===2 && cubeY===0 && cubeZ===1)
              !whiteSide ? solvedEdges++ : moveString+= space + "01R 01F' 01U 01F";
            
            
            //If piece three is in y section 1
            if(cubeX===0 && cubeY===1 && cubeZ===2)
              whiteSide===1 ? moveString+= space + "01F2 01L 01F2" : moveString+= space + "01F' 01U' 01F";
            
            else if(cubeX===2 && cubeY===1 && cubeZ===2)
              whiteSide===1 ? moveString+= space + "01R'" : moveString+= space + "01F' 01U 01F";
            
            else if(cubeX===2 && cubeY===1 && cubeZ===0)
              whiteSide===2 ? moveString+= space + "01F 01D' 01F'" : moveString+= space + "01R";
            
            else if(cubeX===0 && cubeY===1 && cubeZ===0)
              whiteSide===4 ? moveString+= space + "01F 01D 01F'" : moveString+= space + "01F2 01L' 01F2";
            

            //If piece three is in y section 2
            if(cubeX===1 && cubeY===2 && cubeZ===2)
              whiteSide===3 ? moveString+= space + "01F' 01U2 01F" : moveString+= space + "01U 01R' 01U'";
            
            else if(cubeX===2 && cubeY===2 && cubeZ===1)
              whiteSide===3 ? moveString+= space + "01R2" : moveString+= space + "01R' 01F' 01U 01F";
            
            else if(cubeX===1 && cubeY===2 && cubeZ===0)
              whiteSide===3 ? moveString+= space + "01F 01D2 01F'" : moveString+= space + "01D' 01L";
            
            else if(cubeX===0 && cubeY===2 && cubeZ===1)
              whiteSide===3 ? moveString+= space + "01B2 01R2" : moveString+= space + "01B' 01U 01R' 01U'";
            
          }
          if(i===pieceFour && solvedEdges === 3){
  
            if(cubeX===1 && cubeY===0 && cubeZ===0)
              !whiteSide ? solvedEdges++ : moveString+= space + "01D 01F' 01R 01F";
            
            //If piece four is in y section 1
            if(cubeX===0 && cubeY===1 && cubeZ===2)
              whiteSide===1 ? moveString+= space + "01F 01L 01F'" : moveString+= space + "01F2 01U' 01F2";
            
            else if(cubeX===2 && cubeY===1 && cubeZ===2)
              whiteSide===1 ? moveString+= space + "01F' 01R' 01F" : moveString+= space + "01F2 01U 01F2";
            
            else if(cubeX===2 && cubeY===1 && cubeZ===0)
              whiteSide===2 ? moveString+= space + "01D'" : moveString+= space + "01F' 01R 01F";
            
            else if(cubeX===0 && cubeY===1 && cubeZ===0)
              whiteSide===4 ? moveString+= space + "01D" : moveString+= space + "01F 01L' 01F'";
            

            //If piece four is in y section 2
            if(cubeX===1 && cubeY===2 && cubeZ===2)
              whiteSide===3 ? moveString+= space + "01F2 01U2 01F2" : moveString+= space + "01B 01L' 01D 01L";
            
            else if(cubeX===2 && cubeY===2 && cubeZ===1)
              whiteSide===3 ? moveString+= space + "01F' 01R2 01F" : moveString+= space + "01R 01D' 01R'";
            
            else if(cubeX===1 && cubeY===2 && cubeZ===0)
              whiteSide===3 ? moveString+= space + "01D2" : moveString+= space + "01D' 01F' 01R 01F";
            
            else if(cubeX===0 && cubeY===2 && cubeZ===1)
              whiteSide===3 ? moveString+= space + "01F 01L2 01F'" : moveString+= space + "01L' 01D 01L";
            
          }
        }
      }
    }
    
    const moveArray = this.moveStringToArray(moveString);

    solvedEdges < 4 ? this.setState({moveSet : moveArray}) : this.setState({solveState : 2});  
  }

  // Solves white (front) corners
  solveWhiteCorners = () => {
    let moveString = "";
    let cube = this.state.rubiksObject;
    let space = "";
    let solvedCorners = 0;

    let dim = this.state.cubeDimension;

    let pieceOne = 0;
    let pieceTwo = dim - 1;
    let pieceThree = (cube.length/dim) - dim;
    let pieceFour = (cube.length/dim) - 1;

    for(let i = 0; i < cube.length; i++){
      if(moveString.length) space = " ";
      if(cube[i].includes("white")){

        let emptyCount = 0;
        let whiteSide = -1;
        let cubeX = cube[i][6];
        let cubeY = cube[i][7];
        let cubeZ = cube[i][8];

        for(let j = 0; j < 6; j++){
          if (cube[i][j] === "black") emptyCount++;
          else if(cube[i][j] === "white") whiteSide = j;
        }

        // If edge piece
        if(emptyCount === 3) {

          if(i===pieceOne && solvedCorners === 0 ){
            //Front
            if(cubeX===0 && cubeY===0 && cubeZ===dim-1){
              if(whiteSide===0){solvedCorners++;}
              else if(whiteSide===1) moveString+= space + "01L' 01B 01L 01B' 01L' 01B 01L";
              else moveString+= space + "01L' 01B' 01L 01B2 01U 01B' 01U'";
            }
            else if(cubeX===dim-1 && cubeY===0 && cubeZ===dim-1) moveString+= space + "01R 01L' 01B 01L 01R'"
            else if(cubeX===dim-1 && cubeY===0 && cubeZ===0) moveString+= space + "01R' 01B' 01R 01U 01B' 01U'";
            else if(cubeX===0 && cubeY===0 && cubeZ===0) moveString+= space + "01D' 01U 01B 01U' 01D"
            //Back
            else if(cubeX===0 && cubeY===dim-1 && cubeZ===dim-1) moveString+= space + "01U 01B 01U'"
            else if(cubeX===dim-1 && cubeY===dim-1 && cubeZ===dim-1) moveString+= space + "01L' 01B 01L"
            else if(cubeX===dim-1 && cubeY===dim-1 && cubeZ===0) moveString+= space + "01L' 01B2 01L"
            else if(cubeX===0 && cubeY===dim-1 && cubeZ===0) moveString+= space + "01U 01B' 01U'"
          }

          if(i===pieceTwo && solvedCorners === 1 ){
            if(cubeX===dim-1 && cubeY === 0 && cubeZ === dim-1){
              if(whiteSide === 0){solvedCorners++}
              else if(whiteSide===1) moveString += space + "01R 01B' 01R' 01B 01R 01B' 01R'";
              else moveString += space + "01U' 01B 01U 01B' 01U' 01B 01U";
            }
            else if(cubeX === dim-1 && cubeY===0 && cubeZ===0) moveString+= space + "01U' 01D 01B 01D' 01U";
            else if(cubeX===0 && cubeY===0 && cubeZ===0) moveString+= space + "01L 01R 01B2 01R' 01L'";
            //Back
            else if(cubeX===0 && cubeY===dim-1 && cubeZ===dim-1) moveString+= space + "01R 01B' 01R'";
            else if(cubeX===dim-1 && cubeY===dim-1 && cubeZ===dim-1) moveString+= space + "01B 01R 01B' 01R'";
            else if(cubeX===dim-1 && cubeY===dim-1 && cubeZ===0) moveString+= space + "01B2 01R 01B' 01R'";
            else if(cubeX===0 && cubeY===dim-1 && cubeZ===0) moveString+= space + "01R 01B2 01R'";
          }

          if(i===pieceThree && solvedCorners === 2 ){
            if(cubeX===0 && cubeY===0 && cubeZ===0){
              if(whiteSide === 0){solvedCorners++}
              else if(whiteSide === 4) moveString += space + "01D' 01B 01D 01B' 01D' 01B 01D";
              else moveString += space + "01L 01B' 01L' 01B 01L 01B' 01L'";
            }
            else if(cubeX === dim-1 && cubeY===0 && cubeZ===0) moveString+= space + "01R' 01L 01B' 01L' 01R";
            //Back
            else if(cubeX===0 && cubeY===dim-1 && cubeZ===dim-1) moveString+= space + "01D' 01B 01D";
            else if(cubeX===dim-1 && cubeY===dim-1 && cubeZ===dim-1) moveString+= space + "01D' 01B2 01D";
            else if(cubeX===dim-1 && cubeY===dim-1 && cubeZ===0) moveString+= space + "01B' 01D' 01B' 01D";
            else if(cubeX===0 && cubeY===dim-1 && cubeZ===0) moveString+= space + "01D' 01B' 01D";
          }

          if(i===pieceFour && solvedCorners === 3 ){
            if(cubeX === dim-1 && cubeY===0 && cubeZ===0){
              if(whiteSide === 0){solvedCorners++}
              else if(whiteSide === 2) moveString += space + "01D 01B' 01D' 01B 01D 01B' 01D'";
              else moveString += space + "01R' 01B 01R 01B' 01R' 01B 01R";
            }
            //Back
            else if(cubeX===0 && cubeY===dim-1 && cubeZ===dim-1) moveString+= space + " 01R' 01B2 01R";
            else if(cubeX===dim-1 && cubeY===dim-1 && cubeZ===dim-1) moveString+= space + "01D 01B' 01D'";
            else if(cubeX===dim-1 && cubeY===dim-1 && cubeZ===0) moveString+= space + "01B 01D 01B' 01D'";
            else if(cubeX===0 && cubeY===dim-1 && cubeZ===0) moveString+= space + "01R' 01B 01R";
          }
        }
      }
    }

    const moveArray = this.moveStringToArray(moveString);

    solvedCorners < 4 ? this.setState({moveSet : moveArray}) :
      dim < 3 ? this.setState({solveState : 6}) : this.setState({solveState : 3});
  }

  // Correctly positions the middle edges for 3x3 and greater
  solveMiddleEdges = () => {
    let moveString = "";
    let cube = this.state.rubiksObject;
    let space = "";
    let solvedEdges = 0;
    let moveFromMiddle012 = "01B 01U 01B' 01U' 01B' 01L' 01B 01L";
    let moveFromMiddle212 = "01B 01R 01B' 01R' 01B' 01U' 01B 01U";
    let moveFromMiddle210 = "01B 01D 01B' 01D' 01B' 01R' 01B 01R";
    let moveFromMiddle010 = "01B 01L 01B' 01L' 01B' 01D' 01B 01D";

    for(let i = 0; i < 27; i++){
      if(moveString.length) space = " ";
      if(cube[i].includes("green") || cube[i].includes("blue")){
        let emptyCount = 0;
        let blueSide = -1;
        let greenSide = -1;
        let cubeX = cube[i][6];
        let cubeY = cube[i][7];
        let cubeZ = cube[i][8];

        for(let j = 0; j < 6; j++){
          if (cube[i][j] === "black") emptyCount++;
          else {
            if(cube[i][j] === "blue") blueSide = j;
            else if(cube[i][j] === "green") greenSide = j;
          }
        }

        if(emptyCount === 4){
          if(i===9 && solvedEdges === 0){
            //Front
            if(cubeX === 0 && cubeY === 1 && cubeZ === 2)
              blueSide === 1 ? solvedEdges++ : moveString+= space + moveFromMiddle012;
            
            else if(cubeX === 2 && cubeY === 1 && cubeZ === 2) moveString+= space + moveFromMiddle212;
            else if(cubeX === 0 && cubeY === 1 && cubeZ === 0) moveString+= space + moveFromMiddle010;
            else if(cubeX === 2 && cubeY === 1 && cubeZ === 0) moveString+= space + moveFromMiddle210;
            //Back
            else if(cubeX === 0 && cubeY === 2 && cubeZ === 1) {
              blueSide === 3 ? moveString+= space + moveFromMiddle012 : moveString+= space + "01B2 01L' 01B' 01L 01B 01U 01B 01U'";
            }
            else if(cubeX === 1 && cubeY === 2 && cubeZ === 2) moveString+= space + "01B";
            else if(cubeX === 2 && cubeY === 2 && cubeZ === 1) moveString+= space + "01B2";
            else if(cubeX === 1 && cubeY === 2 && cubeZ === 0) moveString+= space + "01B'";
          }
          if(i===11 && solvedEdges === 1){
            //Front
            if(cubeX === 2 && cubeY === 1 && cubeZ === 2){
              blueSide === 1 ? solvedEdges++ : moveString+= space + moveFromMiddle212;
            }
            else if(cubeX === 0 && cubeY === 1 && cubeZ === 0) moveString+= space + moveFromMiddle010;
            else if(cubeX === 2 && cubeY === 1 && cubeZ === 0) moveString+= space + moveFromMiddle210;
            //Back
            else if(cubeX === 1 && cubeY === 2 && cubeZ === 2) {
              blueSide === 1 ? moveString+= space + moveFromMiddle212 : moveString+= space + "01B2 01U' 01B' 01U 01B 01R 01B 01R'";
            }
            else if(cubeX === 2 && cubeY === 2 && cubeZ === 1) moveString+= space + "01B";
            else if(cubeX === 1 && cubeY === 2 && cubeZ === 0) moveString+= space + "01B2";
            else if(cubeX === 0 && cubeY === 2 && cubeZ === 1) moveString+= space + "01B'";
          }
          if(i===15 && solvedEdges === 2){
            //Front
            if(cubeX === 0 && cubeY === 1 && cubeZ === 0){
              greenSide === 5 ? solvedEdges++ : moveString+= space + moveFromMiddle010;
            }
            else if(cubeX === 2 && cubeY === 1 && cubeZ === 0) moveString+= space + moveFromMiddle210;
            //Back
            else if(cubeX === 1 && cubeY === 2 && cubeZ === 0){
              greenSide === 5 ? moveString+= space + moveFromMiddle010 : moveString+= space + "01B2 01D' 01B' 01D 01B 01L 01B 01L'";
            }
            else if(cubeX === 0 && cubeY === 2 && cubeZ === 1) moveString+= space + "01B";
            else if(cubeX === 1 && cubeY === 2 && cubeZ === 2) moveString+= space + "01B2";
            else if(cubeX === 2 && cubeY === 2 && cubeZ === 1) moveString+= space + "01B'";
          }
          if(i===17 && solvedEdges === 3){
            //Front
            if(cubeX === 2 && cubeY === 1 && cubeZ === 0){
              greenSide === 5 ? solvedEdges++ : moveString+= space + moveFromMiddle210;
            }
            //Back
            else if(cubeX === 2 && cubeY === 2 && cubeZ === 1){
              greenSide === 3 ? moveString+= space + moveFromMiddle210 : moveString+= space + "01B2 01R' 01B' 01R 01B 01D 01B 01D'";
            }
            else if(cubeX === 1 && cubeY === 2 && cubeZ === 0) moveString+= space + "01B";
            else if(cubeX === 0 && cubeY === 2 && cubeZ === 1) moveString+= space + "01B2";
            else if(cubeX === 1 && cubeY === 2 && cubeZ === 2) moveString+= space + "01B'"; 
          }
        }
      }
    }

    const moveArray = this.moveStringToArray(moveString);

    solvedEdges < 4 ? this.setState({moveSet : moveArray}) : this.setState({solveState : 4});
  }

  // Solves the yellow (back) cross for 3x3 and greater
  solveYellowCross = () => {
    let moveString = "";
    let cube = this.state.rubiksObject;
    let recipe = "01U 01R 01B 01R' 01B' 01U'";
    let cubeIndex = [19,21,23,25];
    let cubeAtIndex = [];

    for(let i = 0; i < 4; i++){
      if(cube[cubeIndex[i]][6] === 1 && 
         cube[cubeIndex[i]][7] === 2 &&
         cube[cubeIndex[i]][8] === 2) cubeAtIndex[0] = cube[cubeIndex[i]][3];
      else if (cube[cubeIndex[i]][6] === 0 && 
        cube[cubeIndex[i]][7] === 2 &&
        cube[cubeIndex[i]][8] === 1) cubeAtIndex[1] = cube[cubeIndex[i]][3];
      else if (cube[cubeIndex[i]][6] === 2 && 
        cube[cubeIndex[i]][7] === 2 &&
        cube[cubeIndex[i]][8] === 1) cubeAtIndex[2] = cube[cubeIndex[i]][3];
      else if (cube[cubeIndex[i]][6] === 1 && 
        cube[cubeIndex[i]][7] === 2 &&
        cube[cubeIndex[i]][8] === 0) cubeAtIndex[3] = cube[cubeIndex[i]][3];
    }

    if(cube[19][3] === "yellow" &&
      cube[21][3] === "yellow" &&
      cube[23][3] === "yellow" &&
      cube[25][3] === "yellow" 
      ) ;

    //Line
    else if (cubeAtIndex[0] === "yellow" && cubeAtIndex[3] === "yellow" ) {moveString = "01B " + recipe;}
    else if (cubeAtIndex[1] === "yellow" && cubeAtIndex[2] === "yellow" ) {moveString = recipe;}

    //L-Shape
    else if (cubeAtIndex[0] === "yellow" && cubeAtIndex[2] === "yellow" ) {moveString = "01B2 " + recipe + " " + recipe;}
    else if (cubeAtIndex[1] === "yellow" && cubeAtIndex[3] === "yellow" ) {moveString = recipe + " " + recipe;}
    else if (cubeAtIndex[0] === "yellow" && cubeAtIndex[1] === "yellow" ) {moveString = "01B " + recipe + " " + recipe;}
    else if (cubeAtIndex[2] === "yellow" && cubeAtIndex[3] ) {moveString = "01B' " + recipe + " " + recipe;}

    else moveString = recipe;
    
    const moveArray = this.moveStringToArray(moveString);

    moveString.length ? this.setState({moveSet : moveArray}) : this.setState({solveState:5});
  }

  // Aligns the yellow (back) cross
  alignYellowCross = () =>{
    let moveString = "";
    let cube = this.state.rubiksObject;

    if(cube[19][6] === 1 && cube[19][7] === 2 && cube[19][8] === 2){
      //Check if other pieces are in place
      if(cube[21][6] === 0 && cube[21][8] === 1 &&
         cube[23][6] === 2 && cube[23][8] === 1);

      else if(cube[21][6] === 2 && cube[23][8] === 1 &&
              cube[25][6] === 1 && cube[25][8] === 0) moveString = "01D 01B 01D' 01B 01D 01B2 01D' 01B2 01L 01B 01L' 01B 01L 01B2 01L' 01B";

      else if(cube[25][6] === 2 && cube[25][8] === 1) moveString = "01R 01B 01R' 01B 01R 01B2 01R' 01B";

      else if(cube[25][6] === 0 && cube[25][8] === 1) moveString = "01R 01B 01R' 01B 01R 01B2 01R' 01B";


      //Make moves
    }
    else if(cube[19][6] === 2 && cube[19][7] === 2 && cube[19][8] === 1){
      moveString = "01B";
    }
    else moveString = "01B'"

    const moveArray = this.moveStringToArray(moveString);

    moveString.length ? this.setState({moveSet : moveArray}) : this.setState({solveState:6});
  }

  // Aligns the yellow (back) corners
  alignYellowCorners = () =>{
    let moveString = "";
    let cube = this.state.rubiksObject;

    let dim = this.state.cubeDimension;

    let pieceOne = cube.length - (dim*dim);
    let pieceTwo = pieceOne + (dim-1);
    let pieceThree = cube.length - dim;
    let pieceFour = cube.length - 1;


    if(cube[pieceOne][6] === 0 && cube[pieceOne][8] === dim-1 &&
       cube[pieceTwo][6] === dim-1 && cube[pieceTwo][8] === dim-1);

    else if(cube[pieceOne][6] === 0 && cube[pieceOne][8] === dim-1) moveString = "01B 01U 01B' 01D' 01B 01U' 01B' 01D";
    else if(cube[pieceTwo][6] === dim-1 && cube[pieceTwo][8] === dim-1) moveString = "01B 01R 01B' 01L' 01B 01R' 01B' 01L";
    else if(cube[pieceThree][6] === 0 && cube[pieceThree][8] === 0) moveString = "01B 01L 01B' 01R' 01B 01L' 01B' 01R";
    else if(cube[pieceFour][6] === dim-1 && cube[pieceFour][8] === 0) moveString = "01B 01D 01B' 01U' 01B 01D' 01B' 01U";

    else moveString = "01B 01U 01B' 01D' 01B 01U' 01B' 01D";

    const moveArray = this.moveStringToArray(moveString);

    moveString.length ? this.setState({moveSet : moveArray}) : this.setState({solveState:7});
  }

  // Solves the yellow (back) corners
  solveYellowCorners(){
    let moveString = "";
    let cube = this.state.rubiksObject;
    
    let dim = this.state.cubeDimension;

    let pieceOne = cube.length - (dim*dim);
    let pieceTwo = pieceOne + (dim-1);
    let pieceThree = cube.length - dim;
    let pieceFour = cube.length - 1;

    if(cube[pieceOne][3] === "yellow" &&
       cube[pieceTwo][3] === "yellow" &&
       cube[pieceThree][3] === "yellow" &&
       cube[pieceFour][3] === "yellow"){
      if(cube[pieceOne][6] === 0 && cube[pieceOne][8] === dim-1);
      else moveString = "01B";
    }
    else if(cube[pieceOne][3]!== "yellow"){
      moveString = "01U' 01F' 01U 01F 01U' 01F' 01U 01F";
    }
    else if(cube[pieceTwo][3]!== "yellow"){
      if(cube[pieceTwo][6] === 0 && cube[pieceTwo][8] === dim-1) {
        moveString = "01U' 01F' 01U 01F 01U' 01F' 01U 01F";
      }
      else {
        moveString = "01B";
      }
    }
    else if(cube[pieceFour][3]!== "yellow"){
      if(cube[pieceFour][6] === 0 && cube[pieceFour][8] === dim-1) {
        moveString = "01U' 01F' 01U 01F 01U' 01F' 01U 01F";
      }
      else{
        moveString = "01B";
      }
    }
    else if(cube[pieceThree][3]!== "yellow"){
      if(cube[pieceThree][6] === 0 && cube[pieceThree][8] === dim-1) {
        moveString = "01U' 01F' 01U 01F 01U' 01F' 01U 01F";
      }
      else {
        moveString = "01B";
      }
    }

    let moveArray = this.moveStringToArray(moveString);

    if(moveString.length){
      this.setState({moveSet:moveArray});
    }
    else{
      //check for anomoly
      if(dim === 2) {
        if(cube[pieceOne][6]===0 && cube[pieceOne][8]===dim-1) {
          if(cube[pieceTwo][6]===dim-1 && cube[pieceTwo][8]===dim-1){
            if(cube[pieceThree][6]===0 && cube[pieceThree][8]===0){
              this.setState({moveLog : "",currentFunc: "None",moveSet:[],solveState:-1});
              if(this.state.solveMoves.length){
                let temp = this.state.solveMoves.split(" ");
                console.log("Number of moves: "+ temp.length);
                console.log("Moves set: " + this.state.solveMoves);
                this.setState({solveMoves : ""});
              }
            }
            else {
              moveString = "01R 01D' 01R' 01F' 01R' 01F 01D";
              moveArray = this.moveStringToArray(moveString);
              this.setState({moveSet:moveArray});
            }
          }
        }
        else {
          moveString = "01B";
          moveArray = this.moveStringToArray(moveString);
          this.setState({moveSet:moveArray});
        }
      }
      else {
        this.setState({moveLog : "",currentFunc: "None",moveSet:[],solveState:-1});
        if(this.state.solveMoves.length){
          let temp = this.state.solveMoves.split(" ");
          console.log("Number of moves: "+ temp.length);
          console.log("Moves set: " + this.state.solveMoves);
          this.setState({solveMoves : ""});
        }
      }
    }
  }

  // Changes the settings by passing setting to change and new val for the setting
  changeSettings (settingToChange,newVals) {
    switch(settingToChange){
      /*case 'anisotropy':
        this.setState({anisotropy : !this.state.anisotropy});
        break;*/
      default:
    }
  }
  
  // Remove event listener on compenent unmount	
  componentWillUnmount() {    
    window.removeEventListener("keydown", this.keyHandling);
  }

  // Gets the url to be parsed
  getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return parts;
  }

  // Initialization and animation functions
  componentDidMount() {
    
    // Start URL parsing
    let url = this.getUrlVars();

    // Cube Dimensions
    let cD;

    // localhost
    if(url.length < "https://rubiksprogram.herokuapp.com/id=".length)
      cD = parseInt(url.substring(25));

    // heroku
    else 
      cD = parseInt(url
                      .substring("https://rubiksprogram.herokuapp.com/id="
                      .length));

    // Limits size of cube
    if(cD <= 20 && cD >= 2);

    else cD = 3;
    // End URL Parsing

    // Adjust camera based on cube dimensions
    this.setState({cubeDimension : cD,
                   cameraZ : -(2+cD),
                   cameraX : (2+cD),
                   cameraY : -(2+cD)});
    
    // Generate and store the solved state of the memory cube
    let rubiksObject = this.generateSolved(cD,cD,cD);
    this.setState({rubiksObject : rubiksObject});

    function onMouseMove( event ) {
      // calculate mouse position in normalized device coordinates
      // (-1 to +1) for both components
      mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
      mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;   
    }

    let scope = this;
    function onMouseDown( event ) {
      scope.setState({mouseDown : true});  
    }

    function onMouseUp( event ) {
      scope.setState({mouseDown : false});  
    }

    // Bind event listeners to window
    window.addEventListener("keydown", this.keyHandling);
    window.addEventListener("mousemove", onMouseMove, false );
    window.addEventListener("mousedown", onMouseDown, false );
    window.addEventListener("mouseup", onMouseUp, false );
    
    // === THREE.JS CODE START ===
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, .1, 1000 );
    var renderer = new THREE.WebGLRenderer();
    
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();

    
    // Sets background color
    renderer.setClearColor(new THREE.Color("black"),1);

    // Sets renderer size
    renderer.setSize( window.innerWidth, window.innerHeight-10);

    // Adds rendered to document body
    document.body.appendChild( renderer.domElement );
    
    // On initialization holds the visual cubes
    let tempCubes = [];

    //Texture to pretty up the cube's faces
    const loader = new THREE.TextureLoader().load('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQW92XE-j1aJzRMI9kvvMZIf2VikZzzdEI87zl4rWgHMJBNJ9iw7A&s');
    loader.anisotropy = renderer.getMaxAnisotropy();

    // generate cubes with face colors based off memory cube
    for(let i = 0; i < rubiksObject.length; i++){

      // Store x,y,z of memory cube in easier to read variables
      let cubeX = rubiksObject[i][6];
      let cubeY = rubiksObject[i][7];
      let cubeZ = rubiksObject[i][8];

      // Create the cube object with dimensions of 1 for width,height, and depth
      var geometry = new THREE.BoxGeometry( 1, 1, 1 );

      // Map textures to each face to look nice and then color over
      var cubeMaterials = [
        new THREE.MeshBasicMaterial({ map: loader , color:rubiksObject[i][2], side: THREE.FrontSide}),
        new THREE.MeshBasicMaterial({ map: loader , color:rubiksObject[i][4], side: THREE.FrontSide}), 
        new THREE.MeshBasicMaterial({ map: loader , color:rubiksObject[i][3], side: THREE.FrontSide}),
        new THREE.MeshBasicMaterial({ map: loader}), 
        new THREE.MeshBasicMaterial({ map: loader , color:rubiksObject[i][1], side: THREE.FrontSide}), 
        new THREE.MeshBasicMaterial({ map: loader , color:rubiksObject[i][5], side: THREE.FrontSide}), 
      ];
    
      // Add the new cube to temp cubes
      tempCubes[i] = new THREE.Mesh(geometry, cubeMaterials);
      
      // position piece based off memory cube
      tempCubes[i].translateX(cubeX);
      tempCubes[i].translateY(cubeY);
      tempCubes[i].translateZ(cubeZ); 
    }

    // Translate cube so center of cube is 0,0,0
    scene.translateX(.5-cD/2);
    scene.translateY(.5-cD/2);
    scene.translateZ(.5-cD/2);

    // add cubes to state and then render
    this.setState({cubes : tempCubes}, () => {
      for(let i = 0; i < rubiksObject.length; i++){
        // Logic to render outer pieces since inside pieces aren't ever used
        if((this.state.cubes[i].position.x === 0 || this.state.cubes[i].position.x === this.state.cubeDimension-1) ||
            (this.state.cubes[i].position.y === 0 || this.state.cubes[i].position.y === this.state.cubeDimension-1)||
            (this.state.cubes[i].position.z === 0 || this.state.cubes[i].position.z === this.state.cubeDimension-1)){
          scene.add( this.state.cubes[i] );
        } 
      }
      
      // Resizes the canvas and adjust camera on window resize
      var tanFOV = Math.tan( ( ( Math.PI / 180 ) * camera.fov / 2 ) );
      var windowHeight = window.innerHeight;
      window.addEventListener( 'resize', onWindowResize, false );

      function onWindowResize( event ) {

          camera.aspect = window.innerWidth / window.innerHeight;
          
          // adjust the FOV
          camera.fov = ( 360 / Math.PI ) * Math.atan( tanFOV * ( window.innerHeight / windowHeight ) );
          
          camera.updateProjectionMatrix();
          camera.lookAt( scene.position );

          renderer.setSize( window.innerWidth, window.innerHeight-10 );
          renderer.render( scene, camera );
          
      }
      // End resize

      // Render the scene and begin animate loop
      renderer.render( scene, camera );
      animate();
    });

    let rotate = this.rotatePoint;
    let stats0 = new Stats();
    stats0.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild( stats0.dom);

    // Function runs continuously to animate cube
    var animate = () => {
      stats0.begin();

      // Mouse stuff here
      if(this.state.currentFunc === "None") {
        let previousPiece = this.state.previousPiece;
        // Projects mouse onto scene to find intersected objects
        raycaster.setFromCamera( mouse, camera );

        // calculate objects intersecting the picking ray
        var intersects = raycaster.intersectObjects( scene.children );
        if (intersects[0] && intersects[0].object.material.length && !this.state.mouseDown){
          
          
          
          // Get faces to line up properly
          let faceInteresected = intersects[0].faceIndex;
          let tempIndex = -1;
          
          // Assign the intersected face index to be recolored on hover
          for(let i = 0; i < 6; i++){
            if(faceInteresected===i*2 || faceInteresected=== i*2+1) {
              tempIndex = i;
              this.setState({mouseFace : i});
            }
          }

          // Recolors last hovered piece
          if(parseFloat(intersects[0].object.material[tempIndex].color.r) !== 0.6784313725490196 &&
             parseFloat(intersects[0].object.material[tempIndex].color.g) !== 0.8470588235294118 &&
             parseFloat(intersects[0].object.material[tempIndex].color.b) !== 0.9019607843137255){
            if(previousPiece!==null) {
              this.reloadCubes(previousPiece);
              this.setState({previousPiece:null});
            }
          }
          
          // Recolor face that mouse is over
          if(intersects[0].object.material[tempIndex] && tempIndex > -1)
            if(intersects[0].object.material[tempIndex].color){
              // store the hovered face for use later
              this.setState({facePosX : intersects[0].object.position.x,
                            facePosY : intersects[0].object.position.y,
                            facePosZ : intersects[0].object.position.z });
              intersects[0].object.material[tempIndex].color.set("lightblue");
              // store the hovered coordinates so that if a different
              // piece is hovered, the previous gets colored back.
              this.setState({previousPiece : intersects[0].object.position});
            }
        }

        // 1. Work on what values get stored for mouse and the object hovered 
        // 2. Will be important for determing turn directions based on drag
        // 3. Once available turn directions have been determined, calculate change
        //    in mouse movement to determine which face gets turned and direction
        else if(this.state.mouseDown){
          if(this.state.mouseFace === null){
            // dragging mouse on canvas should rotate cube
          } 

          else{
            // ** account for mouse not being over the cube after selected piece **
            //
            // Code here to figure out which faces can be turned from selected face
            // Also code here to figure which direction to turn face based on mouse movement
          }
        }

        // 
        else if(this.state.mouseFace !== null){
          if(previousPiece!==null) {
            this.reloadCubes(previousPiece);
            this.setState({previousPiece:null});
          }
          if(this.state.mouseFace!==null) this.setState({mouseFace : null});
        }
      }
      
      camera.position.z = this.state.cameraZ * Math.sin( this.state.angle );
      camera.position.y = this.state.cameraY;
      camera.position.x = this.state.cameraX * Math.cos( this.state.angle );
      camera.lookAt(new THREE.Vector3( 0, 0, 0 ));
      requestAnimationFrame( animate );
      
      if(this.state.start<=this.state.end){
        this.rotatePieces(rotate,tempCubes);
      }
      else {
        if(this.state.reload) this.reloadCubes(this.state.face);
        if(this.state.currentFunc !== "None"){

          // Doesn't work with !==
          if(this.state.currentFunc === "Undo" ||
             this.state.currentFunc === "Redo"){}

          // Keeps undo/redo updated with other moves
          else {
            let moveLog = this.state.moveLog;
            let index = this.state.undoIndex;

            if(index > 0){
              let moveArray = this.moveStringToArray(moveLog);

              if(this.state.currentFunc.length < 3){
                let tempVal = moveArray[moveArray.length-1];
                for(let i = 0; i <= index; i++){
                  moveArray.pop();
                }
                moveArray.push(tempVal);
              }

              else{
                for(let i = 0; i < index; i++){
                  moveArray.pop();
                }
              }

              moveLog = moveArray.join(" ");
              this.setState({undoIndex:0,moveLog});
            };
          }

          // Moves based on active function
          if (this.state.currentFunc==="Scrambling")
            this.state.moves < 25 ?
              this.timingScramble() :
              this.setState({currentFunc : "None",moves : 0});

          else if (this.state.currentFunc==="Solving"){
            if(!this.state.moveSet.length) {
              if(this.state.solveState === 0) this.solveMiddles();
              if(this.state.solveState === 1) this.solveWhiteCross();
              if(this.state.solveState === 2) this.solveWhiteCorners();
              if(this.state.solveState === 3) this.solveMiddleEdges();
              if(this.state.solveState === 4) this.solveYellowCross();
              if(this.state.solveState === 5) this.alignYellowCross();
              if(this.state.solveState === 6) this.alignYellowCorners();
              if(this.state.solveState === 7) this.solveYellowCorners();
            }
            else this.moveSetTimed(this.state.moveSet,0,0,0);
          }
          
          else 
            this.state.moveSet.length ?
              this.moveSetTimed(this.state.moveSet,0,0,0) :
              this.setState({currentFunc:"None"}); 
        }
      }
      
      stats0.end();
      renderer.render( scene, camera );     
    };
  }

  // Renders html to the index.html page
  render() {
    let solveBtn = (this.state.cubeDimension < 21) ? <button onClick={this.beginSolve} style={{position:"fixed", bottom: "90px", right: "10px",backgroundColor: "black", border: "none",color:"lightgray"}}>SOLVE</button> : "";
    return (
      <div className="App" >
        
        <Navbar
        title="Rubik's Cube"
        changeSettings={this.changeSettings.bind(this)}
        state={this.state}
        />

        <p style={{position:"fixed", top: "75px", left: "10px",color: "white"}}>Speed: {this.state.currentSpeed}</p>
        <p style={{position:"fixed", top: "75px", right: "10px",color: "white"}}>Current Function: {this.state.currentFunc}</p>
        <div style={{position:"fixed", top: "75px", left: "50%", marginLeft: "-45px",color: "white"}}>
          <button className="redoUndo" onClick={() => this.undo()}>Undo</button>
          <button className="redoUndo" onClick={() => this.redo()}>Redo</button>
        </div>

        {/* Top Left */}
        <button onClick={() => this.changeSpeed(90,20,"Zoomin")} style={{position:"fixed", top: "100px", left: "10px",backgroundColor: "black",width: "90px",color:"white"}}>ZOOMIN</button>
        <button onClick={() => this.changeSpeed(30,100,"Fastest")} style={{position:"fixed", top: "130px", left: "10px",backgroundColor: "red",width: "90px",color:"white"}}>FASTEST</button>
        <button onClick={() => this.changeSpeed(15,175,"Faster")} style={{position:"fixed", top: "160px", left: "10px",backgroundColor: "orange",width: "90px"}}>FASTER</button>
        <button onClick={() => this.changeSpeed(10,250,"Fast")} style={{position:"fixed", top: "190px", left: "10px",backgroundColor: "yellow",width: "90px"}}>FAST</button>
        <button onClick={() => this.changeSpeed(7.5,350,"Medium")} style={{position:"fixed", top: "220px", left: "10px",backgroundColor: "green",width: "90px",color:"white"}}>MEDIUM</button>
        <button onClick={() => this.changeSpeed(5,500,"Slow")} style={{position:"fixed", top: "250px", left: "10px",backgroundColor: "lightblue",width: "90px"}}>SLOW</button>
        <button onClick={() => this.changeSpeed(3,750,"Slower")} style={{position:"fixed", top: "280px", left: "10px",backgroundColor: "blue",width: "90px",color:"white"}}>SLOWER</button>
        <button onClick={() => this.changeSpeed(1.5,1050,"Slowest")} style={{position:"fixed", top: "310px", left: "10px",backgroundColor: "navy",width: "90px",color:"white"}}>SLOWEST</button>
        
        {/* Bottom Left */}
        
        <button onClick={this.cross} style={{position:"fixed", bottom: "150px", left: "10px",backgroundColor: "Transparent", border: "none",color:"lightgray"}}>CROSS</button>
        <button onClick={this.checkerBoard} style={{position:"fixed", bottom: "120px", left: "10px",backgroundColor: "Transparent", border: "none",color:"lightgray"}}>CHECKERBOARD</button>
        <button onClick={this.checkerBoard1} style={{position:"fixed", bottom: "90px", left: "10px",backgroundColor: "Transparent", border: "none",color:"lightgray"}}>CHECKERBOARD1</button>
        <button onClick={this.cubeIn} style={{position:"fixed", bottom: "60px", left: "10px",backgroundColor: "Transparent", border: "none",color:"lightgray"}}>CUBE X2</button>
        <button onClick={this.cubeInACube} style={{position:"fixed", bottom: "30px", left: "10px",backgroundColor: "Transparent", border: "none",color:"lightgray"}}>CUBE X3</button>
        <button onClick={this.sixSpots} style={{position:"fixed", bottom: "0px", left: "10px",backgroundColor: "Transparent", border: "none",color:"lightgray"}}>SIX SPOTS</button>
        
        {/* Top Right */}
        <button className="moveBtn" onClick={() => this.rotateOneFace("F'",[0,0,1])} style={{position:"fixed", top: "100px", right: "50px",backgroundColor: "white",width:"30px"}}>F'</button>
        <button className="moveBtn" onClick={() => this.rotateOneFace("F",[0,-1,1])} style={{position:"fixed", top: "100px", right: "10px",backgroundColor: "white",width:"30px"}}>F</button>
        <button className="moveBtn" onClick={() => this.rotateOneFace("U'",[1,0,1])} style={{position:"fixed", top: "140px", right: "50px",backgroundColor: "blue",color: "white",width:"30px"}}>U'</button>
        <button className="moveBtn" onClick={() => this.rotateOneFace("U",[1,-1,1])} style={{position:"fixed", top: "140px", right: "10px",backgroundColor: "blue",color: "white",width:"30px"}}>U</button>
        <button className="moveBtn" onClick={() => this.rotateOneFace("R'",[2,0,1])} style={{position:"fixed", top: "180px", right: "50px",backgroundColor: "red",color: "white",width:"30px"}}>R'</button>
        <button className="moveBtn" onClick={() => this.rotateOneFace("R",[2,-1,1])} style={{position:"fixed", top: "180px", right: "10px",backgroundColor: "red",color: "white",width:"30px"}}>R</button>
        <button className="moveBtn" onClick={() => this.rotateOneFace("B'",[3,0,1])} style={{position:"fixed", top: "220px", right: "50px",backgroundColor: "yellow",width:"30px"}}>B'</button>
        <button className="moveBtn" onClick={() => this.rotateOneFace("B",[3,-1,1])} style={{position:"fixed", top: "220px", right: "10px",backgroundColor: "yellow",width:"30px"}}>B</button>
        <button className="moveBtn" onClick={() => this.rotateOneFace("L'",[4,0,1])} style={{position:"fixed", top: "260px", right: "50px",backgroundColor: "orange",width:"30px"}}>L'</button> 
        <button className="moveBtn" onClick={() => this.rotateOneFace("L",[4,-1,1])} style={{position:"fixed", top: "260px", right: "10px",backgroundColor: "orange",width:"30px"}}>L</button>
        <button className="moveBtn" onClick={() => this.rotateOneFace("D'",[5,0,1])} style={{position:"fixed", top: "300px", right: "50px",backgroundColor: "green",color: "white",width:"30px"}}>D'</button> 
        <button className="moveBtn" onClick={() => this.rotateOneFace("D",[5,-1,1])} style={{position:"fixed", top: "300px", right: "10px",backgroundColor: "green",color: "white",width:"30px"}}>D</button>

        {/* Bottom Right */} 
        {solveBtn}
        <button onClick={this.scramble} style={{position:"fixed", bottom: "60px", right: "10px",backgroundColor: "Transparent", border: "none",color:"lightgray"}}>SCRAMBLE</button>
        <button onClick={this.reverseMoves} style={{position:"fixed", bottom: "30px", right: "10px",backgroundColor: "Transparent", border: "none",color:"lightgray"}}>REVERSE MOVES</button>
        <button onClick={this.reset} style={{position:"fixed", bottom: "0px", right: "10px",backgroundColor: "Transparent", border: "none",color:"lightgray"}}>RESET</button>
      </div>
    );
  }
}

export default App;