import React, { useState } from 'react';
import { X } from 'lucide-react';

const Calculator = ({ isOpen, onClose }) => {
    const [display, setDisplay] = useState('0');
    const [prevValue, setPrevValue] = useState(null);
    const [operator, setOperator] = useState(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);

    if (!isOpen) return null;

    const inputDigit = (digit) => {
        if (waitingForOperand) {
            setDisplay(String(digit));
            setWaitingForOperand(false);
        } else {
            setDisplay(display === '0' ? String(digit) : display + digit);
        }
    };

    const inputDecimal = () => {
        if (waitingForOperand) {
            setDisplay('0.');
            setWaitingForOperand(false);
            return;
        }
        if (!display.includes('.')) {
            setDisplay(display + '.');
        }
    };

    const clearAll = () => {
        setDisplay('0');
        setPrevValue(null);
        setOperator(null);
        setWaitingForOperand(false);
    };

    const toggleSign = () => {
        const val = parseFloat(display);
        if (val !== 0) {
            setDisplay(String(-val));
        }
    };

    const inputPercent = () => {
        const val = parseFloat(display);
        setDisplay(String(val / 100));
    };

    const performOperation = (nextOperator) => {
        const inputValue = parseFloat(display);

        if (prevValue == null) {
            setPrevValue(inputValue);
        } else if (operator) {
            const currentValue = prevValue;
            let newValue;
            switch (operator) {
                case '+': newValue = currentValue + inputValue; break;
                case '-': newValue = currentValue - inputValue; break;
                case '×': newValue = currentValue * inputValue; break;
                case '÷': newValue = inputValue !== 0 ? currentValue / inputValue : 'Error'; break;
                default: newValue = inputValue;
            }
            setPrevValue(newValue);
            setDisplay(String(newValue));
        }

        setWaitingForOperand(true);
        setOperator(nextOperator);
    };

    const handleEquals = () => {
        if (operator && prevValue != null) {
            performOperation('=');
            setOperator(null);
            setPrevValue(null);
        }
    };

    const btnBase = "font-black text-xl md:text-2xl border-4 border-black transition-all active:scale-95 active:translate-y-1 flex items-center justify-center";
    const btnNum = `${btnBase} bg-white hover:bg-gray-100 pop-shadow-sm`;
    const btnOp = `${btnBase} bg-pink-400 text-white hover:bg-pink-500 pop-shadow-sm`;
    const btnFunc = `${btnBase} bg-gray-300 hover:bg-gray-400 pop-shadow-sm`;
    const btnEqual = `${btnBase} bg-green-400 hover:bg-green-500 pop-shadow-sm`;

    // Format display for readability
    const formatDisplay = (val) => {
        if (val === 'Error') return 'Error';
        const num = parseFloat(val);
        if (isNaN(num)) return val;
        // If it has decimals, show them; otherwise format with locale
        if (val.includes('.') && val.endsWith('.')) return val;
        if (val.includes('.')) {
            const parts = val.split('.');
            return parseFloat(parts[0]).toLocaleString('id-ID') + '.' + parts[1];
        }
        return num.toLocaleString('id-ID');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-yellow-300 border-4 border-black pop-shadow w-full max-w-[340px] rounded-none relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-black text-yellow-400 px-4 py-3 flex justify-between items-center">
                    <h2 className="font-black uppercase text-lg tracking-wider">Kalkulator</h2>
                    <button onClick={onClose} className="text-white hover:text-red-400 transition-colors">
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>

                {/* Display */}
                <div className="bg-white border-4 border-black m-3 mb-2 p-4 pop-shadow-sm">
                    <div className="text-right text-sm font-bold text-gray-400 h-5 truncate">
                        {prevValue != null && operator ? `${parseFloat(prevValue).toLocaleString('id-ID')} ${operator}` : ''}
                    </div>
                    <div className="text-right text-4xl md:text-5xl font-black tracking-tight truncate mt-1">
                        {formatDisplay(display)}
                    </div>
                </div>

                {/* Buttons Grid */}
                <div className="grid grid-cols-4 gap-2 p-3 pt-1">
                    {/* Row 1: AC, +/-, %, ÷ */}
                    <button className={btnFunc} onClick={clearAll}>AC</button>
                    <button className={btnFunc} onClick={toggleSign}>+/-</button>
                    <button className={btnFunc} onClick={inputPercent}>%</button>
                    <button className={`${btnOp} ${operator === '÷' && waitingForOperand ? 'ring-4 ring-white' : ''}`} onClick={() => performOperation('÷')}>÷</button>

                    {/* Row 2: 7, 8, 9, × */}
                    <button className={btnNum} onClick={() => inputDigit(7)}>7</button>
                    <button className={btnNum} onClick={() => inputDigit(8)}>8</button>
                    <button className={btnNum} onClick={() => inputDigit(9)}>9</button>
                    <button className={`${btnOp} ${operator === '×' && waitingForOperand ? 'ring-4 ring-white' : ''}`} onClick={() => performOperation('×')}>×</button>

                    {/* Row 3: 4, 5, 6, - */}
                    <button className={btnNum} onClick={() => inputDigit(4)}>4</button>
                    <button className={btnNum} onClick={() => inputDigit(5)}>5</button>
                    <button className={btnNum} onClick={() => inputDigit(6)}>6</button>
                    <button className={`${btnOp} ${operator === '-' && waitingForOperand ? 'ring-4 ring-white' : ''}`} onClick={() => performOperation('-')}>−</button>

                    {/* Row 4: 1, 2, 3, + */}
                    <button className={btnNum} onClick={() => inputDigit(1)}>1</button>
                    <button className={btnNum} onClick={() => inputDigit(2)}>2</button>
                    <button className={btnNum} onClick={() => inputDigit(3)}>3</button>
                    <button className={`${btnOp} ${operator === '+' && waitingForOperand ? 'ring-4 ring-white' : ''}`} onClick={() => performOperation('+')}>+</button>

                    {/* Row 5: 0 (span 2), ., = */}
                    <button className={`${btnNum} col-span-2`} onClick={() => inputDigit(0)}>0</button>
                    <button className={btnNum} onClick={inputDecimal}>.</button>
                    <button className={btnEqual} onClick={handleEquals}>=</button>
                </div>
            </div>
        </div>
    );
};

export default Calculator;
