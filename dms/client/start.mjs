#!/usr/bin/env node
import { execSync } from "child_process";
import { networkInterfaces } from "os";

const nets = networkInterfaces();
let lanIp = "0.0.0.0";
for (const ifaces of Object.values(nets)) {
  for (const iface of (ifaces ?? [])) {
    if (iface.family === "IPv4" && !iface.internal && iface.address.startsWith("192.168.")) {
      lanIp = iface.address;
    }
  }
}

console.log("");
console.log("   Next.js (Production)");
console.log(`   - Local:   http://localhost:3000`);
console.log(`   - Network: http://${lanIp}:3000`);
console.log("");
