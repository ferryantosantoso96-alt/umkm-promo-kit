#!/usr/bin/env bash
# Gabungkan video tanpa suara + musik/efek (dan voiceover bila ada).
# pakai: tools/gabung.sh hasil/pisa-9x16.tanpa-suara.mp4 hasil/musik-sfx.wav hasil/pisa-9x16.mp4 [vo.mp3]
set -e
V=$1; M=$2; OUT=$3; VO=$4
if [ -n "$VO" ]; then
  # musik diturunkan (ducking) saat narasi
  ffmpeg -v error -y -i "$V" -i "$M" -i "$VO" -filter_complex \
    "[2:a]aformat=channel_layouts=stereo,volume=1.0[vo];[vo]asplit[vo1][vo2];[1:a][vo1]sidechaincompress=threshold=0.04:ratio=6:attack=20:release=400[bg];[bg][vo2]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5[a]" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
else
  ffmpeg -v error -y -i "$V" -i "$M" -filter_complex "[1:a]loudnorm=I=-16:TP=-1.5[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
fi
echo "ok $OUT"
