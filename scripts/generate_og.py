"""Generate OG image for Gameshin"""
from PIL import Image, ImageDraw, ImageFont
import os

PUBLIC_DIR = r"D:\ai\agent_workplace\games\ai_games_workplace\Gameshin\public"
OUTPUT = os.path.join(PUBLIC_DIR, "og-image.png")

img = Image.new("RGB", (1200, 630), "#1a1a2e")
draw = ImageDraw.Draw(img)

colors = ["#4ade80", "#f59e0b", "#d4a017", "#3b82f6", "#ef4444", "#a855f7"]
for i, color in enumerate(colors):
    x = 60 + i * 200
    for y in (240, 420):
        for row in range(6):
            for col in range(6):
                px = x + col * 8
                py = y + row * 8
                draw.rectangle([px, py, px + 7, py + 7], fill=color)

# font
bold = r"C:\Windows\Fonts\arialbd.ttf"
reg = r"C:\Windows\Fonts\arial.ttf"
tf = ImageFont.truetype(bold, 88) if os.path.exists(bold) else ImageFont.load_default()
sf = ImageFont.truetype(bold, 32) if os.path.exists(bold) else ImageFont.load_default()
gf = ImageFont.truetype(reg, 26) if os.path.exists(reg) else ImageFont.load_default()
uf = ImageFont.truetype(reg, 22) if os.path.exists(reg) else ImageFont.load_default()

items = [
    ("GAMESHIN", tf, "#ffffff", 60),
    ("GAME HUB  ·  FREE ONLINE GAMES", sf, "#4ade80", 160),
    ("Chinese Chess · Snake · Tetris · Gomoku · Chess · Pixel Jumper", gf, "#8888aa", 500),
    ("gameshin.com", uf, "#f59e0b", 560),
]

for txt, font, color, y in items:
    b = draw.textbbox((0, 0), txt, font=font)
    w = b[2] - b[0]
    x = (1200 - w) // 2
    draw.text((x, y), txt, fill=color, font=font)

img.save(OUTPUT, "PNG")
print(f"OG image created: {OUTPUT}")
print(f"Size: {os.path.getsize(OUTPUT)} bytes")
