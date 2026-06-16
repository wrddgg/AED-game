import requests, base64, json, sys, os, time

API_KEY = sys.argv[1]
API_URL = "https://www.hfsyapi.cn/v1/images/generations"
IMG_BASE = r"C:\Users\HIT\Desktop\游戏制作\AED-game\demo\assets\images"
REF_DIR = r"C:\Users\HIT\Desktop\游戏制作\三视图"

NOTEXT = " Absolutely no text, no words, no letters, no numbers, no logos, no watermarks, no UI elements anywhere in the image."

def encode_image(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()

# --- Load references ---
scene_ref = encode_image(os.path.join(IMG_BASE, "prologue_rain", "img_01.png"))
print("Loaded: scene anchor (prologue_rain/img_01)")

REF = {}
for name, fname in [
    ("wy", "王远三视图.png"),
    ("lxy", "林小雨三视图.png"),
    ("lr", "倒地老人三视图.png"),
    ("mg", "孙建国三视图.png"),
    ("zm", "赵雪梅三视图.png"),
    ("cm", "陈默三视图.png"),
]:
    fp = os.path.join(REF_DIR, fname)
    if os.path.exists(fp):
        REF[name] = encode_image(fp)
        print("Loaded ref: " + name)

# --- Scene anchor ---
SC = ("At the same Chinese subway entrance station at night during a typhoon: "
      "glass and steel canopy structure with fluorescent lights, electronic clock showing 21:17, "
      "heavy diagonal rain, typhoon winds, wet pavement reflecting cold blue ambient light "
      "and warm yellow canopy lights, puddles on ground.")

def gen(scene, fname, prompt, refs=None):
    """Generate one image with retries."""
    ref_imgs = [scene_ref]
    if refs:
        for r in refs:
            if r in REF:
                ref_imgs.append(REF[r])

    full_prompt = prompt + NOTEXT
    payload = {
        "model": "gpt-image-2",
        "prompt": full_prompt,
        "size": "1280x720",
        "n": 1,
        "response_format": "b64_json",
    }
    if ref_imgs:
        payload["reference_images"] = ref_imgs

    headers = {"Authorization": "Bearer " + API_KEY, "Content-Type": "application/json"}
    out_dir = os.path.join(IMG_BASE, scene)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, fname)

    if os.path.exists(out_path):
        print("  SKIP (exists): " + scene + "/" + fname)
        return True

    for attempt in range(3):
        try:
            resp = requests.post(API_URL, headers=headers, json=payload, timeout=600)
            data = resp.json()
            if resp.status_code != 200:
                print("  ERR " + str(resp.status_code) + ": " + json.dumps(data, ensure_ascii=False)[:200])
                time.sleep(5); continue
            if "data" in data and len(data["data"]) > 0:
                img_data = data["data"][0]
                if "b64_json" in img_data:
                    img_bytes = base64.b64decode(img_data["b64_json"])
                elif "url" in img_data:
                    img_bytes = requests.get(img_data["url"], timeout=60).content
                else:
                    print("  ERR: no image data"); continue
                with open(out_path, "wb") as f:
                    f.write(img_bytes)
                print("  OK: " + scene + "/" + fname + " (" + str(len(img_bytes)) + " bytes)")
                return True
            else:
                print("  ERR: " + json.dumps(data, ensure_ascii=False)[:200])
                time.sleep(5); continue
        except Exception as e:
            print("  ERR: " + str(e))
            time.sleep(5); continue
    print("  FAILED after 3 attempts: " + scene + "/" + fname)
    return False

# ================================================================
# BATCH 1: prologue_rain img_02-10
# ================================================================
print("\n=== prologue_rain img_02-10 ===")

gen("prologue_rain", "img_02.png",
    "Close shot of a smartphone screen in someone's wet hand showing a local emergency news alert about call volume surging to three times normal. Rain and subway entrance fluorescent lights reflecting on the glass screen. Grounded realism. " + SC)

gen("prologue_rain", "img_03.png",
    "Low angle shot of rainwater rippling across the subway entrance anti-slip tiles as a crowd circle holds still around someone on the ground. Every second matters. Oppressive stillness before action. Wet tiles, fluorescent light reflections. " + SC)

gen("prologue_rain", "img_04.png",
    "Medium shot, Ma Zhiguo, a 43-year-old Chinese subway security guard in a dark navy blue security uniform with cap, weathered tanned face, standing at the outer ring of the crowd with both arms spread wide pushing people back. Rain on his cap and shoulders. Authoritative posture. Under the subway canopy with fluorescent lights. " + SC,
    ["mg"])

