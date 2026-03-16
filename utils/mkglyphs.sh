#!/bin/bash
echo "Generating speed limits"
for sl in {5..180..5}
do 
    echo "Speed limit $sl"
    cat src/svg/template-speed-limit.svg| sed "s/>SPL</>$sl</" > src/svg/glyphs/speed-$sl.svg
    cat src/svg/template-speed-limit-end.svg| sed "s/>SPL</>$sl</" > src/svg/glyphs/speed-$sl-end.svg
done

echo "Generating distances"
for d in {25..400..25}
do 
    echo "Distance $d"
    cat src/svg/template-distance.svg| sed "s/>999m</>$d</" > src/svg/glyphs/distance$d.svg
done

echo "Generating abbreviations"
for abbr in "L" "R" "P" "PP" "RO" "P\/\/" "HP" "FPP" "FRO" "SA" "GV" "DN" "DNX" "DNT" "L1" "L2" "L3" "DSS" "ASS" "VG" "A" "ALT" "BTW" "DNX" "IN" "kpL" "kpR" "kpS" "L\/R" "onL" "onR" "R\/L" "RP" "CX" "TJS" "NBX" "IMP" "EFF" "ORN" "BAD" "RP"
do 
    fname="src/svg/glyphs/abbr-"$(echo $abbr | tr '/' '-' | tr -d '\\')".svg"
    echo "Abbreviation $abbr -> $fname"
    cc=$(echo -n $abbr | tr -d '\\' | wc -m)
    cat src/svg/template-abbr$cc.svg| sed "s/>BTW</>$abbr</" > $fname
done