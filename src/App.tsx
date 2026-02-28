/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Minus, X, Divide, RotateCcw, SkipForward, 
  Lightbulb, Trophy, Flame, Heart, Cat, PawPrint,
  Undo2, RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generateSolvablePuzzle, getSolution, type Operator } from './utils/solver';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GameState {
  numbers: number[];
  history: number[][];
  selectedCardIndex: number | null;
  selectedOperator: Operator | null;
  score: number;
  streak: number;
  message: string;
  isSuccess: boolean;
  hint: string | null;
}

export default function App() {
  const [state, setState] = useState<GameState>({
    numbers: [],
    history: [],
    selectedCardIndex: null,
    selectedOperator: null,
    score: 0,
    streak: 0,
    message: '算出24点吧！',
    isSuccess: false,
    hint: null,
  });

  const [initialNumbers, setInitialNumbers] = useState<number[]>([]);

  const startNewGame = useCallback((isSkip = false) => {
    const newNums = generateSolvablePuzzle();
    setInitialNumbers(newNums);
    setState(prev => ({
      ...prev,
      numbers: newNums,
      history: [],
      selectedCardIndex: null,
      selectedOperator: null,
      message: isSkip ? '已跳过！试试这组数字。' : '新开局！算出24点。',
      isSuccess: false,
      hint: null,
      streak: isSkip ? 0 : prev.streak,
    }));
  }, []);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const handleCardClick = (index: number) => {
    if (state.isSuccess) return;

    // If an operator is already selected, we are performing an operation
    if (state.selectedOperator && state.selectedCardIndex !== null) {
      if (state.selectedCardIndex === index) {
        // Deselect if clicking the same card
        setState(prev => ({ ...prev, selectedCardIndex: null, selectedOperator: null }));
        return;
      }

      const num1 = state.numbers[state.selectedCardIndex];
      const num2 = state.numbers[index];
      let result = 0;

      switch (state.selectedOperator) {
        case '+': result = num1 + num2; break;
        case '-': result = num1 - num2; break;
        case '*': result = num1 * num2; break;
        case '/': 
          if (num2 === 0 || num1 % num2 !== 0) {
            setState(prev => ({ ...prev, message: "只能进行整除运算哦！", selectedOperator: null, selectedCardIndex: null }));
            return;
          }
          result = num1 / num2; 
          break;
      }

      const newNumbers = [...state.numbers];
      // Remove the two used numbers and add the result
      const firstIdx = Math.min(state.selectedCardIndex, index);
      const secondIdx = Math.max(state.selectedCardIndex, index);
      
      newNumbers.splice(secondIdx, 1);
      newNumbers.splice(firstIdx, 1);
      newNumbers.push(result);

      const isWin = newNumbers.length === 1 && Math.abs(newNumbers[0] - 24) < 1e-6;

      setState(prev => ({
        ...prev,
        history: [...prev.history, prev.numbers],
        numbers: newNumbers,
        selectedCardIndex: null,
        selectedOperator: null,
        message: isWin ? '喵呜！你成功算出了24！' : '继续加油...',
        isSuccess: isWin,
        score: isWin ? prev.score + 10 : prev.score,
        streak: isWin ? prev.streak + 1 : prev.streak,
      }));

      if (isWin) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFB7C5', '#FF8DA1', '#FFFFFF']
        });
      }
    } else {
      // Selecting the first card
      setState(prev => ({ ...prev, selectedCardIndex: index }));
    }
  };

  const handleOperatorClick = (op: Operator) => {
    if (state.isSuccess || state.selectedCardIndex === null) return;
    setState(prev => ({ ...prev, selectedOperator: op }));
  };

  const undo = () => {
    if (state.history.length === 0 || state.isSuccess) return;
    const lastNumbers = state.history[state.history.length - 1];
    setState(prev => ({
      ...prev,
      numbers: lastNumbers,
      history: prev.history.slice(0, -1),
      selectedCardIndex: null,
      selectedOperator: null,
      message: '撤销成功！',
    }));
  };

  const reset = () => {
    setState(prev => ({
      ...prev,
      numbers: initialNumbers,
      history: [],
      selectedCardIndex: null,
      selectedOperator: null,
      message: '已重置！',
      isSuccess: false,
      hint: null,
    }));
  };

  const showHint = () => {
    const solution = getSolution(initialNumbers);
    setState(prev => ({ ...prev, hint: solution }));
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center p-4 md:p-8 max-w-4xl mx-auto select-none overflow-x-hidden">
      {/* Main Container: Stack in portrait, side-by-side in landscape */}
      <div className="w-full flex flex-col landscape:flex-row landscape:items-start landscape:gap-8 flex-1">
        
        {/* Left Side (Portrait: Top) */}
        <div className="flex flex-col items-center landscape:w-1/3 landscape:sticky landscape:top-8">
          {/* Header */}
          <header className="w-full flex justify-between items-center mb-4 landscape:flex-col landscape:gap-4">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-kitty-pink/30">
              <Trophy className="text-yellow-500 w-5 h-5" />
              <span className="font-bold text-kitty-brown">{state.score}</span>
            </div>
            
            <h1 className="font-display text-2xl md:text-3xl lg:text-4xl text-kitty-pink font-bold drop-shadow-sm flex items-center gap-2">
              <Cat className="w-8 h-8" />
              Kitty 24点
            </h1>

            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-kitty-pink/30">
              <Flame className="text-orange-500 w-5 h-5" />
              <span className="font-bold text-kitty-brown">{state.streak}</span>
            </div>
          </header>

          {/* Mascot & Message */}
          <div className="flex flex-col items-center gap-3 mb-6 landscape:mb-0">
            <motion.div
              animate={state.isSuccess ? { y: [0, -15, 0], scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: state.isSuccess ? Infinity : 0, duration: 0.5 }}
              className="relative group cursor-help"
              onClick={() => setState(prev => ({ ...prev, message: "喵！组合数字算出24点吧！" }))}
            >
              <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center shadow-inner border-4 border-kitty-pink transition-transform group-hover:rotate-12">
                <Cat className={cn("w-12 h-12 md:w-14 md:h-14", state.isSuccess ? "text-kitty-pink" : "text-kitty-brown/40")} />
              </div>
              {state.isSuccess && (
                <motion.div 
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-red-400 text-white p-1 rounded-full"
                >
                  <Heart className="w-3 h-3 fill-current" />
                </motion.div>
              )}
            </motion.div>
            
            <div className="bg-white/80 backdrop-blur-sm px-5 py-2 rounded-2xl border-2 border-kitty-pink/20 shadow-sm max-w-[200px] md:max-w-none">
              <p className="text-sm md:text-base font-medium text-kitty-brown text-center leading-tight">
                {state.message}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side (Portrait: Bottom) */}
        <div className="flex-1 w-full flex flex-col items-center justify-center gap-4 md:gap-6 landscape:justify-start">
          {/* Game Board */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 w-full max-w-sm md:max-w-md">
            <AnimatePresence mode="popLayout">
              {state.numbers.map((num, idx) => (
                <motion.div
                  key={`${num}-${idx}`}
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCardClick(idx)}
                  className={cn(
                    "kitty-card h-24 md:h-32 landscape:h-28",
                    state.selectedCardIndex === idx && "ring-4 ring-kitty-pink ring-offset-4",
                    state.isSuccess && "bg-kitty-pink text-white border-white"
                  )}
                >
                  <span className="font-display text-3xl md:text-4xl">{num}</span>
                  <PawPrint className="absolute bottom-2 right-2 w-5 h-5 text-kitty-pink/20" />
                  
                  {state.selectedCardIndex === idx && !state.selectedOperator && (
                    <motion.div 
                      layoutId="selection-indicator"
                      className="absolute -top-2 -left-2 bg-kitty-pink text-white p-1 rounded-full shadow-md"
                    >
                      <PawPrint className="w-3 h-3" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Operators */}
          <div className="flex gap-2 md:gap-4 flex-wrap justify-center">
            {(['+', '-', '*', '/'] as Operator[]).map((op) => (
              <button
                key={op}
                onClick={() => handleOperatorClick(op)}
                disabled={state.selectedCardIndex === null || state.isSuccess}
                className={cn(
                  "w-11 h-11 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-all duration-200 shadow-md",
                  state.selectedOperator === op 
                    ? "bg-kitty-pink text-white scale-110" 
                    : "bg-white text-kitty-pink hover:bg-kitty-cream border-2 border-kitty-pink/20",
                  (state.selectedCardIndex === null || state.isSuccess) && "opacity-50 cursor-not-allowed grayscale"
                )}
              >
                {op === '+' && <Plus className="w-5 h-5 md:w-6 md:h-6" />}
                {op === '-' && <Minus className="w-5 h-5 md:w-6 md:h-6" />}
                {op === '*' && <X className="w-5 h-5 md:w-6 md:h-6" />}
                {op === '/' && <Divide className="w-5 h-5 md:w-6 md:h-6" />}
              </button>
            ))}
          </div>

          <p className="text-[10px] md:text-xs text-kitty-brown/40 font-medium uppercase tracking-widest text-center">
            先选数字，再选符号，最后选另一个数字
          </p>

          {/* Controls */}
          <div className="w-full mt-2 flex flex-col gap-3 max-w-sm md:max-w-md">
            {state.hint && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-50 border border-yellow-200 p-2 rounded-xl text-center text-xs text-yellow-800 italic"
              >
                提示: {state.hint}
              </motion.div>
            )}

            <div className="flex justify-between gap-2">
              <div className="flex gap-2">
                <button 
                  onClick={undo}
                  disabled={state.history.length === 0 || state.isSuccess}
                  className="kitty-btn kitty-btn-secondary px-3 py-2"
                  title="撤销"
                >
                  <Undo2 className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button 
                  onClick={reset}
                  className="kitty-btn kitty-btn-secondary px-3 py-2"
                  title="重置"
                >
                  <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>

              <div className="flex gap-2">
                {!state.isSuccess ? (
                  <>
                    <button onClick={showHint} className="kitty-btn kitty-btn-secondary px-3 py-2">
                      <Lightbulb className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="hidden sm:inline text-sm">提示</span>
                    </button>
                    <button onClick={() => startNewGame(true)} className="kitty-btn kitty-btn-secondary px-3 py-2">
                      <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="hidden sm:inline text-sm">跳过</span>
                    </button>
                  </>
                ) : (
                  <button onClick={() => startNewGame()} className="kitty-btn kitty-btn-primary px-4 py-2 text-sm">
                    下一关
                    <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background paw prints decoration */}
      <div className="fixed inset-0 -z-10 opacity-[0.03] pointer-events-none overflow-hidden">
        <PawPrint className="absolute top-10 left-10 w-24 h-24 md:w-32 md:h-32 rotate-12" />
        <PawPrint className="absolute bottom-20 right-10 w-32 h-32 md:w-48 md:h-48 -rotate-45" />
        <PawPrint className="absolute top-1/2 left-1/4 w-16 h-16 md:w-24 md:h-24 rotate-45" />
        <PawPrint className="absolute top-1/3 right-1/4 w-12 h-12 md:w-16 md:h-16 -rotate-12" />
      </div>
    </div>
  );
}
