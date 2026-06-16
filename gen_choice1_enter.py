import requests, base64, json, sys, os

API_KEY = sys.argv[1]
API_URL = "https://www.hfsyapi.cn/v1/images/generations"
IMG_BASE = r"C:\Users\HIT\Desktop\游戏制作\AED-game\demo\assets\images"
REF_DIR = r"C:\Users\HIT\Desktop\游戏制作\三视图"

def encode_image(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()

scene_ref = encode_image(os.path.join(IMG_BASE, "prologue_rain", "img_01.png"))
print("Loaded: prologue_rain/img_01 (scene reference)")

char_refs = {}
for name, fname in [
    ("wang_yuan", "王远三视图.png"),
    ("lin_xiaoyu", "林小雨三视图.png"),
    ("laoren", "倒地老人三视图.png"),
    ("ma_zhiguo", "孙建国三视图.png"),
]:
    fpath = os.path.join(REF_DIR, fname)
    if os.path.exists(fpath):
        char_refs[name] = encode_image(fpath)
        print("Loaded: " + name)

SCENE_ANCHOR = (
    "Rainy night at a Chinese subway entrance station (Line 2, with electronic clock showing 21:17), "
    "glass and steel canopy structure with fluorescent lights underneath, heavy diagonal rain and typhoon winds, "
    "wet pavement reflecting cold blue ambient light and warm yellow canopy lights, "
    "people with umbrellas being blown by wind, puddles on the ground, urban street with traffic lights in background"
)

def generate(prompt, ref_keys, filename, scene_dir):
    refs = [scene_ref]
    for k in ref_keys:
        if k in char_refs:
            refs.append(char_refs[k])

    payload = {
        "model": "gpt-image-2",
        "prompt": prompt,
        "size": "1280x720",
        "n": 1,
        "response_format": "b64_json",
        "reference_images": refs
    }
    headers = {"Authorization": "Bearer " + API_KEY, "Content-Type": "application/json"}

    print("  -> " + scene_dir + "/" + filename)
    for attempt in range(3):
        try:
            resp = requests.post(API_URL, headers=headers, json=payload, timeout=600)
            data = resp.json()
            if resp.status_code != 200:
                print("  ERROR " + str(resp.status_code) + ": " + json.dumps(data, ensure_ascii=False)[:300])
                if attempt < 2:
                    print("  Retrying...")
                    continue
                return None
            if "data" in data and len(data["data"]) > 0:
                img_data = data["data"][0]
                if "b64_json" in img_data:
                    img_bytes = base64.b64decode(img_data["b64_json"])
                elif "url" in img_data:
                    img_bytes = requests.get(img_data["url"], timeout=60).content
                else:
                    print("  ERROR: No image data")
                    return None
                out_dir = os.path.join(IMG_BASE, scene_dir)
                os.makedirs(out_dir, exist_ok=True)
                out_path = os.path.join(out_dir, filename)
                with open(out_path, "wb") as f:
                    f.write(img_bytes)
                print("  OK (" + str(len(img_bytes)) + " bytes)")
                return out_path
            else:
                print("  ERROR: " + json.dumps(data, ensure_ascii=False)[:300])
                if attempt < 2:
                    print("  Retrying...")
                    continue
                return None
        except Exception as e:
            print("  EXCEPTION: " + str(e))
            if attempt < 2:
                print("  Retrying...")
                continue
            return None
    return None

# ============================================================
# choice_1
# ============================================================
print("\n" + "=" * 60)
print("choice_1")
print("=" * 60)

choice1 = [
    ("img_01.png",
     "Dynamic action shot, Wang Yuan (young Chinese man, 25, dark complexion, short crew cut, wearing yellow-black delivery rain jacket and helmet) on an electric delivery scooter braking hard on a rain-slick Chinese city street at night, rear wheel skidding sideways spraying water, shoulders twisting to control the slide, helmet visor covered with rain drops. Scene environment: " + SCENE_ANCHOR + ". Cinematic photorealistic, 16:9",
     ["wang_yuan"]),

    ("img_02.png",
     "POV shot from a stopped electric delivery scooter looking toward a Chinese subway entrance canopy (glass and steel canopy structure with fluorescent lights, electronic clock). Heavy diagonal rain, a circle of bystanders gathered on the wet ground under the canopy, some holding umbrellas, wet tiles glowing under canopy lights. Cold blue street light and warm yellow canopy light. Ominous and immediate atmosphere. Scene environment: " + SCENE_ANCHOR + ". Cinematic photorealistic, 16:9",
     []),

    ("img_03.png",
     "Over-the-shoulder shot from behind Wang Yuan (young Chinese delivery worker in yellow-black rain jacket and yellow helmet) as he hesitates at the edge of a crowd gathered under a rainy subway canopy, the ring of bystanders backs and umbrellas forming a human wall in front of him, his body frozen with hesitation. Rain dripping from his helmet. Wet ground reflecting the same cold blue and warm yellow light as the subway entrance canopy. Grounded emotional realism. Scene: " + SCENE_ANCHOR + ". Cinematic, 16:9",
     ["wang_yuan"]),
]

for fname, prompt, refs in choice1:
    generate(prompt, refs, fname, "choice_1")

# ============================================================
# enter_circle
# ============================================================
print("\n" + "=" * 60)
print("enter_circle")
print("=" * 60)

enter_circle = [
    ("img_01.png",
     "Dynamic medium shot, Wang Yuan (young Chinese man, 25, dark complexion, short crew cut, wearing yellow-black delivery rain jacket and yellow helmet) pushing through a crowd of umbrella-holding bystanders from behind while shouting, one hand pushing aside a wet umbrella, surprised bystanders turning toward him in shock. Under the same subway canopy with fluorescent lights. Rain and wet ground. Scene: " + SCENE_ANCHOR + ". Cinematic photorealistic, no text no words, 16:9",
     ["wang_yuan"]),

    ("img_02.png",
     "Wide action shot, a yellow-black electric delivery scooter parked at the curb with headlight still on at night, Wang Yuan (delivery rider in yellow helmet and rain jacket) running toward the subway entrance canopy, pushing past umbrella-holding bystanders, water splashing under his feet on the wet pavement. The subway entrance canopy with its fluorescent lights visible ahead. Scene: " + SCENE_ANCHOR + ". Cinematic photorealistic, 16:9",
     ["wang_yuan"]),

    ("img_03.png",
     "Close-up of an elderly Chinese man (70+ years old, gray-white hair) lying on wet ground, face grayish-white, lips turning blue-purple with cyanosis, eyes closed. Harsh fluorescent light from the subway canopy above casting downward shadows. Rain droplets on his face and wet ground. He wears a dark blue cotton jacket. The clinical reality of cardiac arrest. Medical realism, restrained not graphic. Same canopy environment. 16:9",
     ["laoren"]),

    ("img_04.png",
     "Low-angle shot, Wang Yuan (delivery worker in yellow-black rain gear) dropping to his knees on wet anti-slip subway tiles beside a collapsed elderly man, water splashing from the knee impact, his hands already reaching toward the patients chest. Bystanders legs and feet visible standing in a circle around them on the wet ground. The same subway canopy fluorescent lights above. Rain visible outside the canopy. Cinematic photorealistic action shot, 16:9",
     ["wang_yuan", "laoren"]),

    ("img_05.png",
     "Medium shot from the side, Wang Yuan (young Chinese delivery worker in yellow-black rain jacket) kneeling firmly beside a collapsed elderly man (gray-white hair, dark blue jacket) on wet subway tiles, both hands positioned on the patients chest ready to begin CPR compressions, no hesitation in his posture. The full circle of bystanders visible beyond them standing under the canopy. Rain pouring outside. Same fluorescent canopy lighting. Cinematic photorealistic, 16:9",
     ["wang_yuan", "laoren"]),
]

for fname, prompt, refs in enter_circle:
    generate(prompt, refs, fname, "enter_circle")

print("\n=== ALL DONE ===")
