class CasioFX82Calculator {
    constructor() {
        this.display = document.getElementById('display');
        this.secondaryDisplay = document.getElementById('secondary-display');
        this.currentInput = '0';
        this.previousInput = '';
        this.operator = '';
        this.waitingForNewNumber = false;
        this.memory = 0;
        this.isShiftMode = false;
        this.isAlphaMode = false;
        this.angleMode = 'DEG'; // DEG, RAD, GRAD
        this.history = [];
        
        this.initializeEventListeners();
        this.updateDisplay();
    }
    
    initializeEventListeners() {
        // Números
        document.querySelectorAll('[data-number]').forEach(button => {
            button.addEventListener('click', () => {
                const number = button.getAttribute('data-number');
                this.inputNumber(number);
                this.addPressedEffect(button);
            });
        });
        
        // Operadores
        document.querySelectorAll('[data-operator]').forEach(button => {
            button.addEventListener('click', () => {
                const operator = button.getAttribute('data-operator');
                this.inputOperator(operator);
                this.addPressedEffect(button);
            });
        });
        
        // Acciones especiales
        document.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');
                this.handleAction(action);
                this.addPressedEffect(button);
            });
        });
        
        // Funciones científicas
        document.querySelectorAll('[data-function]').forEach(button => {
            button.addEventListener('click', () => {
                const func = button.getAttribute('data-function');
                this.handleFunction(func);
                this.addPressedEffect(button);
            });
        });
        
        // Teclado
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    
    addPressedEffect(button) {
        button.classList.add('pressed');
        setTimeout(() => button.classList.remove('pressed'), 100);
    }
    
    inputNumber(num) {
        if (this.waitingForNewNumber) {
            this.currentInput = num;
            this.waitingForNewNumber = false;
        } else {
            this.currentInput = this.currentInput === '0' ? num : this.currentInput + num;
        }
        this.updateDisplay();
    }
    
    inputOperator(op) {
        if (this.previousInput !== '' && !this.waitingForNewNumber) {
            this.calculate();
        }
        
        this.previousInput = this.currentInput;
        this.operator = op;
        this.waitingForNewNumber = true;
        this.secondaryDisplay.textContent = `${this.previousInput} ${this.getOperatorSymbol(op)}`;
    }
    
    getOperatorSymbol(op) {
        const symbols = {
            'plus': '+',
            'minus': '-',
            'multiply': '×',
            'divide': '÷'
        };
        return symbols[op] || op;
    }
    
    calculate() {
        if (this.previousInput === '' || this.operator === '') return;
        
        const prev = parseFloat(this.previousInput);
        const current = parseFloat(this.currentInput);
        let result;
        
        switch (this.operator) {
            case 'plus':
                result = prev + current;
                break;
            case 'minus':
                result = prev - current;
                break;
            case 'multiply':
                result = prev * current;
                break;
            case 'divide':
                if (current === 0) {
                    this.showError('Math ERROR');
                    return;
                }
                result = prev / current;
                break;
            default:
                return;
        }
        
        this.currentInput = this.formatResult(result);
        this.previousInput = '';
        this.operator = '';
        this.waitingForNewNumber = true;
        this.secondaryDisplay.textContent = '';
        this.updateDisplay();
        
        // Agregar al historial
        this.addToHistory(`${prev} ${this.getOperatorSymbol(this.operator)} ${current} = ${result}`);
    }
    
    formatResult(num) {
        if (isNaN(num) || !isFinite(num)) {
            return 'ERROR';
        }
        
        // Manejar números muy grandes o muy pequeños
        if (Math.abs(num) > 9999999999 || (Math.abs(num) < 0.0000001 && num !== 0)) {
            return num.toExponential(8);
        }
        
        // Limitar decimales
        if (num % 1 !== 0) {
            return parseFloat(num.toFixed(10)).toString();
        }
        
        return num.toString();
    }
    
    handleAction(action) {
        switch (action) {
            case 'clear':
                this.clear();
                break;
            case 'delete':
                this.delete();
                break;
            case 'equals':
                this.calculate();
                break;
            case 'decimal':
                this.inputDecimal();
                break;
            case 'shift':
                this.toggleShift();
                break;
            case 'alpha':
                this.toggleAlpha();
                break;
            case 'mode':
                this.changeMode();
                break;
            case 'on':
                this.turnOn();
                break;
            case 'replay':
                this.replay();
                break;
            case 'open-paren':
                this.inputNumber('(');
                break;
            case 'close-paren':
                this.inputNumber(')');
                break;
        }
    }
    
    handleFunction(func) {
        const current = parseFloat(this.currentInput);
        let result;
        
        if (isNaN(current) && func !== 'rcl') {
            this.showError('Math ERROR');
            return;
        }
        
        switch (func) {
            case 'sin':
                result = this.isShiftMode ? Math.asin(current) : Math.sin(this.toRadians(current));
                break;
            case 'cos':
                result = this.isShiftMode ? Math.acos(current) : Math.cos(this.toRadians(current));
                break;
            case 'tan':
                result = this.isShiftMode ? Math.atan(current) : Math.tan(this.toRadians(current));
                break;
            case 'sqrt':
                if (current < 0) {
                    this.showError('Math ERROR');
                    return;
                }
                result = this.isShiftMode ? current * current : Math.sqrt(current);
                break;
            case 'ln':
                if (current <= 0) {
                    this.showError('Math ERROR');
                    return;
                }
                result = this.isShiftMode ? Math.exp(current) : Math.log(current);
                break;
            case 'log':
                if (current <= 0) {
                    this.showError('Math ERROR');
                    return;
                }
                result = this.isShiftMode ? Math.pow(10, current) : Math.log10(current);
                break;
            case '2nd':
                result = this.isShiftMode ? Math.sqrt(current) : current * current;
                break;
            case 'xy':
                this.inputOperator('power');
                return;
            case 'deg':
                this.toggleAngleMode();
                return;
            case 'rcl':
                this.currentInput = this.memory.toString();
                break;
            case 'fraction':
                this.handleFraction();
                return;
            case 'exp':
                this.inputNumber('E');
                return;
            case 's-d':
                this.toggleDecimalMode();
                return;
            case 'eng':
                this.engineeringMode();
                return;
        }
        
        if (result !== undefined) {
            this.currentInput = this.formatResult(result);
            this.waitingForNewNumber = true;
            this.updateDisplay();
        }
        
        this.isShiftMode = false;
        this.updateShiftIndicator();
    }
    
    toRadians(degrees) {
        if (this.angleMode === 'RAD') return degrees;
        if (this.angleMode === 'GRAD') return degrees * Math.PI / 200;
        return degrees * Math.PI / 180; // DEG
    }
    
    toDegrees(radians) {
        if (this.angleMode === 'RAD') return radians;
        if (this.angleMode === 'GRAD') return radians * 200 / Math.PI;
        return radians * 180 / Math.PI; // DEG
    }
    
    clear() {
        this.currentInput = '0';
        this.previousInput = '';
        this.operator = '';
        this.waitingForNewNumber = false;
        this.secondaryDisplay.textContent = '';
        this.updateDisplay();
    }
    
    delete() {
        if (this.currentInput.length > 1) {
            this.currentInput = this.currentInput.slice(0, -1);
        } else {
            this.currentInput = '0';
        }
        this.updateDisplay();
    }
    
    inputDecimal() {
        if (this.waitingForNewNumber) {
            this.currentInput = '0.';
            this.waitingForNewNumber = false;
        } else if (this.currentInput.indexOf('.') === -1) {
            this.currentInput += '.';
        }
        this.updateDisplay();
    }
    
    toggleShift() {
        this.isShiftMode = !this.isShiftMode;
        this.updateShiftIndicator();
    }
    
    toggleAlpha() {
        this.isAlphaMode = !this.isAlphaMode;
        this.updateAlphaIndicator();
    }
    
    toggleAngleMode() {
        const modes = ['DEG', 'RAD', 'GRAD'];
        const currentIndex = modes.indexOf(this.angleMode);
        this.angleMode = modes[(currentIndex + 1) % modes.length];
        this.updateModeIndicator();
    }
    
    changeMode() {
        // Implementar cambio de modo (COMP, SD, REG, etc.)
        this.showMessage('COMP');
    }
    
    turnOn() {
        this.clear();
        this.showMessage('CASIO fx-82MS');
        setTimeout(() => {
            this.currentInput = '0';
            this.updateDisplay();
        }, 2000);
    }
    
    replay() {
        if (this.history.length > 0) {
            this.showMessage(this.history[this.history.length - 1]);
        }
    }
    
    showError(message) {
        this.currentInput = message;
        this.updateDisplay();
        setTimeout(() => {
            this.clear();
        }, 2000);
    }
    
    showMessage(message) {
        this.currentInput = message;
        this.updateDisplay();
    }
    
    addToHistory(calculation) {
        this.history.push(calculation);
        if (this.history.length > 10) {
            this.history.shift();
        }
    }
    
    updateDisplay() {
        this.display.textContent = this.currentInput;
        
        // Ajustar tamaño de fuente si el texto es muy largo
        if (this.currentInput.length > 10) {
            this.display.style.fontSize = '16px';
        } else {
            this.display.style.fontSize = '20px';
        }
    }
    
    updateShiftIndicator() {
        const shiftBtn = document.querySelector('[data-action="shift"]');
        if (this.isShiftMode) {
            shiftBtn.classList.add('active');
        } else {
            shiftBtn.classList.remove('active');
        }
    }
    
    updateAlphaIndicator() {
        const alphaBtn = document.querySelector('[data-action="alpha"]');
        if (this.isAlphaMode) {
            alphaBtn.classList.add('active');
        } else {
            alphaBtn.classList.remove('active');
        }
    }
    
    updateModeIndicator() {
        this.secondaryDisplay.textContent = this.angleMode;
        setTimeout(() => {
            if (this.operator === '') {
                this.secondaryDisplay.textContent = '';
            }
        }, 1500);
    }
    
    handleKeyboard(event) {
        event.preventDefault();
        
        const key = event.key;
        
        // Números
        if ('0123456789'.includes(key)) {
            this.inputNumber(key);
        }
        
        // Operadores
        else if (key === '+') {
            this.inputOperator('plus');
        } else if (key === '-') {
            this.inputOperator('minus');
        } else if (key === '*') {
            this.inputOperator('multiply');
        } else if (key === '/') {
            this.inputOperator('divide');
        }
        
        // Acciones especiales
        else if (key === 'Enter' || key === '=') {
            this.calculate();
        } else if (key === 'Escape' || key === 'c' || key === 'C') {
            this.clear();
        } else if (key === 'Backspace') {
            this.delete();
        } else if (key === '.') {
            this.inputDecimal();
        }
        
        // Funciones
        else if (key === 's') {
            this.handleFunction('sin');
        } else if (key === 'o') {
            this.handleFunction('cos');
        } else if (key === 't') {
            this.handleFunction('tan');
        } else if (key === 'q') {
            this.handleFunction('sqrt');
        } else if (key === 'l') {
            this.handleFunction('ln');
        }
    }
    
    handleFraction() {
        // Funcionalidad básica para fracciones
        this.showMessage('a b/c');
        setTimeout(() => {
            this.updateDisplay();
        }, 1000);
    }
    
    toggleDecimalMode() {
        // Cambiar entre formato decimal y fraccionario
        this.showMessage('S⇔D');
        setTimeout(() => {
            this.updateDisplay();
        }, 1000);
    }
    
    engineeringMode() {
        const num = parseFloat(this.currentInput);
        if (!isNaN(num)) {
            this.currentInput = num.toExponential(3);
            this.updateDisplay();
        }
    }
}

// Inicializar la calculadora cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    new CasioFX82Calculator();
});

// Prevenir zoom en dispositivos móviles al hacer doble tap
document.addEventListener('touchstart', (event) => {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
});

let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);