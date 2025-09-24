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
        // Si el modal CSV está abierto, escribir en el textarea
        if (this.csvModal && this.csvModal.style.display === 'block') {
            this.csvInput.value += num;
            this.csvInput.focus();
            this.showInfo('Número ingresado en CSV', 'info');
            return;
        }

        // Comportamiento normal de la calculadora
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

    // ... (el resto de tu código se mantiene igual, sin cambios)
    
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
