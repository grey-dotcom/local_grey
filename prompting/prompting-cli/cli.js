#!/usr/bin/env node

import readlineSync from "readline-sync";
import dotenv from "dotenv";
import { chat } from "./chat.js";

dotenv.config();

async function start() {
  console.log("\nPrompting CLI\n");
  console.log("type 'exit' to quit\n");

  while (true) {
    const input = readlineSync.question("prompt > ");

    if (input === "exit") {
      console.log("bye");
      process.exit();
    }

    const reply = await chat(input);
    console.log("\n" + reply + "\n");
  }
}

start();