#!/bin/bash
(
  printf "\nCleaning and creating directories...\n";
  mkdir -p dist;
  rm -rf dist/mods.d;
  rm -rf dist/modules;
  rm -f bible.zip;
  mkdir dist/mods.d;
  cp bible.conf dist/mods.d/bible.conf;
  mkdir -p dist/modules/texts/ztext/bible;
  cd dist;
  printf "\nBuilding modules...\n";
  osis2mod modules/texts/ztext/bible bible.xml -z -v Luther;
  chmod +x modules/texts/ztext/bible/*;
  zip -r -D bible.zip mods.d/bible.conf modules/texts/ztext/bible;
  printf "\nDone!\n";
)
