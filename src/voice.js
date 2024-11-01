import { exec } from 'child_process';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { VOICES } from './config.js';

let currentVoice = 'Default';
let isVoiceEnabled = false;
let speechRate = 175;

// Check if espeak is installed
exec('which espeak', (err) => {
  if (err) {
    console.error(chalk.red('Error: espeak is not installed. Voice synthesis will be disabled.'));
    console.error(chalk.yellow('Install espeak using: sudo pacman -S espeak-ng'));
    isVoiceEnabled = false;
  }
});

export async function selectVoice() {
  const { voice } = await inquirer.prompt([{
    type: 'list',
    name: 'voice',
    message: 'Select a voice:',
    choices: Object.entries(VOICES).map(([name, description]) => ({
      name: `${name} (${description})`,
      value: name
    }))
  }]);
  
  currentVoice = voice;
  
  // Test the selected voice
  return new Promise((resolve) => {
    speakText('Voice test successful')
      .then(() => {
        process.stdout.write(chalk.green(`\nVoice set to: ${voice}\n`));
        resolve();
      })
      .catch(err => {
        process.stdout.write(chalk.red(`\nError testing voice: ${err.message}\n`));
        isVoiceEnabled = false;
        resolve();
      });
  });
}

export function toggleVoice() {
  isVoiceEnabled = !isVoiceEnabled;
  process.stdout.write(chalk.green(`\nVoice output ${isVoiceEnabled ? 'enabled' : 'disabled'}\n`));
  if (isVoiceEnabled) {
    process.stdout.write(chalk.dim(`Current voice: ${currentVoice}\n`));
  } else {
    // Kill any running espeak processes
    exec('pkill espeak');
  }
  return isVoiceEnabled;
}

export function getVoiceStatus() {
  return {
    enabled: isVoiceEnabled,
    currentVoice,
    speechRate
  };
}

export function listVoices() {
  process.stdout.write(chalk.cyan('\nAvailable voices:\n'));
  Object.entries(VOICES).forEach(([name, description]) => {
    process.stdout.write(chalk.yellow(`${name}: `) + chalk.white(`${description}\n`));
  });
  process.stdout.write('\n');
}

export function speakText(text) {
  return new Promise((resolve, reject) => {
    if (!isVoiceEnabled) {
      resolve();
      return;
    }

    const voice = VOICES[currentVoice]?.espeakVoice || 'en';
    const command = `espeak -v ${voice} -s ${speechRate} "${text.replace(/"/g, '\\"')}"`;
    
    exec(command, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}