gen("prologue_rain", "img_05.png",
    "Close-up of Ma Zhiguo, a 43-year-old Chinese security guard in dark navy uniform cap, shouting under harsh fluorescent entrance lighting. Rain dripping from the brim of his cap, jaw tight, one arm still outstretched to control the crowd. Weathered face. " + SC,
    ["mg"])

gen("prologue_rain", "img_06.png",
    "Detail close-up of Ma Zhiguo's left hand under subway entrance fluorescent light, the missing tip of his ring finger clearly visible. Wet scarred skin, raindrops catching the light. A 43-year-old security guard's hand. " + SC,
    ["mg"])

gen("prologue_rain", "img_07.png",
    "Wide composition from behind Ma Zhiguo (security guard in dark navy uniform, cap), his body forming a barrier between the crowd and the center. Posture straight and disciplined. The rescue circle visible ahead through rain haze under the canopy. " + SC,
    ["mg"])

gen("prologue_rain", "img_08.png",
    "Low angle medium shot, Lin Xiaoyu, a 19-year-old Chinese nursing student with a low ponytail and silver-rimmed glasses wearing a light grey hoodie, squatting at the front row of the crowd peering through gaps toward a collapsed elderly man on the ground. Worried and alert expression. Under the subway canopy in the rain. " + SC,
    ["lxy"])

gen("prologue_rain", "img_09.png",
    "Close-up of Lin Xiaoyu's face, a 19-year-old Chinese woman with low ponytail and silver-rimmed glasses, lips slightly parted as if about to speak then stopping. Conflict visible in her eyes, throat tense, rain on her cheek. Realistic emotional hesitation. Under the subway canopy. " + SC,
    ["lxy"])

gen("prologue_rain", "img_10.png",
    "Close-up of Lin Xiaoyu's wet hands, a 19-year-old woman in light grey hoodie, pulling out a smartphone and pressing the call button to dial 120, raindrops on the screen. Urgent decisive motion. Under the subway canopy fluorescent light. " + SC,
    ["lxy"])

# ================================================================
# BATCH 2: choice_1 (3 images)
# ================================================================
print("\n=== choice_1 ===")

gen("choice_1", "img_01.png",
    "Dynamic action shot, Wang Yuan, a young Chinese man with dark complexion and short crew cut wearing a yellow and black Meituan delivery rain jacket and yellow helmet, on an electric delivery scooter braking hard on a rain-slick Chinese city street at night. Rear wheel skidding sideways spraying water, shoulders twisting to control the slide, helmet visor covered with rain drops. " + SC)

gen("choice_1", "img_02.png",
    "Wide POV shot from a stopped electric delivery scooter looking toward a Chinese subway entrance canopy in heavy rain. A circle of bystanders gathered under the canopy around something on the ground, some holding umbrellas. Wet tiles glowing under canopy lights. Cold blue street light and warm yellow canopy light. Ominous and immediate. " + SC)

gen("choice_1", "img_03.png",
    "Over-the-shoulder shot from behind Wang Yuan, a young Chinese delivery worker in yellow-black rain jacket and yellow helmet, as he hesitates at the edge of a crowd gathered under the rainy subway canopy. The ring of bystanders' backs and umbrellas forming a human wall. His body frozen with hesitation. Rain dripping from his helmet. " + SC,
    ["wy"])

# ================================================================
# BATCH 3: enter_circle (5 images)
# ================================================================
print("\n=== enter_circle ===")

gen("enter_circle", "img_01.png",
    "Dynamic medium shot, Wang Yuan, a young Chinese man with dark complexion and short crew cut in yellow-black Meituan delivery rain jacket and yellow helmet, pushing through a crowd of umbrella-holding bystanders from behind while shouting, one hand pushing aside a wet umbrella, surprised bystanders turning toward him. Under the subway canopy with fluorescent lights. " + SC,
    ["wy"])

gen("enter_circle", "img_02.png",
    "Wide action shot, a yellow-black electric delivery scooter parked at the curb with headlight on, Wang Yuan in yellow helmet and yellow-black rain jacket running toward the subway entrance canopy pushing past umbrella-holding bystanders, water splashing underfoot on wet pavement. The subway canopy with fluorescent lights visible ahead. " + SC,
    ["wy"])

