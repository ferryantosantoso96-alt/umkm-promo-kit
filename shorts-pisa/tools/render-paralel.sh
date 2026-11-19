#!/usr/bin/env bash
# Render video.html dalam 3 segmen paralel lalu gabungkan. pakai: tools/render-paralel.sh video.html hasil/keluar.mp4
set -e
HTML=$1; OUT=$2; K=${3:-3}
N=$(node -e "const s=require('fs').readFileSync('render/dur.txt','utf8');console.log(Math.round(parseFloat(s)*30))")
mkdir -p render/seg; : > render/seg/list.txt
for ((i=0;i<K;i++)); do
  a=$(( N*i/K )); b=$(( N*(i+1)/K ))
  node tools/render.js "$HTML" render/seg/s$i.mp4 --frame $a,$b > render/seg/log$i.txt 2>&1 &
  echo "file 's$i.mp4'" >> render/seg/list.txt
done
wait
ffmpeg -v error -y -f concat -safe 0 -i render/seg/list.txt -c:v libx264 -preset slow -crf 21 -maxrate 14M -bufsize 28M -pix_fmt yuv420p "$OUT"
echo "selesai $OUT"
