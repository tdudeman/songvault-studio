#!/usr/bin/env python3
"""Generate SongVault PWA icons without external dependencies."""
import struct, zlib
from pathlib import Path
def png(w, h, filename, maskable=False):
    rows=[]
    for y in range(h):
        row=bytearray()
        for x in range(w):
            X=x/w; Y=y/h
            inset=.18 if maskable else .085
            in_s=x>=w*inset and y>=h*inset and x<w*(1-inset) and y<h*(1-inset)
            r,g,b=(18,17,29)
            if in_s:
                t=(X+Y)/2
                r,g,b=int(239*(1-t)+122*t),int(102*(1-t)+96*t),int(126*(1-t)+217*t)
                # White note head, stem, and flag.
                xx=(X-.50); yy=(Y-.66)
                head=((xx/.095)**2+(yy/.064)**2)<1
                stem=(.56<X<.588 and .33<Y<.65)
                flag=(.49<X<.60 and .34<Y<.39)
                if head or stem or flag:r,g,b=255,255,255
            row.extend((r,g,b,255))
        rows.append(b"\\x00"+bytes(row))
    def chunk(t,data):return struct.pack(">I",len(data))+t+data+struct.pack(">I",zlib.crc32(t+data)&0xffffffff)
    content=b"\\x89PNG\\r\\n\\x1a\\n"+chunk(b"IHDR",struct.pack(">2I5B",w,h,8,6,0,0,0))+chunk(b"IDAT",zlib.compress(b"".join(rows),9))+chunk(b"IEND",b"")
    Path(filename).parent.mkdir(parents=True,exist_ok=True)
    Path(filename).write_bytes(content)
png(192,192,"icons/icon-192.png")
png(512,512,"icons/icon-512.png")
png(512,512,"icons/maskable-512.png",True)
png(180,180,"icons/apple-touch-icon.png")
