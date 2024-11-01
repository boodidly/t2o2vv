import { stdout } from 'process';
import chalk from 'chalk';
import { speakText } from './voice.js';

const TYPING_SPEED = {
  min: 20,
  max: 35
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function typeText(text, voice = null) {
  let buffer = '';
  const terminalWidth = stdout.columns || 80;
  
  // Split text into sentences for better sync
  const sentences = text.split(/([.!?]+\s+)/);
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    if (!sentence.trim()) continue;
    
    // Start speaking the sentence if voice is enabled
    let speechPromise;
    if (voice?.enabled) {
      speechPromise = speakText(sentence);
    }
    
    const words = sentence.split(' ');
    
    for (const word of words) {
      // Check if adding the next word would exceed terminal width
      if ((buffer + word).length > terminalWidth - 5) {
        stdout.write(chalk.white(buffer + '\n'));
        buffer = '';
      }
      
      // Type each character in the word
      for (const char of word) {
        buffer += char;
        stdout.write(chalk.white(char));
        await sleep(Math.random() * (TYPING_SPEED.max - TYPING_SPEED.min) + TYPING_SPEED.min);
      }
      
      // Add space between words
      if (words.indexOf(word) < words.length - 1) {
        buffer += ' ';
        stdout.write(' ');
        await sleep(TYPING_SPEED.min);
      }
    }
    
    // Wait for speech to complete before moving to next sentence
    if (speechPromise) {
      await speechPromise.catch(() => {});
    }
  }
  
  // Write any remaining text and add final newline
  if (buffer) {
    stdout.write(chalk.white(buffer));
  }
}