gen("enter_circle", "img_03.png",
    "Close-up of an elderly Chinese man, 70+ years old with gray-white hair, lying on wet ground. Face grayish-white, lips turning blue-purple with cyanosis, eyes closed. Harsh fluorescent light from the subway canopy above. Rain droplets on his face. He wears a dark blue cotton jacket. Clinical reality of cardiac arrest. " + SC,
    ["lr"])

gen("enter_circle", "img_04.png",
    "Low-angle shot, Wang Yuan in yellow-black delivery rain jacket and yellow helmet dropping to his knees on wet anti-slip subway tiles beside a collapsed elderly man in dark blue cotton jacket with gray-white hair. Water splashing from the knee impact, his hands already reaching toward the patient's chest. Bystanders' legs visible around them. " + SC,
    ["wy", "lr"])

gen("enter_circle", "img_05.png",
    "Medium shot from the side, Wang Yuan in yellow-black delivery rain jacket kneeling firmly beside a collapsed elderly man with gray-white hair in dark blue jacket on wet subway tiles. Both hands positioned on the patient's chest ready to begin CPR compressions. No hesitation. Full circle of bystanders visible beyond them under the canopy. " + SC,
    ["wy", "lr"])

# ================================================================
# BATCH 4: film_first (4 images)
# ================================================================
print("\n=== film_first ===")

gen("film_first", "img_01.png",
    "Close-up of Wang Yuan's wet hands in yellow-black delivery jacket sleeves holding a smartphone in landscape mode, camera app open, rain droplets on the glass screen, the viewfinder angled toward a subway canopy entrance. Night rain scene. " + SC,
    ["wy"])

gen("film_first", "img_02.png",
    "POV shot through a phone camera screen showing a subway entrance scene: wet ground, canopy structure with fluorescent lights, crowd's lower bodies visible, deliberately framing away from faces. Rain drops on the phone screen. Night. " + SC)

gen("film_first", "img_03.png",
    "Over-the-shoulder shot from behind Wang Yuan in yellow-black delivery rain jacket and yellow helmet walking toward a crowd circle under the subway canopy in heavy rain. His right hand gripping a phone pressed against his palm. Crowd ring ahead in the rain. " + SC,
    ["wy"])

gen("film_first", "img_04.png",
    "Wide shot from the side, Wang Yuan in yellow-black delivery rain jacket approaching a rescue circle under the subway canopy with phone clutched in one fist. Body language shifting from self-protection to getting closer. Crowd ahead. Rain pouring outside. " + SC,
    ["wy"])

# ================================================================
# BATCH 5: check_response (6 images)
# ================================================================
print("\n=== check_response ===")

gen("check_response", "img_01.png",
    "Medium shot, Wang Yuan, a young Chinese man with dark complexion and short crew cut in yellow-black delivery rain jacket, kneeling beside an elderly man with gray-white hair in dark blue jacket under the subway canopy. One hand lightly tapping the man's shoulder while calling out. Rain visible beyond the shelter. Realistic assessment posture. " + SC,
    ["wy", "lr"])

gen("check_response", "img_02.png",
    "Close medium shot, Wang Yuan in yellow-black delivery jacket lowering his ear near the elderly man's mouth and nose while watching the chest for movement. His hands deliberately not on the wrist. Focused emergency assessment. Rain and canopy fluorescent light. " + SC,
    ["wy", "lr"])

gen("check_response", "img_03.png",
    "Detail shot of the elderly man's upper torso in dark blue cotton jacket through wet clothing, no visible rise and fall of the chest. Wang Yuan's hand in yellow-black sleeve hovering nearby without contact. Ominous stillness under the canopy. " + SC,
    ["wy", "lr"])

gen("check_response", "img_04.png",
    "Extreme close-up of the elderly man's jaw and mouth, an unnatural agonal gasp, lips blue-purple, rainwater on chin and face. Gray-white hair on wet ground. Medical realism, restrained not graphic. Canopy fluorescent light. " + SC,
    ["lr"])

gen("check_response", "img_05.png",
    "Wide shot pulling back, the rescue circle under the subway canopy falling into brief stunned stillness. Wang Yuan in yellow-black jacket frozen in assessment posture beside the elderly man. Crowd motionless around them. Heavy rain continuing outside the canopy. " + SC,
    ["wy", "lr"])

gen("check_response", "img_06.png",
    "Medium close-up of Lin Xiaoyu, a 19-year-old Chinese woman with low ponytail and silver-rimmed glasses in light grey hoodie, standing in the crowd. Eyes wide with medical recognition and fear, rain on her face, whispering urgently. Under the subway canopy. " + SC,
    ["lxy"])

