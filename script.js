class CasioFX82Calculator {
    constructor() {
        this.display = document.getElementById('display');
        this.secondaryDisplay = document.getElementById('secondary-display');
        this.infoDisplay = document.getElementById('info-display');
        this.currentInput = '0';
        this.previousInput = '';
        this.operator = '';
        this.waitingForNewNumber = false;
        this.memory = 0;
        this.isShiftMode = false;
        this.isAlphaMode = false;
        this.angleMode = 'DEG'; // DEG, RAD, GRAD
        this.history = [];
        this.errorLog = [];
        this.csvData = [];
        
        this.initializeEventListeners();
        this.initializeModals();
        this.initializeErrorLog();
        this.updateDisplay();
        this.showInfo('Calculadora lista', 'success');
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
        
        // Teclado con navegación mejorada
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Añadir índices de tabulación para accesibilidad
        this.setupKeyboardNavigation();
    }
    
    initializeModals() {
        // CSV Modal
        this.csvModal = document.getElementById('csv-modal');
        this.csvInput = document.getElementById('csv-input');
        this.csvResult = document.getElementById('csv-result');
        
        document.getElementById('csv-sum').addEventListener('click', () => this.csvOperation('sum'));
        document.getElementById('csv-mean').addEventListener('click', () => this.csvOperation('mean'));
        document.getElementById('csv-remove').addEventListener('click', () => this.csvOperation('removeLast'));
        document.getElementById('csv-remove-specific').addEventListener('click', () => this.csvOperation('removeSpecific'));
        document.getElementById('csv-clear').addEventListener('click', () => this.csvOperation('clear'));
        document.getElementById('csv-close').addEventListener('click', () => this.closeModal('csv'));
        
        // Power Modal
        this.powerModal = document.getElementById('power-modal');
        document.getElementById('power-calculate').addEventListener('click', () => this.calculatePower());
        document.getElementById('power-close').addEventListener('click', () => this.closeModal('power'));
        
        // Cerrar modales al hacer clic fuera
        window.addEventListener('click', (e) => {
            if (e.target === this.csvModal) this.closeModal('csv');
            if (e.target === this.powerModal) this.closeModal('power');
        });
    }
    
    initializeErrorLog() {
        this.logPanel = document.getElementById('error-log-panel');
        this.logPanel.classList.add('collapsed');
        
        document.getElementById('toggle-log').addEventListener('click', () => {
            this.logPanel.classList.toggle('collapsed');
        });
        
        document.getElementById('download-log').addEventListener('click', () => this.downloadErrorLog());
        document.getElementById('clear-log').addEventListener('click', () => this.clearErrorLog());
    }
    
    setupKeyboardNavigation() {
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach((button, index) => {
            button.setAttribute('tabindex', '0');
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    button.click();
                }
            });
        });
    }
    
    addPressedEffect(button) {
        button.classList.add('pressed', 'highlighted');
        setTimeout(() => {
            button.classList.remove('pressed', 'highlighted');
        }, 200);
    }
    
    inputNumber(num) {
        if (!this.validateInput(num, 'number')) return;
        
        if (this.waitingForNewNumber) {
            this.currentInput = num;
            this.waitingForNewNumber = false;
        } else {
            this.currentInput = this.currentInput === '0' ? num : this.currentInput + num;
        }
        this.updateDisplay();
        this.showInfo('Número ingresado', 'info');
    }
    
    inputOperator(op) {
        if (this.previousInput !== '' && !this.waitingForNewNumber) {
            this.calculate();
        }
        
        this.previousInput = this.currentInput;
        this.operator = op;
        this.waitingForNewNumber = true;
        this.secondaryDisplay.textContent = `${this.previousInput} ${this.getOperatorSymbol(op)}`;
        
        const opName = this.getOperatorName(op);
        this.showInfo(`Operación: ${opName}`, 'operation');
    }
    
    getOperatorSymbol(op) {
        const symbols = {
            'plus': '+',
            'minus': '-',
            'multiply': '×',
            'divide': '÷',
            'power': '^'
        };
        return symbols[op] || op;
    }
    
    getOperatorName(op) {
        const names = {
            'plus': 'Suma',
            'minus': 'Resta',
            'multiply': 'Multiplicación',
            'divide': 'División',
            'power': 'Potencia'
        };
        return names[op] || op;
    }
    
    calculate() {
        if (this.previousInput === '' || this.operator === '') return;
        
        const prev = parseFloat(this.previousInput);
        const current = parseFloat(this.currentInput);
        
        if (isNaN(prev) || isNaN(current)) {
            this.showError('Error: Valores no numéricos ingresados');
            return;
        }
        
        let result;
        const operatorName = this.getOperatorName(this.operator);
        
        try {
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
                        this.showError('Error: División por cero no permitida');
                        return;
                    }
                    result = prev / current;
                    break;
                case 'power':
                    result = Math.pow(prev, current);
                    if (!isFinite(result)) {
                        this.showError('Error: Resultado fuera del rango válido');
                        return;
                    }
                    break;
                default:
                    this.showError('Error: Operador no reconocido');
                    return;
            }
            
            this.currentInput = this.formatResult(result);
            this.previousInput = '';
            this.operator = '';
            this.waitingForNewNumber = true;
            this.secondaryDisplay.textContent = '';
            this.updateDisplay();
            
            // Mostrar información contextual sobre el resultado
            this.showResultInfo(operatorName, result, prev, current);
            
            // Agregar al historial
            this.addToHistory(`${prev} ${this.getOperatorSymbol(this.operator)} ${current} = ${result}`);
            
        } catch (error) {
            this.showError(`Error en cálculo: ${error.message}`);
        }
    }
    
    showResultInfo(operation, result, operand1, operand2) {
        let message = `${operation} completada. `;
        
        // Información contextual según el rango del resultado
        if (result >= 100 && result <= 200) {
            message += 'Resultado entre 100 y 200';
        } else if (result > 1000000) {
            message += 'Resultado muy grande';
        } else if (result < -1000000) {
            message += 'Resultado muy pequeño';
        } else if (result === Math.floor(result)) {
            message += 'Resultado entero';
        } else {
            message += 'Resultado decimal';
        }
        
        this.showInfo(message, 'success');
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
        
        switch (func) {
            case 'sqrt':
                if (this.isShiftMode) {
                    result = current * current;
                    this.showInfo('Operación: Cuadrado calculado', 'success');
                } else {
                    if (current < 0) {
                        this.showError('Error: Raíz cuadrada de número negativo');
                        return;
                    }
                    result = Math.sqrt(current);
                    this.showInfo(current >= 0 ? 'Raíz cuadrada de número positivo' : 'Error: Número negativo', current >= 0 ? 'success' : 'error');
                }
                break;
            case 'cube':
                if (this.isShiftMode) {
                    if (current < 0) {
                        this.showError('Error: Raíz cúbica de número negativo no implementada');
                        return;
                    }
                    result = Math.pow(current, 1/3);
                    this.showInfo('Operación: Raíz cúbica calculada', 'success');
                } else {
                    result = Math.pow(current, 3);
                    this.showInfo('Operación: Cubo calculado', 'success');
                }
                break;
            case 'power':
                this.openPowerModal();
                return;
            case 'csv':
                this.openCSVModal();
                return;
            case 'sin':
                if (isNaN(current)) {
                    this.showError('Error: Entrada no válida para función trigonométrica');
                    return;
                }
                result = this.isShiftMode ? this.toDegrees(Math.asin(current)) : Math.sin(this.toRadians(current));
                this.showInfo('Función trigonométrica: Seno', 'success');
                break;
            case 'cos':
                if (isNaN(current)) {
                    this.showError('Error: Entrada no válida para función trigonométrica');
                    return;
                }
                result = this.isShiftMode ? this.toDegrees(Math.acos(current)) : Math.cos(this.toRadians(current));
                this.showInfo('Función trigonométrica: Coseno', 'success');
                break;
            case 'tan':
                if (isNaN(current)) {
                    this.showError('Error: Entrada no válida para función trigonométrica');
                    return;
                }
                result = this.isShiftMode ? this.toDegrees(Math.atan(current)) : Math.tan(this.toRadians(current));
                this.showInfo('Función trigonométrica: Tangente', 'success');
                break;
            case 'ln':
                if (current <= 0) {
                    this.showError('Error: Logaritmo natural de número no positivo');
                    return;
                }
                result = this.isShiftMode ? Math.exp(current) : Math.log(current);
                this.showInfo('Función logarítmica natural', 'success');
                break;
            case 'log':
                if (current <= 0) {
                    this.showError('Error: Logaritmo de número no positivo');
                    return;
                }
                result = this.isShiftMode ? Math.pow(10, current) : Math.log10(current);
                this.showInfo('Función logarítmica base 10', 'success');
                break;
            case '2nd':
                result = this.isShiftMode ? Math.sqrt(current) : current * current;
                this.showInfo(this.isShiftMode ? 'Raíz cuadrada' : 'Cuadrado', 'success');
                break;
            case 'xy':
                this.inputOperator('power');
                return;
            case 'deg':
                this.toggleAngleMode();
                return;
            case 'rcl':
                this.currentInput = this.memory.toString();
                this.showInfo('Memoria recuperada', 'info');
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
    
    validateInput(input, type) {
        if (type === 'number') {
            if (input === '' || input === null || input === undefined) {
                this.showError('Error: Campo vacío no permitido');
                return false;
            }
            if (isNaN(input) && input !== '.') {
                this.showError('Error: Se requiere entrada numérica');
                return false;
            }
        }
        return true;
    }
    
    openPowerModal() {
        this.powerModal.style.display = 'block';
        document.getElementById('power-base').value = this.currentInput;
        document.getElementById('power-exp').focus();
    }
    
    calculatePower() {
        const base = parseFloat(document.getElementById('power-base').value);
        const exp = parseFloat(document.getElementById('power-exp').value);
        
        if (isNaN(base) || isNaN(exp)) {
            document.getElementById('power-result').textContent = 'Error: Valores no válidos';
            return;
        }
        
        try {
            const result = Math.pow(base, exp);
            if (!isFinite(result)) {
                document.getElementById('power-result').textContent = 'Error: Resultado fuera de rango';
                return;
            }
            
            document.getElementById('power-result').textContent = `${base}^${exp} = ${this.formatResult(result)}`;
            this.currentInput = this.formatResult(result);
            this.waitingForNewNumber = true;
            this.updateDisplay();
            this.showInfo(`Potencia calculada: ${base}^${exp}`, 'success');
        } catch (error) {
            document.getElementById('power-result').textContent = `Error: ${error.message}`;
            this.logError(`Power calculation error: ${error.message}`);
        }
    }
    
    openCSVModal() {
        this.csvModal.style.display = 'block';
        this.csvInput.focus();
        this.showInfo('Modo CSV activado', 'info');
    }
    
    csvOperation(operation) {
        const csvText = this.csvInput.value.trim();
        
        if (operation === 'clear') {
            this.csvInput.value = '';
            this.csvResult.textContent = 'Lista limpiada';
            this.csvData = [];
            return;
        }
        
        if (!csvText) {
            this.csvResult.textContent = 'Error: Lista vacía no permitida';
            this.showError('Error: Ingrese valores CSV antes de operar');
            return;
        }
        
        try {
            this.csvData = csvText.split(',')
                .map(val => val.trim())
                .filter(val => val !== '')
                .map(val => {
                    const num = parseFloat(val);
                    if (isNaN(num)) {
                        throw new Error(`Valor no válido: "${val}"`);
                    }
                    return num;
                });
            
            if (this.csvData.length === 0) {
                throw new Error('Lista vacía después del procesamiento');
            }
            
            let result, message;
            
            switch (operation) {
                case 'sum':
                    result = this.csvData.reduce((sum, num) => sum + num, 0);
                    message = `Suma de ${this.csvData.length} valores: ${result}`;
                    this.currentInput = this.formatResult(result);
                    break;
                case 'mean':
                    result = this.csvData.reduce((sum, num) => sum + num, 0) / this.csvData.length;
                    message = `Media de ${this.csvData.length} valores: ${result}`;
                    this.currentInput = this.formatResult(result);
                    break;
                case 'removeLast':
                    if (this.csvData.length < 2) {
                        message = 'Error: Se necesitan al menos 2 elementos';
                        break;
                    }
                    this.csvData.splice(-2); // Quitar últimos 2 elementos
                    this.csvInput.value = this.csvData.join(', ');
                    message = `Últimos 2 elementos removidos. Quedan ${this.csvData.length} elementos`;
                    break;
                case 'removeSpecific':
                    const valueToRemove = prompt('Ingrese el valor a eliminar:');
                    if (valueToRemove !== null) {
                        const numToRemove = parseFloat(valueToRemove);
                        if (!isNaN(numToRemove)) {
                            const index = this.csvData.indexOf(numToRemove);
                            if (index !== -1) {
                                this.csvData.splice(index, 1);
                                this.csvInput.value = this.csvData.join(', ');
                                message = `Valor ${numToRemove} eliminado. Quedan ${this.csvData.length} elementos`;
                            } else {
                                message = `Valor ${numToRemove} no encontrado en la lista`;
                            }
                        } else {
                            message = 'Valor no válido para eliminar';
                        }
                    }
                    break;
            }
            
            this.csvResult.textContent = message;
            
            if (operation === 'sum' || operation === 'mean') {
                this.updateDisplay();
                this.waitingForNewNumber = true;
                this.showInfo('Lista de valores procesada', 'success');
            }
            
        } catch (error) {
            this.csvResult.textContent = `Error: ${error.message}`;
            this.logError(`CSV operation error: ${error.message}`);
            this.showError(`Error CSV: ${error.message}`);
        }
    }
    
    closeModal(type) {
        if (type === 'csv') {
            this.csvModal.style.display = 'none';
        } else if (type === 'power') {
            this.powerModal.style.display = 'none';
        }
    }
    
    showInfo(message, type = 'info') {
        this.infoDisplay.textContent = message;
        this.infoDisplay.className = 'info-display';
        
        // Agregar clase de tipo para diferentes colores
        switch (type) {
            case 'error':
                this.infoDisplay.style.color = '#ff6b6b';
                break;
            case 'success':
                this.infoDisplay.style.color = '#90ff90';
                break;
            case 'operation':
                this.infoDisplay.style.color = '#87ceeb';
                break;
            default:
                this.infoDisplay.style.color = '#90ff90';
        }
        
        // Auto-clear info after 3 seconds
        setTimeout(() => {
            if (this.infoDisplay.textContent === message) {
                this.infoDisplay.textContent = 'Calculadora lista';
                this.infoDisplay.style.color = '#90ff90';
            }
        }, 3000);
    }
    
    showError(message) {
        this.currentInput = 'ERROR';
        this.updateDisplay();
        this.showInfo(message, 'error');
        this.logError(message);
        
        setTimeout(() => {
            this.clear();
        }, 2000);
    }
    
    logError(message) {
        const timestamp = new Date().toLocaleString();
        this.errorLog.push({ timestamp, message });
        
        // Mantener solo los últimos 50 errores
        if (this.errorLog.length > 50) {
            this.errorLog.shift();
        }
        
        this.updateErrorLogDisplay();
    }
    
    updateErrorLogDisplay() {
        const logList = document.getElementById('error-log-list');
        logList.innerHTML = '';
        
        this.errorLog.slice(-10).reverse().forEach(entry => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.innerHTML = `
                <div class="timestamp">${entry.timestamp}</div>
                <div class="error">${entry.message}</div>
            `;
            logList.appendChild(logEntry);
        });
    }
    
    downloadErrorLog() {
        if (this.errorLog.length === 0) {
            this.showInfo('No hay errores para descargar', 'info');
            return;
        }
        
        const logData = this.errorLog.map(entry => 
            `${entry.timestamp}: ${entry.message}`
        ).join('\n');
        
        const blob = new Blob([logData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `calculadora-errores-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showInfo('Log de errores descargado', 'success');
    }
    
    clearErrorLog() {
        this.errorLog = [];
        this.updateErrorLogDisplay();
        this.showInfo('Log de errores limpiado', 'info');
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
        this.showInfo('Calculadora reiniciada', 'info');
    }
    
    delete() {
        if (this.currentInput.length > 1) {
            this.currentInput = this.currentInput.slice(0, -1);
        } else {
            this.currentInput = '0';
        }
        this.updateDisplay();
        this.showInfo('Último dígito eliminado', 'info');
    }
    
    inputDecimal() {
        if (this.waitingForNewNumber) {
            this.currentInput = '0.';
            this.waitingForNewNumber = false;
        } else if (this.currentInput.indexOf('.') === -1) {
            this.currentInput += '.';
        } else {
            this.showError('Error: Punto decimal ya presente');
            return;
        }
        this.updateDisplay();
        this.showInfo('Punto decimal agregado', 'info');
    }
    
    toggleShift() {
        this.isShiftMode = !this.isShiftMode;
        this.updateShiftIndicator();
        this.showInfo(`Modo SHIFT ${this.isShiftMode ? 'activado' : 'desactivado'}`, 'info');
    }
    
    toggleAlpha() {
        this.isAlphaMode = !this.isAlphaMode;
        this.updateAlphaIndicator();
        this.showInfo(`Modo ALPHA ${this.isAlphaMode ? 'activado' : 'desactivado'}`, 'info');
    }
    
    toggleAngleMode() {
        const modes = ['DEG', 'RAD', 'GRAD'];
        const currentIndex = modes.indexOf(this.angleMode);
        this.angleMode = modes[(currentIndex + 1) % modes.length];
        this.updateModeIndicator();
        this.showInfo(`Modo angular: ${this.angleMode}`, 'info');
    }
    
    changeMode() {
        this.showMessage('COMP');
        this.showInfo('Modo COMP activado', 'info');
    }
    
    turnOn() {
        this.clear();
        this.showMessage('CASIO fx-82MS');
        this.showInfo('Calculadora encendida', 'success');
        setTimeout(() => {
            this.currentInput = '0';
            this.updateDisplay();
            this.showInfo('Calculadora lista', 'success');
        }, 2000);
    }
    
    replay() {
        if (this.history.length > 0) {
            this.showMessage(this.history[this.history.length - 1]);
            this.showInfo('Última operación mostrada', 'info');
        } else {
            this.showInfo('No hay historial disponible', 'info');
        }
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
        const key = event.key;
        
        // Números
        if ('0123456789'.includes(key)) {
            event.preventDefault();
            this.inputNumber(key);
        }
        
        // Operadores
        else if (key === '+') {
            event.preventDefault();
            this.inputOperator('plus');
        } else if (key === '-') {
            event.preventDefault();
            this.inputOperator('minus');
        } else if (key === '*') {
            event.preventDefault();
            this.inputOperator('multiply');
        } else if (key === '/') {
            event.preventDefault();
            this.inputOperator('divide');
        }
        
        // Acciones especiales
        else if (key === 'Enter' || key === '=') {
            event.preventDefault();
            this.calculate();
        } else if (key === 'Escape' || key === 'c' || key === 'C') {
            event.preventDefault();
            this.clear();
        } else if (key === 'Backspace') {
            event.preventDefault();
            this.delete();
        } else if (key === '.') {
            event.preventDefault();
            this.inputDecimal();
        }
        
        // Funciones
        else if (key === 's') {
            event.preventDefault();
            this.handleFunction('sin');
        } else if (key === 'o') {
            event.preventDefault();
            this.handleFunction('cos');
        } else if (key === 't') {
            event.preventDefault();
            this.handleFunction('tan');
        } else if (key === 'q') {
            event.preventDefault();
            this.handleFunction('sqrt');
        } else if (key === 'l') {
            event.preventDefault();
            this.handleFunction('ln');
        } else if (key === 'r') {
            event.preventDefault();
            this.handleFunction('sqrt');
        }
        
        // Nuevas funciones con teclado
        else if (key === '^') {
            event.preventDefault();
            this.inputOperator('power');
        } else if (key === 'v') {
            event.preventDefault();
            this.openCSVModal();
        } else if (key === 'F1') {
            event.preventDefault();
            this.openPowerModal();
        }
    }
    
    handleFraction() {
        this.showMessage('a b/c');
        this.showInfo('Modo fracciones', 'info');
        setTimeout(() => {
            this.updateDisplay();
        }, 1000);
    }
    
    toggleDecimalMode() {
        this.showMessage('S⇔D');
        this.showInfo('Modo decimal alternado', 'info');
        setTimeout(() => {
            this.updateDisplay();
        }, 1000);
    }
    
    engineeringMode() {
        const num = parseFloat(this.currentInput);
        if (!isNaN(num)) {
            this.currentInput = num.toExponential(3);
            this.updateDisplay();
            this.showInfo('Notación científica aplicada', 'success');
        } else {
            this.showError('Error: Valor no válido para notación científica');
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