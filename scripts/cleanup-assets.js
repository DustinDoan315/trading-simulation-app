#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const glob = require("glob");

// Icons that are actually used in the codebase
const usedIcons = [
  "arrow_back.png",
  "eyeVisible.png",
  "information.png",
  "progressBar.png",
  "progressBarFull.png",
  "progressLength.png",
  "progressSecond.png",
  "progress_1.png",
  "progress_2.png",
  "progress_3.png",
  // Crypto icons that might be used
  "btc.png",
  "eth.png",
  "usdt.png",
  "bnb.png",
  "avax.png",
  "dai.png",
];

// Images that are actually used
const usedImages = [
  "adaptive-icon.png",
  "candle.png",
  "favicon.png",
  "icon.png",
  "onboarding.png",
  "partial-react-logo.png",
  "react-logo.png",
  "react-logo@2x.png",
  "react-logo@3x.png",
  "rocket.png",
  "shield.png",
  "splash-icon.png",
  "splashscreen.png",
  "success.png",
  "wallet.png",
];

function findUnusedAssets() {
  const iconsDir = path.join(__dirname, "../assets/icons");
  const imagesDir = path.join(__dirname, "../assets/images");

  // Get all icon files
  const allIcons = fs
    .readdirSync(iconsDir)
    .filter((file) => file.endsWith(".png"));
  const allImages = fs
    .readdirSync(imagesDir)
    .filter((file) => file.endsWith(".png"));

  // Find unused icons
  const unusedIcons = allIcons.filter((icon) => !usedIcons.includes(icon));
  const unusedImages = allImages.filter((image) => !usedImages.includes(image));

  console.log("=== Unused Icons ===");
  unusedIcons.forEach((icon) => {
    const filePath = path.join(iconsDir, icon);
    const stats = fs.statSync(filePath);
    console.log(`${icon} (${(stats.size / 1024).toFixed(2)} KB)`);
  });

  console.log("\n=== Unused Images ===");
  unusedImages.forEach((image) => {
    const filePath = path.join(imagesDir, image);
    const stats = fs.statSync(filePath);
    console.log(`${image} (${(stats.size / 1024).toFixed(2)} KB)`);
  });

  // Calculate total size savings
  const totalUnusedSize = [...unusedIcons, ...unusedImages].reduce(
    (total, file) => {
      const filePath = path.join(
        file.includes(".png") && !file.includes("/") ? iconsDir : imagesDir,
        file
      );
      return total + fs.statSync(filePath).size;
    },
    0
  );

  console.log(`\n=== Summary ===`);
  console.log(
    `Total unused files: ${unusedIcons.length + unusedImages.length}`
  );
  console.log(
    `Potential size savings: ${(totalUnusedSize / 1024).toFixed(2)} KB`
  );

  return { unusedIcons, unusedImages, totalUnusedSize };
}

function removeUnusedAssets(dryRun = true) {
  const { unusedIcons, unusedImages, totalUnusedSize } = findUnusedAssets();

  if (dryRun) {
    console.log("\n=== DRY RUN MODE ===");
    console.log(
      "To actually remove files, run: node scripts/cleanup-assets.js --remove"
    );
    return;
  }

  const iconsDir = path.join(__dirname, "../assets/icons");
  const imagesDir = path.join(__dirname, "../assets/images");

  console.log("\n=== Removing Unused Assets ===");

  // Remove unused icons
  unusedIcons.forEach((icon) => {
    const filePath = path.join(iconsDir, icon);
    try {
      fs.unlinkSync(filePath);
      console.log(`Removed: ${icon}`);
    } catch (error) {
      console.error(`Failed to remove ${icon}:`, error.message);
    }
  });

  // Remove unused images
  unusedImages.forEach((image) => {
    const filePath = path.join(imagesDir, image);
    try {
      fs.unlinkSync(filePath);
      console.log(`Removed: ${image}`);
    } catch (error) {
      console.error(`Failed to remove ${image}:`, error.message);
    }
  });

  console.log(
    `\nSuccessfully removed ${unusedIcons.length + unusedImages.length} files`
  );
  console.log(`Size savings: ${(totalUnusedSize / 1024).toFixed(2)} KB`);
}

// Main execution
const args = process.argv.slice(2);
const shouldRemove = args.includes("--remove");

if (shouldRemove) {
  removeUnusedAssets(false);
} else {
  findUnusedAssets();
  console.log("\nRun with --remove flag to actually delete unused files");
}