# ================================================================
# BATCH 6: start_cpr (4 images)
# ================================================================
print("\n=== start_cpr ===")

gen("start_cpr", "img_01.png",
    "Close-up of Wang Yuan's rain-soaked face, a young Chinese man with dark complexion and short crew cut, at the moment medical judgment becomes certain. Eyes fixed and focused, the shift from doubt to action visible in expression alone. Rain and sweat on skin. Canopy fluorescent light. " + SC,
    ["wy"])

gen("start_cpr", "img_02.png",
    "Medium shot, Wang Yuan in yellow-black delivery jacket, jaw setting and shoulders squaring as he shifts from assessment posture into action. The elderly man in dark blue jacket visible below frame. Rain and harsh canopy light emphasizing the decision. " + SC,
    ["wy", "lr"])

gen("start_cpr", "img_03.png",
    "Overhead action shot, Wang Yuan in yellow-black delivery jacket moving into CPR position beside the elderly man in dark blue jacket. Both hands reaching toward the sternum with deliberate accuracy. Wet ground and wet clothing visible. Canopy fluorescent light from above. " + SC,
    ["wy", "lr"])

gen("start_cpr", "img_04.png",
    "Two-layer composition under a rainy subway canopy. Foreground: Lin Xiaoyu, a 19-year-old woman with low ponytail, silver-rimmed glasses and light grey hoodie, in the crowd reacting with sudden recognition, mouth open as she speaks. Background: Wang Yuan in yellow-black jacket about to begin CPR while Lin Xiaoyu still remains behind the bystander line. " + SC,
    ["wy", "lxy"])

# ================================================================
# BATCH 7: wait_breath (6 images)
# ================================================================
print("\n=== wait_breath ===")

gen("wait_breath", "img_01.png",
    "Close-up of Wang Yuan's face under the canopy, a young Chinese man in yellow-black delivery jacket and yellow helmet. Expression caught in doubt, one wet hand hovering above the elderly man's chest without committing to compression. Rain dripping from helmet edge. Tension in his eyes. " + SC,
    ["wy"])

gen("wait_breath", "img_02.png",
    "Detail shot, Wang Yuan's hand in yellow-black sleeve suspended above the patient's chest through wet dark blue clothing. Fingers tense and uncertain. Fear of doing harm visible through hesitation. Realistic emergency assessment scene under the canopy. " + SC,
    ["wy", "lr"])

gen("wait_breath", "img_03.png",
    "Medium shot from the side, Wang Yuan in yellow-black jacket frozen in assessment posture beside the elderly man in dark blue jacket. Rain continues beyond the canopy. The rest of the crowd watching in suspense. Painful stillness of delay. " + SC,
    ["wy", "lr"])

gen("wait_breath", "img_04.png",
    "Detail close-up of the elderly man's face, lips visibly darkening blue-purple, skin pale and still, rainwater on cheek and chin. Gray-white hair. Medically grounded cyanosis detail. Under canopy fluorescent light. " + SC,
    ["lr"])

gen("wait_breath", "img_05.png",
    "Close shot of a phone screen or watch timer counting upward while the elderly patient remains motionless in the blurred background. Heavy documentary realism. Rescuers losing time in real space. Under the rainy canopy. " + SC,
    ["lr"])

gen("wait_breath", "img_06.png",
    "Medium shot, Lin Xiaoyu, 19-year-old Chinese woman with low ponytail and silver-rimmed glasses in light grey hoodie, gripping her phone so tightly her knuckles are pale. One foot half-stepping forward then stopping. Frustration and self-blame on her rain-soaked face. Trapped between knowledge and hesitation. " + SC,
    ["lxy"])

# ================================================================
# BATCH 8: kneel_down (5 images)
# ================================================================
print("\n=== kneel_down ===")

gen("kneel_down", "img_01.png",
    "Low-angle shot, Wang Yuan, a young Chinese man with dark complexion and short crew cut in yellow-black delivery jacket, knees hitting the wet anti-slip subway tiles beside the elderly man in dark blue jacket. Water splashing from the impact. Subway entrance lights reflecting on the wet floor. Commitment visible in the physical action. " + SC,
    ["wy", "lr"])

