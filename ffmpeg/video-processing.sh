#!/bin/bash
INPUT=$1
OUTPUT=$2
ffmpeg -i $INPUT -codec:v libx264 -preset slow -crf 22 -codec:a copy $OUTPUT
