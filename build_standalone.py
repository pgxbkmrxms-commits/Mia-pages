import pathlib
p = pathlib.Path(__file__).parent
b64_dir = p / 'images_b64'
confetti_path = p / 'libs' / 'confetti.min.js'
out = p / 'valentine-standalone.html'

# read base64 images
images = {}
for f in sorted(b64_dir.glob('*.b64')):
    # Remove newlines so the base64 fits safely in JS string literals
    images[f.name] = f.read_text().replace('\n', '').replace('\r', '')

confetti = confetti_path.read_text() if confetti_path.exists() else ''

# order images: prefer giphy as first, then image2..image7
order = ['giphy.gif.b64'] + [f for f in images.keys() if f != 'giphy.gif.b64']

html = []
html.append('<!DOCTYPE html>')
html.append('<html lang="de">')
html.append('<head>')
html.append('  <meta charset="UTF-8">')
html.append('  <meta name="viewport" content="width=device-width, initial-scale=1.0">')
html.append('  <meta name="description" content="Ein liebevolles Valentinsgruß-Webpage — sag ihr, dass du sie magst!">')
html.append('  <meta name="theme-color" content="#ffdceb">')
html.append('  <meta name="apple-mobile-web-app-capable" content="yes">')
html.append('  <title></title>')
html.append('  <style>')
html.append("    html,body{height:100%;margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial}")
html.append("    .gradient-background{background:linear-gradient(180deg,#ffd0e5 0%,#ffe8f2 36%,#fff 100%);min-height:100vh;display:flex;align-items:center;justify-content:center}")
html.append("    .card{display:flex;flex-direction:column;align-items:center;padding:1rem}")
html.append("    img{border-radius:8px;height:300px;max-width:100%;object-fit:cover;display:block}")
html.append("    h2{font-size:2rem;color:#bd1e59;margin:1rem 0;font-weight:700;font-style:italic}")
html.append("    .buttons{display:flex;gap:1rem;padding-top:20px;align-items:center}")
html.append("    button{border:none;border-radius:8px;padding:12px 20px;font-size:20px;color:#fff;cursor:pointer}")
html.append("    #yesButton{background:#16a34a}")
html.append("    #noButton{background:#ef4444}")
html.append("    .bounce{animation:bounce 2s ease infinite}")
html.append("    @keyframes bounce{0%,20%,50%,80%,100%{transform:translateY(0)}40%{transform:translateY(-20px)}60%{transform:translateY(-10px)}}")
html.append('  </style>')
html.append('</head>')
html.append('<body class="gradient-background">')
html.append('  <div class="card">')
first_img_b64 = images.get(order[0], '')
html.append(f'    <img id="imageDisplay" src="data:image/gif;base64,{first_img_b64}" alt="Valentine image" />')
html.append('    <h2 id="valentineQuestion">Willst du meine Freundin sein?</h2>')
html.append('    <div class="buttons" id="responseButtons">')
html.append('      <button id="yesButton" class="bounce" aria-label="Ja">Ja</button>')
html.append('      <button id="noButton" aria-label="Nein">Nein</button>')
html.append('    </div>')
html.append('  </div>')

html.append('  <!-- Confetti library (inlined) -->')
html.append('  <script>')
html.append(confetti)
html.append('  </script>')

# Build JS imagePaths
html.append('  <script>')
html.append('    const yesButton = document.getElementById("yesButton");')
html.append('    const noButton = document.getElementById("noButton");')
html.append('    const imageDisplay = document.getElementById("imageDisplay");')
html.append('    const valentineQuestion = document.getElementById("valentineQuestion");')
html.append('    const responseButtons = document.getElementById("responseButtons");')
html.append('')
html.append('    let noClickCount = 0;')
html.append('    let buttonHeight = 48;')
html.append('    let buttonWidth = 80;')
html.append('    let fontSize = 20;')
html.append('    const imagePaths = [')
for i, name in enumerate(order):
    b64 = images.get(name, '')
    if i < len(order) - 1:
        html.append(f'      "data:image/gif;base64,{b64}",')
    else:
        html.append(f'      "data:image/gif;base64,{b64}"')
html.append('    ];')

html.append('    imageDisplay.src = imagePaths[0];')
html.append('    imageDisplay.addEventListener("error", () => {')
html.append('      imageDisplay.src = imagePaths[6];')
html.append('      imageDisplay.alt = "Fallback-Bild";')
html.append('    });')

html.append('    noButton.addEventListener("click", function() {')
html.append('      if (noClickCount < 5) {')
html.append('        noClickCount++;')
html.append('        imageDisplay.src = imagePaths[noClickCount];')
html.append('        buttonHeight += 20;')
html.append('        buttonWidth += 20;')
html.append('        fontSize += 6;')
html.append('        yesButton.style.height = `${buttonHeight}px`;')
html.append('        yesButton.style.width = `${buttonWidth}px`;')
html.append('        yesButton.style.fontSize = `${fontSize}px`;')
html.append('        if (noClickCount < 6) {')
html.append('          noButton.textContent = ["Nein", "Bist du dir sicher?", "Ganz sicher?", "Wirklich ganz ganz sicher?:(", "Immernoch nicht?", "Warum nicht :("][noClickCount];')
html.append('        }')
html.append('      }')
html.append('    });')

html.append('    yesButton.addEventListener("click", () => {')
html.append('      imageDisplay.src = imagePaths[6];')
html.append('      valentineQuestion.textContent = "Yayyy!! :3";')
html.append('      responseButtons.style.display = "none";')
html.append('      try { confetti(); } catch(e) { console.warn("Confetti nicht verfügbar", e); }')
html.append('    });')
html.append('  </script>')
html.append('</body>')
html.append('</html>')

out.write_text('\n'.join(html))
print(f'Wrote {out} ({out.stat().st_size} bytes)')