gen("kneel_down", "img_02.png",
    "Close-up detail, Wang Yuan's hands in yellow-black delivery jacket unzipping the elderly man's dark blue cotton jacket, then pressing through a wet sweater to locate the sternum. Water dripping from sleeves. Texture of wet fabric under hands. Under canopy fluorescent light. " + SC,
    ["wy", "lr"])

gen("kneel_down", "img_03.png",
    "Overhead shot, rain drops splashing on Wang Yuan's hunched back in yellow-black delivery jacket as he leans over the elderly patient. Both palms hovering just above the chest. Backlit by the subway entrance canopy light. First compression about to begin. " + SC,
    ["wy", "lr"])

gen("kneel_down", "img_04.png",
    "Close shot from the side, Wang Yuan's hands in yellow-black sleeves suspended above the elderly man's sternum, arms straightening into position. Determined focus. The subway canopy light and rain behind. " + SC,
    ["wy", "lr"])

gen("kneel_down", "img_05.png",
    "Medium close-up of Lin Xiaoyu in the crowd, a 19-year-old woman with low ponytail and silver-rimmed glasses in light grey hoodie. Mouth forming encouragement, eyes wide with recognition that the right decision is being made. Rain on her face. Under the subway canopy. " + SC,
    ["lxy"])

# ================================================================
# BATCH 9: cpr_first_push (4 images)
# ================================================================
print("\n=== cpr_first_push ===")

gen("cpr_first_push", "img_01.png",
    "Overhead close shot, Wang Yuan's hands in yellow-black delivery jacket correctly stacked on the center of the elderly man's chest at the lower half of the sternum. Arms straight, shoulders over hands, body weight aligned vertically. The elderly man in dark blue jacket. Wet clothing and rain-darkened ground. Medically accurate CPR posture. " + SC,
    ["wy", "lr"])

gen("cpr_first_push", "img_02.png",
    "Side-angle close shot, Wang Yuan in yellow-black jacket performing CPR on the elderly man in dark blue jacket. Locked arms pressing down with visible depth while the chest fully recoils between compressions. Realistic body mechanics. Wet ground. Canopy light. " + SC,
    ["wy", "lr"])

gen("cpr_first_push", "img_03.png",
    "Hyper-real close-up of hands in yellow-black delivery jacket sleeves compressing through soaked dark blue clothing on a human chest. Fabric texture, rainwater, subtle resistance under the palms. The physical reality of touching a body in crisis. " + SC,
    ["wy", "lr"])

gen("cpr_first_push", "img_04.png",
    "Overhead medium shot, Wang Yuan's face beyond his outstretched arms in yellow-black delivery jacket. Face tense with concentration and uncertainty. Sweat and rain mixed on his forehead. Compressions continuing despite doubt. Documentary realism. Canopy fluorescent light. " + SC,
    ["wy"])

# ================================================================
# BATCH 10: scam_whisper (5 images)
# ================================================================
print("\n=== scam_whisper ===")

gen("scam_whisper", "img_01.png",
    "Wide shot, Wang Yuan in yellow-black delivery jacket performing CPR in the center of the rescue circle under the subway canopy. Rain intensifying heavily in the background. Crowd of bystanders standing in a ring watching. First compression completed. Wet ground. " + SC,
    ["wy"])

gen("scam_whisper", "img_02.png",
    "Wide medium shot from behind Wang Yuan's shoulder in yellow-black jacket as he compresses the elderly patient's chest. Circle of bystanders visible around them, several faces murmuring to each other, mouths half-hidden behind hands and umbrellas. Social judgment pressing in. " + SC,
    ["wy"])

gen("scam_whisper", "img_03.png",
    "Close-up of a middle-aged Chinese man in the crowd, leaning to whisper to the person beside him. One hand raised near his mouth. Expression of worried caution. Rain on his umbrella. Under the subway canopy. " + SC)

gen("scam_whisper", "img_04.png",
    "Close-up of an older Chinese woman in the crowd, frowning with disapproval. Eyes directed at someone filming. Judgment visible in her expression. Rain on her umbrella. Under the canopy. " + SC)

gen("scam_whisper", "img_05.png",
    "Over-the-shoulder shot from behind Wang Yuan in yellow-black jacket as he continues CPR on the elderly man. His shoulders slightly hunched under the invisible weight of the crowd's judgment. Murmuring faces visible in the circle beyond. Burden felt through posture. " + SC,
    ["wy", "lr"])

print("\n=== Part 1 done (prologue_rain through scam_whisper) ===")
print("Run part2 next for remaining scenes.")
