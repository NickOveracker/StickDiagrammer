/**************************************************************************************************
 * 
 * ## Legal Stuff
 * Copyright Nick Overacker & Miho Kobayashi.
 * This code is offered under the Strict License 1.0.0 (https://polyformproject.org/licenses/strict/1.0.0/),
 * which permits users to use this code for noncommercial purposes but reserves most rights for the copyright holders.
 * For uses not permitted under the license, please contact: nick.overacker@okstate.edu
 *
 * ## Stipulations for updates
 *    - All builds must pass JSHint with no warnings (https://jshint.com/)
 *      - This following tags may be disabled, but only on a line-by-line basis.
 *      - "jshint bitwise" (bitwise operators)
 *      - "jshint -W093" (returning and assigning in one step)
 *      - "jshint complexity" (cyclomatic complexity, function-by-function basis)
 *    - All builds must pass testbench
 *      - The testbench may need to be modified for some breaking changes (e.g., new layers)
 * 
 **************************************************************************************************/

/* jshint curly: true */
/* jshint eqeqeq: true */
/* jshint esversion: 6 */
/* jshint forin: true */
/* jshint freeze: true */
/* jshint futurehostile: true */
/* jshint leanswitch: true */
/* jshint maxcomplexity: 10 */
/* jshint maxdepth: 4 */
/* jshint maxparams: 4 */
/* jshint noarg: true */
/* jshint nocomma: false */
/* jshint nonbsp: true */
/* jshint nonew: true */
/* jshint noreturnawait: true */
/* jshint regexpu: true */
/* jshint strict: true */
/* jshint trailingcomma: true */
/* jshint undef: true */
/* jshint unused: true */
/* jshint varstmt: true */
/* jshint browser: true */
/* jshint latedef: true */
(() => {
    'use strict';
    let tutorials = [];

    class TutorialStep {
        constructor(UI) {
            this.UI = UI;
            this.timer = Date.now();
            
            this.instructions = {
                en_us: "English instructions.",
                ja_jp: "日本語の手順。",
            };
            this.completed     = () => { return true; };
            this.position      = { centerHorizontal: false, centerVertical: false, x: 0, y: 0, flipLeft: false, flipUp: false, };
            this.specialAction = () => { return; };
            this.target = document.body;
            this.tutorialOverlay = document.createElement("div");
        }

        display(languageSetting) {
            this.tutorialOverlay.classList.add("tutorial-overlay");
            this.tutorialOverlay.innerHTML = this.instructions[languageSetting];
            document.body.appendChild(this.tutorialOverlay);
            this.reposition();
        }

        reposition() {
            let targetRect      = this.target.getBoundingClientRect();
            let overlayRect     = this.tutorialOverlay.getBoundingClientRect();
            let targetStyle     = window.getComputedStyle(this.target);
            let overlayStyle    = window.getComputedStyle(this.tutorialOverlay);

            let x               = targetRect.left;
            let y               = targetRect.top + window.scrollY;
            let totalExtraSpace = parseFloat(targetStyle.getPropertyValue("margin"),   10) +
                                  parseFloat(targetStyle.getPropertyValue("padding"),  10) +
                                  parseFloat(overlayStyle.getPropertyValue("margin"),  10) +
                                  parseFloat(overlayStyle.getPropertyValue("padding"), 10);

            // Which side are we positioning relative to?
            x = this.position.flipLeft ? x - overlayRect.width  - this.position.x : x + targetRect.width  + this.position.x;
            y = this.position.flipUp   ? y - overlayRect.height - this.position.y : y + targetRect.height + this.position.y;
            
            // Center? (Not compatible with flipping)
            x = this.position.centerHorizontal ? x - targetRect.width  / 2 - overlayRect.width  / 2 : this.position.flipLeft ? x - totalExtraSpace : x + totalExtraSpace;
            y = this.position.centerVertical   ? y - targetRect.height / 2 - overlayRect.height / 2 : this.position.flipUp   ? y - totalExtraSpace : y + totalExtraSpace;

            // Position the overlay next to the target element
            x = Math.max(x, 0);
            y = Math.max(y, 0);
            x = Math.min(x, window.innerWidth - overlayRect.width);
            this.tutorialOverlay.style.left = `${x}px`;
            this.tutorialOverlay.style.top = `${y}px`;
        }
    }

    class Tutorial {
        constructor() {
            this.steps = [];
            this.currentStep = 0;
            this.active = false;
            this.languageSetting = "en_us";
        }

        getLayerSpan(layer, UI) {
            let layerName, color;
            layerName = UI.diagramGrid.constructor.layers(layer).toUpperCase();
            color = UI.diagramView.getColor(layer, true);
            return `<span style="color: ${color}; font-weight: bold;">${layerName}</span>`;
        }

        step() {
            if(this.active) {
                if(this.steps[this.currentStep].completed()) {
                    this.currentStep++;
                    if(this.currentStep >= this.steps.length) {
                        this.active = false;
                        alert("Tutorial complete");
                    } else {
                        this.steps[this.currentStep].display(this.languageSetting);
                    }
                } else {
                    this.steps[this.currentStep].specialAction();
                }
            }
        }

        start() {
            this.active = true;
            this.steps[this.currentStep].display(this.languageSetting);
        }
    }

    function setUpInverterTutorial(UI, LayeredGrid) {
        let tutorial = new Tutorial();

        ////////////////////////// STEP 1 //////////////////////////
        let tutStep = new TutorialStep(UI);

        tutStep.instructions = {
            en_us: `Toggle dark mode by pressing the on-screen toggle button or by pressing ${UI.darkModeCommand.ctrlModifier ? "CTRL-" : UI.darkModeCommand.shiftModifier ? "SHIFT-" : ""}${String.fromCharCode(UI.darkModeCommand.keyCode)}.`,
            ja_jp: `ダークモードのトグルボタンを押すか、${UI.darkModeCommand.ctrlModifier ? "CTRL-" : UI.darkModeCommand.shiftModifier ? "SHIFT-" : ""}${String.fromCharCode(UI.darkModeCommand.keyCode)}を押して下さい。`,
        };

        tutStep.completed = (function(darkModeSet) {
            return function() {
                let completed = UI.diagramView.darkMode !== darkModeSet;
                if(completed) {
                    window.scrollTo({behavior: "smooth", top: Math.ceil(document.getElementsByClassName("offscreen")[0].getBoundingClientRect().top + window.scrollY), left: 0,});
                    // Remove glow from dark mode button.
                    let classList = document.getElementById("dark-mode-btn").classList;
                    if(classList.contains("glowing")) {
                        classList.remove("glowing");
                        classList.remove("rounded");
                    }
                    // Change layer if currently on METAL1 to prepare for next step.
                    if(UI.diagramController.cursorIndex === LayeredGrid.METAL1) {
                        UI.diagramController.changeLayer();
                    }
                    this.tutorialOverlay.remove();
                }
                return completed;
            }.bind(tutStep);
        }.bind(tutStep))(UI.diagramView.darkMode);

        tutStep.specialAction = function() {
            let classList = document.getElementById("dark-mode-btn").classList;
            if(!classList.contains("glowing")) {
                classList.add("glowing");
                classList.add("rounded");
            }
        };

        tutStep.target = document.getElementById("dark-mode-btn");
        
        tutorial.steps.push(tutStep);

        ////////////////////////// STEP 2 //////////////////////////
        tutStep = new TutorialStep(UI);

        tutStep.instructions = {
            en_us: "Set the grid to 20 rows and 20 columns.",
            ja_jp: "グリッドの行数と列数を両方２０に設定しましょう。",
        };

        tutStep.completed = function() {
            let completed = UI.diagramGrid.width === 20 && UI.diagramGrid.height === 20;
            if(completed) {
                // Remove glow from dark mode button.
                let remColClassList = document.getElementById("remove-column").classList;
                let remRowClassList = document.getElementById("remove-row").classList;
                let addColClassList = document.getElementById("add-column").classList;
                let addRowClassList = document.getElementById("add-row").classList;

                if(remColClassList.contains("glowing")) {
                    remColClassList.remove("glowing");
                }
                if(remRowClassList.contains("glowing")) {
                    remRowClassList.remove("glowing");
                }
                if(addColClassList.contains("glowing")) {
                    addColClassList.remove("glowing");
                }
                if(addRowClassList.contains("glowing")) {
                    addRowClassList.remove("glowing");
                }

                let moveTerm = function(x, y, terminal) {
                    let oldX = terminal.x;
                    let oldY = terminal.y;
                    terminal.x = x;
                    terminal.y = y;
                    this.diagramController.placeTerminal(terminal, terminal, true);
                    this.diagramGrid.clear(oldX, oldY, LayeredGrid.CONTACT);
                }.bind(UI);

                // Move the terminals to a better position
                moveTerm(2,   2, UI.diagram.vddCell);
                moveTerm(1,  18, UI.diagram.gndCell);
                moveTerm(18, 10, UI.diagram.outputs[0]);

                // Disable further adjustment of the grid size for now
                UI.diagramGrid.temp = UI.diagramGrid.resize;
                UI.diagramGrid.resize = () => { return; };

                this.tutorialOverlay.remove();
                window.scrollTo({behavior: "smooth", top: Math.ceil(document.body.getBoundingClientRect().top), left: 0,});
            }
            return completed;
        }.bind(tutStep);

        tutStep.specialAction = function() {
            let limit = 20;
            let setGlowing = function(element, compareVal, isAddButton) {
                if(isAddButton && compareVal < limit) {
                    if(!element.classList.contains("glowing")) {
                        element.classList.add("glowing");
                    }
                } else if(!isAddButton && compareVal > limit) {
                    if(!element.classList.contains("glowing")) {
                        element.classList.add("glowing");
                    }
                } else if(element.classList.contains("glowing")) {
                    if(element.classList.contains("glowing")) {
                        element.classList.remove("glowing");
                    }
                }
            }.bind(tutStep);

            setGlowing(document.getElementById("remove-column"), UI.diagramGrid.width, false);
            setGlowing(document.getElementById("remove-row"), UI.diagramGrid.height, false);
            setGlowing(document.getElementById("add-column"), UI.diagramGrid.width, true);
            setGlowing(document.getElementById("add-row"), UI.diagramGrid.height, true);
        };

        tutStep.target = document.getElementsByClassName("offscreen")[0];
        tutStep.position.flipUp = true;
        tutStep.position.centerHorizontal = true;
        
        tutorial.steps.push(tutStep);

        ////////////////////////// STEP 3 //////////////////////////
        tutStep = new TutorialStep(UI);

        tutStep.instructions = {
            en_us: "Select the METAL1 layer by right clicking a few times, or by pressing the METAL1 layer select button.",
            ja_jp: "右クリックを数回してMETAL1層に変えるか、METAL1層の選択ボタンを押して下さい。",
        };

        tutStep.completed = function() {
            let completed = UI.diagramController.cursorIndex === LayeredGrid.METAL1;
            if(completed) {
                // Remove glow from metal1 swatch.
                let classList = document.getElementById("metal1-swatch").classList;
                if(classList.contains("glowing")) {
                    classList.remove("glowing");
                    classList.remove("rounded");
                }
                this.tutorialOverlay.remove();
            }
            return completed;
        }.bind(tutStep);

        tutStep.specialAction = function() {
            let classList = document.getElementById("metal1-swatch").classList;
            if(!classList.contains("glowing")) {
                classList.add("glowing");
                classList.add("rounded");
            }
        };

        tutStep.target = document.getElementById("metal1-swatch");
        tutStep.position.centerHorizontal = true;
        tutStep.position.flipUp = true;
        
        tutorial.steps.push(tutStep);

        ////////////////////////// STEP 4 //////////////////////////
        tutStep = new TutorialStep(UI);

        tutStep.instructions = {
            en_us: "Connect VDD to METAL1.",
            ja_jp: "VDDをMETAL1層に接続して下さい。",
        };

        tutStep.completed = function() {
            let cellSet = UI.diagramGrid.get(UI.diagram.vddCell.x, UI.diagram.vddCell.y, LayeredGrid.METAL1).isSet;
            let completed = cellSet && !UI.diagram.controller.dragging;
            if(completed) {
                this.tutorialOverlay.remove();
            }
            return completed;
        }.bind(tutStep);

        tutStep.specialAction = function() {
            return;
        };

        tutStep.target = document.getElementById("canvas");
        tutStep.position.centerHorizontal = true;
        tutStep.position.flipUp = true;
        
        tutorial.steps.push(tutStep);

        ////////////////////////// STEP 5 //////////////////////////
        tutStep = new TutorialStep(UI);

        tutStep.instructions = {
            en_us: "Select the CONTACT layer by right clicking a few times, or by pressing the METAL1 layer select button.",
            ja_jp: "右クリックを数回してCONTACT層に変えるか、CONTACT層の選択ボタンを押して下さい。",
        };

        tutStep.completed = function() {
            let completed = UI.diagramController.cursorIndex === LayeredGrid.CONTACT;
            if(completed) {
                // Remove glow from contact swatch.
                let classList = document.getElementById("contact-swatch").classList;
                if(classList.contains("glowing")) {
                    classList.remove("glowing");
                    classList.remove("rounded");
                }
                this.tutorialOverlay.remove();
            }
            return completed;
        }.bind(tutStep);

        tutStep.specialAction = function() {
            let classList = document.getElementById("contact-swatch").classList;
            if(!classList.contains("glowing")) {
                classList.add("glowing");
                classList.add("rounded");
                let bounds = {
                    left: 0,
                    right: this.width - 1,
                    top: 0,
                    bottom: this.height - 1,
                    lowLayer: 0,
                    highLayer: this.layers - 1,
                };
                this.map(bounds, function(x,y,layer) {
                    /* jshint maxcomplexity: 21 */ 
                    /** VDD rail  */ let paintCell = y === this.diagram.vddCell.y && layer === LayeredGrid.METAL1;
                    /** GND rail  */ paintCell = paintCell || y === this.diagram.gndCell.y && layer === LayeredGrid.METAL1;
                    /** PDIFF     */ paintCell = paintCell || y === this.diagram.vddCell.y + 2 && layer === LayeredGrid.PDIFF;
                    /** NDIFF     */ paintCell = paintCell || y === this.diagram.gndCell.y - 2 && layer === LayeredGrid.NDIFF;
                    /** Output    */ paintCell = paintCell || x === this.diagram.outputs[0].x && y >= this.diagram.vddCell.y + 2 && y <= this.diagram.gndCell.y - 2 && layer === LayeredGrid.METAL1;
                    /** VDD-PDIFF */ paintCell = paintCell || x === this.diagram.vddCell.x + 2 && y >= this.diagram.vddCell.y && y <= this.diagram.vddCell.y + 2 && layer === LayeredGrid.METAL1;
                    /** VDD-NDIFF */ paintCell = paintCell || x === this.diagram.gndCell.x + 2 && y <= this.diagram.gndCell.y && y >= this.diagram.gndCell.y - 2 && layer === LayeredGrid.METAL1;
                    
                    if(paintCell) {
                        this.set(x,y,layer);
                    } else {
                        this.clear(x,y,layer);
                    }
                }.bind(this), true);
            }
        }.bind(UI.diagramGrid);

        tutStep.target = document.getElementById("contact-swatch");
        tutStep.position.flipLeft = true;
        tutStep.position.flipUp   = true;
        
        tutorial.steps.push(tutStep);

        ////////////////////////// STEP 6 //////////////////////////
        tutStep = new TutorialStep(UI);

        tutStep.instructions = {
            en_us: `Place ${this.getLayerSpan(UI.diagramGrid.constructor.CONTACT, UI)}s where ${this.getLayerSpan(UI.diagramGrid.constructor.METAL1, UI)} meets ${this.getLayerSpan(UI.diagramGrid.constructor.PDIFF, UI)} or ${this.getLayerSpan(UI.diagramGrid.constructor.NDIFF, UI)}.`,
            ja_jp: `${this.getLayerSpan(UI.diagramGrid.constructor.PDIFF, UI)}か${this.getLayerSpan(UI.diagramGrid.constructor.NDIFF, UI)}層の上に${this.getLayerSpan(UI.diagramGrid.constructor.METAL1, UI)}層が引かれたところに${this.getLayerSpan(UI.diagramGrid.constructor.CONTACT, UI)}を置いてください。`,
        };

        tutStep.completed = function() {
            let done = UI.diagramGrid.get(UI.diagram.vddCell.x+2, UI.diagram.vddCell.y+2, LayeredGrid.CONTACT).isSet;
            done = done && UI.diagramGrid.get(UI.diagram.gndCell.x+2, UI.diagram.gndCell.y-2, LayeredGrid.CONTACT).isSet;
            done = done && UI.diagramGrid.get(UI.diagram.outputs[0].x, UI.diagram.vddCell.y+2, LayeredGrid.CONTACT).isSet;
            done = done && UI.diagramGrid.get(UI.diagram.outputs[0].x, UI.diagram.gndCell.y-2, LayeredGrid.CONTACT).isSet;
            
            done = done && !UI.diagramController.dragging;
            if(done) {
                this.tutorialOverlay.remove();
            }
            return done;
        }.bind(tutStep);

        tutStep.specialAction = function() {
            return;
        };

        tutStep.target = document.getElementById("canvas");
        tutStep.position.centerHorizontal = true;
        tutStep.position.flipUp = true;
        
        tutorial.steps.push(tutStep);

        ////////////////////////// STEP 7 //////////////////////////
        tutStep = new TutorialStep(UI);

        tutStep.instructions = {
            en_us: "Select the POLY layer by right clicking a few times, or by pressing the POLY layer select button.",
            ja_jp: "右クリックを数回してPOLY層に変えるか、POLY層の選択ボタンを押して下さい。",
        };

        tutStep.completed = function() {
            let completed = UI.diagramController.cursorIndex === LayeredGrid.POLY;
            if(completed) {
                // Remove glow from poly swatch.
                let classList = document.getElementById("poly-swatch").classList;
                if(classList.contains("glowing")) {
                    classList.remove("glowing");
                    classList.remove("rounded");
                }
                this.tutorialOverlay.remove();
            }
            return completed;
        }.bind(tutStep);

        tutStep.specialAction = function() {
            let classList = document.getElementById("poly-swatch").classList;
            if(!classList.contains("glowing")) {
                classList.add("glowing");
                classList.add("rounded");
                let bounds = {
                    left: 0,
                    right: this.width - 1,
                    top: 0,
                    bottom: this.height - 1,
                    lowLayer: 0,
                    highLayer: this.layers - 1,
                };
                this.map(bounds, function(x,y,layer) {
                    /* jshint maxcomplexity: 25 */ 
                    /** VDD rail  */ let paintCell = y === this.diagram.vddCell.y && layer === LayeredGrid.METAL1;
                    /** GND rail  */ paintCell = paintCell || y === this.diagram.gndCell.y && layer === LayeredGrid.METAL1;
                    /** PDIFF     */ paintCell = paintCell || y === this.diagram.vddCell.y + 2 && layer === LayeredGrid.PDIFF;
                    /** NDIFF     */ paintCell = paintCell || y === this.diagram.gndCell.y - 2 && layer === LayeredGrid.NDIFF;
                    /** Output    */ paintCell = paintCell || x === this.diagram.outputs[0].x && y >= this.diagram.vddCell.y + 2 && y <= this.diagram.gndCell.y - 2 && layer === LayeredGrid.METAL1;
                    /** VDD-PDIFF */ paintCell = paintCell || x === this.diagram.vddCell.x + 2 && y >= this.diagram.vddCell.y && y <= this.diagram.vddCell.y + 2 && layer === LayeredGrid.METAL1;
                    /** VDD-NDIFF */ paintCell = paintCell || x === this.diagram.gndCell.x + 2 && y <= this.diagram.gndCell.y && y >= this.diagram.gndCell.y - 2 && layer === LayeredGrid.METAL1;
                    /** Contacts  */ paintCell = paintCell || layer === LayeredGrid.CONTACT && this.get(x,y,LayeredGrid.METAL1).isSet && (this.get(x,y,LayeredGrid.PDIFF).isSet || this.get(x,y,LayeredGrid.NDIFF).isSet);
                    
                    if(paintCell) {
                        this.set(x,y,layer);
                    } else {
                        this.clear(x,y,layer);
                    }
                }.bind(this), true);
            }
        }.bind(UI.diagramGrid);

        tutStep.target = document.getElementById("poly-swatch");
        tutStep.position.flipUp   = true;
        
        tutorial.steps.push(tutStep);

        ////////////////////////// STEP 8 //////////////////////////
        tutStep = new TutorialStep(UI);

        tutStep.instructions = {
            en_us: `Draw a line of ${this.getLayerSpan(UI.diagramGrid.constructor.POLY, UI)} that spans across the ${this.getLayerSpan(UI.diagramGrid.constructor.PDIFF, UI)} and ${this.getLayerSpan(UI.diagramGrid.constructor.NDIFF, UI)} lines between the left and right ${this.getLayerSpan(UI.diagramGrid.constructor.CONTACT, UI)}.`,
            ja_jp: `${this.getLayerSpan(UI.diagramGrid.constructor.POLY, UI)}層で${this.getLayerSpan(UI.diagramGrid.constructor.PDIFF, UI)}と${this.getLayerSpan(UI.diagramGrid.constructor.NDIFF, UI)}層を通る一本の線を左右の${this.getLayerSpan(UI.diagramGrid.constructor.CONTACT, UI)}の間に引いてください。`,
        };

        tutStep.completed = function() {
            if(UI.diagramController.dragging) {
                return false;
            }
            
            UI.diagram.setNets();
            UI.diagram.clearAnalyses();
            
            let done = UI.diagram.nmos.size === 1 && UI.diagram.pmos.size === 1;
            done = done && UI.diagram.nmos.values().next().value.gate.isIdentical(UI.diagram.pmos.values().next().value.gate);
            done = done && !UI.diagram.vddNet.isIdentical(UI.diagram.gndNet);
            
            if(done) {
                this.tutorialOverlay.remove();
            }
            
            return done;
        }.bind(tutStep);

        tutStep.specialAction = function() {
            return;
        };

        tutStep.target = document.getElementById("canvas");
        tutStep.position.centerHorizontal = true;
        tutStep.position.flipUp = true;
        
        tutorial.steps.push(tutStep);

        ////////////////////////// STEP 9 //////////////////////////
        tutStep = new TutorialStep(UI);

        tutStep.instructions = {
            en_us: "Open the Terminals menu.",
            ja_jp: "端子のメニューを開いて下さい。",
        };

        tutStep.completed = function() {
            let done = !document.getElementById("terminal-menu").classList.contains("closed");
            
            if(done) {
                this.tutorialOverlay.remove();
                if(this.target.classList.contains("glowing")) {
                    this.target.classList.remove("glowing");
                    this.target.classList.remove("rounded");
                }
            }
            
            return done;
        }.bind(tutStep);

        tutStep.specialAction = function() {
            if(!this.target.classList.contains("glowing")) {
                this.target.classList.add("glowing");
                this.target.classList.add("rounded");
            }
        };

        tutStep.target = document.getElementById("term-menu-btn");
        tutStep.position.centerHorizontal = true;
        tutStep.position.flipUp = true;
        
        tutorial.steps.push(tutStep);

        ////////////////////////// STEP 10 //////////////////////////
        tutStep = new TutorialStep(UI);

        tutStep.instructions = {
            en_us: "Select Terminal A.",
            ja_jp: "A端子を選択してください。",
        };

        tutStep.completed = function() {
            let label = document.getElementById("termselect-label-2");
            let done = label && document.getElementById("termselect-2").checked;
            
            if(done) {
                this.tutorialOverlay.remove();
                if(label.classList.contains("glowing")) {
                    label.classList.remove("glowing");
                }
            }
            
            return done;
        }.bind(tutStep);

        tutStep.specialAction = function() {
            // Don't let the user delete the A input.
            let label = document.getElementById("termselect-label-2");
            if(!label) {
                UI.diagramController.addTerminal(false);
                label = document.getElementById("termselect-label-2");
            }
            // Make the label glow.
            if(!label.classList.contains("glowing")) {
                label.classList.add("glowing");
            }
        };

        tutStep.target = document.getElementById("canvas");
        tutStep.position.centerHorizontal = true;
        tutStep.position.centerVertical = true;
        
        tutorial.steps.push(tutStep);

        ////////////////////////// STEP 11 //////////////////////////
        tutStep = new TutorialStep(UI);

        tutStep.instructions = {
            en_us: "Press the Place Terminal button.",
            ja_jp: "端子移動ボタンを押してください。",
        };

        tutStep.completed = function() {
            let button = document.getElementById("place-term-btn");
            let done = button.classList.contains("active");
            
            if(done) {
                this.tutorialOverlay.remove();
                if(button.classList.contains("glowing")) {
                    button.classList.remove("glowing");
                }
            }
            
            return done;
        }.bind(tutStep);

        tutStep.specialAction = function() {
            let button = document.getElementById("place-term-btn");
            if(!button.classList.contains("glowing")) {
                button.classList.add("glowing");
            }
        };

        tutStep.target = document.getElementById("canvas");
        tutStep.position.centerHorizontal = true;
        tutStep.position.centerVertical = true;
        
        tutorial.steps.push(tutStep);

        ////////////////////////// STEP 12 //////////////////////////
        tutStep = new TutorialStep(UI);

        tutStep.instructions = {
            en_us: `Place the A terminal on the ${this.getLayerSpan(this.UI.diagramGrid.prototype.POLY, UI)} between the ${this.getLayerSpan(this.UI.diagramGrid.prototype.PDIFF, UI)} and ${this.getLayerSpan(this.UI.diagramGrid.prototype.NDIFF, UI)} lines.`,
            ja_jp: `A端子を${this.getLayerSpan(this.UI.diagramGrid.prototype.PDIFF, UI)}と${this.getLayerSpan(this.UI.diagramGrid.prototype.NDIFF, UI)}層の間の${this.getLayerSpan(this.UI.diagramGrid.prototype.POLY, UI)}層上に置いてください。`,
        };

        tutStep.completed = function() {
            let done = !UI.diagramController.dragging && UI.diagram.inputs.length > 0;
            done = done &&  UI.diagramGrid.get(UI.diagram.inputs[0].x, UI.diagram.inputs[0].y, LayeredGrid.POLY).isSet;
            done = done && !UI.diagramGrid.get(UI.diagram.inputs[0].x, UI.diagram.inputs[0].y, LayeredGrid.NDIFF).isSet;
            done = done && !UI.diagramGrid.get(UI.diagram.inputs[0].x, UI.diagram.inputs[0].y, LayeredGrid.PDIFF).isSet;

            if(done) {
                this.tutorialOverlay.remove();
            }

            return done;
        }.bind(tutStep);

        tutStep.specialAction = function() {
            return;
        };

        tutStep.target = document.getElementById("canvas");
        tutStep.position.centerHorizontal = true;
        tutStep.position.flipUp = true;
        
        tutorial.steps.push(tutStep);

        ////////////////////////// STEP 13 //////////////////////////
        tutStep = new TutorialStep(UI);

        tutStep.instructions = {
            en_us: "Good! If you are on PC, you can also place the A terminal by typing \"A\".<br><br>Now delete every terminal except for A.",
            ja_jp: "完璧！パソコンを使用しているなら、A端子をAキーを打って早く置けます。<br><br>次、A端子以外の入力端子を削除しましょう。",
        };

        tutStep.completed = function() {
            let done = UI.diagram.inputs.length === 1;
            
            if(done) {
                let button = document.getElementById("remove-input-btn");

                // Don't let the user accidentally delete the A terminal.
                UI.diagramController.temp = UI.diagramController.removeTerminal;
                UI.diagramController.removeTerminal = () => { return; };

                this.tutorialOverlay.remove();
                if(button.classList.contains("glowing")) {
                    button.classList.remove("glowing");
                }
            }
            
            return done;
        }.bind(tutStep);

        tutStep.specialAction = function() {
            let button = document.getElementById("remove-input-btn");
            if(!button.classList.contains("glowing")) {
                button.classList.add("glowing");
            }
        };

        tutStep.target = document.getElementById("canvas");
        tutStep.position.centerHorizontal = true;
        tutStep.position.centerVertical = true;
        
        tutorial.steps.push(tutStep);

        ////////////////////////// STEP 14 //////////////////////////
        tutStep = new TutorialStep(UI);

        tutStep.instructions = {
            en_us: "Now, close the Terminals menu by pressing the close button or by pressing ESC.",
            ja_jp: "バツボタンまたはESCキーを押して端子メニューを閉じてください。",
        };

        tutStep.completed = function() {
            let done = document.getElementById("terminal-menu").classList.contains("closed");
            
            if(done) {
                UI.diagramController.removeTerminal = UI.diagramController.temp;
                this.tutorialOverlay.remove();
                if(this.target.classList.contains("glowing")) {
                    this.target.classList.remove("glowing");
                }
                window.scrollTo({behavior: "smooth", top: Math.ceil(document.getElementById("evaluate-btn").getBoundingClientRect().top + window.scrollY), left: 0,});
            }
            
            return done;
        }.bind(tutStep);

        tutStep.specialAction = function() {
            if(!this.target.classList.contains("glowing")) {
                this.target.classList.add("glowing");
            }
        };

        tutStep.target = document.getElementById("close-term-menu-btn");
        tutStep.position.flipLeft = true;
        tutStep.position.flipUp = true;
        
        tutorial.steps.push(tutStep);

        ////////////////////////// STEP 15 //////////////////////////
        tutStep = new TutorialStep(UI);

        tutStep.instructions = {
            en_us: "Press \"Evaluate\" to generate a truth table for the circuit.",
            ja_jp: "「Evaluate」を押して回路の真理値表を作成してください。",
        };

        tutStep.completed = function() {
            let done = document.getElementById("truth-table").children.length > 0;
            
            if(done) {
                this.tutorialOverlay.remove();
                let classList = document.getElementById("evaluate-btn").classList;
                if(classList.contains("glowing")) {
                    classList.remove("glowing");
                }
            }
            
            return done;
        }.bind(tutStep);

        tutStep.specialAction = function() {
            // Sneakily remove a contact and don't allow it to be replaced.
            UI.diagramGrid.clear(UI.diagram.vddCell.x, UI.diagram.vddCell.y, LayeredGrid.METAL1);
            this.reposition();

            let classList = document.getElementById("evaluate-btn").classList;
            if(!classList.contains("glowing")) {
                classList.add("glowing");
            }
        };

        tutStep.target = document.getElementById("evaluate-btn");
        tutStep.position.centerHorizontal = true;
        tutStep.position.flipUp = true;
        
        tutorial.steps.push(tutStep);

        ////////////////////////// STEP 16 //////////////////////////
        tutStep = new TutorialStep(UI);

        tutStep.instructions = {
            en_us: "The output isn't right! Click the \"Z\" output in the truth table to find out why it isn't \"1\".",
            ja_jp: "出力がおかしい！「Z」の出力を押して、なぜ予想した「１」になっていないか検査しましょう。",
        };

        tutStep.completed = function() {
            let done = UI.diagramView.netHighlightGrid[UI.diagram.vddCell.x + 1, UI.diagram.vddCell.y];
            this.reposition();
            
            if(done) {
                let outputCell = document.getElementById("truth-table").children[0].children[1].children[1];
                this.tutorialOverlay.remove();
                let classList = outputCell.classList;
                if(classList.contains("glowing")) {
                    classList.remove("glowing");
                }
                window.scrollTo({behavior: "smooth", top: Math.ceil(document.body.getBoundingClientRect().top), left: 0,});
            }
            
            return done;
        }.bind(tutStep);

        tutStep.specialAction = function() {
            let outputCell = document.getElementById("truth-table").children[0].children[1].children[1];
            let classList = outputCell.classList;
            if(!classList.contains("glowing")) {
                classList.add("glowing");
            }
        };

        tutStep.target = document.getElementById("evaluate-btn");
        tutStep.position.centerHorizontal = true;
        tutStep.position.centerVertical = true;
        
        tutorial.steps.push(tutStep);

        ////////////////////////// STEP 17 //////////////////////////
        tutStep = new TutorialStep(UI);

        tutStep.instructions = {
            en_us: `The output path isn't passing through VDD! ${this.getLayerSpan(this.UI.diagramGrid.prototype.METAL1, UI)} isn't passing through it.<br>Place ${this.getLayerSpan(this.UI.diagramGrid.prototype.METAL1, UI)} on VDD.`,
            ja_jp: `出力の同電路がVDDを通っていません！${this.getLayerSpan(this.UI.diagramGrid.prototype.METAL1, UI)}層がVDDのセルにありません。<br>${this.getLayerSpan(this.UI.diagramGrid.prototype.METAL1, UI)}層をVDDに置いてください。`,
        };

        tutStep.completed = function() {
            let done = !UI.diagramController.dragging && UI.diagramGrid.get(UI.diagram.vddCell.x, UI.diagram.vddCell.y, LayeredGrid.METAL1).isSet;
            
            if(done) {
                this.tutorialOverlay.remove();
                document.getElementById("truth-table").innerHTML = "";
                window.scrollTo({behavior: "smooth", top: Math.ceil(document.getElementById("evaluate-btn").getBoundingClientRect().top), left: 0,});
            }
            
            return done;
        }.bind(tutStep);

        tutStep.specialAction = function() {
            return;
        };

        tutStep.target = document.getElementById("canvas");
        tutStep.position.centerHorizontal = true;
        tutStep.position.flipUp = true;
        
        tutorial.steps.push(tutStep);

        ////////////////////////// STEP 18 //////////////////////////
        tutStep = new TutorialStep(UI);

        tutStep.instructions = {
            en_us: "Press \"Evaluate\" to generate an updated truth table for the circuit.",
            ja_jp: "「Evaluate」を押して回路の真理値表を再作成してください。",
        };

        tutStep.completed = function() {
            let done = document.getElementById("truth-table").children.length > 0;
            
            if(done) {
                this.tutorialOverlay.remove();
                let classList = document.getElementById("evaluate-btn").classList;
                if(classList.contains("glowing")) {
                    classList.remove("glowing");
                }
                // Re-enable grid resizing.
                UI.diagramGrid.resize = UI.diagramGrid.temp;
            }
            
            return done;
        }.bind(tutStep);

        tutStep.specialAction = function() {
            let classList = document.getElementById("evaluate-btn").classList;
            if(!classList.contains("glowing")) {
                classList.add("glowing");
            }
        };

        tutStep.target = document.getElementById("evaluate-btn");
        tutStep.position.centerHorizontal = true;
        tutStep.position.flipUp = true;
        
        tutorial.steps.push(tutStep);

        return tutorial;
    }

    tutorials.push({name: "Inverter", get: setUpInverterTutorial,});   
    window.tutorials = tutorials;
})();