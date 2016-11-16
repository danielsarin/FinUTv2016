#!/bin/bash
(
  printf "\nCleaning and creating directories...\n";
  rm -r dist/*;
  mkdir dist/mods.d;
  cp finutv2016.conf dist/mods.d/finutv2016.conf;
  mkdir -p dist/modules/texts/ztext/finutv2016;
  printf "\nParsing and creating OSIS XML...\n";
  node parser.js;
  cd dist;
  printf "\nBuilding modules...\n";
  osis2mod modules/texts/ztext/finutv2016 FinUTv2016.xml -z -v Luther;
  chmod +x modules/texts/ztext/finutv2016/*;
  zip -r -D FinUTv2016.zip mods.d/finutv2016.conf modules/texts/ztext/finutv2016;
  printf "\nDone!\n";
)
