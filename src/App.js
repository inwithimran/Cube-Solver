import React, { Component } from 'react';
import Navbar from "./components/Navbar/Navbar";
import Patterns from "./components/Patterns"
import Speeds from "./components/Speeds"
import Controls from "./components/Controls"
import MoveInput from "./components/MoveInput"
import * as THREE from "three";
import Stats from "stats.js";
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import cube from './cubeFunctions/cube';
import solver from './solvers/solver';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

// TODO:
/*
 * 1. Start moving functions to other files STARTED
 * 
 * 2. All pattern functions can be condensed into one since only
 *    the move patterns are different for each. FINISHED
 * 
 * 3. Add changes to rotateFace and rotatePiece. Code can be greatly condensed
 *    by using a function with paramters to minimize repetative code. ATTEMPTED
 * 
 * 4. Continue working on solvers. STARTED
 * 
 * 5. Known issue with undo/redo. Occassionally last move fails. FIXED
 * 
 * 6. Consolidate setStates, seems fairly expensive to use many STARTED
 * 
 * 7. Fix Camera rotations. FIXED for now
 * 
 * 8. Highlight turns when hovering over move buttons. FINISHED
 * 
 * 9. Implement rotating pieces by dragging. NOT STARTED
 * 
 * 10. The program needs a good readme. NOT STARTED
 */


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
    cubeDimension : null, // Cube dimensions. Ex: 3 => 3x3x3 cube
    cubeDepth : 1,        // Used to determine rotation depth on cubes greater than 3
    currentSpeed:"Medium",// Displays which speed is selected
    moves : 0,            // Used by scramble functions
    reload : false,       // Lets animate know when to reload the cube (after every move)
    solveState : -1,      // Dictates progression of solve function
    solveMoves : "",      // Keeps track of moves used during solve
    facePosX : null,
    facePosY : null,
    facePosZ : null,
    mouseFace : null,
    mouseDown : false,
    mousePos : null,
    undoIndex : 0,        // Index to keep track of where undo/redo is
    blockMoveLog : false, // Blocks adding move when undoing/redoing a move
    previousPiece : null, // Keeps track of hovered face to not redraw
    rubiksIndex : 0,      // Index to keep track of middles while solving
    middles : [],         // Contains all middle segments         
    showStats: false,     // Setting for stats
    showMoveInput: true,  // Setting for custom move input
    showControls: true,   // Setting for move controls
    showHints: true,
    showGuideArrows: true,
    activeDragsInput: 0,  // Keeps track of draggable input
    deltaPositionInput: {
      x: 100, y: 100
    },
    controlledPositionInput: {
      x: 0, y: 0
    },
    activeDragsControls: 0,// Keeps track of draggable buttons
    deltaPositionControls: {
      x: 100, y: 100
    },
    controlledPositionControls: {
      x: 0, y: 0
    },
    isMulti: false,
    isVisible: false,
    hoverData : []
  };

  // rotate colors on face (memory cube)
  // implement isMulti (should be in place everywhere)
  rotateFace = (cubeFace,direction,cubeDepth,isMulti) => {
    let centerPoint = this.state.cubeDimension/2-.5;
    let rubiksObject = this.state.rubiksObject;
    let degrees = 90;
    // const mapped = [
    //   {side: 7, side1 : 6, side2 : 8, swap : [1,2,5,4]},
    //   {side: 8, side1 : 6, side2 : 7, swap : [3,2,0,4]},
    //   {side: 6, side1 : 7, side2 : 8, swap : [3,5,0,1]},
    //   {side: 7, side1 : 6, side2 : 8, swap : [1,4,5,2]},
    //   {side: 6, side1 : 7, side2 : 8, swap : [3,1,0,5]},
    //   {side: 8, side1 : 6, side2 : 7, swap : [3,4,0,2]}
    // ];

    if(direction < 0)  degrees *=-1;

    // Side 0 (white center piece)
    if (cubeFace === 0){ 
        for(let i = 0; i < rubiksObject.length; i++){

            // white side is y===0. add multi at all these
            if ((isMulti || rubiksObject[i][7] > cubeDepth-2) &&
                rubiksObject[i][7] < cubeDepth){

                // Rotate rubiksObject pieces to new location generated by rotatePoint2
                let newPoint = cube.rotatePoint2(centerPoint,
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
            if ((isMulti || rubiksObject[i][8] < this.state.cubeDimension+1-cubeDepth) &&
                rubiksObject[i][8]>this.state.cubeDimension-1-cubeDepth){
                let newPoint = cube.rotatePoint2(centerPoint,
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
            if ((isMulti || rubiksObject[i][6] < this.state.cubeDimension+1-cubeDepth) &&
                rubiksObject[i][6]>this.state.cubeDimension-1-cubeDepth){
                let newPoint = cube.rotatePoint2(centerPoint,
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
            if ((isMulti || rubiksObject[i][7] < this.state.cubeDimension+1-cubeDepth) && rubiksObject[i][7]>this.state.cubeDimension-1-cubeDepth){
                let newPoint = cube.rotatePoint2(centerPoint,centerPoint,degrees,rubiksObject[i][6],rubiksObject[i][8]);
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
            if ((isMulti || rubiksObject[i][6] > cubeDepth-2) && rubiksObject[i][6] < cubeDepth){
                let newPoint = cube.rotatePoint2(centerPoint,centerPoint,degrees,rubiksObject[i][7],rubiksObject[i][8]);
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
            if ((isMulti || rubiksObject[i][8] > cubeDepth-2) && rubiksObject[i][8] < cubeDepth){
                let newPoint = cube.rotatePoint2(centerPoint,centerPoint,degrees,rubiksObject[i][6],rubiksObject[i][7]);
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

  // rotate pieces attached to face (visual cube)
  /**
   * 
   * Possible Optimization!
   * 
   * Instead of turning each piece individually,
   * group the pieces to be turned and then turn the group.
   * - Pros
   *    - Less Code
   *    - Easier on the renderer
   * 
   * - Cons
   *    - Not sure where to attempt implementation
   * 
   * Development Stage: Trial
   * 
   * - Resources
   *    - https://jsfiddle.net/of1vfhzz/1/
   *    - https://stackoverflow.com/questions/37779104/how-can-i-rotate-around-the-center-of-a-group-in-three-js
   */
  rotatePieces = (rotate,tempCubes) => {
    this.setState({reload : true});

    // Trial variable
    // let tempGroup = new THREE.Group();

    // state variables asigned for shorter names
    let centerPoint = this.state.cubeDimension/2-.5;
    let cubes = this.state.cubes;
    let turnDirection = this.state.turnDirection;
    let speed = this.state.speed;
    let start = this.state.start;
    let face = this.state.face;
    let cubeDepth = this.state.cubeDepth;
    let isMulti = this.state.isMulti;

    this.setState({start : start+speed});

    //Rotate white center piece Face
    if(face === 0){
      for(let i = 0; i<this.state.rubiksObject.length;i++){

        //implement isMulti for all of these comparisons
        if((isMulti || cubes[i].position.y > cubeDepth-2) && cubes[i].position.y < cubeDepth){
          
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
        if((isMulti || cubes[i].position.z < this.state.cubeDimension + 1 - cubeDepth) && cubes[i].position.z > this.state.cubeDimension - 1 - cubeDepth){
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
        if((isMulti || tempCubes[i].position.x < this.state.cubeDimension + 1 - cubeDepth) && cubes[i].position.x > this.state.cubeDimension - 1 - cubeDepth){
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
        if((isMulti || tempCubes[i].position.y < this.state.cubeDimension + 1 - cubeDepth) && cubes[i].position.y > this.state.cubeDimension - 1 - cubeDepth){
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
        if((isMulti || tempCubes[i].position.x > cubeDepth-2) && cubes[i].position.x < cubeDepth){
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
        if((isMulti || tempCubes[i].position.z > cubeDepth-2) && cubes[i].position.z < cubeDepth){
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

  // Bind keys to functions
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

  // Handles key press event
  keyHandling = e => {
    if(e.keyCode <= 36 || e.keyCode >= 41) this.keyBinds(e.key);
  }

  onMouseDown( event ) {
    this.setState({mouseDown : true});  
  }

  onMouseUp( event ) {
    this.setState({mouseDown : false});  
  }

  onSliderChange = (value) => {
    switch(value){
      case 0:
        this.changeSpeed(1.5,1050,"Slowest");
        break;
      case 10:
        this.changeSpeed(3,750,"Slower")
        break;
      case 20:
        this.changeSpeed(5,500,"Slow")
        break;
      case 30:
        this.changeSpeed(7.5,350,"Medium")
        break;
      case 40:
        this.changeSpeed(10,250,"Fast")
        break;
      case 50:
        this.changeSpeed(15,175,"Faster")
        break;
      case 60:
        this.changeSpeed(30,100,"Fastest")
        break;
      case 70:
        this.changeSpeed(90,20,"Zoomin")
        break;
      default:
        console.log("unexpected behavior");
    }
  }

  // Functions to change speed
  changeSpeed = (_speed,_rotationSpeed,_name) => {
    if(this.state.currentFunc !== "None") return;
    this.setState({currentSpeed: _name,speed: _speed, start: _speed, end: 0, rotationSpeed: _rotationSpeed});
  }

  // Allows the user to undo a move
  undo = () => {
    let undoIndex = this.state.undoIndex;
    let moveString = this.state.moveLog;
    const moveArray = this.moveStringToArray(moveString);
    if(moveString === "") return;

    else if(this.state.currentFunc !== "None") return;

    else if(moveArray.length-1-undoIndex >= 0)
      this.setState({blockMoveLog : true,
                     currentFunc : "Undo",
                     moveSet : [moveArray[moveArray.length-1-undoIndex]],
                     undoIndex : undoIndex + 1});
  }

  // Allows the user to redo a move
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

    if(undoIndex > 0)
      this.setState({blockMoveLog : true,
                     currentFunc : "Redo",
                     moveSet : [backwardsMove],
                     undoIndex : undoIndex - 1});
  }

  // Control when single buttons can be clicked
  rotateOneFace = (e,vals) => {
    if (vals.length < 4) vals.push(false);
    if(this.state.currentFunc === "None") {
      this.setState({currentFunc: e});
      this.rotateCubeFace(vals[0],vals[1],vals[2],vals[3]);
    }
  }

  // Controls camera movements
  // *** Needs to be reworked ***
  rotateCamera = (key) => {
    let y = this.state.cameraY;
    //let x = this.state.cameraX;
    //let z = this.state.cameraZ;
    //let formula = this.state.cubeDimension+2+(y+1)/20;
    if(key === 37){ // left
      this.setState({angle: this.state.angle+.075}); 
    }
    if(key === 38){ // up
      if(y < this.state.cubeDimension+2) this.setState({cameraY: y + .5});
    }
    if(key === 39){ // right
      this.setState({angle: this.state.angle-.075});
    }
    if(key === 40){ // down
      
      if(y > -(this.state.cubeDimension+2)) this.setState({cameraY: y - .5});
    }
  }

  // Changes values in state to trigger face rotation
  rotateCubeFace = (face,direction,cubeDepth,isMulti) => {
    if(!this.state.blockMoveLog){
      
      let tempMove = "";
      cubeDepth<10 ? tempMove+="0"+cubeDepth : tempMove += cubeDepth;
      if(face === 0) !isMulti ? tempMove += "F" : tempMove += "f";
      else if(face === 1) !isMulti ? tempMove += "U" : tempMove += "u";
      else if(face === 2) !isMulti ? tempMove += "R" : tempMove += "r";
      else if(face === 3) !isMulti ? tempMove += "B" : tempMove += "b";
      else if(face === 4) !isMulti ? tempMove += "L" : tempMove += "l";
      else if(face === 5) !isMulti ? tempMove += "D" : tempMove += "d";
      if(direction === -1) tempMove += "'";

      this.state.moveLog.length > 0 ?
        this.setState({moveLog : this.state.moveLog + " " + tempMove}) :
        this.setState({moveLog : this.state.moveLog + tempMove});
      
      // Keeps tracks of solver's moves
      if(this.state.solveState > -1) 
        this.setState({solveMoves : this.state.solveMoves.length ? this.state.solveMoves + " " + tempMove : this.state.solveMoves + tempMove});
    }

    // Faces on opposite side of cube rotate backwards
    if(face>2 && direction === -1) direction = 0;

    else if (face>2 && direction === 0) direction = -1;

    // change state so animate function kicks in
    this.setState({blockMoveLog:false,
                   face : face,
                   turnDirection : direction,
                   end : this.state.end + 90,
                   cubeDepth : cubeDepth,
                   isMulti: isMulti},
                   () =>{
      this.rotateFace(face,direction,cubeDepth,isMulti);
    });
  }

  // Takes prebuilt algorithms and converts to moves
  // allow for C,c
  algorithm = (moveString,moveName) => {
    if(this.state.currentFunc !== "None") return;
    const moveArray = this.moveStringToArray(moveString);
    //console.log(moveArray);
    this.setState({currentFunc : moveName, moveSet : moveArray});
  }

  // Refreshes page to reset cube
  reset = () => {
    let cD = this.state.cubeDimension;
    let generated = cube.generateSolved(cD,cD,cD);
    let rubiksObject = generated.tempArr;
    this.setState({rubiksObject,moveSet: []},()=>{
      this.reloadTurnedPieces('all');
    });
    //window.location.reload();
  }

  // Generates a random move
  scramble = () => {

    this.setState({moves:this.state.moves+1});

    let maxDepth = Math.ceil((this.state.cubeDimension/2));
    let randFace = Math.floor((Math.random() * 6));
    let randTurn = Math.floor((Math.random() * 2)-1);
    let randIsMulti = Math.floor((Math.random() * 2));
    let randDepth = 1;

    if(this.state.cubeDimension>2) 
      randDepth = Math.floor((Math.random() * maxDepth)) + 1;

    if(randDepth === Math.ceil(this.state.cubeDimension/2) && this.state.cubeDimension%2)
      randIsMulti=0;

    this.rotateCubeFace(randFace, randTurn,randDepth,randIsMulti);
  }

  // Changes state active function to begin scrambling
  beginScramble = () => {
    if(this.state.currentFunc === "None") this.setState({currentFunc : "Scrambling"});
  }

  // Starts the solve process
  beginSolve = () => {
    if(this.state.currentFunc !== "None") return;
    this.setState({currentFunc : "Solving",solveState : 0});
  }

  stopSolve = () => {
    this.setState({currentFunc : "None",solveState : -1,moveSet:[]});
  }

  handleDragInput = (e, ui) => {
    const {x, y} = this.state.deltaPositionInput;
    this.setState({
      deltaPositionInput: {
        x: x + ui.deltaX,
        y: y + ui.deltaY,
      }
    });
  };

  onStartInput = () => {
    this.setState({activeDragsInput: this.state.activeDragsInput+1});
  };

  onStopInput = () => {
    this.setState({activeDragsInput: this.state.activeDragsInput-1});
  };

  handleDragControls = (e, ui) => {
    const {x, y} = this.state.deltaPositionControls;
    this.setState({
      deltaPositionControls: {
        x: x + ui.deltaX,
        y: y + ui.deltaY,
      }
    });
  };

  onStartControls = () => {
    this.setState({activeDragsControls: this.state.activeDragsControls+1});
  };

  onStopControls = () => {
    this.setState({activeDragsControls: this.state.activeDragsControls-1});
  };

  mouseOver = (name,data) => {
    if(this.state.showHints)
      this.setState({
        isVisible: true,
        hoverData: data
      });
  }

  mouseLeave = () => {
    this.setState({
      isVisible: false,
      hoverData: []
    });
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

  // Generalized move function. Takes in array of moves and parse the moves
  parseMoveArray = (moveArray) =>{
    //if(typeof moveArray === 'string') moveArray = [moveArray];
    let shifted = moveArray.shift();

    let tempFace = 0;
    let tempDirection = -1;
    let tempDepth = 1;
    let tempIsMulti = false;

    if(shifted.length === 4) tempDirection=0;
    tempDepth = parseInt(shifted.slice(0,2));

    if(shifted.slice(2,3) === shifted.slice(2,3).toLowerCase()){
      tempIsMulti = true;
    }

    if(shifted.slice(2,3).toUpperCase() === "U") tempFace = 1;
    else if(shifted.slice(2,3).toUpperCase() === "F") tempFace = 0;
    else if(shifted.slice(2,3).toUpperCase() === "B") tempFace = 3;
    else if(shifted.slice(2,3).toUpperCase() === "R") tempFace = 2;
    else if(shifted.slice(2,3).toUpperCase() === "L") tempFace = 4;
    else if(shifted.slice(2,3).toUpperCase() === "D") tempFace = 5;

    this.rotateCubeFace(tempFace,tempDirection,tempDepth,tempIsMulti);

  }

  /* Each piece that's rotated has it's rotation disrupted on other planes.
   *
   * This function solves that issue by setting all piece rotation back to zero
   * and then placing colors to look as though the piece were still rotated.
   * 
   * Some optimizations have been added. Undersides and sides of some pieces
   * appear white instead of black but does not disrupt the rest of the cube.
   * Likely won't be changed since that optimization greatly improves run time.
   */
  reloadTurnedPieces = (pos) => {
    let cubes = [...this.state.cubes];
    
    for(let i = 0; i<this.state.rubiksObject.length;i++){

      let tempCube = {...cubes[i]};
      let rotation = tempCube.rotation;

      if((rotation.x !== 0 || rotation.y !== 0 ||rotation.z !== 0) || 
           (pos === tempCube.position || pos==='all')){

        if(pos==='all') {
          tempCube.position.x=this.state.rubiksObject[i][9];
          tempCube.position.y=this.state.rubiksObject[i][10];
          tempCube.position.z=this.state.rubiksObject[i][11];
        }
        tempCube.material[0].color = new THREE.Color(this.state.rubiksObject[i][2]);
        tempCube.material[1].color = new THREE.Color(this.state.rubiksObject[i][4]);
        tempCube.material[2].color = new THREE.Color(this.state.rubiksObject[i][3]);
        tempCube.material[3].color = new THREE.Color(this.state.rubiksObject[i][0]);
        tempCube.material[4].color = new THREE.Color(this.state.rubiksObject[i][1]);
        tempCube.material[5].color = new THREE.Color(this.state.rubiksObject[i][5]);
        
        tempCube.rotation.x = 0; tempCube.rotation.y = 0; tempCube.rotation.z = 0;
        cubes[i] = tempCube;
        
      }
    }

    this.setState({cubes,reload : false});
  }

  // function to solves edges on cubes greater than 3x3x3
  // move to other file
  solveMultipleEdges = () =>{
    // code here
  }

  // Changes the settings by passing setting to change and new val for the setting
  changeSettings (settingToChange,newVals) {
    switch(settingToChange){
      case 'displayStats':
        this.state.showStats ? document.body.children[9].style.display = "none" : document.body.children[9].style.display = "";
        this.setState({showStats : !this.state.showStats});
        break;
      case 'displayMoveInput':
        this.setState({showMoveInput:!this.state.showMoveInput});
        break;
      case 'displayControls':
        this.setState({showControls:!this.state.showControls});
        break;
      case 'displayHints':
        this.setState({showHints:!this.state.showHints});
        break;
      default:
        console.log("Invalid Setting");
    }
  }
  
  // Remove event listener on compenent unmount	
  componentWillUnmount() {    
    window.removeEventListener("keydown", this.keyHandling);
  }

  // Gets the url to be parsed
  getSizeFromUrl() {
    let limit = 50;
    let cD;
    let vars = {};
    let parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    //return parts;
    if(parts.length < "https://rubiksprogram.herokuapp.com/id=".length)
      cD = parseInt(parts.substring(25));
    else 
      cD = parseInt(
        parts
          .substring("https://rubiksprogram.herokuapp.com/id=".length));
    if(cD <= limit && cD >= 2);

    else cD = 3;

    return cD;
  }

  calculateTurnAtFace(coord1,coord2,piece1,piece2,dir1,dir2,cD){
    if(Math.abs(coord1)>=Math.abs(coord2)&&(Math.abs(coord1)>.1)) 
      return {calculated : coord1<0?dir1:(dir1+"'"),depth : (cD-piece2)}
      
    if(Math.abs(coord2)>Math.abs(coord1)&&(Math.abs(coord2)>.1)) {
      return {calculated : coord2<0?dir2:(dir2+"'"),depth : (cD-piece1)}
    }
    return null;
  }
  // needs more params
  calculateTurn(current,previous,piece,pieceFace,cD){
    // console.log("Current x,y,z: ",current.x,current.y,current.z);
    // console.log("Previous x,y,z: ",previous.x,previous.y,previous.z);
    // console.log("Piece x,y,z: ",piece.x,piece.y,piece.z);
    // console.log("Face: ",pieceFace);

    const dif = { 
      x: (previous.x-current.x), 
      y: (previous.y-current.y), 
      z: (previous.z-current.z)
    }
    let calculated = null;
    let depth = null;
    let turn = null;

    //console.log("difference: ", dif)

    if(current.x===previous.x && current.y === previous.y && current.z===previous.z){
      //console.log("Nothing to be done. Mouse hasn't moved");
      return null;
    }

    //determines the move based on mouse difference from click to new position
    switch(pieceFace){
      case 0:
        turn = this.calculateTurnAtFace(dif.z,dif.x,piece.z,piece.x,"R","U",cD);
        calculated = turn.calculated;
        depth = turn.depth;
        // if(Math.abs(dif.z)>=Math.abs(dif.x)&&(Math.abs(dif.z)>.1)) {
        //   calculated = dif.z<0?"R":"R'";
        //   depth=cD-piece.x;
        // }
        // if(Math.abs(dif.x)>Math.abs(dif.z)&&(Math.abs(dif.x)>.1)) {
        //   calculated = dif.x<0?"U'":"U";
        //   depth=cD-piece.z;
        // }
        break;
      case 1:
        //turn = this.calculateTurnAtFace(dif.x,dif.y,piece.z,piece.y,"F","R",cD);
        if(Math.abs(dif.x)>=Math.abs(dif.y)&&Math.abs(dif.x)>.1) {
          calculated = dif.x>0?"F'":"F";
          depth=piece.y+1;
        }
        if(Math.abs(dif.y)>Math.abs(dif.x)&&Math.abs(dif.y)>.1) {
          calculated = dif.y<0?"R":"R'";
          depth=cD-piece.x;
        }
        break;
      case 2:
        //turn = this.calculateTurnAtFace(dif.z,dif.y,piece.z,piece.y,"F","U",cD);
        if(Math.abs(dif.z)>=Math.abs(dif.y)&&Math.abs(dif.z)>.1) {
          calculated = dif.z>0?"F":"F'";
          depth=piece.y+1;
        }
        if(Math.abs(dif.y)>Math.abs(dif.z)&&Math.abs(dif.y)>.1) {
          calculated = dif.y>0?"U":"U'";
          depth=cD-piece.z;
        }
        break;
      case 3:
        if(Math.abs(dif.z)>=Math.abs(dif.x)&&Math.abs(dif.z)>.1) {
          calculated = dif.z>0?"R":"R'";
          depth=cD-piece.x;
        }
        if(Math.abs(dif.x)>Math.abs(dif.z)&&Math.abs(dif.x)>.1) {
          calculated = dif.x>0?"U'":"U";
          depth=cD-piece.z;
        }
        break;
      case 4:
        if(Math.abs(dif.z)>=Math.abs(dif.y)&&Math.abs(dif.z)>.1) {
          calculated = dif.z<0?"F":"F'";
          depth=piece.y+1;
        }
        if(Math.abs(dif.y)>Math.abs(dif.z)&&Math.abs(dif.y)>.1) {
          calculated = dif.y<0?"U":"U'";
          depth=cD-piece.z;
        }
        break;
      case 5:
        if(Math.abs(dif.x)>=Math.abs(dif.y)&&Math.abs(dif.x)>.1) {
          calculated = dif.x<0?"F'":"F";
          depth=piece.y+1;
        }
        if(Math.abs(dif.y)>Math.abs(dif.x)&&Math.abs(dif.y)>.1) {
          calculated = dif.y>0?"R":"R'";
          depth=cD-piece.x;
        }
        break;
      default:
    }

    //console.log("{ turn: " + calculated + " } , { depth: " + depth + " }");
    return ((depth<10? "0" : "") + depth+calculated);
  }

  // Proto function for feature to be built later
  calculateTheta(){

  }

  // Initialization and animation functions
  componentDidMount() {

    let cD = this.getSizeFromUrl();
    let generated = cube.generateSolved(cD,cD,cD);
    let rubiksObject = generated.tempArr;
    let tempCubes = [];
    let stats = new Stats();
    const groups = [
      [],[],[],[],[],[]
    ];
    let previousMousePos = null;
    let piecePos = null;
    let intersected = null;

    // === THREE.JS VARIABLES ===
    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, .1, 1000 );
    let renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    let raycaster = new THREE.Raycaster();
    let mouse = new THREE.Vector2();
    let cubeGeometry = new THREE.BoxGeometry( 1, 1, 1 );
    var geometry = new THREE.PlaneGeometry(1,1);
    //const loader = new THREE.TextureLoader().load('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSp2vqlj5dzmGwQfEBy7yNWfDvDVm6mgsA4768bcpsJDmdp9t0g7w&s');
    const loader = new THREE.TextureLoader().load('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQW92XE-j1aJzRMI9kvvMZIf2VikZzzdEI87zl4rWgHMJBNJ9iw7A&s');
    //const loader1 = new THREE.TextureLoader().load('https://cdn0.iconfinder.com/data/icons/arrows-11/100/arrow-1-512.png');
    const loader1 = new THREE.TextureLoader().load('https://cdn2.iconfinder.com/data/icons/communication-language/100/Up_Arrow-01-512.png');
    var material = new THREE.MeshBasicMaterial( {map:loader1,transparent: true,color: 'black', opacity:'.8',side: THREE.DoubleSide} );
    let tanFOV = Math.tan( ( ( Math.PI / 180 ) * camera.fov / 2 ) );

    let windowHeight = window.innerHeight;

    function onMouseMove( event ) {
      // calculate mouse position in normalized device coordinates
      // (-1 to +1) for both components
      mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
      mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;   
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      
      // adjust the FOV
      camera.fov = ( 360 / Math.PI ) * Math.atan( tanFOV * ( window.innerHeight / windowHeight ) );
      
      camera.updateProjectionMatrix();
      camera.lookAt( scene.position );

      renderer.setSize( window.innerWidth, window.innerHeight-10 );
      renderer.render( scene, camera );
    }

    // Bind event listeners to window
    window.addEventListener("keydown", this.keyHandling);
    window.addEventListener("mousemove", onMouseMove, false );
    window.addEventListener("mousedown", this.onMouseDown.bind(this), false );
    window.addEventListener("mouseup", this.onMouseUp.bind(this), false );
    window.addEventListener("resize", onWindowResize, false );
    
    // Set background color and size
    renderer.setClearColor(new THREE.Color("black"),0);
    renderer.domElement.className = "canvas";
    renderer.setSize( window.innerWidth, window.innerHeight);
    document.body.children[5].appendChild( renderer.domElement );

    stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild( stats.dom);
    document.body.children[9].style.display = "none"

    // Prevents bluring
    loader.anisotropy = renderer.capabilities.getMaxAnisotropy();
    loader1.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // generate cubes with face colors based off memory cube
    for(let i = 0; i < rubiksObject.length; i++){

      // Store x,y,z of memory cube in easier to read variables
      let cubeX = rubiksObject[i][6];
      let cubeY = rubiksObject[i][7];
      let cubeZ = rubiksObject[i][8];

      // Map textures to each face to look nice and then color over
      const cubeMaterials = [
        new THREE.MeshBasicMaterial({ map: loader ,transparent: true, color:rubiksObject[i][2], side: THREE.FrontSide}),
        new THREE.MeshBasicMaterial({ map: loader ,transparent: true, color:rubiksObject[i][4], side: THREE.FrontSide}), 
        new THREE.MeshBasicMaterial({ map: loader ,transparent: true, color:rubiksObject[i][3], side: THREE.FrontSide}),
        new THREE.MeshBasicMaterial({ map: loader ,transparent: true,}), 
        new THREE.MeshBasicMaterial({ map: loader ,transparent: true, color:rubiksObject[i][1], side: THREE.FrontSide}), 
        new THREE.MeshBasicMaterial({ map: loader ,transparent: true, color:rubiksObject[i][5], side: THREE.FrontSide}), 
      ];
    
      // Add the new cube to temp cubes
      tempCubes[i] = new THREE.Mesh(cubeGeometry, cubeMaterials);
      //group.add( tempCubes[i] );
      // position piece based off memory cube
      tempCubes[i].translateX(cubeX);
      tempCubes[i].translateY(cubeY);
      tempCubes[i].translateZ(cubeZ); 
    }

    // Translate cube so center of cube is 0,0,0
    scene.translateX(.5-cD/2);
    scene.translateY(.5-cD/2);
    scene.translateZ(.5-cD/2);

    

    // Allows for drag to rotate camera
    const controls = new OrbitControls( camera , renderer.domElement);
    controls.enableDamping = true;   //damping 
    controls.dampingFactor = 0.15;   //damping inertia
    controls.enableZoom = true;      //Zooming
    controls.autoRotate = false;     //Enable auto rotation
    controls.minDistance = (2+cD);
    controls.maxDistance = (2+cD)+20;
    controls.keys = {
      LEFT: null, //left arrow
      UP: null, // up arrow
      RIGHT: null, // right arrow
      BOTTOM: null // down arrow
    };

    controls.addEventListener("change", () => {
      if (renderer) renderer.render(scene, camera);
    });

    // **************************** Implement direction of turns ****************************
    // generate side 4 and 2 move hints
    for(let k = 0; k < cD; k++){
      let tempGroup = new THREE.Group();
      let tempGroupOther = new THREE.Group();
      for(let i = 0; i < 4; i++){
        for(let j = 0; j<cD;j++){
          let tempPlane = new THREE.Mesh( geometry, material );
          let tempPlaneOther = new THREE.Mesh( geometry, material );
          if(i===0){
            tempPlane.translateX(cD-1-k);
            tempPlane.translateZ((cD-1)+.51);
            tempPlane.translateY((cD-1)-j);

            tempPlaneOther.translateX(cD-1-k);
            tempPlaneOther.translateZ((cD-1)+.51);
            tempPlaneOther.translateY((cD-1)-j);
            tempPlaneOther.rotateZ(Math.PI);
          }
          else if(i===1){
            tempPlane.translateX(cD-1-k);
            tempPlane.translateZ((cD-1)-j);
            tempPlane.translateY((cD-1)+.51);
            tempPlane.rotateX(Math.PI/2);
            tempPlane.rotateZ(Math.PI);

            tempPlaneOther.translateX(cD-1-k);
            tempPlaneOther.translateZ((cD-1)-j);
            tempPlaneOther.translateY((cD-1)+.51);
            tempPlaneOther.rotateX(Math.PI/2);
          }
          else if(i===2){
            tempPlane.translateX(cD-1-k);
            tempPlane.translateZ(-.51);
            tempPlane.translateY((cD-1)-j);
            tempPlane.rotateX(Math.PI);

            tempPlaneOther.translateX(cD-1-k);
            tempPlaneOther.translateZ(-.51);
            tempPlaneOther.translateY((cD-1)-j);
          }
          else if(i===3){
            tempPlane.translateX(cD-1-k);
            tempPlane.translateZ((cD-1)-j);
            tempPlane.translateY(-.51);
            tempPlane.rotateX(-Math.PI/2);
            tempPlane.rotateZ(Math.PI);

            tempPlaneOther.translateX(cD-1-k);
            tempPlaneOther.translateZ((cD-1)-j);
            tempPlaneOther.translateY(-.51);
            tempPlaneOther.rotateX(-Math.PI/2);
          }
          tempGroup.add(tempPlane)
          tempGroupOther.add(tempPlaneOther)
        }
      }
      tempGroup.visible = false;
      tempGroupOther.visible = false;
      groups[2].push(tempGroup);
      groups[5].push(tempGroupOther);
    }

    // generate side 0 and 3 move hints
    for(let k = 0; k < cD; k++){
      let tempGroup = new THREE.Group();
      let tempGroupOther = new THREE.Group();
      for(let i = 0; i < 4; i++){
        for(let j = 0; j<cD;j++){
          let tempPlane = new THREE.Mesh( geometry, material );
          let tempPlaneOther = new THREE.Mesh( geometry, material );
          if(i===0){
            tempPlane.translateX((cD-1)-j);
            tempPlane.translateZ((cD-1)+.51);
            tempPlane.translateY(k);
            tempPlane.rotateZ(-Math.PI/2);
            

            tempPlaneOther.translateX((cD-1)-j);
            tempPlaneOther.translateZ((cD-1)+.51);
            tempPlaneOther.translateY(k);
            tempPlaneOther.rotateX(Math.PI);
            tempPlaneOther.rotateZ(Math.PI/2);
          }
          else if(i===1){
            tempPlane.translateX((cD-1)+.51);
            tempPlane.translateZ((cD-1)-j);
            tempPlane.translateY(k);
            tempPlane.rotateX(Math.PI/2);
            tempPlane.rotateZ(Math.PI);
            tempPlane.rotateY(Math.PI/2);

            tempPlaneOther.translateX((cD-1)+.51);
            tempPlaneOther.translateZ((cD-1)-j);
            tempPlaneOther.translateY(k);
            tempPlaneOther.rotateX(Math.PI/2);
            tempPlaneOther.rotateY(Math.PI/2);
          }
          else if(i===2){
            tempPlane.translateX((cD-1)-j);
            tempPlane.translateZ(-.51);
            tempPlane.translateY(k);
            tempPlane.rotateX(Math.PI);
            tempPlane.rotateZ(Math.PI/2);

            tempPlaneOther.translateX((cD-1)-j);
            tempPlaneOther.translateZ(-.51);
            tempPlaneOther.translateY(k);
            tempPlaneOther.rotateZ(-Math.PI/2);
          }
          else if(i===3){
            tempPlane.translateX(-.51);
            tempPlane.translateZ((cD-1)-j);
            tempPlane.translateY(k);
            tempPlane.rotateX(-Math.PI/2);
            tempPlane.rotateZ(Math.PI);
            tempPlane.rotateY(-Math.PI/2);

            tempPlaneOther.translateX(-.51);
            tempPlaneOther.translateZ((cD-1)-j);
            tempPlaneOther.translateY(k);
            tempPlaneOther.rotateX(-Math.PI/2);
            tempPlaneOther.rotateY(Math.PI/2);
            //tempPlaneOther.rotateZ(Math.PI);
          }
          tempGroup.add(tempPlane)
          tempGroupOther.add(tempPlaneOther)
        }
      }
      tempGroup.visible = false;
      tempGroupOther.visible = false;
      
      groups[0].push(tempGroup);     //Clockwise for white, counter for yellow
      groups[3].push(tempGroupOther);//Counter for white, clockwise for yellow
    }

    // generate side 1 and 5 move hints
    for(let k = 0; k < cD; k++){
      let tempGroup = new THREE.Group();
      let tempGroupOther = new THREE.Group();
      for(let i = 0; i < 4; i++){
        for(let j = 0; j<cD;j++){
          let tempPlane = new THREE.Mesh( geometry, material );
          let tempPlaneOther = new THREE.Mesh( geometry, material );
          if(i===0){
            tempPlane.translateX((cD-1)-j);
            tempPlane.translateZ((cD-1)-k);
            tempPlane.translateY((cD-1)+.51);
            tempPlane.rotateZ(-Math.PI/2);
            tempPlane.rotateY(Math.PI/2);
            

            tempPlaneOther.translateX((cD-1)-j);
            tempPlaneOther.translateZ((cD-1)-k);
            tempPlaneOther.translateY((cD-1)+.51);
            tempPlaneOther.rotateX(Math.PI);
            tempPlaneOther.rotateZ(Math.PI/2);
            tempPlaneOther.rotateY(Math.PI/2);
          }
          else if(i===1){
            tempPlane.translateX((cD-1)+.51);
            tempPlane.translateZ((cD-1)-k);
            tempPlane.translateY((cD-1)-j);
            //tempPlane.rotateX(Math.PI/2);
            tempPlane.rotateZ(Math.PI);
            tempPlane.rotateY(Math.PI/2);

            tempPlaneOther.translateX((cD-1)+.51);
            tempPlaneOther.translateZ((cD-1)-k);
            tempPlaneOther.translateY((cD-1)-j);
            //tempPlaneOther.rotateX(Math.PI);
            tempPlaneOther.rotateY(Math.PI/2);
          }
          else if(i===2){
            tempPlane.translateX((cD-1)-j);
            tempPlane.translateZ((cD-1)-k);
            tempPlane.translateY(-.51);
            tempPlane.rotateX(Math.PI/2);
            tempPlane.rotateZ(Math.PI/2);

            tempPlaneOther.translateX((cD-1)-j);
            tempPlaneOther.translateZ((cD-1)-k);
            tempPlaneOther.translateY(-.51);
            tempPlaneOther.rotateX(Math.PI/2);
            tempPlaneOther.rotateZ(-Math.PI/2);
          }
          else if(i===3){
            tempPlane.translateX(-.51);
            tempPlane.translateZ((cD-1)-k);
            tempPlane.translateY((cD-1)-j);
            tempPlane.rotateX(Math.PI);
            tempPlane.rotateZ(Math.PI);
            tempPlane.rotateY(-Math.PI/2);

            tempPlaneOther.translateX(-.51);
            tempPlaneOther.translateZ((cD-1)-k);
            tempPlaneOther.translateY((cD-1)-j);
            tempPlaneOther.rotateX(-Math.PI);
            tempPlaneOther.rotateY(Math.PI/2);
            //tempPlaneOther.rotateZ(Math.PI);
          }
          tempGroup.add(tempPlane)
          tempGroupOther.add(tempPlaneOther)
        }
      }
      tempGroup.visible = false;
      tempGroupOther.visible = false;
      
      groups[1].push(tempGroup);     //Clockwise for white, counter for yellow
      groups[4].push(tempGroupOther);//Counter for white, clockwise for yellow
    }

    scene.add(...groups.flat(2));
    // **************************** End scrap code ****************************


    // add cubes to state and then render
    this.setState({
      cubes : tempCubes,
      cubeDimension : cD,
      cameraZ : -(2+cD),
      cameraX : (2+cD),
      cameraY : -(2+cD),
      rubiksObject,
      middles: generated.middles,
      generatedButtons: cube.generateButtonData(this.getSizeFromUrl())
    }, () => {
      // Callback required to wait for setState to finish
      for(let i = 0; i < rubiksObject.length; i++){
        // Logic to only render outer pieces since inside pieces aren't ever used
        if((this.state.cubes[i].position.x === 0 || this.state.cubes[i].position.x === this.state.cubeDimension-1) ||
            (this.state.cubes[i].position.y === 0 || this.state.cubes[i].position.y === this.state.cubeDimension-1)||
            (this.state.cubes[i].position.z === 0 || this.state.cubes[i].position.z === this.state.cubeDimension-1)){
          scene.add( this.state.cubes[i] );
        } 
      }
      camera.position.z = this.state.cameraZ;// * Math.sin( this.state.angle );
      camera.position.y = this.state.cameraY;
      camera.position.x = this.state.cameraX;// * Math.cos( this.state.angle );

      renderer.render( scene, camera );
      animate();
    });

    // Function runs continuously to animate cube
    var animate = () => {

      // clear visible move hints
      for(let i = 0; i < groups.length;i++)
        groups[i].forEach(group => group.visible = false)

      controls.enabled = true;
      stats.begin();
      requestAnimationFrame( animate );

      // Mouse stuff here
      // Consider moving into another function to unclutter animate
      // Very expensive operation
      if(this.state.currentFunc === "None") {

        //check here that data isn't the same as previous so not running this every time
        // Data on move button triggers visual move hints
        if(this.state.isVisible){ 
          //console.log("make turn visible"); 
          let [hFace,hDir,hDepth,hMulti] = this.state.hoverData;
          if(hFace<3){
            if(hDir === -1){
              if(!hMulti){
                groups[hFace][hDepth-1].visible=true;
              }
              else
                for(let i = 0; i <= hDepth-1; i++){
                  groups[hFace][i].visible=true;
                }
            }
            else {
              if(!hMulti){
                groups[hFace+3][hDepth-1].visible=true;
              }
              else
              for(let i = 0; i <= hDepth-1; i++){
                groups[hFace+3][i].visible=true;
              }
            }
          }
          else{
            if(hFace===3) hFace=0;
            if(hFace===4) hFace=2;
            if(hFace===5) hFace=1;

            if(hDir === -1){
              if(!hMulti){
                groups[hFace+3][(groups[hFace+3].length-1)-(hDepth-1)].visible=true;
              }
              else
                for(let i = groups[hFace+3].length-1; i >= (groups[hFace+3].length-1)-(hDepth-1); i--){
                  groups[hFace+3][i].visible=true;
                }
            }
            else {
              if(!hMulti){
                groups[hFace][(groups[hFace].length-1)-(hDepth-1)].visible=true;
              }
              else
                for(let i = groups[hFace].length-1; i >= (groups[hFace+3].length-1)-(hDepth-1); i--){
                  groups[hFace][i].visible=true;
                }
            }
          }
        }

        let previousPiece = this.state.previousPiece;

        // Projects mouse onto scene to find intersected objects
        raycaster.setFromCamera( mouse, camera );

        // calculate objects intersecting the picking ray
        var intersects = raycaster.intersectObjects( scene.children );
        if (intersects[0] && intersects[0].object.material.length && !this.state.mouseDown){
          previousMousePos = null;
          piecePos = null;
          intersected = null;
          controls.enabled = false;
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

          // Recolors last hovered piece. rgb values of cyan
          if(parseFloat(intersects[0].object.material[tempIndex].color.r) !== 0.6784313725490196 &&
             parseFloat(intersects[0].object.material[tempIndex].color.g) !== 0.8470588235294118 &&
             parseFloat(intersects[0].object.material[tempIndex].color.b) !== 0.9019607843137255){
            if(previousPiece!==null) {
              this.reloadTurnedPieces(previousPiece);
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
            try{
              let toFace = [2,4,3,0,1,5];
              
              if(previousMousePos === null) {
                previousMousePos = intersects[0].point;
                piecePos = intersects[0].object.position;
                intersected = Math.floor(intersects[0].faceIndex/2);
              }
              else{
                  let calculated = this.calculateTurn(intersects[0].point,previousMousePos,piecePos,toFace[intersected],cD);
                  if(calculated!==null&&!calculated.includes("null")){
                    //console.log(calculated)
                    this.setState({mouseDown: false},()=>{
                      this.algorithm(calculated,"Custom");
                    });
                  }
                
              }
            }catch(e){
              console.error("Error prevented");
            }
            // ** account for mouse not being over the cube after selected piece **
            //
            // Code here to figure out which faces can be turned from selected face
            // Also code here to figure which direction to turn face based on mouse movement
          }
        }

        // 
        else if(this.state.mouseFace !== null){
          if(previousPiece!==null) {
            this.reloadTurnedPieces(previousPiece);
            this.setState({previousPiece:null});
          }

          previousMousePos = null;
          piecePos = null;
          intersected = null;
          this.setState({mouseFace : null});
        }
      }
      
      if(this.state.start<=this.state.end){
        this.rotatePieces(cube.rotatePoint,tempCubes);
      }

      else {
        if(this.state.reload) this.reloadTurnedPieces(this.state.face);
        if(this.state.currentFunc !== "None"){

          // Doesn't work with !==
          if(this.state.currentFunc === "Undo" ||
             this.state.currentFunc === "Redo"){}

          // Keeps undo/redo updated with other moves
          // find the error in this logic
          else {
            let moveLog = this.state.moveLog;
            let index = this.state.undoIndex;

            if(index > 0){
              let moveArray = this.moveStringToArray(moveLog);

              if(this.state.currentFunc[0]==='0' || this.state.currentFunc[0]==='1' ||
                 this.state.currentFunc[1]==='1' || this.state.currentFunc[1]==='2' || this.state.currentFunc[1]==='3'){
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
            }
          }

          // Moves based on active function
          if (this.state.currentFunc==="Scrambling")
            this.state.moves < 25 ?
              this.scramble() :
              this.setState({currentFunc : "None",moves : 0});

          else if (this.state.currentFunc==="Solving"){
            if(!this.state.moveSet.length) {
              this.setState(solver(
                this.state.solveState,
                this.state.rubiksObject,
                this.state.cubeDimension,
                this.moveStringToArray,
                this.state.solveMoves,
                this.state.rubiksIndex,
                this.state.middles));
            }
            else this.parseMoveArray(this.state.moveSet);
          }
          
          else 
            this.state.moveSet.length ?
              this.parseMoveArray(this.state.moveSet) :
              this.setState({currentFunc:"None"}); 
        }
      }
      
      controls.update();
      renderer.render( scene, camera );
      stats.end();     
    };
  }

  // Renders html to the index.html page
  render() {
    let solveBtn = (this.state.cubeDimension < 21) ? <button onClick={this.beginSolve} style={{position:"fixed", bottom: "60px", right: "10px",backgroundColor: "Transparent", border: "none",color:"lightgray"}}>SOLVE</button> : "";
    let stopSolveBtn = <button onClick={this.stopSolve} style={{position:"fixed", bottom: "60px", right: "10px",backgroundColor: "Transparent", border: "none",color:"lightgray"}}>STOP SOLVE</button>;
    return (
      <div className="App" >
        
        <Navbar
          title="Rubik's Cube"
          changeSettings={this.changeSettings.bind(this)}
          state={this.state}
        />

        <p style={{position:"fixed", top: "75px", left: "10px",color: "white"}}>Speed: {this.state.currentSpeed}</p>
        <p style={{position:"fixed", top: "75px", right: "10px",color: "white"}}>{this.state.currentFunc === "None" ? "" : this.state.currentFunc}</p>
        <div style={{position:"fixed", top: "75px", left: "50%", marginLeft: "-50px",color: "white"}}>
          <button className="redoUndo" onClick={() => this.undo()}>Undo</button>
          <button className="redoUndo" onClick={() => this.redo()}>Redo</button>
        </div>

        <Speeds //Top left with slider
          onSliderChange={this.onSliderChange}
          isDisabled={this.state.currentFunc==="None" ? false:true}
        />

        { this.state.showMoveInput? 
          <MoveInput
            algorithm = {this.algorithm}
            handleDrag = {this.handleDragInput}
            onStart = {this.onStartInput}
            onStop = {this.onStopInput}
          /> : ""
        }
      
        <Patterns
          algorithm={this.algorithm}
          size={this.getSizeFromUrl()}
        />

        { this.state.generatedButtons && this.state.showControls? 
          <Controls
          disableHover={this.state.showGuideArrows}
          generatedButtons={this.state.generatedButtons}
          size={this.getSizeFromUrl()}
          rotateOneFace={this.rotateOneFace}
          handleDrag = {this.handleDragControls}
          onStart = {this.onStartControls}
          onStop = {this.onStopControls}
          mouseEnter= {this.mouseOver}
          mouseLeave= {this.mouseLeave}
        /> : ""}
  
        {/* Bottom Right */} 
        {this.state.solveState < 0 ? solveBtn : stopSolveBtn}
        <button onClick={this.beginScramble} style={{position:"fixed", bottom: "30px", right: "10px",backgroundColor: "Transparent", border: "none",color:"lightgray"}}>SCRAMBLE</button>
        <button onClick={this.reset} style={{position:"fixed", bottom: "0px", right: "10px",backgroundColor: "Transparent", border: "none",color:"lightgray"}}>RESET</button>
      </div>
    );
  }
}

export default App;